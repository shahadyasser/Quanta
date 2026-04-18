import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Sparkles, ArrowLeft, Briefcase, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RecruiterAuth() {
  const [tab, setTab] = useState("login"); // "login" | "register"
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    base44.auth.redirectToLogin();
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2">
      {/* Left side — branding */}
      <div className="relative hidden lg:flex flex-col justify-between px-16 py-14 overflow-hidden bg-gradient-to-br from-[#EEE9FF] via-[#F3EEFF] to-[#E8E0FF]">
        {/* Blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-purple-300/20 blur-3xl" />

        {/* Logo */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-white rounded-full px-4 py-1.5 shadow-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">AI-Powered Recruitment Platform</span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-white/80 backdrop-blur-sm border border-white shadow-md flex items-center justify-center mb-8">
            <Briefcase className="w-8 h-8 text-primary" strokeWidth={1.75} />
          </div>
          <h1 className="text-5xl font-bold text-primary tracking-tight mb-4">QuantaHire</h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-sm">
            Transform your hiring process with intelligent candidate matching, AI-powered interviews, and unbiased screening.
          </p>
        </div>

        {/* Bottom spacer */}
        <div />
      </div>

      {/* Right side — auth form */}
      <div className="flex flex-col px-6 md:px-12 py-10 bg-background">
        {/* Back button */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-foreground tracking-tight">
                {tab === "login" ? "Welcome" : "Create Account"}
              </h2>
              <p className="mt-1.5 text-muted-foreground">
                {tab === "login"
                  ? "Sign in to your account or create a new one"
                  : "Fill in the details below to get started"}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-muted rounded-xl p-1 mb-8">
              <button
                onClick={() => setTab("login")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === "login"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setTab("register")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === "register"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Register
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name — register only */}
              {tab === "register" && (
                <div className="space-y-1.5">
                  <Label htmlFor="fullname">Full Name</Label>
                  <Input
                    id="fullname"
                    type="text"
                    placeholder="John Doe"
                    className="h-12 rounded-xl border-border"
                  />
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-12 rounded-xl border-border"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-12 rounded-xl border-border pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password — register only */}
              {tab === "register" && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-12 rounded-xl border-border pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-medium bg-primary hover:bg-primary/90 mt-2"
              >
                {tab === "login" ? "Sign In" : "Create Account"}
              </Button>

              {/* Switch tab hint */}
              <p className="text-center text-sm text-muted-foreground">
                {tab === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setTab("register")}
                      className="text-primary font-medium hover:underline"
                    >
                      Register
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setTab("login")}
                      className="text-primary font-medium hover:underline"
                    >
                      Login
                    </button>
                  </>
                )}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}