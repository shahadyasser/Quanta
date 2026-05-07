import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import pg from 'npm:pg@8.11.3';

const pool = new pg.Pool({
  host: Deno.env.get('PGHOST'),
  port: parseInt(Deno.env.get('PGPORT') || '5432'),
  database: Deno.env.get('PGDATABASE'),
  user: Deno.env.get('PGUSER'),
  password: Deno.env.get('PGPASSWORD'),
  ssl: { rejectUnauthorized: false },
});

// ─── OpenAI Embeddings for Real RAG ───
async function getEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000)
    })
  });
  console.log("OpenAI API response status:", response.status);
  if (!response.ok) {
    const errText = await response.text();
    console.error("OpenAI API error response:", errText);
    return null; // Return null on failure; caller handles gracefully
  }
  const data = await response.json();
  return data.data[0].embedding; // 1536-dimensional vector
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function computeRealSimilarity(text1, text2) {
  const [emb1, emb2] = await Promise.all([
    getEmbedding(text1),
    getEmbedding(text2)
  ]);
  const sim = cosineSimilarity(emb1, emb2);
  return Math.round(Math.max(0, sim) * 1000) / 10; // 0-100 scale
}

// Smart chunking: split on paragraph breaks, keep chunks under 1500 chars
function chunkText(text, maxChunkSize = 1500) {
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  const chunks = [];
  let currentChunk = '';
  
  for (const para of paragraphs) {
    if ((currentChunk + '\n\n' + para).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
    }
  }
  
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
}

