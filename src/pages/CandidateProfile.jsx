import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle, UserCheck, Brain, FileText, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import BigFiveResultCard from "@/components/candidate/BigFiveResultCard";

const TABS = ["Overview", "Interview", "AI Insights", "Personality"];

export default function CandidateProfile() {
  const [tab, setTab] = useState("Overview");
  const [candidate, setCandidate] = useState(null);
  const [psychResult, setPsychResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const appId = urlParams.get("app_id");
        
        if (!appId) {
          setError("No candidate selected");
          return;
        }

        const app = await base44.entities.Application.get(appId);
        if (!app) {
          setError("Candidate not found");
          return;
        }

        setCandidate(app);

        // Fetch Big Five result for this candidate
        if (app.candidate_email) {
          const psychRes = await base44.entities.AssessmentResult.filter({ candidate_email: app.candidate_email }, "-created_date", 1);
          if (psychRes.length > 0) setPsychResult(psychRes[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-[#F8F7FF]">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          <Link to="/view-candidates" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Candidates
          </Link>
          <div className="bg-white rounded-2xl p-8 text-center text-muted-foreground">
            {error || "Candidate not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 md:px-10 py-4 sticky top-0 z-10">
        <Link to="/view-candidates" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Candidates
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Profile card */}
        <div className="bg-white border border-border rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-2xl">{(candidate.candidate_name || "?").substring(0, 2).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-foreground">{candidate.candidate_name || "Unknown"}</h1>
                <Badge className="bg-blue-50 text-blue-600 border-blue-200 capitalize">{candidate.status || "pending"}</Badge>
              </div>
              <p className="text-muted-foreground text-sm flex items-center gap-1.5 mb-3">
                <Mail className="w-3.5 h-3.5" />{candidate.candidate_email}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(candidate.skills || []).map((s) => (
                  <span key={s} className="text-xs bg-accent text-primary px-2.5 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </div>
            {/* Score */}
            {candidate.match_score && (
              <div className="text-center shrink-0">
                <div className="w-20 h-20 rounded-full border-4 border-primary flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{candidate.match_score.toFixed(0)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Match Score</p>
              </div>
            )}
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-border">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{candidate.years_of_experience || "N/A"}</p>
              <p className="text-xs text-muted-foreground">Years Experience</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{(candidate.skills || []).length}</p>
              <p className="text-xs text-muted-foreground">Skills</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">{candidate.candidate_email.split("@")[1]}</p>
              <p className="text-xs text-muted-foreground">Email Domain</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border border-border rounded-xl p-1 gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "Overview" && (
          <div className="space-y-4">
            {candidate.work_experience_summary && (
              <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
                <h2 className="font-semibold text-foreground flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Work Experience</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{candidate.work_experience_summary}</p>
              </div>
            )}
            {candidate.education_summary && (
              <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
                <h2 className="font-semibold text-foreground flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Education</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{candidate.education_summary}</p>
              </div>
            )}
            <div className="bg-white border border-border rounded-2xl p-6 space-y-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><UserCheck className="w-4 h-4 text-primary" /> Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {candidate.years_of_experience && <div><span className="text-muted-foreground">Experience: </span><span className="text-foreground font-medium">{candidate.years_of_experience} years</span></div>}
                <div><span className="text-muted-foreground">Applied For: </span><span className="text-foreground font-medium">{candidate.job_title}</span></div>
                <div><span className="text-muted-foreground">Status: </span><span className="text-foreground font-medium capitalize">{candidate.status}</span></div>
                {candidate.match_score && <div><span className="text-muted-foreground">Match Score: </span><span className="text-foreground font-medium">{candidate.match_score.toFixed(0)}%</span></div>}
              </div>
              {(candidate.strengths || []).length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-foreground mb-2">Strengths</p>
                  <ul className="list-disc list-inside space-y-1">
                    {candidate.strengths.map((s, i) => <li key={i} className="text-sm text-muted-foreground">{s}</li>)}
                  </ul>
                </div>
              )}
              {(candidate.improvements || []).length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-foreground mb-2">Areas for Improvement</p>
                  <ul className="list-disc list-inside space-y-1">
                    {candidate.improvements.map((i, idx) => <li key={idx} className="text-sm text-muted-foreground">{i}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "Interview" && (
          <div className="bg-white border border-border rounded-2xl p-6">
            {candidate.interview_date ? (
              <div className="space-y-4">
                <h2 className="font-semibold text-foreground">Interview Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Date: </span><span className="text-foreground font-medium">{candidate.interview_date}</span></div>
                  {candidate.interview_time && <div><span className="text-muted-foreground">Time: </span><span className="text-foreground font-medium">{candidate.interview_time}</span></div>}
                  {candidate.interview_type && <div><span className="text-muted-foreground">Type: </span><span className="text-foreground font-medium capitalize">{candidate.interview_type}</span></div>}
                  {candidate.interview_duration && <div><span className="text-muted-foreground">Duration: </span><span className="text-foreground font-medium">{candidate.interview_duration}</span></div>}
                  {candidate.interview_location && <div className="sm:col-span-2"><span className="text-muted-foreground">Location: </span><span className="text-foreground font-medium">{candidate.interview_location}</span></div>}
                  {candidate.interviewer_name && <div className="sm:col-span-2"><span className="text-muted-foreground">Interviewer: </span><span className="text-foreground font-medium">{candidate.interviewer_name}</span></div>}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No interview scheduled yet.</p>
            )}
          </div>
        )}

        {tab === "AI Insights" && (
          <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><Brain className="w-4 h-4 text-primary" /> AI Analysis</h2>
            {candidate.rag_results?.construct_scores && (
              <div className="space-y-3">
                {[["Work Experience", "work_experience"], ["Skills Match", "skills"], ["Education", "education"], ["Certifications", "certifications"]].map(([label, key]) => (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <p className="text-xs font-medium text-muted-foreground">{label}</p>
                      <p className="text-xs font-semibold text-foreground">{candidate.rag_results.construct_scores[key] || 0}/5</p>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{width: `${(candidate.rag_results.construct_scores[key] || 0) * 20}%`}}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!candidate.rag_results?.construct_scores && (
              <p className="text-sm text-muted-foreground">No AI analysis available yet. Process this CV from the Rank Candidates page.</p>
            )}
          </div>
        )}

        {tab === "Personality" && (
          <div className="bg-white border border-border rounded-2xl p-6">
            {psychResult ? (
              <BigFiveResultCard result={psychResult} showLink={false} />
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                This candidate has not completed the Big Five personality assessment yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}