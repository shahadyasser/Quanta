import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { full_name, company, email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if already registered
    const existing = await base44.asServiceRole.entities.RecruiterProfile.filter({ email });
    if (existing.length > 0) {
      return Response.json({ error: 'Email already registered' }, { status: 409 });
    }

    await base44.asServiceRole.entities.RecruiterProfile.create({
      full_name,
      company,
      email,
      role: "recruiter",
      status: "pending",
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});