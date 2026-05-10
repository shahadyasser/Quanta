import React, { useState } from "react";
import { ChevronDown, ChevronUp, FileText, RotateCw, Loader2, ThumbsUp, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RejectionEmailDialog from "@/components/recruiter/RejectionEmailDialog";
import AcceptanceEmailDialog from "@/components/recruiter/AcceptanceEmailDialog";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const MEDAL_ICONS = ["🥇", "🥈", "🥉"];

function getScoreColor(score) {
  if (score >= 80) return { bar: "bg-green-500", text: "text-green-600", badge: "bg-green-50 text-green-700 border-green-200", label: "Strong Match" };
  if (score >= 60) return { bar: "bg-yellow-400", text: "text-yellow-600", badge: "bg-yellow-50 text-yellow-700 border-yellow-200", label: "Moderate Match" };
  if (score >= 40) return { bar: "bg-orange-400", text: "text-orange-600", badge: "bg-orange-50 text-orange-700 border-orange-200", label: "Weak Match" };
  return { bar: "bg-red-400", text: "text-red-600", badge: "bg-red-50 text-red-700 border-red-200", label: "Poor Match" };
}

function ScoreBar({ score }) {
  if (!score || score === 0) return <span className="text-xs text-muted-foreground">Pending</span>;
  const c = getScoreColor(score);
  return (
    <div className="flex flex-col gap-1 min-w-[90px]">
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${c.text}`}>{Math.round(score)}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${c.bar} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-medium px-1.5 py-0.5 rounded border w-fit ${c.badge}`}>{c.label}</span>
    </div>
  );
}

