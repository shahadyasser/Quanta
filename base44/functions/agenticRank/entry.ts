import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { job_id, job_title, job_description, job_skills, recruiter_query, round } = await req.json();

    if (!job_id) return Response.json({ error: 'job_id is required' }, { status: 400 });

    // Fetch all applications for this job that have been processed
    const applications = await base44.asServiceRole.entities.Application.filter({ job_id });
    // Include any candidate that has a CV uploaded, regardless of processing status
    const processedApps = applications.filter(a => a.cv_url);

    if (processedApps.length === 0) {
      return Response.json({ error: 'No processed applications found. Run initial RAG first.' }, { status: 400 });
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

    const prompt = `You are a senior AI recruiter performing a holistic agentic re-ranking of ${processedApps.length} job applicants. Unlike standard screening, you compare ALL candidates against each other AND against the job requirements to produce the most accurate relative ranking.

JOB REQUIREMENTS:
${jobText}
${recruiter_query ? `\nRECRUITER'S SPECIFIC REQUIREMENTS/PRIORITIES:\n${recruiter_query}` : ''}

ALL CANDIDATES TO RANK:
${candidateList}

INSTRUCTIONS:
1. Compare all candidates holistically against each other
2. ${recruiter_query ? 'Give special weight to the recruiter\'s stated requirements' : 'Weight candidates by overall fit, experience, and skill alignment'}
3. For each candidate, write a detailed 2-4 sentence explanation explaining SPECIFICALLY why they are ranked at their position — reference their actual skills, experience, and how they compare to other candidates
4. Be specific, honest, and professional — mention what each candidate uniquely brings or lacks

Return a JSON object ranking ALL ${processedApps.length} candidates:`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          ranked_candidates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                candidate_id:    { type: 'string' },
                candidate_name:  { type: 'string' },
                rank:            { type: 'number' },
                agentic_score:   { type: 'number' },
                explanation:     { type: 'string' },
              }
            }
          }
        }
      }
    });

    const rankedCandidates = result?.ranked_candidates || [];
    const roundNum = round || 2;

    // Update each application with agentic scores and explanations
    await Promise.all(rankedCandidates.map(async (rc) => {
      const app = processedApps.find(a => a.id === rc.candidate_id);
      if (!app) return;

      const updatedRagResults = {
        ...(app.rag_results || {}),
        agentic_score: rc.agentic_score,
        agentic_rank: rc.rank,
        agentic_explanation: rc.explanation,
        agentic_round: roundNum,
        recruiter_query: recruiter_query || null,
        original_match_score: app.rag_results?.original_match_score ?? app.match_score,
      };

      await base44.asServiceRole.entities.Application.update(rc.candidate_id, {
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