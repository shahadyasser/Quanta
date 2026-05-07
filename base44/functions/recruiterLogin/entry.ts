import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.RecruiterProfile.filter({ email });

    if (profiles.length === 0) {
      return Response.json({ status: 'not_found' });
    }

    const profile = profiles[0];
    return Response.json({ status: profile.status, profile });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});