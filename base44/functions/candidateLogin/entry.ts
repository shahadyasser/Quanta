import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const candidates = await base44.asServiceRole.entities.Candidate.filter({ email });

    if (candidates.length === 0) {
      return Response.json({ found: false });
    }

    return Response.json({ found: true, candidate: candidates[0] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});