import React, { useState } from "react";
import { Mail, Phone, FileText, RotateCw, Loader2, CheckCircle, AlertCircle, ThumbsUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import RejectionEmailDialog from "@/components/recruiter/RejectionEmailDialog";
import AcceptanceEmailDialog from "@/components/recruiter/AcceptanceEmailDialog";

export default function CandidateExpandedRow({ app, jobId, job, onReprocess, isReprocessing, onStatusChange }) {
  const [updating, setUpdating] = useState(null);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [acceptDialog, setAcceptDialog] = useState(false);
  const { toast } = useToast();
  
  // Get recruiter name from localStorage (set during login)
  const recruiterName = localStorage.getItem("recruiterName") || "Recruiter";
  const companyName = localStorage.getItem("companyName") || "Company";
  return (
    <div className="space-y-6">
      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-border">
          <Mail className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium text-foreground">{app.candidate_email}</p>
          </div>
        </div>
        {app.years_of_experience !== undefined && (
          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-border">
            <Phone className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Experience</p>
              <p className="text-sm font-medium text-foreground">{app.years_of_experience} years</p>
            </div>
          </div>
        )}
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <h3 className="text-sm font-semibold text-green-700 mb-3">✓ Strengths</h3>
          <ul className="space-y-2">
            {(app.strengths || []).map((s, idx) => (
              <li key={idx} className="text-sm text-green-700">• {s}</li>
            ))}
          </ul>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
          <h3 className="text-sm font-semibold text-orange-700 mb-3">⚠ Areas to Improve</h3>
          <ul className="space-y-2">
            {(app.improvements || []).map((s, idx) => (
              <li key={idx} className="text-sm text-orange-700">• {s}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* RAG Details */}
      {app.rag_results && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-blue-700 mb-3">RAG Analysis Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Similarity Score</p>
              <p className="font-semibold text-foreground">{app.rag_results.similarity_score?.toFixed(1) || "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">LLM Score</p>
              <p className="font-semibold text-foreground">{app.rag_results.llm_total?.toFixed(1) || "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Chunks Retrieved</p>
              <p className="font-semibold text-foreground">{app.rag_results.chunks_retrieved || "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Embedding Model</p>
              <p className="font-semibold text-foreground text-xs">text-embedding-3-small</p>
            </div>
          </div>
          {app.rag_results.verdict && (
            <div className="mt-3 p-2 bg-white rounded border border-blue-200">
              <p className="text-xs text-muted-foreground">Verdict</p>
              <p className="text-sm font-medium text-foreground">{app.rag_results.verdict}</p>
            </div>
          )}
          {app.rag_results.agentic_explanation && (
            <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-xs font-semibold text-orange-700 mb-1">🤖 Agentic AI Explanation — Why this ranking?</p>
              <p className="text-sm text-orange-900 leading-relaxed">{app.rag_results.agentic_explanation}</p>
              {app.rag_results.agentic_round && (
                <p className="text-xs text-orange-500 mt-1">Round {app.rag_results.agentic_round} • Agentic Score: {app.rag_results.agentic_score?.toFixed(1)}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summaries */}
      {(app.education_summary || app.work_experience_summary) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {app.education_summary && (
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Education</p>
              <p className="text-sm text-muted-foreground">{app.education_summary}</p>
            </div>
          )}
          {app.work_experience_summary && (
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Work Experience</p>
              <p className="text-sm text-muted-foreground">{app.work_experience_summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
        {app.cv_url && (
          <a href={app.cv_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Download CV
            </Button>
          </a>
        )}
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-1.5"
          onClick={onReprocess}
          disabled={isReprocessing}
        >
          {isReprocessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
          {isReprocessing ? "Reprocessing..." : "Reprocess"}
        </Button>
        <div className="ml-auto flex gap-2">
          {!["accepted", "rejected", "interview"].includes(app.status) && (
            <>
              <Button
                size="sm"
                className="rounded-xl bg-blue-600 hover:bg-blue-700 gap-1.5 text-white"
                onClick={() => setAcceptDialog(true)}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Accept
              </Button>
              <Button
                size="sm"
                className="rounded-xl bg-green-600 hover:bg-green-700 gap-1.5 text-white"
                onClick={() => setAcceptDialog(true)}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Interview
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 gap-1.5"
                onClick={() => setRejectDialog(true)}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Rejection Email Dialog */}
      {rejectDialog && (
        <RejectionEmailDialog
          application={app}
          recruiterName={recruiterName}
          companyName={companyName}
          onClose={() => setRejectDialog(false)}
          onSent={() => {
            setRejectDialog(false);
            if (onStatusChange) {
              onStatusChange(app.id, "rejected");
            }
          }}
        />
      )}

      {/* Acceptance Email Dialog */}
      {acceptDialog && (
        <AcceptanceEmailDialog
          application={app}
          recruiterName={recruiterName}
          companyName={companyName}
          onClose={() => setAcceptDialog(false)}
          onSent={() => {
            setAcceptDialog(false);
            if (onStatusChange) {
              onStatusChange(app.id, "accepted");
            }
          }}
        />
      )}
    </div>
  );

  async function handleStatusChange(newStatus) {
    try {
      setUpdating(newStatus);
      await base44.entities.Application.update(app.id, {
        status: newStatus,
        is_viewed: true,
        updated_date: new Date().toISOString()
      });

      if (onStatusChange) {
        await onStatusChange(app.id, newStatus);
      }

      const messages = {
        accepted: "Candidate has been accepted!",
        interview: "Candidate moved to Interview stage",
        rejected: "Candidate has been rejected"
      };
      toast({ description: messages[newStatus] || "Status updated" });
    } catch (error) {
      toast({ description: `Failed to update status: ${error.message}` });
      console.error("Status update error:", error);
    } finally {
      setUpdating(null);
    }
  }
}