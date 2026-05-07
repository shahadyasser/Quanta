import React, { useState } from "react";
import { X, Plus, Trash2, CalendarDays, Loader2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";

export default function ProposeInterviewModal({ application, recruiterEmail, onClose, onSent }) {
  const [slots, setSlots] = useState([""]);
  const [meetingLink, setMeetingLink] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  const addSlot = () => setSlots((prev) => [...prev, ""]);
  const removeSlot = (i) => setSlots((prev) => prev.filter((_, idx) => idx !== i));
  const updateSlot = (i, val) => setSlots((prev) => prev.map((s, idx) => idx === i ? val : s));

  const handleSend = async () => {
    const validSlots = slots.filter((s) => s.trim() !== "");
    if (validSlots.length === 0) return;
    setSending(true);

    // Check if there's already an existing proposed slot for this application
    const existing = await base44.entities.InterviewSlot.filter({ application_id: application.id });
    if (existing.length > 0) {
      await base44.entities.InterviewSlot.update(existing[0].id, {
        proposed_slots: validSlots,
        meeting_link: meetingLink,
        notes,
        status: "proposed",
        confirmed_slot: null,
      });
    } else {
      await base44.entities.InterviewSlot.create({
        application_id: application.id,
        job_id: application.job_id,
        job_title: application.job_title,
        company: application.company,
        candidate_email: application.candidate_email,
        candidate_name: application.candidate_name,
        recruiter_email: recruiterEmail,
        proposed_slots: validSlots,
        meeting_link: meetingLink,
        notes,
        status: "proposed",
      });
    }

    // Send notification email to candidate
    await base44.integrations.Core.SendEmail({
      to: application.candidate_email,
      subject: `Interview Invitation – ${application.job_title}`,
      body: `Dear ${application.candidate_name || "Candidate"},\n\nWe'd like to invite you for an interview for the ${application.job_title} position at ${application.company}.\n\nPlease log in to your candidate dashboard to confirm one of the proposed time slots.\n\n${notes ? `Notes: ${notes}\n\n` : ""}${meetingLink ? `Meeting Link: ${meetingLink}\n\n` : ""}Best regards,\nThe Hiring Team`,
    });

    setSending(false);
    onSent();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={() => !sending && onClose()} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" /> Propose Interview Times
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                For <strong>{application.candidate_name || application.candidate_email}</strong> — {application.job_title}
              </p>
            </div>
            <button onClick={() => !sending && onClose()} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Time Slots */}
          <div className="space-y-2">
            <Label>Proposed Interview Slots</Label>
            {slots.map((slot, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  type="datetime-local"
                  value={slot}
                  onChange={(e) => updateSlot(i, e.target.value)}
                  className="h-10 rounded-xl flex-1"
                />
                {slots.length > 1 && (
                  <button onClick={() => removeSlot(i)} className="text-muted-foreground hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {slots.length < 4 && (
              <button onClick={addSlot} className="flex items-center gap-1.5 text-sm text-primary hover:underline mt-1">
                <Plus className="w-3.5 h-3.5" /> Add another slot
              </button>
            )}
          </div>

          {/* Meeting Link */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><LinkIcon className="w-3.5 h-3.5" /> Meeting Link (optional)</Label>
            <Input
              placeholder="https://meet.google.com/..."
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes for Candidate (optional)</Label>
            <textarea
              placeholder="e.g. Please prepare a short presentation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-border rounded-xl p-3 text-sm text-foreground h-24 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose} disabled={sending}>Cancel</Button>
            <Button
              className="flex-1 rounded-xl bg-primary hover:bg-primary/90 gap-2"
              onClick={handleSend}
              disabled={sending || slots.every((s) => !s.trim())}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
              {sending ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}