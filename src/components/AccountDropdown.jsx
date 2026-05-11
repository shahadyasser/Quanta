import React, { useState, useRef, useEffect } from "react";
import { LogOut, User, Mail, Phone, Building2, ChevronDown, Badge as BadgeIcon } from "lucide-react";

export default function AccountDropdown({ email, fullName, phone, company, role, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = (fullName || email || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-white border border-border rounded-xl px-3 py-2 hover:bg-accent transition-colors shadow-sm"
      >
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-primary font-bold text-xs">{initials}</span>
        </div>
        <span className="text-sm font-medium text-foreground hidden sm:block max-w-[140px] truncate">
          {fullName || email}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-72 bg-white border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-4 bg-gradient-to-br from-primary/5 to-primary/10 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold text-lg">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{fullName || "—"}</p>
                <span className="inline-flex items-center text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium mt-0.5 capitalize">
                  {role || "user"}
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="px-4 py-3 space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Mail className="w-4 h-4 shrink-0 text-primary/60" />
              <span className="truncate">{email || "—"}</span>
            </div>
            {phone && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0 text-primary/60" />
                <span>{phone}</span>
              </div>
            )}
            {company && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Building2 className="w-4 h-4 shrink-0 text-primary/60" />
                <span className="truncate">{company}</span>
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="px-4 pb-3 pt-1 border-t border-border">
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl px-3 py-2.5 transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}