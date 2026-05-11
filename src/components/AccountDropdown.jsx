import React, { useState, useRef, useEffect } from "react";
import { LogOut, User, Mail, Building2, Phone, ChevronDown } from "lucide-react";

export default function AccountDropdown({ user, profile, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = (user?.full_name || user?.email || "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-xl transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
          {initials}
        </div>
        <span className="text-sm font-medium hidden sm:block max-w-[140px] truncate">
          {user?.full_name || user?.email || "Account"}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-72 bg-white border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-4 bg-gradient-to-br from-primary/5 to-primary/10 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{user?.full_name || "—"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || "—"}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="px-4 py-3 space-y-2.5">
            {user?.email && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0 text-primary" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
            {profile?.phone && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0 text-primary" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile?.company && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Building2 className="w-4 h-4 shrink-0 text-primary" />
                <span className="truncate">{profile.company}</span>
              </div>
            )}
            {profile?.role && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <User className="w-4 h-4 shrink-0 text-primary" />
                <span className="capitalize">{profile.role}</span>
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="px-4 py-3 border-t border-border">
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}