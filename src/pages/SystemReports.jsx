import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Users, Briefcase, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const STATS = [
  { label: "Total Recruiters", value: "47", change: "+12%", sub: "vs last month", icon: Users },
  { label: "Total Jobs Posted", value: "156", change: "+8%", sub: "vs last month", icon: Briefcase },
  { label: "Total Applications", value: "892", change: "+15%", sub: "vs last month", icon: FileText },
  { label: "Avg Time to Hire", value: "18 days", change: "-3 days", sub: "vs last month", icon: Clock },
];

const RECRUITER_DATA = [
  { month: "Jul", value: 22 },
  { month: "Aug", value: 28 },
  { month: "Sep", value: 33 },
  { month: "Oct", value: 38 },
  { month: "Nov", value: 44 },
  { month: "Dec", value: 47 },
];

const JOB_DATA = [
  { month: "Jul", value: 55 },
  { month: "Aug", value: 78 },
  { month: "Sep", value: 95 },
  { month: "Oct", value: 112 },
  { month: "Nov", value: 138 },
  { month: "Dec", value: 156 },
];

const PIE_DATA = [
  { name: "Shortlisted", value: 198, color: "#7C3AED" },
  { name: "Pending", value: 245, color: "#A78BFA" },
  { name: "Interviewed", value: 156, color: "#60A5FA" },
  { name: "Hired", value: 89, color: "#34D399" },
  { name: "Rejected", value: 204, color: "#F87171" },
];

const PERCENT_LABELS = {
  Shortlisted: "22%",
  Pending: "27%",
  Interviewed: "17%",
  Hired: "10%",
  Rejected: "23%",
};

export default function SystemReports() {
  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Navbar */}
      <nav className="bg-white border-b border-border px-6 md:px-10 py-3 flex items-center sticky top-0 z-10">
        <span className="font-bold text-lg text-primary">QuantaHire Admin</span>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Back */}
        <Link
          to="/admin-dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">System Reports</h1>
            <p className="text-muted-foreground mt-1">Recruiter usage analytics and platform statistics</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 rounded-xl gap-2 self-start">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(({ label, value, change, sub, icon: Icon }) => (
            <div key={label} className="bg-white border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground font-medium">{label}</p>
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{value}</p>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  change.startsWith("-") ? "bg-green-50 text-green-600" : "bg-green-50 text-green-600"
                }`}>{change}</span>
                <span className="text-xs text-muted-foreground">{sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recruiter Growth */}
          <div className="bg-white border border-border rounded-2xl p-6">
            <h2 className="font-semibold text-foreground mb-1">Recruiter Growth</h2>
            <p className="text-sm text-muted-foreground mb-5">Active recruiters over the last 6 months</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={RECRUITER_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="recruiterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px" }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="value" stroke="#7C3AED" strokeWidth={2} fill="url(#recruiterGrad)" name="Active Recruiters" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Job Postings Trend */}
          <div className="bg-white border border-border rounded-2xl p-6">
            <h2 className="font-semibold text-foreground mb-1">Job Postings Trend</h2>
            <p className="text-sm text-muted-foreground mb-5">Total job postings over the last 6 months</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={JOB_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px" }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="value" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Job Postings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Application Status Distribution */}
        <div className="bg-white border border-border rounded-2xl p-6">
          <h2 className="font-semibold text-foreground mb-1">Application Status Distribution</h2>
          <p className="text-sm text-muted-foreground mb-6">Current status of all applications in the system</p>
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Legend list */}
            <div className="space-y-3 min-w-[160px]">
              {PIE_DATA.map(({ name, value, color }) => (
                <div key={name} className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-sm text-muted-foreground">{name}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>

            {/* Pie */}
            <div className="flex-1 flex justify-center">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={PIE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {PIE_DATA.map(({ name, color }) => (
                      <Cell key={name} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px" }}
                    formatter={(value, name) => [`${value} (${PERCENT_LABELS[name]})`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Percent badges */}
            <div className="space-y-3 min-w-[160px]">
              {PIE_DATA.map(({ name, color }) => (
                <div key={name} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">{name}</span>
                  <span className="text-sm font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>
                    {PERCENT_LABELS[name]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}