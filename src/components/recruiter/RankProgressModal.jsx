import React from "react";
import { Loader2 } from "lucide-react";

export default function RankProgressModal({ progress }) {
  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Processing CVs</h2>
            <p className="text-sm text-muted-foreground mt-2">
              {progress.current} of {progress.total}
            </p>
            <p className="text-sm font-medium text-primary mt-1">Processing CV {progress.current} of {progress.total}</p>
          </div>

          <div className="space-y-3">
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center font-medium">{percentage}% Complete</p>
          </div>

          <p className="text-xs text-muted-foreground text-center">This may take a few minutes. Please don't close this window.</p>
        </div>
      </div>
    </>
  );
}