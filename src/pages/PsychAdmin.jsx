import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Download, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { base44 } from "@/api/base44Client";

const TRAITS = ["openness", "conscientiousness", "extraversion", "agreeableness", "stability"];
const TRAIT_LABELS = { openness: "Openness", conscientiousness: "Conscientiousness", extraversion: "Extraversion", agreeableness: "Agreeableness", stability: "Stability" };

function FitBadge({ score }) {
  if (score >= 80) return <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-2.5 py-1 rounded-full">{score}</span>;
  if (score >= 60) return <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-bold px-2.5 py-1 rounded-full">{score}</span>;
  return <span className="bg-red-50 text-red-600 border border-red-200 text-xs font-bold px-2.5 py-1 rounded-full">{score}</span>;
}

const emptyProfile = () => ({
  title: "", department: "",
  ideal_openness: 3, ideal_conscientiousness: 3, ideal_extraversion: 3, ideal_agreeableness: 3, ideal_stability: 3,
  weight_openness: 1, weight_conscientiousness: 1, weight_extraversion: 1, weight_agreeableness: 1, weight_stability: 1,
});

export default function PsychAdmin() {
  const [results, setResults] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyProfile());
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("candidates"); // candidates | profiles

  useEffect(() => {
    const load = async () => {
      const [res, profs] = await Promise.all([
        base44.entities.AssessmentResult.list("-fit_score", 100),
        base44.entities.JobProfile.list(),
      ]);
      setResults(res);
      setProfiles(profs);
      setLoading(false);
    };
    load();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    const saved = await base44.entities.JobProfile.create(form);
    setProfiles(prev => [...prev, saved]);
    setShowForm(false);
    setForm(emptyProfile());
    setSaving(false);
  };

  const handleDeleteProfile = async (id) => {
    await base44.entities.JobProfile.delete(id);
    setProfiles(prev => prev.filter(p => p.id !== id));
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Job Profile", "Fit Score", "Openness", "Conscientiousness", "Extraversion", "Agreeableness", "Stability", "Date"];
    const rows = results.map(r => [
      r.candidate_name || "", r.candidate_email, r.job_profile_title,
      r.fit_score, r.score_openness, r.score_conscientiousness,
      r.score_extraversion, r.score_agreeableness, r.score_stability,
      new Date(r.created_date).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "assessment_results.csv"; a.click();
  };

  const radarData = (result) => TRAITS.map(t => ({
    trait: TRAIT_LABELS[t].slice(0, 4),
    score: result[`score_${t}`] || 0,
  }));

  if (loading) return (
    <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      <nav className="bg-white border-b border-border px-6 md:px-10 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="font-bold text-lg text-primary">QuantaHire · Psych Admin</span>
        <Link to="/admin-dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Admin Dashboard
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Psychometric Results</h1>
            <p className="text-sm text-muted-foreground">{results.length} assessments completed</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl gap-2" onClick={exportCSV}>
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border border-border rounded-xl p-1 gap-1 w-fit">
          {["candidates", "profiles"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "candidates" ? "Candidates" : "Job Profiles"}
            </button>
          ))}
        </div>

        {/* CANDIDATES TAB */}
        {tab === "candidates" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* List */}
            <div className="space-y-3">
              {results.length === 0 && <div className="bg-white border border-border rounded-2xl p-10 text-center text-muted-foreground text-sm">No assessments yet.</div>}
              {results.map(r => (
                <div
                  key={r.id}
                  onClick={() => setSelectedResult(selectedResult?.id === r.id ? null : r)}
                  className={`bg-white border rounded-2xl p-5 cursor-pointer transition-all hover:border-primary/40 ${selectedResult?.id === r.id ? "border-primary shadow-sm" : "border-border"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0 font-bold text-primary">
                        {(r.candidate_name || r.candidate_email || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{r.candidate_name || r.candidate_email}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.job_profile_title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <FitBadge score={r.fit_score} />
                      {selectedResult?.id === r.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                  {selectedResult?.id === r.id && (
                    <div className="mt-4 grid grid-cols-5 gap-2">
                      {TRAITS.map(t => (
                        <div key={t} className="text-center">
                          <p className="text-xs text-muted-foreground capitalize">{t.slice(0, 3)}</p>
                          <p className="font-bold text-foreground">{(r[`score_${t}`] || 0).toFixed(1)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Radar Detail */}
            <div className="bg-white border border-border rounded-2xl p-6 sticky top-24 h-fit">
              {selectedResult ? (
                <>
                  <h2 className="font-semibold text-foreground mb-1">{selectedResult.candidate_name || selectedResult.candidate_email}</h2>
                  <p className="text-xs text-muted-foreground mb-1">{selectedResult.job_profile_title}</p>
                  <div className="mb-3"><FitBadge score={selectedResult.fit_score} /></div>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={radarData(selectedResult)}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="trait" tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9 }} tickCount={6} />
                      <Radar name="Score" dataKey="score" stroke="hsl(262,83%,58%)" fill="hsl(262,83%,58%)" fillOpacity={0.3} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-5 gap-2 text-center">
                    {TRAITS.map(t => (
                      <div key={t}>
                        <p className="text-xs text-muted-foreground">{TRAIT_LABELS[t].slice(0, 4)}</p>
                        <p className="font-bold text-primary">{(selectedResult[`score_${t}`] || 0).toFixed(1)}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-2">
                    <span className="text-2xl">📊</span>
                  </div>
                  <p className="font-medium">Select a candidate</p>
                  <p className="text-sm">Click any candidate to view their radar chart</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* JOB PROFILES TAB */}
        {tab === "profiles" && (
          <div className="space-y-4">
            <Button className="gap-2 rounded-xl bg-primary hover:bg-primary/90" onClick={() => setShowForm(v => !v)}>
              <Plus className="w-4 h-4" /> {showForm ? "Cancel" : "Add Job Profile"}
            </Button>

            {showForm && (
              <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
                <h3 className="font-semibold text-foreground">New Job Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Data Analyst" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Department</label>
                    <Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Analytics" className="rounded-xl" />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Ideal Scores & Weights</p>
                  {TRAITS.map(t => (
                    <div key={t} className="grid grid-cols-3 items-center gap-3">
                      <label className="text-sm text-foreground capitalize col-span-1">{TRAIT_LABELS[t]}</label>
                      <div>
                        <label className="text-xs text-muted-foreground mb-0.5 block">Ideal (1-5)</label>
                        <Input type="number" min={1} max={5} step={0.1}
                          value={form[`ideal_${t}`]}
                          onChange={e => setForm(f => ({ ...f, [`ideal_${t}`]: parseFloat(e.target.value) }))}
                          className="rounded-xl h-9" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-0.5 block">Weight (0.5-2)</label>
                        <Input type="number" min={0.5} max={2} step={0.1}
                          value={form[`weight_${t}`]}
                          onChange={e => setForm(f => ({ ...f, [`weight_${t}`]: parseFloat(e.target.value) }))}
                          className="rounded-xl h-9" />
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="rounded-xl bg-primary hover:bg-primary/90 gap-2" disabled={!form.title || saving} onClick={handleSaveProfile}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Profile
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map(p => (
                <div key={p.id} className="bg-white border border-border rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-foreground">{p.title}</h3>
                      <p className="text-xs text-muted-foreground">{p.department}</p>
                    </div>
                    <button onClick={() => handleDeleteProfile(p.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {TRAITS.map(t => (
                      <div key={t} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{TRAIT_LABELS[t]}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${((p[`ideal_${t}`] || 3) / 5) * 100}%` }} />
                          </div>
                          <span className="font-medium text-foreground w-6 text-right">{p[`ideal_${t}`] || "—"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}