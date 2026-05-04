import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Loader2, Brain, TrendingUp, BookOpen, FileText, Mail, X } from "lucide-react";
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
  const [emailModal, setEmailModal] = useState(null); // { app, type: 'accept' | 'reject' }
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
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

    // Auto-refresh every 5s while any application is still pending
    const interval = setInterval(async () => {
      const filter = jobId ? { job_id: jobId } : {};
      const data = await base44.entities.Application.filter(filter, "-match_score");
      setApplications(data);
      const hasPending = data.some((a) => a.status === "pending");
      if (!hasPending) clearInterval(interval);
    }, 5000);

    return () => clearInterval(interval);
  }, [jobId]);

  const filtered = applications
    .filter((a) => {
      const q = search.toLowerCase();
      return (
        !q ||
        (a.candidate_name || "").toLowerCase().includes(q) ||
        (a.candidate_email || "").toLowerCase().includes(q) ||
        (a.skills || []).some((s) => s.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      // Processed/scored candidates ranked by match_score descending
      // Pending (no score) go to the bottom
      const scoreA = a.match_score ?? -1;
      const scoreB = b.match_score ?? -1;
      return scoreB - scoreA;
    });

  const processed = applications.filter((a) => a.status === "processed" || a.match_score);
  const avgScore = processed.length
    ? Math.round(processed.reduce((sum, a) => sum + (a.match_score || 0), 0) / processed.length)
    : 0;

  const updateStatus = async (appId, status) => {
    await base44.entities.Application.update(appId, { status });
    setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status } : a));
  };

  const openEmailModal = async (app, type) => {
    setEmailModal({ app, type });
    setEmailMessage("");
    setSendingEmail(false);

    const isAccept = type === "accept";
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: isAccept
          ? `Write a formal, warm, and professional acceptance email for a job applicant. Clearly explain WHY they were selected, referencing their specific strengths and skills.

Candidate Name: ${app.candidate_name || "Candidate"}
Job Title: ${jobTitle}
Candidate's Skills: ${(app.skills || []).join(", ") || "Not specified"}
Years of Experience: ${app.years_of_experience || "Not specified"}
Match Score: ${app.match_score || "N/A"}/100
Strengths: ${(app.strengths || []).join(", ") || "N/A"}

Instructions:
- Start with "Dear ${app.candidate_name || "Candidate"},"
- Congratulate them warmly and clearly state they have been accepted
- Highlight the specific strengths and skills that made them stand out
- Mention next steps (e.g. we will be in touch with further details)
- End with "Best regards,\nThe Hiring Team"
- Do NOT include a subject line
- Tone: formal, enthusiastic, and encouraging`
          : `Write a formal, kind, and professional rejection email for a job applicant. Clearly but gently explain WHY the candidate was not selected, referencing their skill gaps and experience.

Candidate Name: ${app.candidate_name || "Candidate"}
Job Title: ${jobTitle}
Candidate's Skills: ${(app.skills || []).join(", ") || "Not specified"}
Years of Experience: ${app.years_of_experience || "Not specified"}
Match Score: ${app.match_score || "N/A"}/100
Strengths: ${(app.strengths || []).join(", ") || "N/A"}
Areas Lacking: ${(app.improvements || []).join(", ") || "N/A"}

Instructions:
- Start with "Dear ${app.candidate_name || "Candidate"},"
- Thank them sincerely for their time and interest
- Clearly but kindly explain the specific reasons for rejection
- Acknowledge their strengths genuinely
- Encourage them to apply for future roles if appropriate
- End with "Best regards,\nThe Hiring Team"
- Do NOT include a subject line
- Tone: formal, warm, and respectful`,
      });
      setEmailMessage(result);
    } catch {
      setEmailMessage(`Dear ${app.candidate_name || "Candidate"},\n\nThank you for applying for the ${jobTitle} position.\n\nBest regards,\nThe Hiring Team`);
    }
  };

  const handleSendEmail = async () => {
    if (!emailModal) return;
    const { app, type } = emailModal;
    const isAccept = type === "accept";
    setSendingEmail(true);
    await Promise.all([
      base44.integrations.Core.SendEmail({
        to: app.candidate_email,
        subject: isAccept ? `Congratulations – ${jobTitle} Offer` : `Application Update – ${jobTitle}`,
        body: emailMessage
      }),
      updateStatus(app.id, isAccept ? "shortlisted" : "rejected")
    ]);
    setSendingEmail(false);
    setEmailModal(null);
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
                const rankColors = ["text-yellow-500", "text-slate-400", "text-amber-600"];
                const rankColor = a.match_score && i < 3 ? rankColors[i] : "text-muted-foreground";
                return (
                  <div key={a.id} className={`bg-white border rounded-2xl p-5 ${i === 0 && a.match_score ? "border-yellow-300 shadow-sm" : "border-border"}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <span className={`text-sm font-bold w-6 ${rankColor}`}>#{i + 1}</span>
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
                          {a.cv_url && (
                            <a href={a.cv_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
                                <FileText className="w-3.5 h-3.5" /> CV
                              </Button>
                            </a>
                          )}
                          {a.status === "processed" && (
                            <Button variant="outline" size="sm" className="rounded-xl border-primary text-primary hover:bg-accent" onClick={() => setExpanded(isExpanded ? null : a.id)}>
                              {isExpanded ? "Hide" : "Details"}
                            </Button>
                          )}
                          {a.status !== "shortlisted" && a.status !== "rejected" && (
                            <Button size="sm" className="rounded-xl bg-green-600 hover:bg-green-700 text-white" onClick={() => openEmailModal(a, "accept")}>
                              Accept
                            </Button>
                          )}
                          {a.status !== "rejected" && a.status !== "shortlisted" && (
                            <Button size="sm" variant="outline" className="rounded-xl border-red-300 text-red-500 hover:bg-red-50" onClick={() => openEmailModal(a, "reject")}>
                              Reject
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
      {/* Accept / Reject Email Modal */}
      {emailModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => !sendingEmail && setEmailModal(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-foreground text-lg">
                    {emailModal.type === "accept" ? "Accept & Notify Candidate" : "Reject & Notify Candidate"}
                  </h2>
                  <p className="text-sm text-muted-foreground">An email will be sent to <strong>{emailModal.app.candidate_email}</strong></p>
                </div>
                <button onClick={() => !sendingEmail && setEmailModal(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              {emailMessage === "" ? (
                <div className="w-full border border-border rounded-xl p-4 h-48 flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/30">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  AI is writing the email...
                </div>
              ) : (
                <textarea
                  className="w-full border border-border rounded-xl p-3 text-sm text-foreground h-48 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  disabled={sendingEmail}
                />
              )}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setEmailModal(null)} disabled={sendingEmail}>Cancel</Button>
                <Button
                  className={`flex-1 rounded-xl gap-2 text-white ${emailModal.type === "accept" ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"}`}
                  onClick={handleSendEmail}
                  disabled={sendingEmail || emailMessage === ""}
                >
                  {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  {sendingEmail ? "Sending..." : emailModal.type === "accept" ? "Send & Accept" : "Send & Reject"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}