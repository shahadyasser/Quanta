import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Loader2, Search, Download, Sparkles, Bell, Mail, Cpu } from "lucide-react";
import NotifyModal from "@/components/recruiter/NotifyModal";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import RankSummaryCards from "@/components/recruiter/RankSummaryCards";
import RankedCandidatesTable from "@/components/recruiter/RankedCandidatesTable";
import RankProgressModal from "@/components/recruiter/RankProgressModal";

export default function RankCandidates() {
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentName: "" });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("score");
  const [rankingStarted, setRankingStarted] = useState(false);
  const [topN, setTopN] = useState("");
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [agenticRunning, setAgenticRunning] = useState(false);
  const [agenticDone, setAgenticDone] = useState(false);
  const [recruiterQuery, setRecruiterQuery] = useState("");
  const [roundNumber, setRoundNumber] = useState(1);
  const [cumulativeFeedback, setCumulativeFeedback] = useState("");
  const [previousRanks, setPreviousRanks] = useState({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get("job_id");

  useEffect(() => {
    if (!jobId) {
      navigate("/recruiter-dashboard");
      return;
    }
    fetchJobAndCandidates();
  }, [jobId]);

  const fetchJobAndCandidates = async () => {
    try {
      const jobData = await base44.entities.Job.get(jobId);
      setJob(jobData);
      const apps = await base44.entities.Application.filter({ job_id: jobId });
      setCandidates(apps || []);
    } catch (error) {
      console.error("Failed to load job or candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  const rankAllCandidates = async () => {
    const appsWithCV = candidates.filter((a) => a.cv_url && a.cv_url.trim());

    if (appsWithCV.length === 0) {
      alert("No applications with CVs to process.");
      return;
    }

    setRankingStarted(true);
    setProcessing(true);
    setProgress({ current: 0, total: appsWithCV.length, currentName: "" });

    for (let i = 0; i < appsWithCV.length; i++) {
      const app = appsWithCV[i];
      setProgress({ current: i + 1, total: appsWithCV.length, currentName: app.candidate_name || "Unknown" });

      try {
        await base44.functions.invoke("processCV", {
          cv_url: app.cv_url,
          application_id: app.id,
          job_id: jobId,
          job_title: job.title,
          job_description: job.description,
          job_skills: job.skills || [],
        });
        console.log("Processed:", app.candidate_name, `(${i + 1}/${appsWithCV.length})`);
      } catch (error) {
        console.error("Failed to process:", app.candidate_name, error.message);
      }
    }

    await fetchJobAndCandidates();
    setProcessing(false);
  };

  const reprocessCandidate = async (appId) => {
    const app = candidates.find((a) => a.id === appId);
    if (!app) return;

    try {
      setProcessing(true);
      setProgress({ current: 1, total: 1, currentName: app.candidate_name || "Unknown" });

      await base44.functions.invoke("processCV", {
        cv_url: app.cv_url,
        application_id: app.id,
        job_id: jobId,
        job_title: job.title,
        job_description: job.description,
        job_skills: job.skills || [],
      });

      await fetchJobAndCandidates();
    } catch (error) {
      console.error("Failed to reprocess:", error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleTopN = async () => {
    const n = parseInt(topN);
    if (!n || n < 1) return;
    const sorted = [...candidates]
      .filter(c => c.match_score > 0)
      .sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
    const topCandidates = sorted.slice(0, n);
    const restCandidates = sorted.slice(n);
    setProcessing(true);
    await Promise.all([
      ...topCandidates.map(c => base44.entities.Application.update(c.id, { status: 'shortlisted' })),
      ...restCandidates.map(c => base44.entities.Application.update(c.id, { status: 'rejected' })),
    ]);
    await fetchJobAndCandidates();
    setProcessing(false);
    toast({ description: `Top ${n} candidates set to Shortlisted, rest set to Rejected.` });
  };

  const sendFeedbackToAll = async () => {
    const appsWithStatus = candidates.filter(c =>
      ["accepted", "shortlisted", "interview", "rejected", "waitlisted"].includes(c.status)
    );
    if (appsWithStatus.length === 0) {
      toast({ description: "No candidates with a final status. Assign statuses first." });
      return;
    }
    setSendingFeedback(true);
    const res = await base44.functions.invoke("sendCandidateEmails", {
      applications: appsWithStatus,
      job_title: job?.title || "",
      company: job?.company || "",
      custom_messages: {},
    });
    const succeeded = res.data?.succeeded || 0;
    toast({ description: `📧 Sent feedback to ${succeeded} / ${appsWithStatus.length} candidates.` });
    setSendingFeedback(false);
  };

  const runAgenticRank = async () => {
    const appsWithCV = candidates.filter(c => c.cv_url);
    if (appsWithCV.length === 0) {
      toast({ description: "No candidates with CVs found for this job." });
      return;
    }

    const newCumulativeFeedback = cumulativeFeedback && recruiterQuery
      ? `${cumulativeFeedback}. Additionally: ${recruiterQuery}`
      : recruiterQuery || cumulativeFeedback || "";
    setCumulativeFeedback(newCumulativeFeedback);

    const sortedForRank = [...candidates]
      .filter(c => c.match_score > 0)
      .sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
    const prevRanks = {};
    sortedForRank.forEach((c, i) => { prevRanks[c.id] = i + 1; });
    setPreviousRanks(prevRanks);

    setAgenticRunning(true);
    const nextRound = agenticDone ? roundNumber + 1 : 1;
    const res = await base44.functions.invoke("agenticRank", {
      job_id: jobId,
      job_title: job?.title || "",
      job_description: job?.description || "",
      job_skills: job?.skills || [],
      recruiter_query: newCumulativeFeedback,
      round: nextRound,
    });
    if (res.data?.success) {
      setRoundNumber(nextRound);
      setAgenticDone(true);
      await fetchJobAndCandidates();
      toast({ description: `✅ Agentic re-ranking complete! Round ${nextRound} — ${res.data.ranked} candidates ranked with detailed explanations.` });
    } else {
      toast({ description: `Failed: ${res.data?.error || 'Unknown error'}` });
    }
    setAgenticRunning(false);
  };

  const exportCSV = () => {
    const sorted = [...candidates].sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
    const headers = ["Rank", "Candidate Name", "Email", "Match Score", "Status", "Ranking Reason", "Round Number"];
    const rows = sorted.map((app, idx) => [
      idx + 1,
      app.candidate_name || "Unknown",
      app.candidate_email || "",
      app.match_score ? app.match_score.toFixed(1) : "N/A",
      app.status || "pending",
      (app.rag_results?.feedback || app.rag_results?.ranking_reason || "").replace(/"/g, "'"),
      1,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ranked-candidates-${job?.title || "job"}.csv`;
    a.click();
  };

  // Deduplicate by candidate_email — keep highest match_score per candidate
  const deduped = Object.values(
    candidates.reduce((acc, a) => {
      const key = a.candidate_email || a.id;
      if (!acc[key] || (a.match_score || 0) > (acc[key].match_score || 0)) {
        acc[key] = a;
      }
      return acc;
    }, {})
  );

  const filteredAndSorted = deduped
    .filter((a) => {
      const q = search.toLowerCase();
      return !q || (a.candidate_name || "").toLowerCase().includes(q) || (a.candidate_email || "").toLowerCase().includes(q);
    })
    .filter((a) => {
      if (filterStatus === "all") return true;
      const score = a.match_score || 0;
      if (filterStatus === "strong") return score >= 80;
      if (filterStatus === "moderate") return score >= 60 && score < 80;
      if (filterStatus === "weak") return score >= 40 && score < 60;
      if (filterStatus === "poor") return score < 40;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "score") return (b.match_score || 0) - (a.match_score || 0);
      if (sortBy === "name") return (a.candidate_name || "").localeCompare(b.candidate_name || "");
      if (sortBy === "date") return new Date(b.created_date) - new Date(a.created_date);
      return 0;
    });

  const processedCount = candidates.filter((a) => a.status === "processed" && a.match_score).length;
  const strongMatches = candidates.filter((a) => a.match_score >= 80).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 md:px-10 py-4 sticky top-0 z-10">
        <Link to="/recruiter-dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="mt-3">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Rank Candidates — {job?.title || "Job"}
          </h1>
          <p className="text-sm text-muted-foreground">AI-powered candidate ranking with RAG analysis</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Action Bar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 rounded-xl gap-2 px-6"
              onClick={rankAllCandidates}
              disabled={processing}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {processing ? "Processing..." : "Get All Candidates Match Score"}
            </Button>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" className="rounded-xl gap-2" onClick={exportCSV} disabled={processing}>
                <Download className="w-4 h-4" />📥 Export Results
              </Button>
              <Button variant="outline" className="rounded-xl gap-2" onClick={sendFeedbackToAll} disabled={sendingFeedback || processing}>
                {sendingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                📧 Send Feedback to All
              </Button>
              <Button className="rounded-xl gap-2 bg-primary hover:bg-primary/90" onClick={() => setNotifyOpen(true)} disabled={processing}>
                <Bell className="w-4 h-4" />Notify Candidates
              </Button>
            </div>
          </div>

          {/* Top N */}
          <div className="flex items-center gap-2 bg-white border border-border rounded-xl p-3">
            <span className="text-sm font-medium text-foreground">Top N Quick-Select:</span>
            <input
              type="number"
              min="1"
              value={topN}
              onChange={e => setTopN(e.target.value)}
              placeholder="e.g. 5"
              className="w-20 h-8 rounded-lg border border-input px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button size="sm" variant="outline" className="rounded-lg h-8" onClick={handleTopN} disabled={!topN || processing}>
              Apply — Top {topN || "N"} → Shortlisted, rest → Rejected
            </Button>
          </div>

          {/* Agentic Re-Ranking — show after initial scoring (current session or previous) */}
          {(rankingStarted || candidates.some(c => c.match_score > 0)) && candidates.some(c => c.cv_url) && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    🤖 Agentic Re-Ranking {agenticDone ? `(Round ${roundNumber} active)` : ""}
                  </p>
                  <p className="text-xs text-orange-600 mt-0.5">Smarter holistic re-ranking — AI compares all candidates against each other and generates a detailed explanation per CV.</p>
                  {agenticDone && <p className="text-xs text-orange-500 mt-1 italic">✓ Previous round applied. Modify the query below and run again to re-rank with new priorities.</p>}
                  {cumulativeFeedback && (
                    <button
                      onClick={async () => {
                        // Restore original scores for all agentic-ranked candidates
                        const agenticCandidates = candidates.filter(c => c.rag_results?.agentic_rank);
                        await Promise.all(agenticCandidates.map(c => {
                          const originalScore = c.rag_results?.original_match_score ?? c.match_score;
                          const restoredRagResults = { ...c.rag_results };
                          delete restoredRagResults.agentic_rank;
                          delete restoredRagResults.agentic_score;
                          delete restoredRagResults.agentic_explanation;
                          delete restoredRagResults.agentic_round;
                          delete restoredRagResults.recruiter_query;
                          delete restoredRagResults.cumulative_feedback;
                          delete restoredRagResults.rewritten_query;
                          delete restoredRagResults.previous_rank;
                          delete restoredRagResults.previous_score;
                          delete restoredRagResults.rank_change;
                          delete restoredRagResults.llm_rank_suggestion;
                          return base44.entities.Application.update(c.id, { match_score: originalScore, rag_results: restoredRagResults });
                        }));
                        await fetchJobAndCandidates();
                        setCumulativeFeedback(""); setRecruiterQuery(""); setRoundNumber(1); setAgenticDone(false); setPreviousRanks({});
                        toast({ description: "✅ Restored original scores for all candidates." });
                      }}
                      className="text-xs text-red-500 hover:text-red-700 underline mt-1"
                    >
                      🗑 Clear query history
                    </button>
                  )}
                </div>
                <Button
                  className="shrink-0 rounded-xl gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={runAgenticRank}
                  disabled={agenticRunning || processing}
                >
                  {agenticRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                  {agenticRunning ? `Analyzing ${candidates.filter(c=>c.cv_url).length} candidates…` : agenticDone ? "Re-rank Again" : "Run Agentic RAG"}
                </Button>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-orange-700">Custom Query / Priorities (optional):</label>
                <textarea
                  value={recruiterQuery}
                  onChange={e => setRecruiterQuery(e.target.value)}
                  placeholder="e.g. 'Prioritize candidates with React and 3+ years fintech experience' or 'I need someone who can lead a team'"
                  className="w-full text-sm border border-orange-200 rounded-xl p-2.5 bg-white min-h-[60px] resize-none focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <RankSummaryCards
          total={candidates.length}
          processed={processedCount}
          strongMatches={strongMatches}
        />

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 h-10 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Candidates</option>
              <option value="strong">Strong Match (80+)</option>
              <option value="moderate">Moderate (60-79)</option>
              <option value="weak">Weak (40-59)</option>
              <option value="poor">Poor (&lt;40)</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 h-10 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="score">Sort by Score</option>
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date Applied</option>
            </select>
          </div>
        </div>

        {/* Round Header */}
        {rankingStarted && (
          <div className={`rounded-xl px-5 py-3 flex items-center gap-3 ${agenticDone ? "bg-orange-500 text-white" : "bg-blue-500 text-white"}`}>
            <span className="font-bold text-sm">
              {agenticDone ? `Round ${roundNumber} — Agentic Re-Ranking` : "Round 1 — Initial AI Ranking"}
            </span>
            {agenticDone && cumulativeFeedback && (
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Custom Query Applied</span>
            )}
          </div>
        )}

        {/* Ranked Table */}
        <RankedCandidatesTable
          candidates={filteredAndSorted}
          onReprocess={reprocessCandidate}
          jobId={jobId}
          job={job}
          showScores={rankingStarted}
          previousRanks={previousRanks}
          agenticDone={agenticDone}
          onStatusChange={async () => {
            await fetchJobAndCandidates();
          }}
        />
      </div>

      {/* Progress Modal */}
      {processing && <RankProgressModal progress={progress} />}

      {/* Notify Modal */}
      {notifyOpen && (
        <NotifyModal
          candidates={candidates}
          job={job}
          onClose={() => setNotifyOpen(false)}
          onSent={fetchJobAndCandidates}
        />
      )}
    </div>
  );
}