import { Loader2 } from "lucide-react";

export default function AgenticProgressModal({ candidateCount, round }) {
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

        <p className="text-primary font-semibold text-base">
          Analyzing {candidateCount} candidate{candidateCount !== 1 ? "s" : ""}…
        </p>

        {/* Animated indeterminate bar */}
        <div className="w-full h-3 bg-orange-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full animate-pulse"
            style={{ width: "60%", animation: "agenticBar 1.6s ease-in-out infinite" }}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          The AI is comparing all candidates holistically. This may take a moment.
        </p>
      </div>

      <style>{`
        @keyframes agenticBar {
          0%   { width: 10%; margin-left: 0%; }
          50%  { width: 50%; margin-left: 30%; }
          100% { width: 10%; margin-left: 90%; }
        }
      `}</style>
    </div>
  );
}