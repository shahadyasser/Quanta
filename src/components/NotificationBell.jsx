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
    if (recruiterEmail) {
      // For recruiters: show unviewed applications for their jobs
      const all = await base44.entities.Application.filter({ recruiter_email: recruiterEmail, is_viewed: false }, "-created_date", 30);
      setNotifications(all);
    } else {
      // For admin: show all unviewed processed applications
      const all = await base44.entities.Application.filter({ is_viewed: false }, "-created_date", 30);
      setNotifications(all);
    }
  };

  useEffect(() => {
    load();
    // Real-time updates
    const unsub = base44.entities.Application.subscribe((event) => {
      if (event.type === "create" || event.type === "update") {
        load();
      }
      if (event.type === "delete") {
        setNotifications((prev) => prev.filter((n) => n.id !== event.id));
      }
    });
    return () => unsub();
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
    await base44.entities.Application.update(notif.id, { is_viewed: true });
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    setOpen(false);
    navigate(`/view-candidates?job_id=${notif.job_id}&job=${encodeURIComponent(notif.job_title || "")}`);
  };

  const markAllRead = async () => {
    await Promise.all(notifications.map((n) => base44.entities.Application.update(n.id, { is_viewed: true })));
    setNotifications([]);
    setOpen(false);
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
                      <span className="text-xs text-muted-foreground">· {timeAgo(n.created_date)}</span>
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