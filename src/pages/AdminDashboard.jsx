import React from "react";
import { Link } from "react-router-dom";
import { LogOut, BarChart2, Clock, Briefcase, Users, UserCheck, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TOP_STATS = [
  { label: "Total Recruiters", value: "47", sub: "+5 this month", icon: Users },
  { label: "Active Recruiters", value: "42", sub: "89% of total", icon: UserCheck },
  { label: "Pending Approvals", value: "3", sub: "Require attention", icon: AlertCircle, highlight: true },
];

const BOTTOM_STATS = [
  { label: "Active Job Listings", value: "156", sub: "Posted by approved recruiters", icon: Briefcase },
  { label: "Total Applications", value: "892", sub: "+12% this week", icon: BarChart2 },
  { label: "Avg Response Time", value: "2.3 hours", sub: "Admin approval time", icon: Clock },
];

const PENDING = [
  { company: "TechCorp Solutions", email: "hr@techcorp.com", name: "Sarah Mitchell", location: "New York, USA", date: "12/15/2024", type: "Self-registration" },
  { company: "Innovation Labs Inc", email: "talent@innovationlabs.com", name: "Michael Chen", location: "San Francisco, USA", date: "12/14/2024", type: "Self-registration" },
  { company: "Global Finance Corp", email: "recruitment@globalfinance.com", name: "Emma Thompson", location: "London, UK", date: "12/13/2024", type: "Self-registration" },
];

function StatCard({ label, value, sub, icon: Icon, highlight }) {
  return (
    <div className={`bg-white border rounded-2xl p-5 space-y-3 ${highlight ? "border-orange-200" : "border-border"}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${highlight ? "bg-orange-50" : "bg-accent"}`}>
          <Icon className={`w-4 h-4 ${highlight ? "text-orange-500" : "text-primary"}`} />
        </div>
      </div>
      <p className={`text-3xl font-bold ${highlight ? "text-orange-500" : "text-foreground"}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Navbar */}
      <nav className="bg-white border-b border-border px-6 md:px-10 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="font-bold text-lg text-primary">QuantaHire Admin</span>
        <div className="flex items-center gap-3">
          <span className="text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-medium hidden sm:block">
            admin@quantahire.com
          </span>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" asChild>
            <Link to="/">
              <LogOut className="w-4 h-4" />
              Logout
            </Link>
          </Button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
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

        {/* Recruiter Management */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-foreground text-lg">Recruiter Management</h2>
            </div>
            <Button variant="outline" className="rounded-xl gap-2 text-sm self-start" asChild>
              <Link to="/recruiter-management">
                <Users className="w-4 h-4" />
                Recruiter Management
              </Link>
            </Button>
          </div>

          {/* Pending section */}
          <div className="border border-orange-200 bg-orange-50/50 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <p className="font-semibold text-foreground text-sm">Pending Recruiter Requests</p>
              <Badge className="bg-orange-100 text-orange-600 border-orange-200 text-xs">{PENDING.length} pending</Badge>
              <p className="text-xs text-muted-foreground ml-1">Recruiter registrations awaiting approval</p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    {["Company Name", "Email", "Recruiter Name", "Location", "Registration Date", "Type", "Action"].map((h) => (
                      <th key={h} className="pb-3 pr-4 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {PENDING.map((r) => (
                    <tr key={r.email} className="text-sm">
                      <td className="py-3 pr-4 font-medium text-foreground whitespace-nowrap">{r.company}</td>
                      <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">{r.email}</td>
                      <td className="py-3 pr-4 text-foreground whitespace-nowrap">{r.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">{r.location}</td>
                      <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">{r.date}</td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-xs">{r.type}</Badge>
                      </td>
                      <td className="py-3">
                        <Button size="sm" className="rounded-lg bg-primary hover:bg-primary/90 text-white text-xs h-8 px-3">
                          Review
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
    </div>
  );
}