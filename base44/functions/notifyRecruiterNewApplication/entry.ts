import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { data } = payload;

    if (!data?.recruiter_email || !data?.candidate_email) {
      return Response.json({ skipped: true, reason: "Missing recruiter_email or candidate_email" });
    }

    const base44 = createClientFromRequest(req);

    const subject = `New Application Received – ${data.job_title || "Your Job Posting"}`;
    const body = `Hello,

A new candidate has applied for the position: ${data.job_title || "Unknown"} at ${data.company || "your company"}.

Candidate Details:
- Name: ${data.candidate_name || "Unknown"}
- Email: ${data.candidate_email}

Please log in to QuantaHire to review their application and CV.

Best regards,
The QuantaHire Team`;

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: data.recruiter_email,
        subject,
        body,
        from_name: "QuantaHire"
      });
      console.log("Email sent to recruiter:", data.recruiter_email);
    } catch (emailErr) {
      // Recruiter may not be a registered app user — log and skip gracefully
      console.warn("Could not send email to recruiter (not a registered app user):", data.recruiter_email, emailErr.message);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("notifyRecruiterNewApplication error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});