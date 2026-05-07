import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Loader2, Search, Filter, Download, RotateCw, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { pgQuery } from "@/lib/neonDb";
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

      // Skip if already processed
      if (app.status === "processed" && app.match_score > 0) {
        console.log("Skipping already processed:", app.candidate_name);
        continue;
      }

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

    // Refresh candidates
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

  const exportCSV = () => {
    const headers = ["Rank", "Candidate", "Email", "Match Score", "Work Exp", "Skills", "Education", "Certs", "Status"];
    const rows = filteredAndSorted.map((app, idx) => [
      idx + 1,
      app.candidate_name || "Unknown",
      app.candidate_email || "",
      app.match_score || "N/A",
      app.rag_results?.construct_scores?.work_experience || "N/A",
      app.rag_results?.construct_scores?.skills || "N/A",
      app.rag_results?.construct_scores?.education || "N/A",
      app.rag_results?.construct_scores?.certifications || "N/A",
      app.status || "pending",
    ]);

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ranked-candidates-${job?.title || "job"}.csv`;
    a.click();
  };

  const filteredAndSorted = candidates
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
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 rounded-xl gap-2 px-6"
            onClick={rankAllCandidates}
            disabled={processing}
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {processing ? "Processing..." : "Rank All Candidates"}
          </Button>
          <Button variant="outline" className="rounded-xl gap-2" onClick={exportCSV} disabled={processing}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
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

        {/* Ranked Table */}
        <RankedCandidatesTable
          candidates={filteredAndSorted}
          onReprocess={reprocessCandidate}
          jobId={jobId}
          job={job}
          showScores={rankingStarted || processedCount > 0}
          onStatusChange={async () => {
            await fetchJobAndCandidates();
          }}
        />
      </div>

      {/* Progress Modal */}
      {processing && <RankProgressModal progress={progress} />}
    </div>
  );
}