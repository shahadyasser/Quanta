import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Upload, ClipboardList, Briefcase, MessageSquare, PlayCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATS = [
  { label: "Applications", value: "8" },
  { label: "New Messages", value: "3" },
];

const QUICK_ACTIONS = [
  { icon: Upload, label: "Upload CV", description: "Update your profile with your latest CV" },
  { icon: ClipboardList, label: "Take Assessment", description: "Complete your psychometric test" },
  { icon: Briefcase, label: "Browse Jobs", description: "Find new opportunities" },
];

const APPLICATIONS = [
  {
    company: "TechCorp Inc.",
    role: "Senior Software Engineer",
    date: "Nov 8, 2025",
    status: "Under Review",
    action: null,
  },
  {
    company: "DesignHub",
    role: "Frontend Developer",
    date: "Nov 5, 2025",
    status: "Under Review",
    action: null,
  },
  {
    company: "DataSystems",
    role: "Full Stack Engineer",
    date: "Nov 3, 2025",
    status: "Application Sent",
    action: null,
  },
  {
    company: "CloudVentures",
    role: "DevOps Engineer",
    date: "Nov 1, 2025",
    status: "Feedback Available",
    action: "View Feedback",
  },
];

const STATUS_STYLES = {
  "Interview Scheduled": "bg-green-50 text-green-600 border-green-200",
  "Under Review": "bg-orange-50 text-orange-500 border-orange-200",
  "Application Sent": "bg-blue-50 text-blue-600 border-blue-200",
  "Feedback Available": "bg-purple-50 text-purple-600 border-purple-200",
};

export default function CandidateDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Navbar */}
      <nav className="bg-white border-b border-border px-6 md:px-10 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="font-bold text-lg text-primary">QuantaHire</span>
        <div className="flex items-center gap-3">
          <span className="text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-medium hidden sm:block">
            candidate@quantahire.com
          </span>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" asChild>
            <Link to="/">
              <LogOut className="w-4 h-4" />
              Logout
            </Link>
          </Button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Header */}
        <div>
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-1">Candidate Portal</p>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, John Candidate!</h1>
          <p className="text-muted-foreground mt-1">Track your job applications and status updates.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 max-w-xs">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white border border-border rounded-2xl p-5 text-center">
              <p className="text-3xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {QUICK_ACTIONS.map(({ icon: Icon, label, description }) => (
            <div
              key={label}
              className="bg-white border border-border rounded-2xl p-5 flex flex-col items-center text-center gap-3 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Applications */}
        <div>
          <div className="mb-4">
            <h2 className="font-semibold text-foreground text-lg">My Applications</h2>
            <p className="text-sm text-muted-foreground">Track the status of your job applications</p>
          </div>

          <div className="space-y-3">
            {APPLICATIONS.map((app) => (
              <div
                key={app.company}
                className="bg-white border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">{app.company[0]}</span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-foreground">{app.company}</h3>
                      <Badge className={`text-xs ${STATUS_STYLES[app.status]}`}>{app.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{app.role} • {app.date}</p>
                  </div>
                </div>

                {app.action && (
                  <Button
                    size="sm"
                    className={`rounded-xl shrink-0 gap-2 ${
                      app.action === "Start Interview"
                        ? "bg-primary hover:bg-primary/90 text-white"
                        : "border border-primary text-primary bg-transparent hover:bg-accent"
                    }`}
                    variant={app.action === "Start Interview" ? "default" : "outline"}
                  >
                    {app.action === "Start Interview" ? (
                      <PlayCircle className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    {app.action}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}