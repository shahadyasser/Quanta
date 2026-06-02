import { Loader2 } from "lucide-react";

export default function AgenticProgressModal({ candidateCount, round, progress = 0 }) {
  const pct = Math.round(progress);
  const done = Math.round((pct / 100) * candidateCount);
  const remaining = candidateCount - done;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md mx-4 text-center space-y-6">
        <div className="flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Agentic Re-Ranking</h2>
          <p className="text-muted-foreground text-sm">Round {round || 1}</p>
        </div>

        <p className="text-orange-500 font-semibold text-base">
          {done} of {candidateCount} analyzed — {remaining} remaining
        </p>

        {/* Progress bar */}
        <div className="w-full space-y-1">
          <div className="w-full h-3 bg-orange-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-right text-xs font-semibold text-orange-600">{pct}% Complete</p>
        </div>

        <p className="text-xs text-muted-foreground">
          The AI is comparing all candidates holistically. This may take a moment.
        </p>
      </div>


    </div>
  );
}