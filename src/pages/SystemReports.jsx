import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, Briefcase, FileText, UserCheck, Loader2 } from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { base44 } from "@/api/base44Client";

const STATUS_COLORS = {
  pending: "#A78BFA",
  processed: "#60A5FA",
  shortlisted: "#34D399",
  accepted: "#10B981",
  interview: "#FBBF24",
  rejected: "#F87171",
};

const STATUS_LABELS = {
  pending: "Pending",
  processed: "Under Review",
  shortlisted: "Shortlisted",
  accepted: "Accepted",
  interview: "Interview",
  rejected: "Rejected",
};

function groupByMonth(items, dateField = "created_date") {
  const counts = {};
  items.forEach(item => {
    const d = new Date(item[dateField]);
    if (!isNaN(d)) {
      const key = d.toLocaleString("en-US", { month: "short" });
      counts[key] = (counts[key] || 0) + 1;
    }
  });
  const monthOrder = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const months = Object.keys(counts).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
  return months.slice(-6).map(m => ({ month: m, value: counts[m] }));
}

export default function SystemReports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ recruiters: 0, jobs: 0, applications: 0, candidates: 0 });
  const [recruiterGrowth, setRecruiterGrowth] = useState([]);
  const [jobTrend, setJobTrend] = useState([]);
  const [pieData, setPieData] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [recruiters, jobs, applications, candidates] = await Promise.all([
        base44.entities.RecruiterProfile.list(),
        base44.entities.Job.list(),
        base44.entities.Application.list(),
        base44.entities.Candidate.list(),
      ]);

      setStats({
        recruiters: recruiters.length,
        jobs: jobs.length,
        applications: applications.length,
        candidates: candidates.length,
      });

      setRecruiterGrowth(groupByMonth(recruiters));
      setJobTrend(groupByMonth(jobs));

      // Status distribution
      const statusCounts = {};
      applications.forEach(a => {
        const s = a.status || "pending";
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });
      setPieData(
        Object.entries(statusCounts).map(([status, value]) => ({
          name: STATUS_LABELS[status] || status,
          value,
          color: STATUS_COLORS[status] || "#9CA3AF",
        }))
      );

      setLoading(false);
    };
    load();
  }, []);

  const STAT_CARDS = [
    { label: "Total Recruiters", value: stats.recruiters, icon: Users },
    { label: "Total Jobs Posted", value: stats.jobs, icon: Briefcase },
    { label: "Total Applications", value: stats.applications, icon: FileText },
    { label: "Total Candidates", value: stats.candidates, icon: UserCheck },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      <nav className="bg-white border-b border-border px-6 md:px-10 py-3 flex items-center sticky top-0 z-10">
        <span className="font-bold text-lg text-primary">QuantaHire Admin</span>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <Link
          to="/admin-dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-foreground">System Reports</h1>
          <p className="text-muted-foreground mt-1">Live platform statistics and analytics</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground font-medium">{label}</p>
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-border rounded-2xl p-6">
            <h2 className="font-semibold text-foreground mb-1">Recruiter Registrations</h2>
            <p className="text-sm text-muted-foreground mb-5">By month (last 6 months)</p>
            {recruiterGrowth.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={recruiterGrowth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px" }} />
                  <Bar dataKey="value" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Recruiters" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white border border-border rounded-2xl p-6">
            <h2 className="font-semibold text-foreground mb-1">Job Postings Trend</h2>
            <p className="text-sm text-muted-foreground mb-5">By month (last 6 months)</p>
            {jobTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={jobTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px" }} />
                  <Bar dataKey="value" fill="#A78BFA" radius={[4, 4, 0, 0]} name="Job Postings" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Application Status Distribution */}
        <div className="bg-white border border-border rounded-2xl p-6">
          <h2 className="font-semibold text-foreground mb-1">Application Status Distribution</h2>
          <p className="text-sm text-muted-foreground mb-6">Current status of all applications in the system</p>
          {pieData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No applications yet</p>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="space-y-3 min-w-[180px]">
                {pieData.map(({ name, value, color }) => (
                  <div key={name} className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-sm text-muted-foreground">{name}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex-1 flex justify-center">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map(({ name, color }) => (
                        <Cell key={name} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px" }}
                      formatter={(value, name) => {
                        const total = pieData.reduce((s, d) => s + d.value, 0);
                        return [`${value} (${Math.round((value / total) * 100)}%)`, name];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3 min-w-[120px]">
                {pieData.map(({ name, value, color }) => {
                  const total = pieData.reduce((s, d) => s + d.value, 0);
                  return (
                    <div key={name} className="flex items-center justify-end">
                      <span className="text-sm font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>
                        {Math.round((value / total) * 100)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}