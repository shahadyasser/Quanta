import React, { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Phone, Mail, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CandidateExpandedRow from "@/components/recruiter/CandidateExpandedRow";
import RatingStars from "@/components/recruiter/RatingStars";

const SCORE_COLORS = {
  strong: "bg-green-50 text-green-700 border-green-200",
  moderate: "bg-yellow-50 text-yellow-700 border-yellow-200",
  weak: "bg-orange-50 text-orange-700 border-orange-200",
  poor: "bg-red-50 text-red-700 border-red-200",
};

const MEDAL_ICONS = ["🥇", "🥈", "🥉"];

function getScoreColor(score) {
  if (score >= 80) return SCORE_COLORS.strong;
  if (score >= 60) return SCORE_COLORS.moderate;
  if (score >= 40) return SCORE_COLORS.weak;
  return SCORE_COLORS.poor;
}

function getScoreLabel(score) {
  if (score >= 80) return "Strong Match";
  if (score >= 60) return "Moderate Match";
  if (score >= 40) return "Weak Match";
  return "Poor Match";
}

export default function RankedCandidatesTable({ candidates, onReprocess, jobId, job, showScores }) {
  const [expanded, setExpanded] = useState(null);
  const [reprocessing, setReprocessing] = useState(null);

  const handleReprocess = async (appId) => {
    setReprocessing(appId);
    await onReprocess(appId);
    setReprocessing(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-6 py-4 text-left font-semibold text-foreground w-16">Rank</th>
              <th className="px-6 py-4 text-left font-semibold text-foreground">Candidate</th>
              {showScores && <th className="px-6 py-4 text-left font-semibold text-foreground w-32">Score</th>}
              {showScores && <th className="px-6 py-4 text-center font-semibold text-foreground w-24">Work Exp</th>}
              {showScores && <th className="px-6 py-4 text-center font-semibold text-foreground w-24">Skills</th>}
              {showScores && <th className="px-6 py-4 text-center font-semibold text-foreground w-24">Education</th>}
              {showScores && <th className="px-6 py-4 text-center font-semibold text-foreground w-24">Certs</th>}
              <th className="px-6 py-4 text-left font-semibold text-foreground w-32">Status</th>
              <th className="px-6 py-4 text-right font-semibold text-foreground w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 ? (
              <tr>
                <td colSpan={showScores ? "9" : "4"} className="px-6 py-12 text-center text-muted-foreground">
                  {showScores ? "No candidates with scores yet. Process all CVs first." : "Click 'Rank All Candidates' to start analyzing CVs."}
                </td>
              </tr>
            ) : (
              candidates.map((app, idx) => {
                const isExpanded = expanded === app.id;
                const score = app.match_score || 0;
                const constructs = app.rag_results?.construct_scores || {};

                return (
                  <React.Fragment key={app.id}>
                    <tr className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setExpanded(isExpanded ? null : app.id)}>
                      <td className="px-6 py-4 font-bold text-foreground">
                        {idx < 3 && <span className="text-xl">{MEDAL_ICONS[idx]}</span>}
                        {idx < 3 ? "" : `#${idx + 1}`}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-foreground">{app.candidate_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{app.candidate_email}</p>
                        </div>
                      </td>
                      {showScores && (
                        <td className="px-6 py-4">
                          <div className={`inline-flex flex-col items-center px-3 py-2 rounded-xl border ${getScoreColor(score)}`}>
                            <p className="text-lg font-bold">{score.toFixed(1)}</p>
                            <p className="text-xs">{getScoreLabel(score)}</p>
                          </div>
                        </td>
                      )}
                      {showScores && (
                        <td className="px-6 py-4 text-center">
                          <RatingStars rating={constructs.work_experience || 0} />
                        </td>
                      )}
                      {showScores && (
                        <td className="px-6 py-4 text-center">
                          <RatingStars rating={constructs.skills || 0} />
                        </td>
                      )}
                      {showScores && (
                        <td className="px-6 py-4 text-center">
                          <RatingStars rating={constructs.education || 0} />
                        </td>
                      )}
                      {showScores && (
                        <td className="px-6 py-4 text-center">
                          <RatingStars rating={constructs.certifications || 0} />
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <Badge
                          className={`text-xs ${
                            app.status === "processed"
                              ? "bg-green-50 text-green-600 border-green-200"
                              : app.status === "shortlisted"
                              ? "bg-blue-50 text-blue-600 border-blue-200"
                              : "bg-orange-50 text-orange-600 border-orange-200"
                          }`}
                        >
                          {app.status === "processed" ? "Analyzed" : app.status === "shortlisted" ? "Shortlisted" : "Pending"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-muted-foreground hover:text-foreground">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-muted/10">
                        <td colSpan={showScores ? "9" : "4"} className="px-6 py-6">
                          <CandidateExpandedRow
                            app={app}
                            jobId={jobId}
                            job={job}
                            onReprocess={() => handleReprocess(app.id)}
                            isReprocessing={reprocessing === app.id}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}