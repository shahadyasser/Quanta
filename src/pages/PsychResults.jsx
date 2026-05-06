import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { base44 } from "@/api/base44Client";

const TRAIT_LABELS = {
  openness: "Openness",
  conscientiousness: "Conscientiousness",
  extraversion: "Extraversion",
  agreeableness: "Agreeableness",
  stability: "Stability",
};

const TRAIT_DESCS = {
  openness: "Curiosity, creativity and openness to new experiences.",
  conscientiousness: "Organization, dependability and goal-directed behavior.",
  extraversion: "Sociability, assertiveness and positive emotionality.",
  agreeableness: "Cooperation, trust and empathy toward others.",
  stability: "Emotional resilience and calmness under pressure.",
};

function FitBadge({ score }) {
  if (score >= 80) return <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 font-bold px-4 py-1.5 rounded-full text-sm">🟢 Strong Fit — {score}</span>;
  if (score >= 60) return <span className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 font-bold px-4 py-1.5 rounded-full text-sm">🟡 Moderate Fit — {score}</span>;
  return <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 font-bold px-4 py-1.5 rounded-full text-sm">🔴 Low Fit — {score}</span>;
}

export default function PsychResults() {
  const [result, setResult] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) { setLoading(false); return; }
    const load = async () => {
      const res = await base44.entities.AssessmentResult.filter({ id });
      if (res.length > 0) {
        setResult(res[0]);
        const prof = await base44.entities.JobProfile.filter({ id: res[0].job_profile_id });
        if (prof.length > 0) setProfile(prof[0]);
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (!result) return (
    <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center">
      <div className="text-center text-muted-foreground">No result found.</div>
    </div>
  );

  const traits = ["openness", "conscientiousness", "extraversion", "agreeableness", "stability"];

  const candidateData = traits.map(t => ({
    trait: TRAIT_LABELS[t],
    candidate: result[`score_${t}`] || 0,
    ideal: profile ? (profile[`ideal_${t}`] || 0) : null,
  }));

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      <nav className="bg-white border-b border-border px-6 md:px-10 py-3 flex items-center sticky top-0 z-10">
        <span className="font-bold text-lg text-primary">QuantaHire</span>
      </nav>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <Link to="/candidate-dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="bg-white border border-border rounded-2xl p-6">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Assessment Results</p>
          <h1 className="text-2xl font-bold text-foreground">{result.candidate_name || result.candidate_email}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Role: <span className="font-medium text-foreground">{result.job_profile_title}</span></p>
          <div className="mt-3">
            <FitBadge score={result.fit_score} />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Fit Score = 100 × (1 − totalWeightedDiff / (4 × sumOfWeights))
          </p>
        </div>

        {/* Radar Chart */}
        <div className="bg-white border border-border rounded-2xl p-6">
          <h2 className="font-semibold text-foreground mb-4">Big Five Personality Profile</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={candidateData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="trait" tick={{ fontSize: 12, fill: "#6b7280" }} />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} tickCount={6} />
              <Radar name="You" dataKey="candidate" stroke="hsl(262,83%,58%)" fill="hsl(262,83%,58%)" fillOpacity={0.25} strokeWidth={2} />
              {profile && <Radar name="Ideal" dataKey="ideal" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 4" />}
              <Tooltip formatter={(v) => v.toFixed(2)} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 justify-center mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-primary inline-block rounded" />You</span>
            {profile && <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-green-500 inline-block rounded border-dashed" />Ideal</span>}
          </div>
        </div>

        {/* Trait Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {traits.map(t => {
            const score = result[`score_${t}`] || 0;
            const ideal = profile ? (profile[`ideal_${t}`] || 3) : null;
            const pct = (score / 5) * 100;
            return (
              <div key={t} className="bg-white border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground capitalize">{TRAIT_LABELS[t]}</h3>
                  <span className="text-2xl font-bold text-primary">{score.toFixed(1)}<span className="text-sm font-normal text-muted-foreground">/5</span></span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                {ideal && (
                  <p className="text-xs text-muted-foreground">Ideal for {result.job_profile_title}: <span className="font-medium text-foreground">{ideal}</span></p>
                )}
                <p className="text-xs text-muted-foreground">{TRAIT_DESCS[t]}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}