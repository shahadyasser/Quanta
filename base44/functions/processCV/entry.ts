import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { cv_url, application_id, job_title, job_skills } = await req.json();

    // Step 1: Extract text content from the CV file
    // For DOCX files, use LLM with file_urls since ExtractDataFromUploadedFile doesn't support docx
    const isDocx = cv_url.toLowerCase().includes(".docx") || cv_url.toLowerCase().includes("docx");

    let cvData;

    if (isDocx) {
      // Use InvokeLLM with file_urls to read and extract from DOCX
      cvData = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract the following structured information from this CV/resume document:
- full_name: the candidate's full name
- email: email address
- phone: phone number
- skills: array of technical and professional skills
- years_of_experience: total years of work experience as a number
- education_summary: brief summary of education background
- work_experience_summary: brief summary of work experience

Return only the JSON object with these fields.`,
        file_urls: [cv_url],
        response_json_schema: {
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
    } else {
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
      cvData = extracted.output;
    }

    // Step 2: Run AI analysis with job context for targeted match score
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert HR AI. Analyze this candidate's CV data and compute a match score specifically for the job role.

Job Role: ${job_title || "General Position"}
Required Skills: ${(job_skills || []).join(", ") || "Not specified"}

Candidate CV Data:
- Name: ${cvData.full_name || "Unknown"}
- Skills: ${(cvData.skills || []).join(", ")}
- Years of Experience: ${cvData.years_of_experience || 0}
- Education: ${cvData.education_summary || "Not provided"}
- Work Experience: ${cvData.work_experience_summary || "Not provided"}

Return:
1. match_score (0-100): How well this candidate matches the specific job role and required skills
2. strengths: 3 specific strengths relevant to this role
3. improvements: 3 areas where the candidate could improve for this role`,
      response_json_schema: {
        type: "object",
        properties: {
          match_score: { type: "number" },
          strengths: { type: "array", items: { type: "string" } },
          improvements: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Step 3: Update the Application record
    const updateData = {
      candidate_name: cvData.full_name || "",
      candidate_email: cvData.email || "",
      skills: cvData.skills || [],
      years_of_experience: cvData.years_of_experience || 0,
      education_summary: cvData.education_summary || "",
      work_experience_summary: cvData.work_experience_summary || "",
      match_score: analysis.match_score || 0,
      strengths: analysis.strengths || [],
      improvements: analysis.improvements || [],
      cv_url: cv_url,
      status: "processed"
    };

    if (application_id) {
      await base44.asServiceRole.entities.Application.update(application_id, updateData);
    }

    return Response.json({ success: true, result: updateData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});