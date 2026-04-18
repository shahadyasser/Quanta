import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUESTIONS = [
  {
    question: "When working on a team project, I prefer to:",
    options: [
      "Take the lead and organize the work",
      "Contribute ideas and support others",
      "Focus on completing my assigned tasks",
      "Help resolve conflicts and maintain harmony",
    ],
  },
  {
    question: "When faced with a tight deadline, I typically:",
    options: [
      "Create a detailed plan and stick to it",
      "Prioritize the most critical tasks first",
      "Ask for help to get things done faster",
      "Stay calm and work steadily through it",
    ],
  },
  {
    question: "My ideal work environment is one where:",
    options: [
      "There is clear structure and defined processes",
      "I have the freedom to be creative and innovative",
      "Collaboration and teamwork are emphasized",
      "I can work independently at my own pace",
    ],
  },
  {
    question: "When receiving feedback on my work, I usually:",
    options: [
      "Welcome it and immediately look for ways to improve",
      "Reflect on it before deciding how to apply it",
      "Appreciate positive feedback most",
      "Prefer detailed, actionable suggestions",
    ],
  },
  {
    question: "When making important decisions, I tend to:",
    options: [
      "Rely on data and logical analysis",
      "Trust my instincts and experience",
      "Seek input from others before deciding",
      "Weigh all options carefully before committing",
    ],
  },
];

export default function Assessment() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});

  const total = QUESTIONS.length;
  const answered = Object.keys(answers).length;
  const progress = (answered / total) * 100;

  const handleSelect = (option) => {
    setAnswers((prev) => ({ ...prev, [current]: option }));
  };

  const canNext = answers[current] !== undefined;

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Navbar */}
      <nav className="bg-white border-b border-border px-6 md:px-10 py-3 flex items-center sticky top-0 z-10">
        <span className="font-bold text-lg text-primary">QuantaHire</span>
      </nav>

      <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Back */}
        <Link
          to="/candidate-dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Psychometric Assessment</h1>
            <p className="text-muted-foreground mt-1">Help us understand your work style and preferences</p>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-white border border-border rounded-xl px-3 py-2 shrink-0">
            <Clock className="w-4 h-4" />
            ~10 minutes
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white border border-border rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Progress</span>
            <span className="text-muted-foreground">{answered} of {total} questions</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">
              Question {current + 1} of {total}
            </p>
            <h2 className="text-lg font-semibold text-foreground">{QUESTIONS[current].question}</h2>
            <p className="text-sm text-muted-foreground mt-1">Select the option that best describes you</p>
          </div>

          <div className="space-y-3">
            {QUESTIONS[current].options.map((option) => {
              const selected = answers[current] === option;
              return (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-4 py-4 rounded-xl border text-sm font-medium transition-all ${
                    selected
                      ? "border-primary bg-accent text-primary"
                      : "border-border bg-white text-foreground hover:border-primary/40 hover:bg-accent/50"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              className="rounded-xl gap-2"
              disabled={current === 0}
              onClick={() => setCurrent((c) => c - 1)}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              className="rounded-xl gap-2 bg-primary hover:bg-primary/90"
              disabled={!canNext}
              onClick={() => current < total - 1 && setCurrent((c) => c + 1)}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-2">About this Assessment</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This psychometric test helps evaluate your work style, personality traits, and cultural fit.
            There are no right or wrong answers — just be honest and select what feels most natural to you.
          </p>
        </div>
      </div>
    </div>
  );
}