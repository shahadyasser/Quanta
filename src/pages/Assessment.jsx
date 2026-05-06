import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const LIKERT = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
];

const TRAITS = ["openness", "conscientiousness", "extraversion", "agreeableness", "stability"];

function calcScores(questions, answers) {
  const traitSums = {};
  const traitCounts = {};
  TRAITS.forEach(t => { traitSums[t] = 0; traitCounts[t] = 0; });

  questions.forEach((q) => {
    const raw = answers[q.id];
    if (raw == null) return;
    const score = q.is_reverse_scored ? 6 - raw : raw;
    traitSums[q.trait] += score;
    traitCounts[q.trait]++;
  });

  const scores = {};
  TRAITS.forEach(t => {
    scores[t] = traitCounts[t] > 0 ? traitSums[t] / traitCounts[t] : 0;
  });
  return scores;
}

function calcFitScore(scores, profile) {
  const weights = {
    openness: profile.weight_openness || 1,
    conscientiousness: profile.weight_conscientiousness || 1,
    extraversion: profile.weight_extraversion || 1,
    agreeableness: profile.weight_agreeableness || 1,
    stability: profile.weight_stability || 1,
  };
  const ideals = {
    openness: profile.ideal_openness || 3,
    conscientiousness: profile.ideal_conscientiousness || 3,
    extraversion: profile.ideal_extraversion || 3,
    agreeableness: profile.ideal_agreeableness || 3,
    stability: profile.ideal_stability || 3,
  };
  let totalWeightedDiff = 0;
  let sumWeights = 0;
  TRAITS.forEach(t => {
    totalWeightedDiff += weights[t] * Math.abs(scores[t] - ideals[t]);
    sumWeights += weights[t];
  });
  return Math.max(0, Math.round(100 * (1 - totalWeightedDiff / (4 * sumWeights))));
}

