import React, { useState } from "react";
import { X, Send, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const STATUS_META = {
  accepted:    { label: "Accepted",    color: "bg-green-50 text-green-700 border-green-200" },
  shortlisted: { label: "Shortlisted", color: "bg-blue-50 text-blue-700 border-blue-200" },
  interview:   { label: "Interview",   color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  rejected:    { label: "Rejected",    color: "bg-red-50 text-red-600 border-red-200" },
  waitlisted:  { label: "Waitlisted",  color: "bg-gray-50 text-gray-600 border-gray-200" },
};

const RELEVANT_STATUSES = ["accepted", "shortlisted", "interview", "rejected", "waitlisted"];

function buildDefaultTemplate(status, jobTitle, company) {
  const t = {
    accepted: `Dear [Candidate Name],\n\nWe are pleased to inform you that your application for the ${jobTitle} position at ${company} has been accepted!\n\nYour profile stood out for the following strengths:\n[AI-generated strengths will be included]\n\nNext Steps: Our team will be in touch shortly.\n\nBest regards,\nThe QuantaHire Hiring Team`,
    shortlisted: `Dear [Candidate Name],\n\nCongratulations! Your application for the ${jobTitle} position at ${company} has been shortlisted.\n\nYour profile stood out for the following strengths:\n[AI-generated strengths will be included]\n\nNext Steps: We will contact you shortly with further details.\n\nBest regards,\nThe QuantaHire Hiring Team`,
    interview: `Dear [Candidate Name],\n\nWe are excited to invite you to an interview for the ${jobTitle} position at ${company}.\n\nWe will send you the schedule details shortly.\n\nBest regards,\nThe QuantaHire Hiring Team`,
    rejected: `Dear [Candidate Name],\n\nThank you for your interest in the ${jobTitle} position at ${company}. After careful evaluation, we have decided to move forward with other candidates whose profiles more closely match our current requirements.\n\nFeedback for Your Development:\n[AI-generated constructive feedback will be included]\n\nWe encourage you to apply for future positions that match your growing skill set.\n\nBest regards,\nThe QuantaHire Hiring Team`,
    waitlisted: `Dear [Candidate Name],\n\nThank you for applying to the ${jobTitle} position at ${company}.\n\nYour application is currently on our waitlist. Your qualifications are impressive and you will be contacted if a position becomes available.\n\nBest regards,\nThe QuantaHire Hiring Team`,
  };
  return t[status] || "";
}

export default function NotifyModal({ candidates, job, onClose, onSent }) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const jobTitle = job?.title || "this position";
  const company = job?.company || "our company";

  const grouped = {};
  RELEVANT_STATUSES.forEach(s => {
    const group = candidates.filter(c => c.status === s);
    if (group.length > 0) grouped[s] = group;
  });

  const [templates, setTemplates] = useState(() => {
    const t = {};
    RELEVANT_STATUSES.forEach(s => { t[s] = buildDefaultTemplate(s, jobTitle, company); });
    return t;
  });

  const totalToSend = Object.values(grouped).reduce((sum, g) => sum + g.length, 0);

  const handleSendAll = async () => {
    if (totalToSend === 0) {
      toast({ description: "No candidates with a notification status. Assign statuses first." });
      return;
    }
    setSending(true);
    const appsToSend = Object.entries(grouped).flatMap(([status, apps]) =>
      apps.map(a => ({ ...a, status }))
    );
    const res = await base44.functions.invoke("sendCandidateEmails", {
      applications: appsToSend,
      job_title: jobTitle,
      company,
      custom_messages: templates,
    });
    const succeeded = res.data?.results?.filter(r => r.success).length || 0;
    toast({ description: `✅ Sent ${succeeded} / ${totalToSend} notifications successfully.` });
    setSending(false);
    onSent?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">Send Notifications to Candidates</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{totalToSend} candidate{totalToSend !== 1 ? "s" : ""} will receive emails</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {totalToSend === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No candidates assigned a status yet.</p>
              <p className="text-sm mt-1">Use the status dropdown next to each candidate to assign statuses first.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([status, apps]) => {
              const meta = STATUS_META[status];
              return (
                <div key={status} className="space-y-3 border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>{meta.label}</span>
                    <span className="text-sm text-muted-foreground">{apps.length} candidate{apps.length !== 1 ? "s" : ""}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{apps.map(a => a.candidate_name || a.candidate_email).join(", ")}</p>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Email Template for {meta.label} candidates:</label>
                    <textarea
                      className="w-full text-sm border border-input rounded-xl p-3 bg-yellow-50/40 min-h-[100px] resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                      value={templates[status]}
                      onChange={e => setTemplates(prev => ({ ...prev, [status]: e.target.value }))}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            onClick={handleSendAll}
            disabled={sending || totalToSend === 0}
            className="bg-primary hover:bg-primary/90 rounded-xl gap-2"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending..." : `Send to ${totalToSend} Candidates`}
          </Button>
        </div>
      </div>
    </div>
  );
}