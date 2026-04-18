import React from "react";

export default function RoleCard({ icon: Icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white border border-border rounded-2xl p-5 flex items-center gap-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
    >
      <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
        <Icon className="w-7 h-7 text-primary" strokeWidth={1.75} />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-foreground text-lg mb-0.5">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}