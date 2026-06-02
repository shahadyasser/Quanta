import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { job_id } = await req.json();

    if (!job_id) {
      return Response.json({ error: 'job_id required' }, { status: 400 });
    }

    // Fetch job details
    const job = await base44.asServiceRole.entities.Job.get(job_id);
    if (!job) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    const jobSkills = job.skills || [];
    if (jobSkills.length === 0) {
      return Response.json({ success: true, message: 'No skills to graph' });
    }

    // Generate skill relationships using LLM
    const skillGraphPrompt = `You are a skill relationship analyzer. For a job with skills: ${jobSkills.join(', ')}

Generate relationships between these skills. For each primary skill, identify:
1. Prerequisites (skills needed before learning this)
2. Synergies (skills that work well together)
3. Related skills (similar or complementary)
4. Advanced skills (higher-level variants)

Return a JSON object where each key is a skill and value is an array of {skill, relationship, strength (0-1)}.
Only include relationships between the provided skills.
Keep it focused and practical.`;

    const llmRes = await base44.integrations.Core.InvokeLLM({
      prompt: skillGraphPrompt,
      response_json_schema: {
        type: 'object',
        additionalProperties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skill: { type: 'string' },
              relationship: { type: 'string', enum: ['prerequisite', 'synergy', 'related', 'advanced'] },
              strength: { type: 'number' }
            }
          }
        }
      }
    });

    const graphData = llmRes;

    // Clear old graph for this job
    const oldGraphs = await base44.asServiceRole.entities.SkillGraph.filter({ job_id });
    await Promise.all(oldGraphs.map(g => base44.asServiceRole.entities.SkillGraph.delete(g.id)));

    // Create new graph entries
    const entries = [];
    for (const [skill, relatedSkills] of Object.entries(graphData)) {
      entries.push({
        job_id,
        skill_name: skill,
        related_skills: relatedSkills || [],
        category: ['leadership', 'communication', 'team'].some(w => skill.toLowerCase().includes(w)) ? 'soft' : 'technical',
        importance: jobSkills.includes(skill) ? 0.9 : 0.5
      });
    }

    if (entries.length > 0) {
      await base44.asServiceRole.entities.SkillGraph.bulkCreate(entries);
    }

    return Response.json({
      success: true,
      job_id,
      skills_graphed: entries.length,
      total_relationships: entries.reduce((sum, e) => sum + (e.related_skills?.length || 0), 0)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});