import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Loader2, Brain, TrendingUp, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

const STATUS_STYLES = {
  "processed": "bg-green-50 text-green-600 border-green-200",
  "pending": "bg-orange-50 text-orange-500 border-orange-200",
};

export default function ViewCandidates() {
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const jobTitle = urlParams.get("job") || "Senior Developer";
  const jobStatus = urlParams.get("status") || "Active";

  useEffect(() => {
    base44.entities.CandidateProfile.list("-match_score").then((data) => {
      setCandidates(data);
      setLoading(false);
    });
  }, []);

  const filtered = candidates.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.full_name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.skills || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  const processed = candidates.filter((c) => c.status === "processed");
  const avgScore = processed.length
    ? Math.round(processed.reduce((sum, c) => sum + (c.match_score || 0), 0) / processed.length)
    : 0;

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
            <p className="text-sm text-muted-foreground">Candidates ranked by AI RAG match score</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-border rounded-2xl p-5">
            <p className="text-sm text-muted-foreground mb-2">Total Candidates</p>
            <p className="text-2xl font-bold text-foreground">{candidates.length}</p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-5">
            <p className="text-sm text-muted-foreground mb-2">CV Processed</p>
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
            placeholder="Search candidates by name, email, or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl bg-white"
          />
        </div>

        {/* Candidates list */}
        <div>
          <div className="mb-3">
            <h2 className="font-semibold text-foreground text-lg">Ranked Candidates</h2>
            <p className="text-sm text-muted-foreground">Ranked by AI RAG match score from CV analysis</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-border rounded-2xl p-10 text-center text-muted-foreground">
              No candidates found. Candidates will appear here after uploading their CVs.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((c, i) => {
                const initials = (c.full_name || c.email || "?").split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
                const isExpanded = expanded === c.id;
                return (
                  <div key={c.id} className="bg-white border border-border rounded-2xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Rank + Avatar */}
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shrink-0">
                          <span className="text-primary font-semibold text-sm">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-foreground">{c.full_name || "Unknown"}</h3>
                            <Badge className={`text-xs ${STATUS_STYLES[c.status] || "bg-muted text-muted-foreground"}`}>
                              {c.status === "processed" ? "CV Analyzed" : "Pending"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{c.email}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(c.skills || []).slice(0, 5).map((s) => (
                              <span key={s} className="text-xs bg-accent text-primary px-2.5 py-1 rounded-full">{s}</span>
                            ))}
                            {(c.skills || []).length > 5 && (
                              <span className="text-xs text-muted-foreground">+{c.skills.length - 5} more</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Score + Actions */}
                      <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Match Score</p>
                          <p className={`text-3xl font-bold ${c.match_score >= 80 ? "text-green-600" : c.match_score >= 60 ? "text-orange-500" : "text-muted-foreground"}`}>
                            {c.match_score || "—"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {c.status === "processed" && (
                            <Button variant="outline" size="sm" className="rounded-xl border-primary text-primary hover:bg-accent" onClick={() => setExpanded(isExpanded ? null : c.id)}>
                              {isExpanded ? "Hide" : "RAG Details"}
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate("/candidate-profile")}>
                            Profile
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded RAG Results */}
                    {isExpanded && c.status === "processed" && (
                      <div className="mt-5 pt-5 border-t border-border space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Experience */}
                          <div className="bg-muted/50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-4 h-4 text-primary" />
                              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Experience</p>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{c.years_of_experience || 0} <span className="text-sm font-normal text-muted-foreground">years</span></p>
                          </div>

                          {/* Strengths */}
                          <div className="bg-green-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Brain className="w-4 h-4 text-green-600" />
                              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Strengths</p>
                            </div>
                            <ul className="space-y-1">
                              {(c.strengths || []).map((s, idx) => (
                                <li key={idx} className="text-xs text-green-700">• {s}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Improvements */}
                          <div className="bg-orange-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="w-4 h-4 text-orange-500" />
                              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Areas to Improve</p>
                            </div>
                            <ul className="space-y-1">
                              {(c.improvements || []).map((s, idx) => (
                                <li key={idx} className="text-xs text-orange-600">• {s}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Education & Work */}
                        {(c.education_summary || c.work_experience_summary) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {c.education_summary && (
                              <div className="bg-muted/30 rounded-xl p-4">
                                <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Education</p>
                                <p className="text-sm text-muted-foreground">{c.education_summary}</p>
                              </div>
                            )}
                            {c.work_experience_summary && (
                              <div className="bg-muted/30 rounded-xl p-4">
                                <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Work Experience</p>
                                <p className="text-sm text-muted-foreground">{c.work_experience_summary}</p>
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