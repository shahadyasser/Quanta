import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cv_url, candidate_id } = await req.json();

    // Step 1: Extract text content from the CV file (PDF/DOCX)
    const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url: cv_url,
      json_schema: {
        type: "object",
        properties: {
          full_name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          skills: { type: "array", items: { type: "string" } },
          years_of_experience: { type: "number" },
          education_summary: { type: "string" },
          work_experience_summary: { type: "string" }
        }
      }
    });

    if (extracted.status !== "success") {
      return Response.json({ error: "Failed to extract CV data: " + extracted.details }, { status: 400 });
    }

    const cvData = extracted.output;

    // Step 2: Run deeper AI analysis for match score, strengths, improvements
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert HR AI. Based on this candidate's CV data, compute an overall employability match score and identify strengths and areas for improvement.

Candidate CV Data:
- Name: ${cvData.full_name || "Unknown"}
- Skills: ${(cvData.skills || []).join(", ")}
- Years of Experience: ${cvData.years_of_experience || 0}
- Education: ${cvData.education_summary || "Not provided"}
- Work Experience: ${cvData.work_experience_summary || "Not provided"}

Return a match score (0-100) based on how complete and strong this candidate profile is, plus 3 strengths and 3 areas for improvement.`,
      response_json_schema: {
        type: "object",
        properties: {
          match_score: { type: "number" },
          strengths: { type: "array", items: { type: "string" } },
          improvements: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Step 3: Merge all results and save to CandidateProfile
    const finalData = {
      full_name: cvData.full_name || user.full_name,
      email: cvData.email || user.email,
      phone: cvData.phone || "",
      skills: cvData.skills || [],
      years_of_experience: cvData.years_of_experience || 0,
      education_summary: cvData.education_summary || "",
      work_experience_summary: cvData.work_experience_summary || "",
      match_score: analysis.match_score || 0,
      strengths: analysis.strengths || [],
      improvements: analysis.improvements || [],
      cv_url: cv_url,
      status: "processed",
      rag_results: { ...cvData, ...analysis }
    };

    if (candidate_id) {
      await base44.asServiceRole.entities.CandidateProfile.update(candidate_id, finalData);
    }

    return Response.json({ success: true, result: finalData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});