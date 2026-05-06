import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create') {
      return Response.json({ success: true });
    }

    // Only create Candidate records for 'user' role (candidates)
    if (data.role !== 'user') {
      return Response.json({ success: true });
    }

    // Create Candidate record
    await base44.asServiceRole.entities.Candidate.create({
      user_id: data.id,
      email: data.email,
      full_name: data.full_name || ""
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error creating candidate:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});