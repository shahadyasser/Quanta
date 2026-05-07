import React from "react";
import { TrendingUp, Award, Activity, BarChart3 } from "lucide-react";

export default function RankSummaryCards({ total, processed, strongMatches }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="bg-white border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-primary" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Candidates</p>
        </div>
        <p className="text-3xl font-bold text-foreground">{total}</p>
      </div>

      <div className="bg-white border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Processed</p>
        </div>
        <p className="text-3xl font-bold text-foreground">{processed}</p>
        <p className="text-xs text-muted-foreground mt-1">{total > 0 ? Math.round((processed / total) * 100) : 0}% complete</p>
      </div>

      <div className="bg-white border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-4 h-4 text-green-600" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Strong Matches</p>
        </div>
        <p className="text-3xl font-bold text-green-600">{strongMatches}</p>
      </div>
    </div>
  );
}