import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");
const GMAIL_USER = "shahadym0@gmail.com";

async function sendEmail({ to, subject, body, from_name = "QuantaHire" }) {
  const auth = btoa(`${GMAIL_USER}:${GMAIL_APP_PASSWORD}`);
  const message = `From: ${from_name} <${GMAIL_USER}>\nTo: ${to}\nSubject: ${subject}\nContent-Type: text/plain; charset=utf-8\n\n${body}`;
  
  const res = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw: btoa(message).replace(/\+/g, "-").replace(/\//g, "_"),
    }),
  });
  
  if (!res.ok) throw new Error(`Gmail API error: ${res.statusText}`);
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { data, old_data } = payload;

    // Only act on shortlisted or rejected status changes
    if (!data?.candidate_email) return Response.json({ skipped: true });
    if (data.status !== "shortlisted" && data.status !== "rejected") return Response.json({ skipped: true });
    if (old_data?.status === data.status) return Response.json({ skipped: "no change" });

    const base44 = createClientFromRequest(req);

    const isAccepted = data.status === "shortlisted";
    const subject = isAccepted
      ? `🎉 Congratulations! You've been accepted – ${data.job_title}`
      : `Application Update – ${data.job_title}`;

    const body = isAccepted
      ? `Dear ${data.candidate_name || "Candidate"},\n\nWe are delighted to inform you that your application for the ${data.job_title} position at ${data.company} has been accepted!\n\nOur team will be in touch shortly with the next steps.\n\nBest regards,\nThe QuantaHire Team`
      : `Dear ${data.candidate_name || "Candidate"},\n\nThank you for applying for the ${data.job_title} position at ${data.company}. After careful review, we will not be moving forward with your application at this time.\n\nWe encourage you to continue exploring other opportunities on QuantaHire.\n\nBest regards,\nThe QuantaHire Team`;

    await sendEmail({ to: data.candidate_email, subject, body });

    // Update candidate stats
    const candidates = await base44.asServiceRole.entities.Candidate.filter({ email: data.candidate_email });
    if (candidates.length > 0) {
      const cand = candidates[0];
      const allApps = await base44.asServiceRole.entities.Application.filter({ candidate_email: data.candidate_email });
      const accepted = allApps.filter(a => a.status === "shortlisted").length;
      const rejected = allApps.filter(a => a.status === "rejected").length;
      await base44.asServiceRole.entities.Candidate.update(cand.id, {
        total_applications: allApps.length,
        accepted_count: accepted,
        rejected_count: rejected,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error(error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});