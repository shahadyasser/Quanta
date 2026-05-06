import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── Paper's Multi-Construct Scoring System ───
const SCORE_SYSTEM = `You are a professional HR that rates resumes. Generate a score on the scale 1–5 for each work experience match, skills match, educational background match and certifications/extracurricular match based on the job description summary and resume. Additionally provide the reasons for the generated rating. Be strict in rating.

The format of the output should be exactly like following:

Rating: 
Work Experience Match: 
Skills Match: 
Educational Background Match: 
Certifications/Extracurricular Match: 

Reasons for rating:`;

// Parse the LLM rating response into 4 scores
function parseRating(resp) {
  const scores = { work_exp: 3, skills: 3, education: 3, certifications: 3 };
  const reasons = { work_exp: "", skills: "", education: "", certifications: "" };

  const lines = resp.trim().split("\n");
  let inRatingSection = true;
  let inReasonsSection = false;
  const reasonAccum = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (line.includes("Rating:")) continue;
    if (line.includes("Reasons for rating:")) {
      inRatingSection = false;
      inReasonsSection = true;
      continue;
    }
    if (inRatingSection) {
      if (line.startsWith("Work Experience Match:")) {
        const val = line.split(":", 1)[1] ? line.split(":")[1].trim() : "";
        const num = parseInt(val);
        if (!isNaN(num)) scores.work_exp = Math.min(5, Math.max(1, num));
      } else if (line.startsWith("Skills Match:")) {
        const val = line.split(":")[1] ? line.split(":")[1].trim() : "";
        const num = parseInt(val);
        if (!isNaN(num)) scores.skills = Math.min(5, Math.max(1, num));
      } else if (line.startsWith("Educational Background Match")) {
        const parts = line.split(":");
        const val = parts[1] ? parts[1].trim() : "";
        const num = parseInt(val);
        if (!isNaN(num)) scores.education = Math.min(5, Math.max(1, num));
      } else if (line.startsWith("Certifications/Extracurricular Match:")) {
        const val = line.split(":")[1] ? line.split(":")[1].trim() : "";
        const num = parseInt(val);
        if (!isNaN(num)) scores.certifications = Math.min(5, Math.max(1, num));
      }
    } else if (inReasonsSection) {
      reasonAccum.push(line);
    }
  }

  const fullReason = reasonAccum.join(" ");
  const parts = fullReason.split(".").filter(p => p.trim()).map(p => p.trim() + ".");
  const keys = ["work_exp", "skills", "education", "certifications"];
  keys.forEach((key, i) => {
    reasons[key] = i < parts.length ? parts[i] : (i === 0 ? fullReason.slice(0, 100) : "");
  });

  return { scores, reasons };
}

// Convert 4 scores (1-5) → total match (0-100): (avg - 1) * 25
function totalMatchFromScores(scores) {
  const avg = (scores.work_exp + scores.skills + scores.education + scores.certifications) / 4.0;
  const total = (avg - 1) * 25;
  return Math.max(0, Math.min(100, Math.round(total * 10) / 10));
}

// Hybrid score: 30% semantic similarity + 70% LLM total
function hybridScore(similarity, llmTotal, weightSim = 0.3, weightLlm = 0.7) {
  return Math.round((weightSim * similarity + weightLlm * llmTotal) * 10) / 10;
}

