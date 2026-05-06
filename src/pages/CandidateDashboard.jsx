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
      const authed = await base44.auth.isAuthenticated();
      if (!authed) {
        base44.auth.redirectToLogin("/candidate-dashboard");
        return;
      }
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
                    className="bg-white border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-base">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-foreground">{app.job_title || "Job"}</h3>
                          <Badge className={`text-xs ${STATUS_STYLES[statusLabel] || "bg-muted text-muted-foreground"}`}>{statusLabel}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">{app.company || "Company"}</p>
                        <p className="text-xs text-muted-foreground mt-1">Applied on {new Date(app.created_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                        {(app.skills || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(app.skills || []).slice(0, 4).map((s) => (
                              <span key={s} className="text-xs bg-accent text-primary px-2 py-0.5 rounded-md">{s}</span>
                            ))}
                            {app.skills.length > 4 && <span className="text-xs text-muted-foreground">+{app.skills.length - 4} more</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 shrink-0">
                      {app.match_score ? (
                        <div className="text-center">
                          <p className={`text-2xl font-bold ${app.match_score >= 80 ? "text-green-600" : app.match_score >= 60 ? "text-orange-500" : "text-muted-foreground"}`}>
                            {app.match_score}
                          </p>
                          <p className="text-xs text-muted-foreground">Match Score</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground italic">Analyzing...</p>
                        </div>
                      )}
                      {app.cv_url && (
                        <a href={app.cv_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-accent transition-colors">
                          View CV
                        </a>
                      )}
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