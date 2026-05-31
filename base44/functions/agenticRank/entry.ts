import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { job_id, job_title, job_description, job_skills, recruiter_query, round } = await req.json();

    if (!job_id) return Response.json({ error: 'job_id is required' }, { status: 400 });

    // Fetch all applications for this job that have a CV
    const applications = await base44.asServiceRole.entities.Application.filter({ job_id });
    const processedApps = applications.filter(a => a.cv_url);

    if (processedApps.length === 0) {
      return Response.json({ error: 'No applications with CVs found. Upload CVs first.' }, { status: 400 });
    }

    console.log(`agenticRank: processing ${processedApps.length} candidates for job ${job_id}`);

    const jobText = [
      job_title ? `Job Title: ${job_title}` : '',
      job_description || '',
      job_skills?.length ? `Required Skills: ${job_skills.join(', ')}` : '',
    ].filter(Boolean).join('\n\n');

    const candidateList = processedApps.map((app, i) =>
      `[Candidate ${i + 1}]
ID: ${app.id}
Name: ${app.candidate_name || 'Unknown'}
Score: ${app.match_score || 'N/A'}/100
Experience: ${app.years_of_experience || 'Not specified'} years
Skills: ${(app.skills || []).join(', ') || 'Not specified'}
Education: ${app.education_summary || 'Not specified'}
Work: ${app.work_experience_summary || 'Not specified'}
Strengths: ${(app.strengths || []).join('; ') || 'None'}
Weaknesses: ${(app.improvements || []).join('; ') || 'None'}`
    ).join('\n\n---\n\n');

    const prompt = `You are a senior AI recruiter re-ranking ${processedApps.length} job applicants.

JOB:
${jobText}
${recruiter_query ? `\nRECRUITER PRIORITY (give this heavy weight): ${recruiter_query}` : ''}

CANDIDATES:
${candidateList}

Rank ALL ${processedApps.length} candidates. Return ONLY a JSON array (no other text), like this:
[
  {"candidate_id": "<exact ID>", "candidate_name": "<name>", "rank": 1, "agentic_score": 85, "explanation": "2-3 sentences why this rank, referencing their actual experience vs others."},
  ...
]

Rules:
- rank 1 = best fit
- agentic_score 0-100
- Include ALL ${processedApps.length} candidates
- Use exact IDs from the list above
- explanation must reference ${recruiter_query ? 'the recruiter priority and ' : ''}specific candidate details`;

    const rawResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
    });

    console.log(`agenticRank: LLM raw response type=${typeof rawResult}, preview=${String(rawResult).slice(0, 200)}`);

    // Parse the JSON array from the response
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