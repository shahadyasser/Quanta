import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Users, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";

export default function Portal() {
  const [tab, setTab] = useState("login");
  const [role, setRole] = useState("candidate");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "", company: "" });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    const res = await base44.functions.invoke("authLogin", {
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });
    setLoading(false);
    if (res.data.error) { setError(res.data.error); return; }
    const user = res.data.user;
    localStorage.setItem("userId", user.id);
    localStorage.setItem("userEmail", user.email);
    localStorage.setItem("userRole", user.role);
    if (user.role === "recruiter") {
      localStorage.setItem("recruiterEmail", user.email);
      localStorage.setItem("recruiterId", user.id);
      navigate("/recruiter-dashboard");
    } else if (user.role === "admin") {
      localStorage.setItem("adminEmail", user.email);
      navigate("/admin-dashboard");
    } else {
      localStorage.setItem("candidateEmail", user.email);
      localStorage.setItem("candidateId", user.id);
      navigate("/candidate-dashboard");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.fullName || !form.email || !form.password || !form.confirm) { setError("Please fill in all fields."); return; }
    if (role === "recruiter" && !form.company) { setError("Company name is required for recruiters."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    const res = await base44.functions.invoke("authRegister", {
      email: form.email.trim().toLowerCase(),
      password: form.password,
      full_name: form.fullName,
      role,
      company: form.company || null,
    });
    setLoading(false);
    if (res.data.error) { setError(res.data.error); return; }
    if (role === "recruiter") {
      setSuccess("Registration submitted! Your account is pending admin approval. You'll be notified by email once approved.");
    } else {
      setSuccess("Account created! Please login.");
      setTimeout(() => { setTab("login"); setSuccess(""); }, 1800);
    }
    setForm({ fullName: "", email: "", password: "", confirm: "", company: "" });
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2">
      {/* Left — branding */}
      <div className="relative hidden lg:flex flex-col justify-between px-16 py-14 overflow-hidden bg-gradient-to-br from-[#EEE9FF] via-[#F3EEFF] to-[#E8E0FF]">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-purple-300/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-white rounded-full px-4 py-1.5 shadow-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">AI-Powered Recruitment Platform</span>
          </div>
        </div>
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-white/80 backdrop-blur-sm border border-white shadow-md flex items-center justify-center mb-8">
            <Users className="w-8 h-8 text-primary" strokeWidth={1.75} />
          </div>
          <h1 className="text-5xl font-bold text-primary tracking-tight mb-4">QuantaHire</h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-sm">
            One platform for candidates and recruiters. AI-powered matching, unbiased screening, smart interviews.
          </p>
        </div>
        <div />
      </div>

      {/* Right — form */}
      <div className="flex flex-col px-6 md:px-12 py-10 bg-background">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">Portal Access</p>
              <h2 className="text-3xl font-semibold text-foreground tracking-tight">
                {tab === "login" ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="mt-1.5 text-muted-foreground">
                {tab === "login" ? "Sign in — you'll be redirected based on your role" : "Register as a candidate or recruiter"}
              </p>
            </div>

            {/* Login / Register tabs */}
            <div className="flex bg-muted rounded-xl p-1 mb-6">
              {["login", "register"].map((t) => (
                <button key={t} onClick={() => { setTab(t); setError(""); setSuccess(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {t === "login" ? "Login" : "Register"}
                </button>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-5">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mb-5">{success}</div>
            )}

            {/* LOGIN */}
            {tab === "login" && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <Label>Email Address</Label>
                  <Input type="email" placeholder="you@example.com" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-12 rounded-xl" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="h-12 rounded-xl pr-11" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-base font-medium bg-primary hover:bg-primary/90 gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />} Sign In
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => { setTab("register"); setError(""); }} className="text-primary font-medium hover:underline">Register</button>
                </p>
              </form>
            )}

            {/* REGISTER */}
            {tab === "register" && (
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Role picker */}
                <div className="flex bg-muted rounded-xl p-1">
                  {[{ value: "candidate", label: "Candidate" }, { value: "recruiter", label: "Recruiter" }].map((r) => (
                    <button key={r.value} type="button" onClick={() => { setRole(r.value); setError(""); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${role === r.value ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      {r.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input type="text" placeholder="John Doe" value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="h-12 rounded-xl" required />
                </div>

                {role === "recruiter" && (
                  <div className="space-y-1.5">
                    <Label>Company Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="text" placeholder="Acme Corp" value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        className="h-12 rounded-xl pl-9" required />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Email Address</Label>
                  <Input type="email" placeholder="you@example.com" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-12 rounded-xl" required />
                </div>

                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="h-12 rounded-xl pr-11" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Confirm Password</Label>
                  <div className="relative">
                    <Input type={showConfirm ? "text" : "password"} placeholder="••••••••" value={form.confirm}
                      onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                      className="h-12 rounded-xl pr-11" required />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {role === "recruiter" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                    Recruiter accounts require admin approval before you can log in.
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-base font-medium bg-primary hover:bg-primary/90 gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {role === "recruiter" ? "Submit Registration" : "Create Account"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button type="button" onClick={() => { setTab("login"); setError(""); }} className="text-primary font-medium hover:underline">Login</button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}