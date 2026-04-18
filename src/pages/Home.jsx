import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Briefcase, Users, Shield } from "lucide-react";
import FeatureCard from "../components/home/FeatureCard";
import RoleCard from "../components/home/RoleCard";

export default function Home() {
  const navigate = useNavigate();

  const handleSelectRole = (role) => {
    if (role === "recruiter") navigate("/recruiter-auth");
    else if (role === "candidate") navigate("/candidate-auth");
    else if (role === "admin") navigate("/admin-auth");
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2">
      {/* Left side — branding */}
      <div className="relative flex items-center px-8 md:px-16 py-16 overflow-hidden bg-gradient-to-br from-[#EEE9FF] via-[#F3EEFF] to-[#E8E0FF]">
        {/* Soft blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-purple-300/20 blur-3xl" />

        <div className="relative max-w-xl">
          {/* Pill */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-white rounded-full px-4 py-1.5 shadow-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">AI-Powered Recruitment Platform</span>
          </div>

          {/* Heading */}
          <h1 className="mt-6 text-6xl md:text-7xl font-bold text-primary tracking-tight">
            QuantaHire
          </h1>

          <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-md">
            Transform your hiring process with intelligent candidate matching, AI-powered interviews, and unbiased screening.
          </p>

          {/* Feature cards */}
          <div className="mt-10 grid grid-cols-2 gap-4 max-w-md">
            <FeatureCard
              icon={Briefcase}
              title="For Recruiters"
              description="Smart candidate screening & AI interviews"
            />
            <FeatureCard
              icon={Users}
              title="For Candidates"
              description="Fair evaluation & instant feedback"
            />
          </div>
        </div>
      </div>

      {/* Right side — account selection */}
      <div className="flex items-center justify-center px-6 md:px-12 py-16 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold text-foreground tracking-tight">
              Welcome to QuantaHire
            </h2>
            <p className="mt-2 text-muted-foreground">
              Choose your account type to continue
            </p>
          </div>

          <div className="space-y-3">
            <RoleCard
              icon={Briefcase}
              title="I'm a Recruiter"
              description="Post jobs and find top talent"
              onClick={() => handleSelectRole("recruiter")}
            />
            <RoleCard
              icon={Users}
              title="I'm a Candidate"
              description="Find jobs and apply with ease"
              onClick={() => handleSelectRole("candidate")}
            />
            <RoleCard
              icon={Shield}
              title="I'm an Admin"
              description="Manage platform and users"
              onClick={() => handleSelectRole("admin")}
            />
          </div>

          {/* Demo Accounts */}
          <div className="mt-8 text-center space-y-1">
            <p className="text-sm text-muted-foreground font-medium">Demo Accounts:</p>
            <p className="text-xs text-muted-foreground">Recruiter: recruiter@quantahire.com / recruiter123</p>
            <p className="text-xs text-muted-foreground">Candidate: candidate@quantahire.com / candidate123</p>
            <p className="text-xs text-muted-foreground">Admin: admin@quantahire.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}