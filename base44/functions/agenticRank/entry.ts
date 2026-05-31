import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import OpenAI from 'npm:openai';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { job_id, job_title, job_description, job_skills, recruiter_query, round } = await req.json();

    if (!job_id) return Response.json({ error: 'job_id is required' }, { status: 400 });

    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

    // Fetch all applications for this job that have a CV
    const applications = await base44.asServiceRole.entities.Application.filter({ job_id });
    const processedApps = applications.filter(a => a.cv_url);

    if (processedApps.length === 0) {
      return Response.json({ error: 'No applications with CVs found. Upload CVs first.' }, { status: 400 });
    }

    const jobText = [
      job_title ? `Job Title: ${job_title}` : '',
      job_description || '',
      job_skills?.length ? `Required Skills: ${job_skills.join(', ')}` : '',
    ].filter(Boolean).join('\n\n');

    const candidateList = processedApps.map((app, i) =>
      `[Candidate ${i + 1}] ID: ${app.id}
Name: ${app.candidate_name || 'Unknown'}
Initial RAG Score: ${app.match_score || 'N/A'}/100
Years of Experience: ${app.years_of_experience || 'Not specified'}
Skills: ${(app.skills || []).join(', ') || 'Not specified'}
Education: ${app.education_summary || 'Not specified'}
Work Experience: ${app.work_experience_summary || 'Not specified'}
Strengths: ${(app.strengths || []).join('; ') || 'None'}
Areas for Improvement: ${(app.improvements || []).join('; ') || 'None'}`
    ).join('\n\n---\n\n');

    const systemPrompt = `You are a senior AI recruiter performing holistic agentic re-ranking. Compare ALL candidates against each other AND against the job requirements. Return ONLY valid JSON, no extra text.`;

    const userPrompt = `Re-rank ${processedApps.length} candidates for this job.

JOB REQUIREMENTS:
${jobText}
${recruiter_query ? `\nRECRUITER'S SPECIFIC PRIORITIES (apply heavy weight to this):\n${recruiter_query}` : ''}

ALL CANDIDATES:
${candidateList}

Return JSON in exactly this format:
{
  "ranked_candidates": [
    {
      "candidate_id": "<exact ID from above>",
      "candidate_name": "<name>",
      "rank": <1 = best>,
      "agentic_score": <0-100>,
      "explanation": "<2-4 sentences: why this rank, referencing their actual skills/experience vs others${recruiter_query ? ' and addressing the recruiter priorities' : ''}>"
    }
  ]
}

Include ALL ${processedApps.length} candidates. Rank 1 = best fit.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    const rankedCandidates = parsed.ranked_candidates || [];

    console.log(`agenticRank: ranked ${rankedCandidates.length} candidates, round=${round}, query="${recruiter_query}"`);

    if (rankedCandidates.length === 0) {
      return Response.json({ error: 'LLM returned no ranked candidates' }, { status: 500 });
    }

    const roundNum = round || 2;

    // Update each application with new agentic scores and explanations
    await Promise.all(rankedCandidates.map(async (rc) => {
      const app = processedApps.find(a => a.id === rc.candidate_id);
      if (!app) {
        console.warn(`agenticRank: no app found for candidate_id=${rc.candidate_id}`);
        return;
      }

      const updatedRagResults = {
        ...(app.rag_results || {}),
        agentic_score: rc.agentic_score,
        agentic_rank: rc.rank,
        agentic_explanation: rc.explanation,
        agentic_round: roundNum,
        recruiter_query: recruiter_query || null,
        original_match_score: app.rag_results?.original_match_score ?? app.match_score,
      };

      await base44.asServiceRole.entities.Application.update(app.id, {
        match_score: rc.agentic_score,
        rag_results: updatedRagResults,
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