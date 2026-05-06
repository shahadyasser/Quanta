import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    await base44.asServiceRole.users.inviteUser(email, "user");

    return Response.json({ success: true });
  } catch (error) {
    console.error("Invite error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});