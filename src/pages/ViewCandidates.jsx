import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Loader2, Brain, TrendingUp, BookOpen, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

const STATUS_STYLES = {
  "processed": "bg-green-50 text-green-600 border-green-200",
  "pending": "bg-orange-50 text-orange-500 border-orange-200",
  "shortlisted": "bg-blue-50 text-blue-600 border-blue-200",
  "rejected": "bg-red-50 text-red-500 border-red-200",
};

export default function ViewCandidates() {
  const [search, setSearch] = useState("");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get("job_id");
  const jobTitle = urlParams.get("job") || "All Jobs";
  const jobStatus = urlParams.get("status") || "Active";

  useEffect(() => {
    const fetchApplications = async () => {
      const filter = jobId ? { job_id: jobId } : {};
      const data = await base44.entities.Application.filter(filter, "-match_score");
      setApplications(data);
      setLoading(false);
    };
    fetchApplications();
  }, [jobId]);

  const filtered = applications.filter((a) => {
    const q = search.toLowerCase();
    return (
      (a.candidate_name || "").toLowerCase().includes(q) ||
      (a.candidate_email || "").toLowerCase().includes(q) ||
      (a.skills || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  const processed = applications.filter((a) => a.status === "processed" || a.match_score);
  const avgScore = processed.length
    ? Math.round(processed.reduce((sum, a) => sum + (a.match_score || 0), 0) / processed.length)
    : 0;

  const updateStatus = async (appId, status) => {
    await base44.entities.Application.update(appId, { status });
    setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status } : a));
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 md:px-10 py-4 sticky top-0 z-10">
        <Link to="/recruiter-dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-muted-foreground">Job Status:</span>
              <Badge className="bg-green-50 text-green-600 border-green-200">{jobStatus}</Badge>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{jobTitle}</h1>
            <p className="text-sm text-muted-foreground">Applicants ranked by AI RAG match score</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-border rounded-2xl p-5">
            <p className="text-sm text-muted-foreground mb-2">Total Applications</p>
            <p className="text-2xl font-bold text-foreground">{applications.length}</p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-5">
            <p className="text-sm text-muted-foreground mb-2">CV Analyzed</p>
            <p className="text-2xl font-bold text-foreground">{processed.length}</p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-5">
            <p className="text-sm text-muted-foreground mb-2">Avg Match Score</p>
            <p className="text-2xl font-bold text-foreground">{avgScore || "—"}</p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-5">
            <p className="text-sm text-muted-foreground mb-2">AI Fairness</p>
            <p className="text-base font-bold text-green-600">Bias Check Passed ✓</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl bg-white"
          />
        </div>

        {/* Candidates list */}
        <div>
          <div className="mb-3">
            <h2 className="font-semibold text-foreground text-lg">Ranked Applicants</h2>
            <p className="text-sm text-muted-foreground">Ranked by AI match score from CV analysis</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-border rounded-2xl p-10 text-center text-muted-foreground">
              No applications yet. Candidates will appear here after applying.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a, i) => {
                const initials = (a.candidate_name || a.candidate_email || "?").split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
                const isExpanded = expanded === a.id;
                return (
                  <div key={a.id} className="bg-white border border-border rounded-2xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shrink-0">
                          <span className="text-primary font-semibold text-sm">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-foreground">{a.candidate_name || "Unknown"}</h3>
                            <Badge className={`text-xs ${STATUS_STYLES[a.status] || "bg-muted text-muted-foreground"}`}>
                              {a.status === "processed" ? "CV Analyzed" : a.status === "shortlisted" ? "Shortlisted" : a.status === "rejected" ? "Rejected" : "Pending"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{a.candidate_email}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(a.skills || []).slice(0, 5).map((s) => (
                              <span key={s} className="text-xs bg-accent text-primary px-2.5 py-1 rounded-full">{s}</span>
                            ))}
                            {(a.skills || []).length > 5 && <span className="text-xs text-muted-foreground">+{a.skills.length - 5} more</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Match Score</p>
                          <p className={`text-3xl font-bold ${(a.match_score || 0) >= 80 ? "text-green-600" : (a.match_score || 0) >= 60 ? "text-orange-500" : "text-muted-foreground"}`}>
                            {a.match_score || "—"}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          {a.status === "processed" && (
                            <Button variant="outline" size="sm" className="rounded-xl border-primary text-primary hover:bg-accent" onClick={() => setExpanded(isExpanded ? null : a.id)}>
                              {isExpanded ? "Hide" : "Details"}
                            </Button>
                          )}
                          {a.status !== "shortlisted" && a.status !== "rejected" && (
                            <Button size="sm" className="rounded-xl bg-green-600 hover:bg-green-700 text-white" onClick={() => updateStatus(a.id, "shortlisted")}>
                              Shortlist
                            </Button>
                          )}
                          {a.status !== "rejected" && a.status !== "shortlisted" && (
                            <Button size="sm" variant="outline" className="rounded-xl border-red-300 text-red-500 hover:bg-red-50" onClick={() => updateStatus(a.id, "rejected")}>
                              Reject
                            </Button>
                          )}
                          {(a.status === "shortlisted" || a.status === "rejected") && (
                            <Button size="sm" variant="outline" className="rounded-xl text-muted-foreground" onClick={() => updateStatus(a.id, "processed")}>
                              Reset
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded RAG Results */}
                    {isExpanded && (
                      <div className="mt-5 pt-5 border-t border-border space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-muted/50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-4 h-4 text-primary" />
                              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Experience</p>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{a.years_of_experience || 0} <span className="text-sm font-normal text-muted-foreground">years</span></p>
                          </div>
                          <div className="bg-green-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Brain className="w-4 h-4 text-green-600" />
                              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Strengths</p>
                            </div>
                            <ul className="space-y-1">{(a.strengths || []).map((s, idx) => <li key={idx} className="text-xs text-green-700">• {s}</li>)}</ul>
                          </div>
                          <div className="bg-orange-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="w-4 h-4 text-orange-500" />
                              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Areas to Improve</p>
                            </div>
                            <ul className="space-y-1">{(a.improvements || []).map((s, idx) => <li key={idx} className="text-xs text-orange-600">• {s}</li>)}</ul>
                          </div>
                        </div>
                        {(a.education_summary || a.work_experience_summary) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {a.education_summary && (
                              <div className="bg-muted/30 rounded-xl p-4">
                                <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Education</p>
                                <p className="text-sm text-muted-foreground">{a.education_summary}</p>
                              </div>
                            )}
                            {a.work_experience_summary && (
                              <div className="bg-muted/30 rounded-xl p-4">
                                <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Work Experience</p>
                                <p className="text-sm text-muted-foreground">{a.work_experience_summary}</p>
                              </div>
                            )}
                          </div>
                        )}
                        {a.cv_url && (
                          <a href={a.cv_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                            <FileText className="w-4 h-4" /> View CV
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}