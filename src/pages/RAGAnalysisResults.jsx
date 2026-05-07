import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Loader2, Brain, TrendingUp, BookOpen, FileText, X, Trash2, CheckSquare, Square } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { pgQuery } from "@/lib/neonDb";

const STATUS_STYLES = {
  "processed": "bg-green-50 text-green-600 border-green-200",
  "pending": "bg-orange-50 text-orange-500 border-orange-200",
  "shortlisted": "bg-blue-50 text-blue-600 border-blue-200",
  "rejected": "bg-red-50 text-red-500 border-red-200",
};

export default function RAGAnalysisResults() {
  const [search, setSearch] = useState("");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get("job_id");
  const jobTitle = urlParams.get("job") || "All Jobs";

  const [startTime, setStartTime] = React.useState(null);
  const [elapsedTime, setElapsedTime] = React.useState(0);

  useEffect(() => {
    setStartTime(new Date());
  }, []);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((new Date() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    const fetchApplications = async () => {
      const query = jobId
        ? 'SELECT * FROM applications WHERE job_id = $1 ORDER BY created_date DESC'
        : 'SELECT * FROM applications ORDER BY created_date DESC';
      const params = jobId ? [jobId] : [];
      const data = await pgQuery(query, params);
      setApplications(data || []);
      setLoading(false);
    };
    fetchApplications();
  }, [jobId]);

  const hasResults = applications.some((a) => a.rag_results?.match_score);

  const filtered = applications.filter((a) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (a.candidate_name || "").toLowerCase().includes(q) ||
      (a.candidate_email || "").toLowerCase().includes(q) ||
      (a.skills || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  const processedCount = applications.filter((a) => a.rag_results?.match_score).length;
  const totalCount = applications.length;
  const progressPercent = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;
  const ragFiltered = filtered.filter((a) => a.rag_results?.match_score);
  const topCandidates = ragFiltered.filter((a) => a.rag_results?.match_score >= 80).length;
  const goodCandidates = ragFiltered.filter((a) => a.rag_results?.match_score >= 60 && a.rag_results?.match_score < 80).length;

  const toggleSelect = (id) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((a) => a.id)));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 md:px-10 py-4 sticky top-0 z-10">
        <Link to="/recruiter-dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="mt-3">
          <h1 className="text-2xl font-bold text-foreground">RAG Analysis Results</h1>
          <p className="text-sm text-muted-foreground">{jobTitle} — Ranked by Match Score</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Progress Bar */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-blue-600">RAG Pipeline Progress</p>
            <p className="text-sm text-blue-600">{processedCount} / {totalCount} CVs analyzed</p>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-blue-600">
            <span className="font-semibold">{progressPercent}%</span> • {elapsedTime} seconds elapsed
          </p>
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

        {/* Stats Cards - Only show after pipeline completes */}
        {hasResults && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-border rounded-2xl p-5">
              <p className="text-sm text-muted-foreground mb-2">Total Analyzed</p>
              <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
            </div>
            <div className="bg-white border border-border rounded-2xl p-5">
              <p className="text-sm text-muted-foreground mb-2">Top Candidates (80+)</p>
              <p className="text-2xl font-bold text-green-600">{topCandidates}</p>
            </div>
            <div className="bg-white border border-border rounded-2xl p-5">
              <p className="text-sm text-muted-foreground mb-2">Good Candidates (60-80)</p>
              <p className="text-2xl font-bold text-orange-500">{goodCandidates}</p>
            </div>
          </div>
        )}

        {/* Candidates List */}
        <div className="space-y-4">
          <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-foreground text-lg">Ranked Candidates</h2>
              <p className="text-sm text-muted-foreground">Sorted by match score</p>
            </div>
            {filtered.length > 0 && (
              <button onClick={toggleSelectAll} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                {selected.size === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                {selected.size === filtered.length && filtered.length > 0 ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-border rounded-2xl p-10 text-center text-muted-foreground">
              No analysis results yet.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a, i) => {
                const initials = (a.candidate_name || a.candidate_email || "?").split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
                const isExpanded = expanded === a.id;
                return (
                  <div key={a.id} className={`bg-white border rounded-2xl p-5 ${selected.has(a.id) ? "border-primary/50 bg-accent/10" : "border-border"}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <button onClick={() => toggleSelect(a.id)} className="shrink-0">
                          {selected.has(a.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                        </button>
                        <span className={`text-sm font-bold w-6 text-primary`}>#{i + 1}</span>
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
                            {(Array.isArray(a.skills) ? a.skills : []).slice(0, 5).map((s) => (
                              <span key={s} className="text-xs bg-accent text-primary px-2.5 py-1 rounded-full">{s}</span>
                            ))}
                            {(Array.isArray(a.skills) ? a.skills : []).length > 5 && <span className="text-xs text-muted-foreground">+{(Array.isArray(a.skills) ? a.skills : []).length - 5} more</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                        {hasResults && a.rag_results?.match_score ? (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Match Score</p>
                            <p className={`text-3xl font-bold ${a.rag_results.match_score >= 80 ? "text-green-600" : a.rag_results.match_score >= 60 ? "text-orange-500" : "text-muted-foreground"}`}>
                              {a.rag_results.match_score}
                            </p>
                          </div>
                        ) : null}
                        <div className="flex gap-2">
                          {a.cv_url && (
                            <a href={a.cv_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
                                <FileText className="w-3.5 h-3.5" /> CV
                              </Button>
                            </a>
                          )}
                          <Button variant="outline" size="sm" className="rounded-xl border-primary text-primary hover:bg-accent" onClick={() => setExpanded(isExpanded ? null : a.id)}>
                            {isExpanded ? "Hide" : "Details"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
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
                            <ul className="space-y-1">{(Array.isArray(a.strengths) ? a.strengths : []).map((s, idx) => <li key={idx} className="text-xs text-green-700">• {s}</li>)}</ul>
                          </div>
                          <div className="bg-orange-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="w-4 h-4 text-orange-500" />
                              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Areas to Improve</p>
                            </div>
                            <ul className="space-y-1">{(Array.isArray(a.improvements) ? a.improvements : []).map((s, idx) => <li key={idx} className="text-xs text-orange-600">• {s}</li>)}</ul>
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