export default function Assessment() {
  const navigate = useNavigate();
  const [step, setStep] = useState("intro"); // intro | test | done
  const [questions, setQuestions] = useState([]);
  const [jobProfiles, setJobProfiles] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resultId, setResultId] = useState(null);

  useEffect(() => {
    const init = async () => {
      let me = null;
      try { me = await base44.auth.me(); } catch (_) {}
      setUser(me);
      const [qs, jobs] = await Promise.all([
        base44.entities.PsychQuestion.list("order_index", 50),
        base44.entities.JobProfile.list(),
      ]);
      setQuestions(qs.sort((a, b) => a.order_index - b.order_index));
      setJobProfiles(jobs);
      setLoading(false);
    };
    init();
  }, []);

  const total = questions.length;
  const answered = Object.keys(answers).length;
  const progress = total > 0 ? (answered / total) * 100 : 0;
  const canSubmit = answered === total && selectedJob;

  const handleSelect = (value) => {
    const q = questions[current];
    setAnswers(prev => ({ ...prev, [q.id]: value }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const scores = calcScores(questions, answers);
    const fitScore = calcFitScore(scores, selectedJob);
    const result = await base44.entities.AssessmentResult.create({
      candidate_email: user?.email || "",
      candidate_name: user?.full_name || "",
      job_profile_id: selectedJob.id,
      job_profile_title: selectedJob.title,
      score_openness: Math.round(scores.openness * 10) / 10,
      score_conscientiousness: Math.round(scores.conscientiousness * 10) / 10,
      score_extraversion: Math.round(scores.extraversion * 10) / 10,
      score_agreeableness: Math.round(scores.agreeableness * 10) / 10,
      score_stability: Math.round(scores.stability * 10) / 10,
      fit_score: fitScore,
      answers,
    });
    setResultId(result.id);
    setStep("done");
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // --- DONE SCREEN ---
  if (step === "done") {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center px-4">
        <div className="bg-white border border-border rounded-3xl p-10 max-w-md w-full text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Assessment Complete!</h2>
          <p className="text-muted-foreground text-sm">Your personality profile has been submitted. View your detailed results below.</p>
          <div className="flex flex-col gap-3">
            <Button
              className="w-full rounded-xl bg-primary hover:bg-primary/90"
              onClick={() => navigate(`/psych-results?id=${resultId}`)}
            >
              View My Results
            </Button>
            <Button variant="outline" className="w-full rounded-xl" onClick={() => navigate("/candidate-dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- INTRO SCREEN ---
  if (step === "intro") {
    return (
      <div className="min-h-screen bg-[#F8F7FF]">
        <nav className="bg-white border-b border-border px-6 md:px-10 py-3 flex items-center sticky top-0 z-10">
          <span className="font-bold text-lg text-primary">QuantaHire</span>
        </nav>
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 space-y-6">
          <Link to="/candidate-dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to Dashboard
          </Link>

          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-1">Psychometric Test</p>
            <h1 className="text-3xl font-bold text-foreground">Personality Assessment</h1>
            <p className="text-muted-foreground mt-1">10 questions · ~5 minutes · Big Five personality model</p>
          </div>

          <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Select the job you're applying for</label>
              <div className="relative">
                <select
                  className="w-full h-12 rounded-xl border border-border bg-white px-4 pr-10 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={selectedJob?.id || ""}
                  onChange={e => setSelectedJob(jobProfiles.find(j => j.id === e.target.value) || null)}
                >
                  <option value="">Choose a job profile...</option>
                  {jobProfiles.map(j => <option key={j.id} value={j.id}>{j.title} — {j.department}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="font-semibold text-foreground mb-3">About this assessment</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Rate each statement on a scale from Strongly Disagree to Strongly Agree</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>There are no right or wrong answers — be honest</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Based on the Big Five (OCEAN) personality model</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Your score will be matched against the ideal profile for your role</li>
              </ul>
            </div>

            <Button
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90"
              disabled={!selectedJob}
              onClick={() => setStep("test")}
            >
              Start Assessment
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- TEST SCREEN ---
  const q = questions[current];
  const isLast = current === total - 1;

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      <nav className="bg-white border-b border-border px-6 md:px-10 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="font-bold text-lg text-primary">QuantaHire</span>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted rounded-xl px-3 py-1.5">
          <Clock className="w-3.5 h-3.5" />
          ~5 min
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 space-y-5">
        {/* Progress */}
        <div className="bg-white border border-border rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Progress — <span className="text-primary">{selectedJob?.title}</span></span>
            <span className="text-muted-foreground">{answered} / {total} answered</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground pt-0.5">
            {TRAITS.map(t => (
              <span key={t} className="capitalize">{t.slice(0, 3)}</span>
            ))}
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-6">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">
              Question {current + 1} of {total} · <span className="capitalize">{q?.trait}</span>
            </p>
            <h2 className="text-lg font-semibold text-foreground leading-snug">{q?.text}</h2>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {LIKERT.map(({ value, label }) => {
              const selected = answers[q?.id] === value;
              return (
                <button
                  key={value}
                  onClick={() => handleSelect(value)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border text-xs font-medium transition-all ${
                    selected
                      ? "border-primary bg-accent text-primary shadow-sm"
                      : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:bg-accent/40"
                  }`}
                >
                  <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold ${selected ? "border-primary bg-primary text-white" : "border-border text-muted-foreground"}`}>
                    {value}
                  </span>
                  <span className="text-center leading-tight hidden sm:block">{label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between pt-1">
            <Button variant="outline" className="rounded-xl gap-2" disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>
              <ArrowLeft className="w-4 h-4" /> Previous
            </Button>
            {isLast ? (
              <Button
                className="rounded-xl gap-2 bg-primary hover:bg-primary/90"
                disabled={!canSubmit || submitting}
                onClick={handleSubmit}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Submit
              </Button>
            ) : (
              <Button
                className="rounded-xl gap-2 bg-primary hover:bg-primary/90"
                disabled={answers[q?.id] == null}
                onClick={() => setCurrent(c => c + 1)}
              >
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}