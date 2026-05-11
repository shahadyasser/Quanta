import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ClipboardList, Briefcase, Loader2, Bell, CheckCircle, XCircle, X } from "lucide-react";
import AccountDropdown from "@/components/AccountDropdown";
import InterviewInvites from "@/components/candidate/InterviewInvites";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

import CandidateEmailGate from "@/components/CandidateEmailGate";

const QUICK_ACTIONS = [
  { icon: ClipboardList, label: "Take Assessment", description: "Complete your psychometric test", href: "/assessment" },
  { icon: Briefcase, label: "Browse Jobs", description: "Find jobs and apply with your CV", href: "/browse-jobs" },
];

const STATUS_LABEL = {
  pending: "Submitted",
  processed: "Under Review",
  shortlisted: "Accepted",
  rejected: "Rejected",
};

const STATUS_STYLES = {
  "Submitted": "bg-blue-50 text-blue-600 border-blue-200",
  "Under Review": "bg-orange-50 text-orange-500 border-orange-200",
  "Accepted": "bg-green-50 text-green-600 border-green-200",
  "Rejected": "bg-red-50 text-red-500 border-red-200",
};

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);
  const [alerts, setAlerts] = useState([]); // { id, job_title, status }
  const [showNotifications, setShowNotifications] = useState(false);
  const [invites, setInvites] = useState([]);
  const [emailVerified, setEmailVerified] = useState(false);
  const prevStatusesRef = useRef({});
  const bellRef = useRef(null);

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
      const candidateEmail = (localStorage.getItem("candidateEmail") || "").trim().toLowerCase();
      const candidateId = localStorage.getItem("candidateId");
      if (!candidateEmail || !candidateId) {
        navigate("/candidate-auth");
        setChecking(false);
        return;
      }
      setEmailVerified(true);

      // My Applications: fetch from Base44
      const [apps, interviewSlots] = await Promise.all([
        base44.entities.Application.filter({ candidate_email: candidateEmail }, "-created_date"),
        base44.entities.InterviewSlot.filter({ candidate_email: candidateEmail }, "-created_date"),
      ]);
      setInvites(interviewSlots);

      const userObj = { email: candidateEmail, id: candidateId, full_name: apps[0]?.candidate_name || candidateEmail };
      setUser(userObj);
      // Fetch candidate profile for account dropdown
      const profiles = await base44.entities.CandidateProfile.filter({ email: candidateEmail });
      if (profiles && profiles.length > 0) setProfile(profiles[0]);

      // Initialize prev statuses on first load (no alerts)
      (apps || []).forEach(a => { prevStatusesRef.current[a.id] = a.status; });
      setApplications(apps || []);

      const accepted = (apps || []).filter(a => a.status === "shortlisted" || a.status === "accepted").length;
      const rejected = (apps || []).filter(a => a.status === "rejected").length;
      setCandidate({ email: candidateEmail, full_name: apps[0]?.candidate_name || "", total_applications: (apps || []).length, accepted_count: accepted, rejected_count: rejected });

      setLoading(false);
      setChecking(false);
    };
    init();
  }, [navigate]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Real-time subscription for application status changes
  useEffect(() => {
    if (!user?.email) return;
    const unsubscribe = base44.entities.Application.subscribe((event) => {
      if (event.type === "update" && event.data?.candidate_email === user.email) {
        setApplications((prev) => {
          const updated = prev.map(a => a.id === event.id ? event.data : a);
          checkForAlerts(updated);
          setCandidate({ email: user.email, total_applications: updated.length, accepted_count: updated.filter(a => a.status === "shortlisted").length, rejected_count: updated.filter(a => a.status === "rejected").length });
          return updated;
        });
      }
      if (event.type === "create" && event.data?.candidate_email === user.email) {
        setApplications((prev) => {
          const updated = [event.data, ...prev];
          prevStatusesRef.current[event.id] = event.data.status;
          setCandidate({ email: user.email, total_applications: updated.length, accepted_count: updated.filter(a => a.status === "shortlisted").length, rejected_count: updated.filter(a => a.status === "rejected").length });
          return updated;
        });
      }
    });
    return () => unsubscribe();
  }, [user]);



  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Navbar */}
      <nav className="bg-white border-b border-border px-6 md:px-10 py-3 flex items-center justify-between sticky top-0 z-10 h-16 shrink-0">
        <span className="font-bold text-lg text-primary">QuantaHire</span>
        <div className="flex items-center gap-3">
          {/* Bell with notification dropdown */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="relative p-1.5 rounded-lg hover:bg-accent transition-colors"
            >
              <Bell className="w-5 h-5 text-primary" />
              {alerts.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-10 w-80 bg-white border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <p className="font-semibold text-sm text-foreground">Notifications</p>
                  {alerts.length > 0 && (
                    <button onClick={() => setAlerts([])} className="text-xs text-muted-foreground hover:text-foreground">
                      Clear all
                    </button>
                  )}
                </div>
                {alerts.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">No new notifications</div>
                ) : (
                  <div className="max-h-72 overflow-y-auto divide-y divide-border">
                    {alerts.map((alert) => (
                      <div key={alert.id + alert.status} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                        {alert.status === "shortlisted" ? (
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${alert.status === "shortlisted" ? "text-green-700" : "text-red-600"}`}>
                            {alert.status === "shortlisted" ? "🎉 Application Accepted!" : "Application Update"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            <strong>{alert.job_title}</strong> at <strong>{alert.company}</strong> —{" "}
                            {alert.status === "shortlisted" ? "you've been shortlisted!" : "not selected this time."}
                          </p>
                        </div>
                        <button onClick={() => dismissAlert(alert.id)} className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <AccountDropdown
            user={user}
            profile={profile}
            onLogout={() => { localStorage.removeItem("candidateEmail"); localStorage.removeItem("candidateId"); window.location.href = "/"; }}
          />
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <p className="text-sm text-muted-foreground mt-1">In Review</p>
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

        {/* Interview Invitations */}
        {invites.length > 0 && (
          <InterviewInvites
            invites={invites}
            onUpdate={async () => {
              const updated = await base44.entities.InterviewSlot.filter({ candidate_email: user.email }, "-created_date");
              setInvites(updated);
            }}
          />
        )}

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