// Retrieve top-10 most similar chunks from same job posting, with fallback to current CV
async function retrieveTopChunks(base44, jobEmbedding, jobId, applicationId, topK = 10) {
  // Try to get embeddings from all CVs for this job
  let allEmbeddings = await base44.asServiceRole.entities.CVEmbedding.filter({ job_id: jobId });
  
  // Fallback to current CV only if no cross-CV embeddings exist
  if (!allEmbeddings || allEmbeddings.length === 0) {
    allEmbeddings = await base44.asServiceRole.entities.CVEmbedding.filter({ application_id: applicationId });
  }
  
  const scored = allEmbeddings.map(emb => {
    const sim = cosineSimilarity(jobEmbedding, emb.embedding);
    return { ...emb, similarity: sim };
  });
  
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topK);
}

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { cv_url, application_id, job_id, job_title, job_description, job_skills } = await req.json();

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

    // Step 2: Stage 1 — Real cosine similarity using OpenAI embeddings
    console.log("Starting embedding similarity calculation");
    let similarityScore = 50; // Default fallback
    try {
      similarityScore = await computeRealSimilarity(jobText, cvText);
      console.log("Similarity score calculated:", similarityScore);
    } catch (err) {
      console.error("OpenAI embedding failed, using fallback score:", err.message);
    }

    // Step 3: Stage 2 — Store CV chunks and embeddings
    const cvChunks = chunkText(cvText, 1500);
    console.log("CV text chunked:", cvChunks.length, "chunks created");
    const pgClient = await pool.connect();
    let storedChunksCount = 0;
    try {
      try {
        await Promise.all(cvChunks.map(async (chunk, idx) => {
          console.log("Processing chunk", idx + 1, "of", cvChunks.length);
          const embedding = await getEmbedding(chunk);
          
          if (!embedding) {
            console.warn("Chunk", idx, "embedding failed, skipping storage");
            return;
          }
          
          console.log("Chunk", idx, "embedding obtained, length:", embedding.length);
          // Write to Neon cv_embeddings table
          await pgClient.query(
            `INSERT INTO cv_embeddings (application_id, job_id, embedding, cv_text_chunk, chunk_index)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT DO NOTHING`,
            [application_id, job_id || null, JSON.stringify(embedding), chunk.slice(0, 2000), idx]
          );
          storedChunksCount++;
          console.log("Chunk", idx, "stored in cv_embeddings table");
          // Also write to Base44 entity for backward compatibility
          await base44.asServiceRole.entities.CVEmbedding.create({
            application_id,
            job_id: job_id || "",
            embedding,
            cv_text_chunk: chunk.slice(0, 2000),
            chunk_index: idx
          });
        }));
        console.log("Stored", storedChunksCount, "chunks in cv_embeddings");
      } catch (err) {
        console.error("Embedding storage error:", err.message);
        // Continue with LLM-only scoring instead of crashing
        console.log("Continuing with LLM-only scoring");
      }
    } finally {
      pgClient.release();
    }

    // Step 4: Stage 3 — Retrieve top 10 most relevant chunks from all CVs for this job
    console.log("Retrieving context chunks from stored embeddings");
    let jobEmbedding;
    let retrievedChunks = [];
    try {
      jobEmbedding = await getEmbedding(jobText);
      if (jobEmbedding) {
        retrievedChunks = await retrieveTopChunks(base44, jobEmbedding, job_id || "", application_id, 10);
        console.log("Retrieved", retrievedChunks.length, "relevant chunks for RAG");
      } else {
        console.warn("Job embedding failed, using fallback retrieval");
      }
    } catch (err) {
      console.error("Chunk retrieval failed:", err.message);
    }
    const retrievedText = retrievedChunks.map(c => c.cv_text_chunk).join("\n---\n");
    const chunksCount = retrievedChunks.length;

    // Step 5: LLM scoring with RAG-augmented context and system prompt
    console.log("Starting LLM scoring with", chunksCount, "retrieved context chunks");
    const scoringResp = await base44.integrations.Core.InvokeLLM({
      system_prompt: SCORE_SYSTEM,
      prompt: `Job description:\n${jobText.slice(0, 2000)}\n\nResume:\n${cvText.slice(0, 3000)}\n\nMost relevant retrieved context:\n${retrievedText.slice(0, 3000)}`
    });
    console.log("LLM scoring completed");

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
    console.log("Final match score:", finalScore, "(similarity:", similarityScore, "+ LLM:", llmTotal, ")");

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

    // Step 6: Update applications table directly in Neon Postgres
    const ragResults = {
      similarity_score: similarityScore,
      llm_total: llmTotal,
      final_score: finalScore,
      chunks_stored: cvChunks.length,
      chunks_retrieved: chunksCount,
      retrieval_method: "embedding_cosine",
      embedding_model: "text-embedding-3-small",
      construct_scores: {
        work_experience: scores.work_exp,
        skills: scores.skills,
        education: scores.education,
        certifications: scores.certifications
      },
      verdict: `WE:${scores.work_exp} Sk:${scores.skills} Ed:${scores.education} Cert:${scores.certifications}`
    };

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
      rag_results: ragResults
    };

    if (application_id) {
      // Write directly to Neon Postgres applications table
      const client = await pool.connect();
      try {
        await client.query(
          `UPDATE applications SET
            match_score = $1,
            strengths = $2,
            improvements = $3,
            rag_results = $4,
            status = 'processed',
            skills = $5,
            years_of_experience = $6,
            education_summary = $7,
            work_experience_summary = $8,
            candidate_name = $9,
            candidate_email = $10
          WHERE id = $11`,
          [
            finalScore,
            JSON.stringify(strengths),
            JSON.stringify(improvements),
            JSON.stringify(ragResults),
            JSON.stringify(cvData.skills || []),
            cvData.years_of_experience || 0,
            cvData.education_summary || "",
            cvData.work_experience_summary || "",
            cvData.full_name || "",
            cvData.email || "",
            application_id
          ]
        );
      } finally {
        client.release();
      }

      // Also update Base44 entity for backward compatibility
      await base44.asServiceRole.entities.Application.update(application_id, updateData);
    }

    console.log("CV processing completed successfully");
    return Response.json({ success: true, result: updateData });
  } catch (error) {
    console.error("processCV error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});