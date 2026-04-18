import React from "react";
import { TrendingUp } from "lucide-react";

export default function StatsCard({ label, value, change, positive = true }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <span className={`text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full ${positive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
          <TrendingUp className="w-3 h-3" />
          {change}
        </span>
      </div>
      <div className="text-4xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{positive ? "↑" : "↓"} {change} from last week</div>
    </div>
  );
}