// Compute cosine similarity between two text embeddings via LLM
async function computeSemanticSimilarity(base44, text1, text2) {
  if (!text1 || !text2) return 0;
  // Use LLM to compute a semantic similarity score (0-100)
  // since we can't run sentence-transformers in Deno
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Rate the semantic similarity between these two texts on a scale of 0-100, where:
- 0 = completely unrelated
- 50 = somewhat related  
- 100 = identical meaning

Text 1 (Job Description):
${text1.slice(0, 2000)}

Text 2 (CV/Resume):
${text2.slice(0, 2000)}

Output ONLY a single number between 0 and 100. Nothing else.`,
    response_json_schema: {
      type: "object",
      properties: {
        similarity_score: { type: "number" }
      }
    }
  });
  const score = result?.similarity_score;
  if (typeof score === "number") return Math.min(100, Math.max(0, score));
  return 50;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { cv_url, application_id, job_title, job_description, job_skills } = await req.json();

    // Step 1: Extract CV text content
    const isDocx = cv_url.toLowerCase().includes(".docx");

    let cvData;
    if (isDocx) {
      cvData = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract the following structured information from this CV/resume document:
- full_name: the candidate's full name
- email: email address
- phone: phone number
- skills: array of technical and professional skills
- years_of_experience: total years of work experience as a number
- education_summary: brief summary of education background
- work_experience_summary: brief summary of work experience
- cv_text: the complete raw text of the CV (all content concatenated)

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
            work_experience_summary: { type: "string" },
            cv_text: { type: "string" }
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
            work_experience_summary: { type: "string" },
            cv_text: { type: "string" }
          }
        }
      });
      if (extracted.status !== "success") {
        return Response.json({ error: "Failed to extract CV data: " + extracted.details }, { status: 400 });
      }
      cvData = extracted.output;
    }

    const cvText = cvData.cv_text || [
      cvData.work_experience_summary,
      cvData.education_summary,
      (cvData.skills || []).join(", ")
    ].filter(Boolean).join("\n\n");

    // Build job context text
    const jobText = [
      job_title ? `Job Title: ${job_title}` : "",
      job_description || "",
      job_skills?.length ? `Required Skills: ${job_skills.join(", ")}` : ""
    ].filter(Boolean).join("\n\n");

    // Step 2: Stage 1 — Semantic similarity score (like embedding cosine similarity in the paper)
    const similarityScore = await computeSemanticSimilarity(base44, jobText, cvText);

    // Step 3: Stage 2 — Paper's multi-construct LLM scoring (4 constructs: WE, Skills, Education, Certifications)
    const scoringResp = await base44.integrations.Core.InvokeLLM({
      prompt: `Job description summary:\n${jobText.slice(0, 3000)}\n\nResume content:\n${cvText.slice(0, 5000)}`,
      response_json_schema: null
    });

    // Parse the 4-construct ratings
    let scores, reasons, llmTotal;
    try {
      const parsed = parseRating(scoringResp || "");
      scores = parsed.scores;
      reasons = parsed.reasons;
      llmTotal = totalMatchFromScores(scores);
    } catch (e) {
      scores = { work_exp: 3, skills: 3, education: 3, certifications: 3 };
      reasons = {};
      llmTotal = 50;
    }

    // Step 4: Hybrid final score (30% similarity + 70% LLM) — same as paper
    const finalScore = hybridScore(similarityScore, llmTotal, 0.3, 0.7);

    // Build strengths/improvements from reasons
    const strengths = [
      reasons.skills ? `Skills: ${reasons.skills.slice(0, 100)}` : null,
      reasons.work_exp ? `Experience: ${reasons.work_exp.slice(0, 100)}` : null,
      reasons.education ? `Education: ${reasons.education.slice(0, 100)}` : null,
    ].filter(Boolean);

    const improvements = [];
    if (scores.work_exp < 3) improvements.push("Needs more relevant work experience");
    if (scores.skills < 3) improvements.push("Missing key technical skills for this role");
    if (scores.education < 3) improvements.push("Educational background could be stronger");
    if (scores.certifications < 3) improvements.push("Additional certifications would strengthen the application");
    if (improvements.length === 0) improvements.push("Continue developing domain-specific expertise");

    // Step 5: Update Application record
    const updateData = {
      candidate_name: cvData.full_name || "",
      candidate_email: cvData.email || "",
      skills: cvData.skills || [],
      years_of_experience: cvData.years_of_experience || 0,
      education_summary: cvData.education_summary || "",
      work_experience_summary: cvData.work_experience_summary || "",
      match_score: finalScore,
      strengths,
      improvements,
      cv_url,
      status: "processed",
      rag_results: {
        similarity_score: similarityScore,
        llm_total: llmTotal,
        final_score: finalScore,
        construct_scores: {
          work_experience: scores.work_exp,
          skills: scores.skills,
          education: scores.education,
          certifications: scores.certifications
        },
        verdict: `WE:${scores.work_exp} Sk:${scores.skills} Ed:${scores.education} Cert:${scores.certifications}`
      }
    };

    if (application_id) {
      await base44.asServiceRole.entities.Application.update(application_id, updateData);
    }

    return Response.json({ success: true, result: updateData });
  } catch (error) {
    console.error("processCV error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});