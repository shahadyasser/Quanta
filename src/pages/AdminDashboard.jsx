import React from "react";
import { Link } from "react-router-dom";
import { LogOut, Clock, Briefcase, Users, UserCheck, AlertCircle, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TOP_STATS = [
  {
    label: "Total Recruiters",
    value: "47",
    sub: "+5 this month",
    subGreen: true,
    icon: Users,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    borderColor: "border-l-primary",
  },
  {
    label: "Active Recruiters",
    value: "42",
    sub: "89% of total",
    icon: UserCheck,
    iconColor: "text-green-500",
    iconBg: "bg-green-50",
    borderColor: "border-l-green-500",
  },
  {
    label: "Pending Approvals",
    value: "3",
    sub: "Require attention",
    subOrange: true,
    icon: Clock,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-50",
    borderColor: "border-l-orange-500",
  },
];

const BOTTOM_STATS = [
  {
    label: "Active Job Listings",
    value: "156",
    sub: "Posted by approved recruiters",
    icon: Briefcase,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    borderColor: "border-l-blue-500",
  },
  {
    label: "Total Applications",
    value: "892",
    sub: "+12% this week",
    subGreen: true,
    icon: FileText,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    borderColor: "border-l-primary",
  },
  {
    label: "Avg Response Time",
    value: "2.3 hours",
    sub: "Admin approval time",
    icon: Clock,
    iconColor: "text-teal-500",
    iconBg: "bg-teal-50",
    borderColor: "border-l-teal-500",
  },
];

const PENDING = [
  { company: "TechCorp Solutions", email: "hr@techcorp.com", name: "Sarah Mitchell", location: "New York, USA", date: "12/15/2024", type: "Self-registration" },
  { company: "Innovation Labs Inc", email: "talent@innovationlabs.com", name: "Michael Chen", location: "San Francisco, USA", date: "12/14/2024", type: "Self-registration" },
  { company: "Global Finance Corp", email: "recruitment@globalfinance.com", name: "Emma Thompson", location: "London, UK", date: "12/13/2024", type: "Self-registration" },
];

function StatCard({ label, value, sub, subGreen, subOrange, icon: Icon, iconColor, iconBg, borderColor }) {
  return (
    <div className={`bg-white border border-border border-l-4 ${borderColor} rounded-2xl p-5 space-y-3`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      <p className="text-4xl font-bold text-foreground">{value}</p>
      <p className={`text-xs font-medium ${subOrange ? "text-orange-500" : subGreen ? "text-green-500" : "text-muted-foreground"}`}>
        {subGreen && "↗ "}{sub}
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#F4F3FF]">
      {/* Navbar */}
      <nav className="bg-white border-b border-border px-6 md:px-10 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground leading-none">QuantaHire Admin</p>
            <p className="text-xs text-muted-foreground">admin@quantahire.com</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" asChild>
          <Link to="/">
            <LogOut className="w-4 h-4" />
            Logout
          </Link>
        </Button>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage recruiters, monitor system activity, and review registrations</p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TOP_STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {BOTTOM_STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button className="bg-primary hover:bg-primary/90 rounded-xl gap-2 h-11 px-5" asChild>
            <Link to="/recruiter-management">
              <Users className="w-4 h-4" />
              Recruiter Management
            </Link>
          </Button>
          <Button variant="outline" className="rounded-xl gap-2 h-11 px-5" asChild>
            <Link to="/system-reports">
              <FileText className="w-4 h-4" />
              View Reports
            </Link>
          </Button>
        </div>

        {/* Pending Recruiter Requests */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <h2 className="font-semibold text-foreground">Pending Recruiter Requests</h2>
                <p className="text-sm text-muted-foreground">Recruiter registrations awaiting approval</p>
              </div>
            </div>
            <span className="bg-muted text-foreground text-sm font-semibold px-3 py-1 rounded-lg">{PENDING.length} pending</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  {["Company Name", "Email", "Recruiter Name", "Location", "Registration Date", "Type", "Action"].map((h) => (
                    <th key={h} className="pb-3 pr-6 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {PENDING.map((r) => (
                  <tr key={r.email}>
                    <td className="py-4 pr-6 font-medium text-foreground whitespace-nowrap">{r.company}</td>
                    <td className="py-4 pr-6 text-muted-foreground whitespace-nowrap">{r.email}</td>
                    <td className="py-4 pr-6 text-foreground whitespace-nowrap">{r.name}</td>
                    <td className="py-4 pr-6 text-muted-foreground whitespace-nowrap">{r.location}</td>
                    <td className="py-4 pr-6 text-muted-foreground whitespace-nowrap">{r.date}</td>
                    <td className="py-4 pr-6 whitespace-nowrap">
                      <span className="text-foreground font-medium">{r.type}</span>
                    </td>
                    <td className="py-4">
                      <Button size="sm" className="rounded-lg bg-foreground hover:bg-foreground/80 text-white text-xs h-8 px-4" asChild>
                        <Link to="/recruiter-approval">Review</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}