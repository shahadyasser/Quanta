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
      ? `
⚠️ MANDATORY RECRUITER OVERRIDE — READ THIS FIRST:
The recruiter has specified: "${recruiter_query}"

This is NOT optional context. You MUST:
1. Re-score EVERY candidate based on how well they match this specific requirement.
2. Candidates who clearly match this → boost score significantly (by 10-25 points).
3. Candidates who clearly lack this → reduce score significantly (by 10-25 points).
4. If the recruiter's requirement eliminates most candidates, let the scores reflect that — do not artificially cluster around 70.
5. In ranking_reason, explicitly state whether this candidate meets or fails the recruiter's requirement and by how much.`
      : '';

    const prompt = `You are a senior AI talent analyst performing a rigorous, data-driven ranking of ${processedApps.length} job applicants.

JOB REQUIREMENTS:
${jobText}
${feedbackSection}

ALL CANDIDATES:
${candidateList}

SCORING RULES (follow strictly):
1. Use the FULL 0-100 range — the best candidate may score 90+, the worst may score 20. Do NOT cluster everyone near 70.
2. Score differences between adjacent candidates should be meaningful (at least 3-5 points apart if they genuinely differ).
3. If recruiter feedback is provided above, it OVERRIDES general job fit — a candidate who perfectly matches the recruiter's stated priority should jump to the top regardless of general profile.
4. If a candidate is missing a REQUIRED skill or qualification, cap their score at 60 max.
5. Consider: skills match, years of experience relevance, education fit, and any recruiter-stated priorities.

OUTPUT RULES:
- rank 1 = best overall fit
- ranking_reason: 2-3 sentences. Be specific — name the actual skills/experience matched or missing. If recruiter feedback exists, explicitly say how this candidate does or does not meet it.
- Return ONLY a valid JSON array, no other text.

[
  {"candidate_id": "<exact ID from list>", "candidate_name": "<name>", "rank": 1, "agentic_score": 87, "ranking_reason": "Ranked #1 because..."},
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