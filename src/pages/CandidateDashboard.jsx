import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, ClipboardList, Briefcase, Loader2, Bell, CheckCircle, XCircle } from "lucide-react";
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
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]); // { id, job_title, status }
  const prevStatusesRef = useRef({});

  // Dismiss an alert
  const dismissAlert = (id) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  // Upsert candidate record
  const upsertCandidate = async (me, apps) => {
    const existing = await base44.entities.Candidate.filter({ email: me.email });
    const accepted = apps.filter(a => a.status === "shortlisted").length;
    const rejected = apps.filter(a => a.status === "rejected").length;
    const data = {
      email: me.email,
      full_name: me.full_name || "",
      user_id: me.id,
      total_applications: apps.length,
      accepted_count: accepted,
      rejected_count: rejected,
    };
    if (existing.length > 0) {
      await base44.entities.Candidate.update(existing[0].id, data);
      return existing[0];
    } else {
      return await base44.entities.Candidate.create(data);
    }
  };

  // Check for new status changes and create alerts
  const checkForAlerts = (apps) => {
    const newAlerts = [];
    apps.forEach((app) => {
      const prev = prevStatusesRef.current[app.id];
      const curr = app.status;
      if (prev !== undefined && prev !== curr) {
        if (curr === "shortlisted" || curr === "rejected") {
          newAlerts.push({ id: app.id, job_title: app.job_title, company: app.company, status: curr });
        }
      }
      prevStatusesRef.current[app.id] = curr;
    });
    if (newAlerts.length > 0) {
      setAlerts((prev) => [...prev, ...newAlerts]);
    }
  };

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
        // Initialize prev statuses on first load (no alerts)
        apps.forEach(a => { prevStatusesRef.current[a.id] = a.status; });
        setApplications(apps);
        const rec = await upsertCandidate(me, apps);
        setCandidate(rec);
      }
      setLoading(false);
    };
    init();
  }, []);

  // Real-time subscription for application status changes
  useEffect(() => {
    if (!user?.email) return;
    const unsubscribe = base44.entities.Application.subscribe((event) => {
      if (event.type === "update" && event.data?.candidate_email === user.email) {
        setApplications((prev) => {
          const updated = prev.map(a => a.id === event.id ? event.data : a);
          checkForAlerts(updated);
          // Update candidate counts
          const accepted = updated.filter(a => a.status === "shortlisted").length;
          const rejected = updated.filter(a => a.status === "rejected").length;
          setCandidate(c => c ? { ...c, total_applications: updated.length, accepted_count: accepted, rejected_count: rejected } : c);
          return updated;
        });
      }
      if (event.type === "create" && event.data?.candidate_email === user.email) {
        setApplications((prev) => {
          const updated = [event.data, ...prev];
          prevStatusesRef.current[event.id] = event.data.status;
          setCandidate(c => c ? { ...c, total_applications: updated.length } : c);
          return updated;
        });
      }
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
          {alerts.map((alert) => (
            <div
              key={alert.id + alert.status}
              className={`flex items-start gap-3 rounded-2xl shadow-lg p-4 border ${
                alert.status === "shortlisted"
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              {alert.status === "shortlisted" ? (
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${alert.status === "shortlisted" ? "text-green-700" : "text-red-600"}`}>
                  {alert.status === "shortlisted" ? "🎉 Congratulations!" : "Application Update"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your application for <strong>{alert.job_title}</strong> at <strong>{alert.company}</strong>{" "}
                  {alert.status === "shortlisted" ? "has been accepted!" : "was not selected."}
                </p>
              </div>
              <button onClick={() => dismissAlert(alert.id)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
            </div>
          ))}
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-white border-b border-border px-6 md:px-10 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="font-bold text-lg text-primary">QuantaHire</span>
        <div className="flex items-center gap-3">
          {alerts.length > 0 && (
            <div className="relative">
              <Bell className="w-5 h-5 text-primary" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{alerts.length}</span>
            </div>
          )}
          <span className="text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-medium hidden sm:block">
            {user?.email || ""}
          </span>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={() => base44.auth.logout("/")}>
            <LogOut className="w-4 h-4" />
            Logout
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
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-border rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-foreground">{candidate?.total_applications ?? applications.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Applications</p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-green-600">{candidate?.accepted_count ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Accepted</p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-orange-500">{applications.filter(a => a.status === "pending" || a.status === "processed").length}</p>
            <p className="text-sm text-muted-foreground mt-1">Pending</p>
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
            <p className="text-sm text-muted-foreground">All jobs you have applied to</p>
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
                    className={`bg-white border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      app.status === "shortlisted" ? "border-green-200 bg-green-50/30" :
                      app.status === "rejected" ? "border-red-100" : "border-border"
                    }`}
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
                        <p className="text-xs text-muted-foreground mt-1">
                          Applied on {new Date(app.created_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </p>
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
                    <div className="flex items-center gap-3 shrink-0">
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