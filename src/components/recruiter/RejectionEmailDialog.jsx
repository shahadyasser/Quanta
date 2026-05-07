import React, { useState } from "react";
import { X, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function RejectionEmailDialog({ application, recruiterName, companyName, onClose, onSent }) {
  const [subject, setSubject] = useState(`Update on your application for ${application.job_title}`);
  const [body, setBody] = useState(
    `Dear ${application.candidate_name},

Thank you for your interest in the ${application.job_title} position and for taking the time to apply.

After careful review, we have decided not to move forward with your application at this time. We appreciate your effort and encourage you to apply for future positions that match your skills and experience.

We wish you the best in your career journey.

Best regards,
${recruiterName}
${companyName}`
  );
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ description: "Subject and email body cannot be empty." });
      return;
    }

    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: application.candidate_email,
        subject: subject,
        body: body,
      });

      await base44.entities.Application.update(application.id, {
        status: "rejected",
        status_email_sent: body,
        updated_date: new Date().toISOString(),
      });

      toast({ description: `Rejection email sent to ${application.candidate_email}` });
      onSent();
      onClose();
    } catch (error) {
      toast({ description: `Failed to send email: ${error.message}` });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
              <Mail className="w-5 h-5 text-red-500" />
              Send Rejection Email to {application.candidate_name}
            </h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-foreground">To</label>
              <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 mt-1">
                {application.candidate_email}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-border rounded-lg p-3 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={sending}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground">Email Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full border border-border rounded-lg p-3 text-sm mt-1 h-48 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={sending}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose} disabled={sending}>
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white gap-2"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {sending ? "Sending..." : "Send & Reject"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}