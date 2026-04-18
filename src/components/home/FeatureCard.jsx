import React from "react";

export default function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-primary" strokeWidth={1.75} />
      </div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}