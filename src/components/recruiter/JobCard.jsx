import React, { useState } from "react";
import { Sparkles, Trash2, XCircle, RefreshCw, Clock, MapPin, Users, ChevronDown, ChevronUp, Briefcase, GraduationCap, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const STATUS_STYLES = {
  Open:     "bg-green-50 text-green-600 border border-green-200",
  Closed:   "bg-red-50 text-red-500 border border-red-200",
  Reopened: "bg-yellow-50 text-yellow-600 border border-yellow-200",
  Draft:    "bg-gray-50 text-gray-500 border border-gray-200",
};

function ConfirmDialog({ open, title, message, confirmLabel, confirmClass, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4 border border-border">
        <h3 className="font-semibold text-foreground text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" className="rounded-xl" onClick={onCancel}>Cancel</Button>
          <Button className={`rounded-xl ${confirmClass}`} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

export default function JobCard({ job, appCount, recruiterEmail, onJobUpdated, onNavigateRank }) {
  const [dialog, setDialog] = useState(null); // "close" | "reopen" | "delete"
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isOwner = job.recruiter_email === recruiterEmail;

  const pushHistory = (newStatus) => {
    const history = Array.isArray(job.status_history) ? job.status_history : [];
    return [
      ...history,
      { status: newStatus, timestamp: new Date().toISOString(), changed_by: recruiterEmail }
    ];
  };

  const handleClose = async () => {
    setLoading(true);
    await base44.entities.Job.update(job.id, {
      status: "Closed",
      status_history: pushHistory("Closed"),
    });
    setDialog(null);
    setLoading(false);
    onJobUpdated();
  };

  const handleReopen = async () => {
    setLoading(true);
    await base44.entities.Job.update(job.id, {
      status: "Reopened",
      status_history: pushHistory("Reopened"),
    });
    setDialog(null);
    setLoading(false);
    onJobUpdated();
  };

  const handleDelete = async () => {
    setLoading(true);
    // Delete all applications for this job
    const apps = await base44.entities.Application.filter({ job_id: job.id });
    await Promise.all(apps.map(a => base44.entities.Application.delete(a.id)));
    await base44.entities.Job.delete(job.id);
    setDialog(null);
    setLoading(false);
    onJobUpdated();
  };

  const status = job.status || "Open";

  return (
    <>
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-primary font-bold text-sm">{(job.title || "J")[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[status] || STATUS_STYLES.Draft}`}>
                {status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {job.location && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
              )}
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{appCount} applicant{appCount !== 1 ? "s" : ""}</span>
              {job.created_date && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(job.created_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              )}
              {job.type && <span>{job.type}</span>}
              {job.arrangement && <span>{job.arrangement}</span>}
              {job.level && <span>{job.level}</span>}
              {job.salary && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary}</span>}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Rank */}
          <Button
            size="sm"
            className="rounded-xl bg-primary hover:bg-primary/90 gap-1.5"
            onClick={onNavigateRank}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Rank All
          </Button>

          {isOwner && (
            <>
              {/* Close — shown when Open or Reopened */}
              {(status === "Open" || status === "Reopened") && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600 gap-1.5"
                  onClick={() => setDialog("close")}
                  disabled={loading}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Close Job
                </Button>
              )}

              {/* Reopen — shown when Closed */}
              {status === "Closed" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-green-300 text-green-600 hover:bg-green-50 gap-1.5"
                  onClick={() => setDialog("reopen")}
                  disabled={loading}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reopen
                </Button>
              )}

              {/* Delete — always shown */}
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 px-2.5"
                onClick={() => setDialog("delete")}
                disabled={loading}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
        </div>

        {/* Toggle Details Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-accent/40 py-2 border-t border-border transition-colors"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? "Hide Details" : "View Job Details & Requirements"}
        </button>

        {/* Expanded Details */}
        {expanded && (
          <div className="px-5 pb-5 pt-3 border-t border-border space-y-4 bg-slate-50/50">
            {job.description && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Description</h4>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{job.description}</p>
              </div>
            )}

            {job.skills && job.skills.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Required Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((skill, i) => (
                    <span key={i} className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {job.responsibilities && job.responsibilities.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Responsibilities</h4>
                <ul className="space-y-1">
                  {job.responsibilities.map((r, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {job.benefits && job.benefits.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Benefits</h4>
                <ul className="space-y-1">
                  {job.benefits.map((b, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={dialog === "close"}
        title="Close this job?"
        message="Are you sure you want to close this job? Candidates will no longer be matched."
        confirmLabel="Yes, Close Job"
        confirmClass="bg-red-500 hover:bg-red-600 text-white"
        onConfirm={handleClose}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === "reopen"}
        title="Reopen this job?"
        message="Reopen this job for new candidate matching?"
        confirmLabel="Yes, Reopen"
        confirmClass="bg-green-600 hover:bg-green-700 text-white"
        onConfirm={handleReopen}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        title="Delete this job?"
        message="This will permanently delete this job and all its ranking results. This action cannot be undone."
        confirmLabel="Delete Permanently"
        confirmClass="bg-red-600 hover:bg-red-700 text-white"
        onConfirm={handleDelete}
        onCancel={() => setDialog(null)}
      />
    </>
  );
}