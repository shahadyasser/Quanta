import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { job_id, job_title, job_description, job_skills, recruiter_query, round } = await req.json();

    if (!job_id) return Response.json({ error: 'job_id is required' }, { status: 400 });

    const applications = await base44.asServiceRole.entities.Application.filter({ job_id });
    const processedApps = applications.filter(a => a.cv_url);

    if (processedApps.length === 0) {
      return Response.json({ error: 'No applications with CVs found.' }, { status: 400 });
    }

    console.log(`agenticRank: processing ${processedApps.length} candidates for job ${job_id}, round=${round}, query="${recruiter_query}"`);

    const jobText = [
      job_title ? `Job Title: ${job_title}` : '',
      job_description || '',
      job_skills?.length ? `Required Skills: ${job_skills.join(', ')}` : '',
    ].filter(Boolean).join('\n\n');

    const candidateList = processedApps.map((app, i) =>
      `[Candidate ${i + 1}]
ID: ${app.id}
Name: ${app.candidate_name || 'Unknown'}
Previous Score: ${app.match_score || 'N/A'}/100
Experience: ${app.years_of_experience || 'Not specified'} years
Skills: ${(app.skills || []).join(', ') || 'Not specified'}
Education: ${app.education_summary || 'Not specified'}
Work History: ${app.work_experience_summary || 'Not specified'}
Strengths: ${(app.strengths || []).join('; ') || 'None'}
Weaknesses: ${(app.improvements || []).join('; ') || 'None'}`
    ).join('\n\n---\n\n');

    const feedbackSection = recruiter_query
      ? `\nRECRUITER FEEDBACK (MUST influence your scoring): ${recruiter_query}
You MUST adjust your ratings based on this feedback. Candidates who match the feedback criteria should score HIGHER. Candidates who lack what the recruiter asked for should score LOWER.`
      : '';

    const prompt = `You are a senior AI recruiter performing a holistic re-ranking of ${processedApps.length} job applicants. Compare ALL candidates against each other AND the job requirements to produce a globally consistent ranking.

JOB REQUIREMENTS:
${jobText}
${feedbackSection}

ALL CANDIDATES:
${candidateList}

INSTRUCTIONS:
1. Score and rank ALL ${processedApps.length} candidates relative to each other
2. For each candidate, write a 2-3 sentence "ranking_reason" explaining:
   - Which job requirements they match
   - Which requirements they are missing
   - How the recruiter's feedback (if any) affected their score
3. agentic_score must reflect the recruiter's feedback if provided — do NOT give the same score as before if the feedback changes the priorities
4. rank 1 = best fit, include ALL candidates

Return ONLY a JSON array (no other text):
[
  {"candidate_id": "<exact ID from list>", "candidate_name": "<name>", "rank": 1, "agentic_score": 85, "ranking_reason": "Ranked #1 because..."},
  ...
]`;

    const rawResult = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });

    console.log(`agenticRank: LLM raw type=${typeof rawResult}, preview=${String(rawResult).slice(0, 200)}`);

    let rankedCandidates = [];
    const text = typeof rawResult === 'string' ? rawResult : JSON.stringify(rawResult);
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      rankedCandidates = JSON.parse(match[0]);
    }

    console.log(`agenticRank: parsed ${rankedCandidates.length} candidates`);

    if (rankedCandidates.length === 0) {
      console.error('agenticRank: LLM returned no candidates. Raw:', text.slice(0, 500));
      return Response.json({ error: 'LLM returned no ranked candidates. Try again.' }, { status: 500 });
    }

    const roundNum = round || 2;

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
        agentic_explanation: rc.ranking_reason || rc.explanation,
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