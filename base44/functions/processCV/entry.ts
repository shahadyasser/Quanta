import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cv_url, candidate_id } = await req.json();

    // Fetch the CV content from URL
    const cvResponse = await fetch(cv_url);
    const cvText = await cvResponse.text();

    // Run RAG pipeline via AI
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert HR AI system. Analyze the following CV/resume text and extract structured information, then match it against common job requirements.

CV Content:
${cvText.substring(0, 8000)}

Extract and return:
1. Candidate full name
2. Email (if found)
3. Phone (if found)
4. List of technical and soft skills (array)
5. Years of experience (number)
6. Education summary
7. Work experience summary (last 3 positions)
8. An overall match score out of 100 (based on general employability and skill set completeness)
9. Top 3 strengths
10. Areas for improvement

Be concise and factual.`,
      response_json_schema: {
        type: "object",
        properties: {
          full_name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          skills: { type: "array", items: { type: "string" } },
          years_of_experience: { type: "number" },
          education_summary: { type: "string" },
          work_experience_summary: { type: "string" },
          match_score: { type: "number" },
          strengths: { type: "array", items: { type: "string" } },
          improvements: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Update the candidate profile with extracted data
    if (candidate_id) {
      await base44.asServiceRole.entities.CandidateProfile.update(candidate_id, {
        full_name: result.full_name || user.full_name,
        skills: result.skills || [],
        cv_url: cv_url,
        rag_results: result,
        match_score: result.match_score || 0,
        years_of_experience: result.years_of_experience || 0,
        education_summary: result.education_summary || "",
        work_experience_summary: result.work_experience_summary || "",
        strengths: result.strengths || [],
        improvements: result.improvements || [],
        status: "processed"
      });
    }

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});