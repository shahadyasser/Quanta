import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25'; // v2

// Cosine similarity between two vectors
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
}

// Get OpenAI embedding for a text
async function getEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'text-embedding-ada-002', input: text.slice(0, 8000) }),
  });
  const data = await response.json();
  if (!data.data || !data.data[0]) {
    console.error('OpenAI embedding error:', JSON.stringify(data));
    throw new Error(`OpenAI embedding failed: ${data.error?.message || 'Unknown error'}`);
  }
  return data.data[0].embedding;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { job_id, job_title, job_description, job_skills, recruiter_query, round } = await req.json();

    if (!job_id) return Response.json({ error: 'job_id is required' }, { status: 400 });

    // 1. Fetch all applications with CVs for this job
    const applications = await base44.asServiceRole.entities.Application.filter({ job_id });
    const appsWithCV = applications.filter(a => a.cv_url);

    if (appsWithCV.length === 0) {
      return Response.json({ error: 'No applications with CVs found.' }, { status: 400 });
    }

    console.log(`agenticRank RAG: ${appsWithCV.length} candidates, query="${recruiter_query}"`);

    // 2. Build the semantic search query — combine job requirements + recruiter NLP query
    const searchQuery = [
      recruiter_query || '',
      job_title || '',
      job_description || '',
      (job_skills || []).join(', '),
    ].filter(Boolean).join('\n');

    // 3. Try to get embedding for the combined query (graceful fallback if key is invalid)
    let queryEmbedding = null;
    try {
      queryEmbedding = await getEmbedding(searchQuery);
      console.log('agenticRank: query embedded successfully');
    } catch (embErr) {
      console.warn('agenticRank: embedding failed, falling back to LLM-only ranking:', embErr.message);
    }

    // 4. Fetch all CV embeddings for this job (only if embedding succeeded)
    const allEmbeddings = queryEmbedding
      ? await base44.asServiceRole.entities.CVEmbedding.filter({ job_id })
      : [];
    console.log(`agenticRank: fetched ${allEmbeddings.length} CV embedding chunks`);

    // 5. For each candidate, find their most relevant CV chunks via cosine similarity
    const candidateContexts = {};

    for (const app of appsWithCV) {
      const appEmbeddings = queryEmbedding ? allEmbeddings.filter(e => e.application_id === app.id) : [];

      if (appEmbeddings.length === 0) {
        // No embeddings or embedding disabled — fall back to pre-extracted data
        candidateContexts[app.id] = {
          topChunks: [],
          ragScore: 0,
          hasEmbeddings: false,
        };
        continue;
      }

      // Score each chunk
      const scored = appEmbeddings.map(chunk => ({
        text: chunk.cv_text_chunk,
        similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
      })).sort((a, b) => b.similarity - a.similarity);

      // Take top 3 most relevant chunks
      const topChunks = scored.slice(0, 3);
      const avgRagScore = topChunks.reduce((s, c) => s + c.similarity, 0) / topChunks.length;

      candidateContexts[app.id] = {
        topChunks: topChunks.map(c => c.text),
        ragScore: avgRagScore,
        hasEmbeddings: true,
      };
    }

    // 6. Build candidate list for LLM with RAG-retrieved context
    const candidateList = appsWithCV.map((app, i) => {
      const ctx = candidateContexts[app.id];
      const ragSnippet = ctx.hasEmbeddings && ctx.topChunks.length > 0
        ? `\nMost Relevant CV Sections (RAG-retrieved):\n${ctx.topChunks.map((t, j) => `  [${j+1}] ${t.slice(0, 400)}`).join('\n')}`
        : '';

      return `[Candidate ${i + 1}]
ID: ${app.id}
Name: ${app.candidate_name || 'Unknown'}
RAG Semantic Similarity Score: ${ctx.hasEmbeddings ? (ctx.ragScore * 100).toFixed(1) : 'N/A'}%
Experience: ${app.years_of_experience || 'Not specified'} years
Skills: ${(app.skills || []).join(', ') || 'Not specified'}
Education: ${app.education_summary || 'Not specified'}
Work History: ${app.work_experience_summary || 'Not specified'}
Strengths: ${(app.strengths || []).join('; ') || 'None'}
Weaknesses: ${(app.improvements || []).join('; ') || 'None'}${ragSnippet}`;
    }).join('\n\n---\n\n');

    const jobText = [
      job_title ? `Job Title: ${job_title}` : '',
      job_description || '',
      (job_skills || []).length ? `Required Skills: ${job_skills.join(', ')}` : '',
    ].filter(Boolean).join('\n\n');

    const recruiterSection = recruiter_query
      ? `\n⚠️ RECRUITER'S NATURAL LANGUAGE REQUIREMENT (HIGHEST PRIORITY):
"${recruiter_query}"

You MUST treat this as the primary filter. Candidates who match this requirement should be ranked higher, candidates who don't should be ranked lower. Be explicit in the ranking_reason about whether they satisfy this requirement.`
      : '';

    const prompt = `You are an expert AI recruiter performing RAG-powered candidate ranking.

JOB REQUIREMENTS:
${jobText}
${recruiterSection}

CANDIDATES (with semantic RAG similarity scores and retrieved CV context):
${candidateList}

INSTRUCTIONS:
1. Use the RAG Semantic Similarity Score as a strong signal — it measures how well the CV content matches the query.
2. Also consider extracted skills, experience, and education.
3. Use the FULL 0-100 score range. Best candidate may score 90+, weakest may score 20. DO NOT cluster around 70.
4. If a recruiter requirement is given, it's the #1 priority — candidates who match it should be at the top.
5. In ranking_reason (2-3 sentences): cite specific evidence from their CV/retrieved sections. If recruiter query given, explicitly say if they match it.
6. Return ONLY valid JSON array, no other text.

[
  {"candidate_id": "<exact ID>", "candidate_name": "<name>", "rank": 1, "agentic_score": 88, "ranking_reason": "Ranked #1 because..."},
  ...
]`;

    const rawResult = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });

    const text = typeof rawResult === 'string' ? rawResult : JSON.stringify(rawResult);
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      console.error('agenticRank: no JSON array in LLM response:', text.slice(0, 500));
      return Response.json({ error: 'LLM returned no ranked candidates. Try again.' }, { status: 500 });
    }

    const rankedCandidates = JSON.parse(match[0]);
    console.log(`agenticRank: ranked ${rankedCandidates.length} candidates`);

    const roundNum = round || 2;

    await Promise.all(rankedCandidates.map(async (rc) => {
      const app = appsWithCV.find(a => a.id === rc.candidate_id);
      if (!app) return;

      const ctx = candidateContexts[app.id];

      await base44.asServiceRole.entities.Application.update(app.id, {
        match_score: rc.agentic_score,
        rag_results: {
          ...(app.rag_results || {}),
          agentic_score: rc.agentic_score,
          agentic_rank: rc.rank,
          agentic_explanation: rc.ranking_reason,
          agentic_round: roundNum,
          recruiter_query: recruiter_query || null,
          rag_semantic_score: ctx?.ragScore ? parseFloat((ctx.ragScore * 100).toFixed(1)) : null,
          retrieved_chunks: ctx?.topChunks?.length || 0,
          original_match_score: app.rag_results?.original_match_score ?? app.match_score,
        },
      });
    }));

    return Response.json({
      success: true,
      ranked: rankedCandidates.length,
      round: roundNum,
      results: rankedCandidates,
    });

  } catch (error) {
    console.error('agenticRank error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});