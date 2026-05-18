import React, { useState, useEffect } from "react";
import { X, Brain, FileText, Briefcase, MapPin, GraduationCap, Star, TrendingUp, BookOpen, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function CandidateProfileModal({ candidateEmail, candidateName, onClose }) {
  const [candidate, setCandidate] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Candidate.filter({ email: candidateEmail }),
      base44.entities.AssessmentResult.filter({ candidate_email: candidateEmail }, "-created_date", 1),
    ]).then(([candidates, assessments]) => {
      setCandidate(candidates[0] || null);
      setAssessment(assessments[0] || null);
      setLoading(false);
    });
  }, [candidateEmail]);

  const traits = assessment ? [
    { label: "Openness", value: assessment.score_openness },
    { label: "Conscientiousness", value: assessment.score_conscientiousness },
    { label: "Extraversion", value: assessment.score_extraversion },
    { label: "Agreeableness", value: assessment.score_agreeableness },
    { label: "Stability", value: assessment.score_stability },
  ] : [];

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">{candidateName || candidateEmail}</h2>
                <p className="text-xs text-muted-foreground">{candidateEmail}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {loading ? (
              <div className="flex justify-center py-10 text-muted-foreground text-sm">Loading profile...</div>
            ) : (
              <>
                {/* Basic Info */}
                {candidate && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {candidate.phone && (
                      <InfoRow icon={<User className="w-4 h-4 text-primary" />} label="Phone" value={candidate.phone} />
                    )}
                    {candidate.location && (
                      <InfoRow icon={<MapPin className="w-4 h-4 text-primary" />} label="Location" value={candidate.location} />
                    )}
                    {candidate.current_job_title && (
                      <InfoRow icon={<Briefcase className="w-4 h-4 text-primary" />} label="Current Title" value={candidate.current_job_title} />
                    )}
                    {candidate.years_of_experience !== undefined && (
                      <InfoRow icon={<TrendingUp className="w-4 h-4 text-primary" />} label="Experience" value={`${candidate.years_of_experience} years`} />
                    )}
                    {candidate.education_level && (
                      <InfoRow icon={<GraduationCap className="w-4 h-4 text-primary" />} label="Education" value={`${candidate.education_level}${candidate.field_of_study ? ` — ${candidate.field_of_study}` : ""}`} />
                    )}
                    {candidate.linkedin_url && (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-primary shrink-0" />
                        <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">LinkedIn Profile</a>
                      </div>
                    )}
                    {candidate.portfolio_url && (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-primary shrink-0" />
                        <a href={candidate.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">Portfolio / GitHub</a>
                      </div>
                    )}
                  </div>
                )}

                {/* Skills */}
                {candidate?.skills?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.skills.map(s => (
                        <span key={s} className="text-xs bg-accent text-primary px-2.5 py-1 rounded-lg font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* CV Link */}
                {candidate?.cv_url && (
                  <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-3">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{candidate.cv_filename || "CV Document"}</p>
                      {candidate.cv_uploaded_at && (
                        <p className="text-xs text-muted-foreground">Uploaded {new Date(candidate.cv_uploaded_at).toLocaleDateString()}</p>
                      )}
                    </div>
                    <a href={candidate.cv_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="rounded-lg text-xs">View CV</Button>
                    </a>
                  </div>
                )}

                {/* Psychometric Test */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-5 h-5 text-primary" />
                    <p className="font-semibold text-foreground">Psychometric Assessment (Big Five)</p>
                  </div>
                  {assessment ? (
                    <>
                      <div className="grid grid-cols-5 gap-2">
                        {traits.map(({ label, value }) => (
                          <div key={label} className="bg-[#F8F7FF] rounded-xl px-2 py-3 text-center">
                            <p className="text-xs text-muted-foreground mb-1 leading-tight">{label}</p>
                            <p className="text-xl font-bold text-primary">{value?.toFixed(1) ?? "—"}</p>
                            <div className="w-full bg-muted rounded-full h-1.5 mt-1.5">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${((value || 0) / 5) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      {assessment.recommended_jobs?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Recommended Career Paths</p>
                          <div className="flex flex-wrap gap-1.5">
                            {assessment.recommended_jobs.map(job => (
                              <span key={job} className="text-xs bg-accent text-primary px-2.5 py-1 rounded-lg font-medium">{job}</span>
                            ))}
                          </div>
                          {assessment.recommended_reason && (
                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{assessment.recommended_reason}</p>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Taken on {new Date(assessment.created_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </>
                  ) : (
                    <div className="bg-muted/30 rounded-xl p-4 text-center text-sm text-muted-foreground">
                      This candidate has not taken the psychometric assessment yet.
                    </div>
                  )}
                </div>

                {!candidate && !assessment && (
                  <p className="text-center text-sm text-muted-foreground py-4">No profile data available for this candidate yet.</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}