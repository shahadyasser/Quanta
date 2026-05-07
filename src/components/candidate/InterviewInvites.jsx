import React, { useState } from "react";
import { CalendarDays, CheckCircle, XCircle, Link as LinkIcon, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const STATUS_STYLES = {
  proposed: "bg-blue-50 text-blue-600 border-blue-200",
  confirmed: "bg-green-50 text-green-600 border-green-200",
  declined: "bg-red-50 text-red-500 border-red-200",
  cancelled: "bg-muted text-muted-foreground border-border",
};

function formatSlot(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    year: "numeric", hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Riyadh",
  }) + " (AST)";
}

export default function InterviewInvites({ invites, onUpdate }) {
  const [loadingId, setLoadingId] = useState(null);

  if (!invites || invites.length === 0) return null;

  const confirm = async (invite, slot) => {
    setLoadingId(invite.id + slot);
    await base44.entities.InterviewSlot.update(invite.id, {
      status: "confirmed",
      confirmed_slot: slot,
    });
    // Notify recruiter via email
    await base44.integrations.Core.SendEmail({
      to: invite.recruiter_email,
      subject: `Interview Confirmed – ${invite.job_title}`,
      body: `Hi,\n\n${invite.candidate_name || invite.candidate_email} has confirmed their interview for the ${invite.job_title} position.\n\nConfirmed Time: ${formatSlot(slot)}\n${invite.meeting_link ? `Meeting Link: ${invite.meeting_link}` : ""}\n\nBest regards,\nQuantaHire`,
    });
    setLoadingId(null);
    onUpdate();
  };

  const decline = async (invite) => {
    setLoadingId(invite.id + "decline");
    await base44.entities.InterviewSlot.update(invite.id, { status: "declined" });
    setLoadingId(null);
    onUpdate();
  };

  return (
    <div className="space-y-3">
      <div className="mb-2">
        <h2 className="font-semibold text-foreground text-lg flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" /> Interview Invitations
        </h2>
        <p className="text-sm text-muted-foreground">Confirm a time slot proposed by the recruiter</p>
      </div>

      {invites.map((invite) => (
        <div key={invite.id} className="bg-white border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-semibold text-foreground">{invite.job_title}</p>
              <p className="text-sm text-muted-foreground">{invite.company}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLES[invite.status] || ""}`}>
              {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
            </span>
          </div>

          {invite.notes && (
            <div className="bg-muted/40 rounded-xl px-4 py-2.5 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Note: </span>{invite.notes}
            </div>
          )}

          {invite.meeting_link && (
            <a href={invite.meeting_link} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <LinkIcon className="w-3.5 h-3.5" /> Join Meeting
            </a>
          )}

          {/* Confirmed slot display */}
          {invite.status === "confirmed" && invite.confirmed_slot && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm font-medium text-green-700">Confirmed: {formatSlot(invite.confirmed_slot)}</span>
            </div>
          )}

          {/* Proposed slots to pick from */}
          {invite.status === "proposed" && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Choose a time slot:</p>
              {(invite.proposed_slots || []).map((slot) => (
                <div key={slot} className="flex items-center justify-between gap-3 bg-muted/30 rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground">{formatSlot(slot)}</span>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-lg bg-primary hover:bg-primary/90 h-8 px-3 gap-1.5 text-xs"
                    disabled={!!loadingId}
                    onClick={() => confirm(invite, slot)}
                  >
                    {loadingId === invite.id + slot ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                    Confirm
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 gap-1.5 mt-1"
                disabled={!!loadingId}
                onClick={() => decline(invite)}
              >
                {loadingId === invite.id + "decline" ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Decline Interview
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}