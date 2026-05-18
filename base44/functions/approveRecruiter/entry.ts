import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { recruiterId, action } = await req.json();

    if (!recruiterId || !action) {
      return Response.json({ error: 'Missing recruiterId or action' }, { status: 400 });
    }

    const updateData = action === 'approve' 
      ? { status: 'approved', is_approved: true }
      : { status: 'blocked' };

    await base44.asServiceRole.entities.RecruiterProfile.update(recruiterId, updateData);
    
    // Also update is_active in the users table if approved
    if (action === 'approve') {
      const profile = await base44.asServiceRole.entities.RecruiterProfile.get(recruiterId);
      // Update via postgres if needed - but for now rely on profile.status check in authLogin
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});