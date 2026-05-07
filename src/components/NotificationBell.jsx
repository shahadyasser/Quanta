import React, { useState, useEffect, useRef } from "react";
import { Bell, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function scoreColor(score) {
  if (!score) return "text-muted-foreground";
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
}

export default function NotificationBell({ recruiterEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const apps = await base44.entities.Application.filter({ is_viewed: false });
      
      if (!apps || apps.length === 0) {
        setNotifications([]);
        return;
      }

      const filtered = recruiterEmail 
        ? apps.filter(a => a.recruiter_email === recruiterEmail)
        : apps;

      const notifs = filtered.map(a => ({
        id: a.id,
        job_id: a.job_id,
        candidate_name: a.candidate_name,
        candidate_email: a.candidate_email,
        match_score: a.match_score,
        applied_at: a.created_date,
        job_title: a.job_title
      }));

      notifs.sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at));
      setNotifications(notifs.slice(0, 30));
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setNotifications([]);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [recruiterEmail]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markViewed = async (notif) => {
    try {
      await base44.entities.Application.update(notif.id, { is_viewed: true });
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      setOpen(false);
      navigate(`/view-candidates?job_id=${notif.job_id}&job=${encodeURIComponent(notif.job_title || "")}`);
    } catch (err) {
      console.error("Failed to mark as viewed:", err);
    }
  };

  const markAllRead = async () => {
    try {
      for (const notif of notifications) {
        await base44.entities.Application.update(notif.id, { is_viewed: true });
      }
      setNotifications([]);
      setOpen(false);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const count = notifications.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 rounded-lg hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-primary" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="font-semibold text-sm text-foreground">New Applications</p>
            {count > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline font-medium">
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          {count === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markViewed(n)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-primary font-bold text-sm">
                      {(n.candidate_name || n.candidate_email || "?")[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{n.candidate_name || n.candidate_email}</p>
                    <p className="text-xs text-muted-foreground truncate">{n.job_title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {n.match_score ? (
                        <span className={`text-xs font-semibold ${scoreColor(n.match_score)}`}>
                          {n.match_score}% match
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Score pending</span>
                      )}
                      <span className="text-xs text-muted-foreground">· {timeAgo(n.applied_at)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}