import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, ClipboardList, Briefcase, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

const QUICK_ACTIONS = [
  { icon: ClipboardList, label: "Take Assessment", description: "Complete your psychometric test", href: "/assessment" },
  { icon: Briefcase, label: "Browse Jobs", description: "Find jobs and apply with your CV", href: "/browse-jobs" },
];

const STATUS_LABEL = {
  pending: "In Progress",
  processed: "In Progress",
  shortlisted: "Accepted",
  rejected: "Rejected",
};

const STATUS_STYLES = {
  "In Progress": "bg-orange-50 text-orange-500 border-orange-200",
  "Accepted": "bg-green-50 text-green-600 border-green-200",
  "Rejected": "bg-red-50 text-red-500 border-red-200",
};

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      let me = null;
      try { me = await base44.auth.me(); } catch (_) {}
      setUser(me);
      if (me?.email) {
        const apps = await base44.entities.Application.filter({ candidate_email: me.email }, "-created_date");
        setApplications(apps);
      }
      setLoading(false);
    };
    init();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Navbar */}
      <nav className="bg-white border-b border-border px-6 md:px-10 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="font-bold text-lg text-primary">QuantaHire</span>
        <div className="flex items-center gap-3">
          <span className="text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-medium hidden sm:block">
            {user?.email || ""}
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
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.full_name || "Candidate"}!</h1>
          <p className="text-muted-foreground mt-1">Track your job applications and status updates.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 max-w-xs">
          <div className="bg-white border border-border rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-foreground">{applications.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Applications</p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-green-600">{applications.filter(a => a.status === "shortlisted").length}</p>
            <p className="text-sm text-muted-foreground mt-1">Accepted</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUICK_ACTIONS.map(({ icon: Icon, label, description, href }) => (
            <div
              key={label}
              onClick={() => href && navigate(href)}
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

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : applications.length === 0 ? (
            <div className="bg-white border border-border rounded-2xl p-10 text-center text-muted-foreground">
              No applications yet. Browse jobs and apply!
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const statusLabel = STATUS_LABEL[app.status] || "In Progress";
                const initials = (app.company || app.job_title || "?")[0].toUpperCase();
                return (
                  <div
                    key={app.id}
                    className="bg-white border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold">{initials}</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-foreground">{app.company || "Company"}</h3>
                          <Badge className={`text-xs ${STATUS_STYLES[statusLabel] || "bg-muted text-muted-foreground"}`}>{statusLabel}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{app.job_title} • {new Date(app.created_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}