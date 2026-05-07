import React from "react";
import { Mail, Phone, FileText, RotateCw, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CandidateExpandedRow({ app, jobId, job, onReprocess, isReprocessing }) {
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
        <Button size="sm" className="rounded-xl bg-green-600 hover:bg-green-700 gap-1.5 ml-auto">
          <CheckCircle className="w-3.5 h-3.5" />
          Interview
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          Reject
        </Button>
      </div>
    </div>
  );
}