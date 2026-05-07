import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AdminAuth() {
  const handleLogin = () => {
    base44.auth.redirectToLogin("/admin-dashboard");
  };

  React.useEffect(() => {
    handleLogin();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#EEE9FF] via-[#F3EEFF] to-[#E8E0FF] gap-6">
      <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center">
        <Shield className="w-8 h-8 text-primary" strokeWidth={1.75} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-1">Admin Portal</p>
        <h1 className="text-2xl font-bold text-foreground">QuantaHire</h1>
        <p className="text-muted-foreground mt-1 text-sm">Redirecting to login…</p>
      </div>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
    </div>
  );
}