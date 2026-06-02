import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
}

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
    throw new Error(`OpenAI embedding failed: ${data.error?.message || 'Unknown error'}`);
  }
  return data.data[0].embedding;
}

// ═══ AGENTIC STEP 1: Rewrite the query using LLM ═══
async function rewriteQuery(base44, jobText, recruiterFeedback, previousFeedbacks) {
  const historySection = previousFeedbacks.length > 0
    ? `\nPREVIOUS FEEDBACK HISTORY:\n${previousFeedbacks.map((f, i) => `  Round ${i + 2}: "${f}"`).join('\n')}`
    : '';

  const prompt = `You are an expert HR recruiter. The current search query did not satisfy the recruiter.

ORIGINAL JOB DESCRIPTION:
${jobText.slice(0, 1500)}

CURRENT RECRUITER FEEDBACK:
"${recruiterFeedback}"
${historySection}

Based on ALL the feedback (current and previous), write a NEW focused search query that:
1. Keeps the core job requirements
2. Strongly emphasizes what the recruiter asked for
3. De-emphasizes aspects the recruiter didn't mention

Output ONLY the rewritten search query (3-5 sentences), nothing else.`;

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
  const text = typeof result === 'string' ? result : result?.text || result?.content || JSON.stringify(result);
  return text.trim();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      job_id, job_title, job_description, job_skills,
      recruiter_query, round, previous_feedbacks
    } = await req.json();

    if (!job_id) return Response.json({ error: 'job_id is required' }, { status: 400 });
    if (!recruiter_query && round > 1) {
      return Response.json({ error: 'Recruiter feedback is required for re-ranking' }, { status: 400 });
    }

    const applications = await base44.asServiceRole.entities.Application.filter({ job_id });
    const appsWithCV = applications.filter(a => a.cv_url);

    if (appsWithCV.length === 0) {
      return Response.json({ error: 'No applications with CVs found.' }, { status: 400 });
    }

    const roundNum = round || 1;
    const allPreviousFeedbacks = previous_feedbacks || [];
    const cumulativeFeedback = [...allPreviousFeedbacks, recruiter_query].filter(Boolean).join('. Additionally: ');

    console.log(`agenticRankV2: ${appsWithCV.length} candidates, round=${roundNum}`);

    // ═══ AGENTIC STEP 1: Rewrite the search query ═══
    const jobText = [
      job_title ? `Job Title: ${job_title}` : '',
      job_description || '',
      (job_skills || []).length ? `Required Skills: ${job_skills.join(', ')}` : '',
    ].filter(Boolean).join('\n\n');

    let searchQuery;
    if (roundNum === 1 || !recruiter_query) {
      searchQuery = jobText;
      console.log('agenticRankV2: Round 1 — using original JD as query');
    } else {
      searchQuery = await rewriteQuery(base44, jobText, recruiter_query, allPreviousFeedbacks);
      console.log(`agenticRankV2: Rewritten query: "${searchQuery.slice(0, 200)}"`);
    }

    // ═══ AGENTIC STEP 2: Embed the REWRITTEN query ═══
    let queryEmbedding = null;
    try {
      queryEmbedding = await getEmbedding(searchQuery);
    } catch (embErr) {
      console.warn('agenticRankV2: embedding failed, LLM-only mode:', embErr.message);
    }

    // ═══ AGENTIC STEP 3: Retrieve relevant chunks using NEW embedding ═══
    const allEmbeddings = queryEmbedding
      ? await base44.asServiceRole.entities.CVEmbedding.filter({ job_id })
      : [];

    const candidateContexts = {};
    for (const app of appsWithCV) {
      const appEmbeddings = queryEmbedding ? allEmbeddings.filter(e => e.application_id === app.id) : [];

      if (appEmbeddings.length === 0) {
        candidateContexts[app.id] = { topChunks: [], ragScore: 0, hasEmbeddings: false };
        continue;
      }

      const scored = appEmbeddings.map(chunk => ({
        text: chunk.cv_text_chunk,
        similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
      })).sort((a, b) => b.similarity - a.similarity);

      const topChunks = scored.slice(0, 5);
      const avgRagScore = topChunks.reduce((s, c) => s + c.similarity, 0) / topChunks.length;

      candidateContexts[app.id] = {
        topChunks: topChunks.map(c => c.text),
        ragScore: avgRagScore,
        hasEmbeddings: true,
      };
    }

    // ═══ AGENTIC STEP 4: Score ALL candidates with feedback-aware prompt ═══
    const candidateList = appsWithCV.map((app, i) => {
      const ctx = candidateContexts[app.id];
      const ragSnippet = ctx.hasEmbeddings && ctx.topChunks.length > 0
        ? `\nMost Relevant CV Sections (retrieved by RAG for this specific query):\n${ctx.topChunks.map((t, j) => `  [${j+1}] ${t.slice(0, 500)}`).join('\n')}`
        : '';

      return `[Candidate ${i + 1}]
ID: ${app.id}
Name: ${app.candidate_name || 'Unknown'}
RAG Similarity to REWRITTEN Query: ${ctx.hasEmbeddings ? (ctx.ragScore * 100).toFixed(1) : 'N/A'}%
Experience: ${app.years_of_experience || 'Not specified'} years
Skills: ${(app.skills || []).join(', ') || 'Not specified'}
Education: ${app.education_summary || 'Not specified'}
Work History: ${app.work_experience_summary || 'Not specified'}
Strengths: ${(app.strengths || []).join('; ') || 'None'}
Areas for Improvement: ${(app.improvements || []).join('; ') || 'None'}${ragSnippet}`;
    }).join('\n\n---\n\n');

    let feedbackSection = '';
    if (cumulativeFeedback) {
      feedbackSection = `

⚠️ RECRUITER FEEDBACK (THIS IS YOUR #1 PRIORITY — MUST CHANGE THE RANKING):
"${cumulativeFeedback}"

CRITICAL INSTRUCTIONS FOR AGENTIC RE-RANKING:
- You MUST re-order candidates based on this feedback. If the ranking doesn't change from the previous round, you have FAILED.
- Candidates who MATCH the feedback criteria MUST move UP in rank and receive HIGHER scores.
- Candidates who LACK what the recruiter asked for MUST move DOWN and receive LOWER scores.
- In ranking_reason, you MUST explicitly state whether each candidate satisfies the recruiter's feedback and WHY.
- Use the RAG-retrieved CV sections as evidence — cite specific skills, projects, or experience found in them.
- Do NOT just repeat the previous ranking. The recruiter gave feedback because they wanted CHANGES.`;
    }

    const prompt = `You are an expert AI recruiter performing Agentic RAG-powered candidate ranking (Round ${roundNum}).

JOB REQUIREMENTS:
${jobText}
${feedbackSection}

ALL CANDIDATES (${appsWithCV.length} total — you MUST rank every single one):
${candidateList}

SCORING RULES:
1. The RAG Similarity score shows how well each CV matches the CURRENT query (which includes recruiter feedback). Use it as a strong signal.
2. Use the FULL 0-100 range. Best = 85-95, good = 70-84, average = 50-69, weak = 30-49, poor = 10-29.
3. NO tied scores. Every candidate must have a unique score.
4. ranking_reason MUST be 2-3 sentences citing SPECIFIC evidence from their CV sections. If recruiter feedback exists, explicitly say "Matches recruiter requirement because..." or "Does NOT match recruiter requirement because..."
5. Return ONLY a valid JSON array, no other text.

[
  {"candidate_id": "<exact ID>", "candidate_name": "<name>", "rank": 1, "agentic_score": 88, "ranking_reason": "Ranked #1 because..."},
  ...all ${appsWithCV.length} candidates...
]`;

    const rawResult = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    const text = typeof rawResult === 'string' ? rawResult : JSON.stringify(rawResult);
    const match = text.match(/\[[\s\S]*\]/);

    if (!match) {
      console.error('agenticRankV2: no JSON in LLM response:', text.slice(0, 500));
      return Response.json({ error: 'LLM returned no ranked candidates. Try again.' }, { status: 500 });
    }

    const rankedCandidates = JSON.parse(match[0]);
    console.log(`agenticRankV2: ranked ${rankedCandidates.length} candidates in round ${roundNum}`);

    // ═══ AGENTIC STEP 5: Save results with full history ═══
    await Promise.all(rankedCandidates.map(async (rc) => {
      const app = appsWithCV.find(a => a.id === rc.candidate_id);
      if (!app) return;

      const ctx = candidateContexts[app.id];
      const previousRank = app.rag_results?.agentic_rank || null;
      const previousScore = app.rag_results?.agentic_score || app.match_score || null;

      // Accumulate round history
      const roundHistory = [...(app.rag_results?.round_history || [])];
      roundHistory.push({ round: roundNum, score: rc.agentic_score, rank: rc.rank });

      await base44.asServiceRole.entities.Application.update(app.id, {
        rag_results: {
          ...(app.rag_results || {}),
          agentic_score: finalScore,
          llm_rank_suggestion: rc.agentic_score,
          agentic_rank: rc.rank,
          agentic_explanation: rc.ranking_reason,
          agentic_round: roundNum,
          recruiter_query: recruiter_query || null,
          cumulative_feedback: cumulativeFeedback || null,
          rewritten_query: roundNum > 1 ? searchQuery : null,
          rag_semantic_score: ctx?.ragScore ? parseFloat((ctx.ragScore * 100).toFixed(1)) : null,
          retrieved_chunks: ctx?.topChunks?.length || 0,
          round_history: roundHistory,
          original_match_score: app.rag_results?.original_match_score ?? app.match_score,
          previous_rank: previousRank,
          previous_score: previousScore,
          rank_change: previousRank ? previousRank - rc.rank : null,
        },
      });
    }));

    return Response.json({
      success: true,
      ranked: rankedCandidates.length,
      round: roundNum,
      rewritten_query: roundNum > 1 ? searchQuery : null,
      cumulative_feedback: cumulativeFeedback,
      results: rankedCandidates,
    });

  } catch (error) {
    console.error('agenticRankV2 error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});