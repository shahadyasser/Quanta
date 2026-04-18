import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATS = [
  { label: "Total Candidates", value: "4" },
  { label: "Interviews Done", value: "2" },
  { label: "Avg Score", value: "87" },
  { label: "AI Fairness", value: "Bias Check Passed ✓", green: true },
];

const CANDIDATES = [
  {
    rank: 1, name: "Sarah Johnson", initials: "SJ", email: "sarah.j@email.com",
    status: "Interview Completed", scoreLabel: "Final Score", score: 95,
    skills: ["React", "TypeScript", "Node.js"],
  },
  {
    rank: 2, name: "Michael Chen", initials: "MC", email: "m.chen@email.com",
    status: "Interview Completed", scoreLabel: "Final Score", score: 90,
    skills: ["JavaScript", "Python", "AWS"],
  },
  {
    rank: 3, name: "Emma Williams", initials: "EW", email: "emma.w@email.com",
    status: "Invited", scoreLabel: "Initial Score", score: 85,
    skills: ["Vue.js", "Docker", "MongoDB"],
  },
  {
    rank: 4, name: "James Rodriguez", initials: "JR", email: "j.rodriguez@email.com",
    status: "Under Review", scoreLabel: "Initial Score", score: 82,
    skills: ["Angular", "Java", "PostgreSQL"],
  },
];

const STATUS_STYLES = {
  "Interview Completed": "bg-green-50 text-green-600 border-green-200",
  "Invited": "bg-blue-50 text-blue-600 border-blue-200",
  "Under Review": "bg-orange-50 text-orange-500 border-orange-200",
};

export default function ViewCandidates() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const jobTitle = urlParams.get("job") || "Senior Developer";
  const jobStatus = urlParams.get("status") || "Active";

  const filtered = CANDIDATES.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.skills.some((s) => s.toLowerCase().includes(q))
    );
  });

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
            <p className="text-sm text-muted-foreground">Candidate shortlist ranked by AI scoring</p>
          </div>
          <Badge className="bg-green-50 text-green-600 border-green-200 self-start sm:self-auto">{jobStatus}</Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white border border-border rounded-2xl p-5">
              <p className="text-sm text-muted-foreground mb-2">{s.label}</p>
              <p className={`text-2xl font-bold ${s.green ? "text-green-600 text-base" : "text-foreground"}`}>
                {s.value}
              </p>
            </div>
          ))}
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
            <p className="text-sm text-muted-foreground">Candidates are ranked by their final score (after interview) or initial score (CV + assessment)</p>
          </div>

          <div className="space-y-3">
            {filtered.map((c) => (
              <div key={c.rank} className="bg-white border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Rank + Avatar */}
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-sm font-bold text-muted-foreground w-6">#{c.rank}</span>
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <span className="text-primary font-semibold text-sm">{c.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-foreground">{c.name}</h3>
                      <Badge className={`text-xs ${STATUS_STYLES[c.status]}`}>{c.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{c.email}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.skills.map((s) => (
                        <span key={s} className="text-xs bg-accent text-primary px-2.5 py-1 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Score + Action */}
                <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{c.scoreLabel}</p>
                    <p className="text-3xl font-bold text-foreground">{c.score}</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl border-primary text-primary hover:bg-accent" onClick={() => navigate("/candidate-profile")}>
                    View Profile
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}