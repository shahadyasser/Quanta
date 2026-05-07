import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { data } = payload;

    // Only notify on new applications that have a recruiter email
    if (!data?.recruiter_email || !data?.candidate_email) {
      return Response.json({ skipped: true });
    }

    const base44 = createClientFromRequest(req);

    const subject = `New Application Received – ${data.job_title}`;
    const body = `Hi,\n\nA new application has been submitted for the ${data.job_title} position.\n\nCandidate: ${data.candidate_name || data.candidate_email}\nEmail: ${data.candidate_email}\nCompany: ${data.company}\n\nLog in to your recruiter dashboard to review the application and CV.\n\nBest regards,\nQuantaHire`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: data.recruiter_email,
      subject,
      body,
      from_name: "QuantaHire"
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error(error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});