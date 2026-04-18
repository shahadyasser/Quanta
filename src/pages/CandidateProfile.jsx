import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Star, CheckCircle, Clock, UserCheck, Brain, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CANDIDATE = {
  rank: 1,
  name: "Sarah Johnson",
  initials: "SJ",
  email: "sarah.j@email.com",
  role: "Senior Developer",
  status: "Interview Completed",
  finalScore: 95,
  cvScore: 88,
  interviewScore: 97,
  skills: ["React", "TypeScript", "Node.js", "GraphQL", "AWS"],
  experience: "6 years",
  education: "B.Sc. Computer Science, MIT",
  summary: "Highly skilled full-stack developer with 6 years of experience building scalable web applications. Strong expertise in React and Node.js ecosystems.",
  interviewAnswers: [
    {
      question: "Describe a challenging technical problem you solved.",
      answer: "I architected a real-time collaboration feature for 10k+ concurrent users using WebSockets and Redis pub/sub, reducing latency by 60%.",
      score: 98,
    },
    {
      question: "How do you approach code reviews?",
      answer: "I focus on maintainability, security, and performance. I always provide constructive feedback and suggest alternatives rather than just pointing out issues.",
      score: 95,
    },
    {
      question: "Tell me about your experience with TypeScript.",
      answer: "I've used TypeScript for 4 years across multiple large-scale projects. I leverage advanced types, generics, and utility types to write safer, more maintainable code.",
      score: 96,
    },
  ],
  aiInsights: [
    "Exceptionally strong technical background with hands-on experience in all required skills.",
    "Communication and problem-solving answers indicate high seniority level.",
    "No bias indicators detected — evaluation based purely on merit.",
  ],
};

const TABS = ["Overview", "Interview", "AI Insights"];

export default function CandidateProfile() {
  const [tab, setTab] = useState("Overview");

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
              <span className="text-primary font-bold text-2xl">{CANDIDATE.initials}</span>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-foreground">{CANDIDATE.name}</h1>
                <Badge className="bg-green-50 text-green-600 border-green-200">{CANDIDATE.status}</Badge>
                <span className="text-sm font-semibold text-primary">#{CANDIDATE.rank} Ranked</span>
              </div>
              <p className="text-muted-foreground text-sm flex items-center gap-1.5 mb-3">
                <Mail className="w-3.5 h-3.5" />{CANDIDATE.email}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CANDIDATE.skills.map((s) => (
                  <span key={s} className="text-xs bg-accent text-primary px-2.5 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </div>
            {/* Score */}
            <div className="text-center shrink-0">
              <div className="w-20 h-20 rounded-full border-4 border-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{CANDIDATE.finalScore}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Final Score</p>
            </div>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{CANDIDATE.cvScore}</p>
              <p className="text-xs text-muted-foreground">CV Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{CANDIDATE.interviewScore}</p>
              <p className="text-xs text-muted-foreground">Interview Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{CANDIDATE.experience}</p>
              <p className="text-xs text-muted-foreground">Experience</p>
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
            <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Summary</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{CANDIDATE.summary}</p>
            </div>
            <div className="bg-white border border-border rounded-2xl p-6 space-y-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><UserCheck className="w-4 h-4 text-primary" /> Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Education: </span><span className="text-foreground font-medium">{CANDIDATE.education}</span></div>
                <div><span className="text-muted-foreground">Experience: </span><span className="text-foreground font-medium">{CANDIDATE.experience}</span></div>
                <div><span className="text-muted-foreground">Applied For: </span><span className="text-foreground font-medium">{CANDIDATE.role}</span></div>
                <div><span className="text-muted-foreground">Status: </span><span className="text-foreground font-medium">{CANDIDATE.status}</span></div>
              </div>
            </div>
          </div>
        )}

        {tab === "Interview" && (
          <div className="space-y-4">
            {CANDIDATE.interviewAnswers.map((qa, i) => (
              <div key={i} className="bg-white border border-border rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="font-semibold text-foreground flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {qa.question}
                  </h3>
                  <span className="text-xl font-bold text-primary shrink-0">{qa.score}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">{qa.answer}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "AI Insights" && (
          <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><Brain className="w-4 h-4 text-primary" /> AI-Generated Insights</h2>
            <div className="space-y-3">
              {CANDIDATE.aiInsights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-accent rounded-xl">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{insight}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-700 font-medium">Bias Check Passed — This evaluation meets our fairness standards.</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pb-6">
          <Button className="bg-primary hover:bg-primary/90 rounded-xl gap-2">
            <CheckCircle className="w-4 h-4" /> Shortlist Candidate
          </Button>
          <Button variant="outline" className="rounded-xl gap-2 border-primary text-primary hover:bg-accent">
            <Mail className="w-4 h-4" /> Send Email
          </Button>
          <Button variant="outline" className="rounded-xl gap-2 text-destructive border-destructive/30 hover:bg-destructive/5">
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}