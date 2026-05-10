import React from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

const TRAIT_LABELS = {
  openness: "Openness",
  conscientiousness: "Conscientiousness",
  extraversion: "Extraversion",
  agreeableness: "Agreeableness",
  stability: "Stability",
};

const TRAITS = ["openness", "conscientiousness", "extraversion", "agreeableness", "stability"];

function getTraitLabel(score) {
  if (score >= 4.3) return "Very High";
  if (score >= 3.5) return "High";
  if (score >= 2.6) return "Moderate";
  if (score >= 1.9) return "Low";
  return "Very Low";
}

function getTraitColor(score) {
  if (score >= 3.5) return "text-green-600";
  if (score >= 2.6) return "text-orange-500";
  return "text-red-500";
}

export default function BigFiveResultCard({ result, showLink = false }) {
  if (!result) return null;

  const scores = TRAITS.map(t => ({ trait: t, score: result[`score_${t}`] || 0 }));
  const radarData = scores.map(s => ({
    trait: TRAIT_LABELS[s.trait].slice(0, 5),
    score: s.score,
  }));
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const strengths = sorted.slice(0, 2);
  const growth = sorted.slice(-2).reverse();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Big Five Personality</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Completed {new Date(result.created_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>
        {showLink && (
          <Link
            to={`/psych-results?id=${result.id}`}
            className="text-xs text-primary hover:underline font-medium"
          >
            Full Report →
          </Link>
        )}
      </div>

      {/* Radar Chart */}
      <div className="bg-muted/30 rounded-xl p-4">
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="trait" tick={{ fontSize: 11, fill: "#6b7280" }} />
            <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9 }} tickCount={6} />
            <Radar name="Score" dataKey="score" stroke="hsl(262,83%,58%)" fill="hsl(262,83%,58%)" fillOpacity={0.25} strokeWidth={2} />
            <Tooltip formatter={(v) => v.toFixed(1)} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Score Bars */}
      <div className="space-y-2">
        {scores.map(({ trait, score }) => (
          <div key={trait} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-28 shrink-0">{TRAIT_LABELS[trait]}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${(score / 5) * 100}%` }} />
            </div>
            <span className={`text-xs font-semibold w-16 text-right ${getTraitColor(score)}`}>
              {score.toFixed(1)} — {getTraitLabel(score)}
            </span>
          </div>
        ))}
      </div>

      {/* Strengths & Growth */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 border border-green-100 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs font-semibold text-green-700">Top Traits</span>
          </div>
          {strengths.map(({ trait, score }) => (
            <div key={trait} className="flex justify-between text-xs py-0.5">
              <span className="text-green-800">{TRAIT_LABELS[trait]}</span>
              <span className="font-bold text-green-700">{score.toFixed(1)}</span>
            </div>
          ))}
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-semibold text-orange-700">Growth Areas</span>
          </div>
          {growth.map(({ trait, score }) => (
            <div key={trait} className="flex justify-between text-xs py-0.5">
              <span className="text-orange-800">{TRAIT_LABELS[trait]}</span>
              <span className="font-bold text-orange-700">{score.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Job Recommendations */}
      {(result.recommended_jobs || []).length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Briefcase className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">Recommended Roles</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(result.recommended_jobs || []).map((job) => (
              <span key={job} className="text-xs bg-accent text-primary px-2.5 py-1 rounded-lg font-medium">{job}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}