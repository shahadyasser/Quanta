import React, { useState } from "react";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

export default function CandidateEmailGate({ onVerified }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Redirect to login with the email pre-filled
      await base44.auth.redirectToLogin();
    } catch (err) {
      setError("Failed to verify email. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/10 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Welcome to QuantaHire</h1>
          <p className="text-muted-foreground">Enter your email to access the candidate portal</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Email Address</label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              className="h-11 rounded-lg"
              disabled={loading}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 gap-2"
            disabled={loading}
          >
            {loading ? "Verifying..." : <>
              Continue
              <ArrowRight className="w-4 h-4" />
            </>}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          You'll be asked to verify your email to access your candidate profile and browse jobs.
        </p>
      </div>
    </div>
  );
}