function ConstructBar({ label, value }) {
  const pct = Math.min(100, Math.max(0, (value / 5) * 100));
  let color = "bg-red-400";
  if (value >= 4) color = "bg-green-500";
  else if (value >= 3) color = "bg-yellow-400";
  else if (value >= 2) color = "bg-orange-400";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-semibold text-foreground">{value ? `${value}/5` : "—"}</span>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ExpandedDetails({ app, onReprocess, isReprocessing, onStatusChange }) {
  const [rejectDialog, setRejectDialog] = useState(false);
  const [acceptDialog, setAcceptDialog] = useState(false);
  const { toast } = useToast();
  const recruiterName = localStorage.getItem("recruiterName") || "Recruiter";
  const companyName = localStorage.getItem("companyName") || "Company";
  const constructs = app.rag_results?.construct_scores || {};

  return (
    <div className="space-y-5 py-2">
      {/* Score + Constructs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-green-700 mb-2">✓ Strengths</p>
          {(app.strengths || []).length > 0 ? (
            <ul className="space-y-1">
              {app.strengths.map((s, i) => <li key={i} className="text-sm text-green-800">• {s}</li>)}
            </ul>
          ) : <p className="text-xs text-muted-foreground italic">No strengths data yet</p>}
        </div>

        {/* Weaknesses */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-orange-700 mb-2">⚠ Areas to Improve</p>
          {(app.improvements || []).length > 0 ? (
            <ul className="space-y-1">
              {app.improvements.map((s, i) => <li key={i} className="text-sm text-orange-800">• {s}</li>)}
            </ul>
          ) : <p className="text-xs text-muted-foreground italic">No improvement data yet</p>}
        </div>

        {/* Education */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-700 mb-2">🎓 Education</p>
          <p className="text-sm text-blue-900">{app.education_summary || <span className="italic text-muted-foreground">Not available</span>}</p>
        </div>

        {/* Experience */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-purple-700 mb-2">💼 Work Experience</p>
          {app.years_of_experience !== undefined && (
            <p className="text-xs font-medium text-purple-600 mb-1">{app.years_of_experience} years of experience</p>
          )}
          <p className="text-sm text-purple-900">{app.work_experience_summary || <span className="italic text-muted-foreground">Not available</span>}</p>
        </div>
      </div>

      {/* Construct Scores */}
      {app.rag_results?.construct_scores && (
        <div className="bg-white border border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground mb-1">Scoring Breakdown</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ConstructBar label="Work Experience" value={constructs.work_experience} />
            <ConstructBar label="Skills" value={constructs.skills} />
            <ConstructBar label="Education" value={constructs.education} />
            <ConstructBar label="Certifications" value={constructs.certifications} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
        {app.cv_url && (
          <a href={app.cv_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Download CV
            </Button>
          </a>
        )}
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={onReprocess} disabled={isReprocessing}>
          {isReprocessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
          {isReprocessing ? "Reprocessing..." : "Reprocess"}
        </Button>
        {!["accepted", "rejected", "interview"].includes(app.status) && (
          <div className="ml-auto flex gap-2">
            <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700 gap-1.5 text-white" onClick={() => setAcceptDialog(true)}>
              <ThumbsUp className="w-3.5 h-3.5" /> Accept
            </Button>
            <Button size="sm" className="rounded-xl bg-green-600 hover:bg-green-700 gap-1.5 text-white" onClick={() => setAcceptDialog(true)}>
              <CheckCircle className="w-3.5 h-3.5" /> Interview
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 gap-1.5" onClick={() => setRejectDialog(true)}>
              <AlertCircle className="w-3.5 h-3.5" /> Reject
            </Button>
          </div>
        )}
      </div>

      {rejectDialog && (
        <RejectionEmailDialog application={app} recruiterName={recruiterName} companyName={companyName}
          onClose={() => setRejectDialog(false)}
          onSent={() => { setRejectDialog(false); onStatusChange && onStatusChange(app.id, "rejected"); }} />
      )}
      {acceptDialog && (
        <AcceptanceEmailDialog application={app} recruiterName={recruiterName} companyName={companyName}
          onClose={() => setAcceptDialog(false)}
          onSent={() => { setAcceptDialog(false); onStatusChange && onStatusChange(app.id, "accepted"); }} />
      )}
    </div>
  );
}

export default function RankedCandidatesTable({ candidates, onReprocess, jobId, job, onStatusChange: onParentStatusChange }) {
  const [expanded, setExpanded] = useState(null);
  const [reprocessing, setReprocessing] = useState(null);

  const sorted = [...candidates].sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

  const handleReprocess = async (appId) => {
    setReprocessing(appId);
    await onReprocess(appId);
    setReprocessing(null);
  };

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border p-12 text-center text-muted-foreground">
        No candidates found for this job.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((app, idx) => {
        const isExpanded = expanded === app.id;
        const score = app.match_score || 0;
        return (
          <div key={app.id} className="bg-white rounded-2xl border border-border overflow-hidden">
            {/* Card Header Row */}
            <div
              className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpanded(isExpanded ? null : app.id)}
            >
              {/* Rank */}
              <div className="w-10 text-center font-bold text-foreground shrink-0">
                {idx < 3 ? <span className="text-2xl">{MEDAL_ICONS[idx]}</span> : <span className="text-sm text-muted-foreground">#{idx + 1}</span>}
              </div>

              {/* Name + Email */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{app.candidate_name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground truncate">{app.candidate_email}</p>
              </div>

              {/* Score */}
              <div className="shrink-0 w-36">
                <ScoreBar score={score} />
              </div>

              {/* Status */}
              <div className="shrink-0">
                <Badge className={`text-xs ${
                  app.status === "processed" ? "bg-green-50 text-green-600 border-green-200" :
                  app.status === "shortlisted" ? "bg-blue-50 text-blue-600 border-blue-200" :
                  app.status === "accepted" ? "bg-purple-50 text-purple-600 border-purple-200" :
                  app.status === "rejected" ? "bg-red-50 text-red-500 border-red-200" :
                  "bg-orange-50 text-orange-600 border-orange-200"
                }`}>
                  {app.status === "processed" ? "Analyzed" :
                   app.status === "shortlisted" ? "Shortlisted" :
                   app.status === "accepted" ? "Accepted" :
                   app.status === "rejected" ? "Rejected" : "Pending"}
                </Badge>
              </div>

              {/* Expand toggle */}
              <div className="shrink-0 text-muted-foreground">
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="px-6 pb-6 border-t border-border bg-muted/10">
                <ExpandedDetails
                  app={app}
                  jobId={jobId}
                  job={job}
                  onReprocess={() => handleReprocess(app.id)}
                  isReprocessing={reprocessing === app.id}
                  onStatusChange={onParentStatusChange}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}