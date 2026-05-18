import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const recruiters = await base44.asServiceRole.entities.RecruiterProfile.list();
    return Response.json({ recruiters: recruiters || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});