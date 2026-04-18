import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, TrendingUp, Lightbulb, Award, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

const SCORES = [
  { label: "Technical Skills", value: 88 },
  { label: "Communication", value: 85 },
  { label: "Problem Solving", value: 90 },
  { label: "Cultural Fit", value: 78 },
];

const STRENGTHS = [
  {
    title: "Strong Technical Foundation",
    description:
      "Demonstrated excellent understanding of React, TypeScript, and modern web development practices. Your experience with component architecture and state management was particularly impressive.",
  },
  {
    title: "Problem-Solving Approach",
    description:
      "You showed a systematic and logical approach to breaking down complex problems. Your ability to articulate your thought process was clear and well-structured.",
  },
  {
    title: "Communication Skills",
    description:
      "Articulate responses with good examples from your experience. You effectively conveyed technical concepts in an accessible manner.",
  },
];

const GROWTH = [
  {
    title: "Cloud Infrastructure Experience",
    description:
      "While you have some AWS experience, deepening your knowledge of cloud architecture patterns and infrastructure-as-code would strengthen your profile for senior roles.",
  },
  {
    title: "System Design",
    description:
      "Consider gaining more experience with large-scale system design and architecture decisions. This would be valuable for the senior level position.",
  },
];

const RECOMMENDATIONS = [
  "Explore advanced AWS services and serverless architectures",
  "Work on projects involving microservices and distributed systems",
  "Consider obtaining cloud certifications (AWS Solutions Architect)",
  "Participate in system design discussions and reviews",
];

export default function FeedbackReport() {
  return (
    <div className="min-h-screen bg-[#F4F3FF]">
      {/* Top bar */}
      <div className="bg-white border-b border-border px-6 md:px-10 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link
          to="/candidate-dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <Button variant="outline" className="rounded-xl gap-2 text-sm h-9">
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Feedback Report</h1>
          <p className="text-muted-foreground mt-1">Personalized insights to help you grow professionally</p>
        </div>

        {/* Overview Card */}
        <div className="bg-white border border-border rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">Senior Software Engineer</h2>
              <p className="text-sm text-primary font-medium">CloudVentures</p>
              <p className="text-sm text-muted-foreground">November 10, 2025</p>
            </div>
            <div className="sm:text-right shrink-0">
              <p className="text-xs text-muted-foreground mb-1">Overall Score</p>
              <p className="text-5xl font-bold text-primary">85</p>
              <div className="mt-2 w-40 h-2 bg-muted rounded-full overflow-hidden ml-auto">
                <div className="h-full bg-foreground rounded-full" style={{ width: "85%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Breakdown */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Performance Breakdown</h3>
              <p className="text-sm text-muted-foreground">Detailed analysis across key evaluation areas</p>
            </div>
          </div>
          <div className="space-y-4">
            {SCORES.map(({ label, value }) => (
              <div key={label}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium text-foreground">{label}</span>
                  <span className="text-muted-foreground font-semibold">{value}%</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-foreground rounded-full" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Strengths */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-foreground">Key Strengths</h3>
              <p className="text-sm text-muted-foreground">Areas where you excelled during the evaluation</p>
            </div>
          </div>
          <div className="space-y-3">
            {STRENGTHS.map(({ title, description }) => (
              <div key={title} className="bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="font-semibold text-foreground text-sm mb-1">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Areas for Growth */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="font-semibold text-foreground">Areas for Growth</h3>
              <p className="text-sm text-muted-foreground">Opportunities to enhance your professional profile</p>
            </div>
          </div>
          <div className="space-y-3">
            {GROWTH.map(({ title, description }) => (
              <div key={title} className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                <p className="font-semibold text-foreground text-sm mb-1">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <div>
              <h3 className="font-semibold text-foreground">Recommendations</h3>
              <p className="text-sm text-muted-foreground">Actionable steps to advance your career</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {RECOMMENDATIONS.map((rec, i) => (
              <div key={i} className="flex items-center gap-4 bg-[#F4F3FF] border border-border rounded-xl px-4 py-3">
                <span className="w-6 h-6 rounded-full bg-white border border-border text-foreground text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}