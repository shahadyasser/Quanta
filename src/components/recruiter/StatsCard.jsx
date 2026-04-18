import React from "react";
import { Users, Target, Brain, Clock } from "lucide-react";

const ICON_CONFIG = {
  "Total Applicants":        { icon: Users,  bg: "bg-blue-50",   color: "text-blue-500",   border: "border-l-purple-500" },
  "Avg. Match Score":        { icon: Target, bg: "bg-purple-50", color: "text-purple-500", border: "border-l-purple-500" },
  "AI Interviews Completed": { icon: Brain,  bg: "bg-green-50",  color: "text-green-500",  border: "border-l-purple-500" },
  "Pending Reviews":         { icon: Clock,  bg: "bg-orange-50", color: "text-orange-400", border: "border-l-purple-500" },
};

export default function StatsCard({ label, value, change, subtext }) {
  const cfg = ICON_CONFIG[label] || { icon: Users, bg: "bg-gray-50", color: "text-gray-400", border: "border-l-primary" };
  const Icon = cfg.icon;

  return (
    <div className={`bg-white border border-border border-l-4 ${cfg.border} rounded-2xl p-5 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${cfg.color}`} strokeWidth={1.75} />
        </div>
        <span className="text-xs font-semibold text-green-500 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7M12 3v18" />
          </svg>
          {change}
        </span>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className="text-4xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-green-500 mt-1">{subtext}</p>
      </div>
    </div>
  );
}