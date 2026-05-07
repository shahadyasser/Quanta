import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, Building2, User, Clock, Mail, Phone, Shield, Calendar, Loader2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { pgAdminQuery } from "@/lib/neonDb";

function FieldBox({ icon: Icon, label, value }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="border border-border rounded-xl px-3 py-2.5 bg-white text-sm text-foreground min-h-[42px] flex items-center">
        {value || <span className="text-muted-foreground italic">Not provided</span>}
      </div>
    </div>
  );
}

export default function RecruiterApproval() {
  const navigate = useNavigate();
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Pending Recruiters: SELECT * FROM users WHERE role = 'recruiter' AND is_active = false ORDER BY created_at DESC
    pgAdminQuery('SELECT * FROM users WHERE role = $1 AND is_active = false ORDER BY created_at DESC', ['recruiter'])
      .then((data) => {
        setRecruiters(data || []);
        setLoading(false);
      });
  }, []);

  const handleApprove = async () => {
    if (!selected) return;
    setProcessing(true);
    // Approve Recruiter: UPDATE users SET is_active = true WHERE id = :userId
    await pgAdminQuery('UPDATE users SET is_active = true WHERE id = $1', [selected.id]);
    await base44.integrations.Core.SendEmail({
      to: selected.email,
      subject: "Your QuantaHire Recruiter Account Has Been Approved!",
      body: `Dear ${selected.full_name || "Recruiter"},\n\nCongratulations! Your recruiter account on QuantaHire has been approved. You can now log in and start posting jobs and reviewing candidates.\n\n${note ? `Note from admin: ${note}\n\n` : ""}Welcome aboard!\n\nThe QuantaHire Team`
    });
    setRecruiters((prev) => prev.filter((r) => r.id !== selected.id));
    setSelected(null);
    setNote("");
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!selected || !rejectionReason.trim()) return;
    setProcessing(true);
    // Keep is_active = false (already false for pending). Optionally delete or mark differently.
    await base44.integrations.Core.SendEmail({
      to: selected.email,
      subject: "QuantaHire Recruiter Application Update",
      body: `Dear ${selected.full_name || "Recruiter"},\n\nThank you for registering on QuantaHire. After careful review, we are unable to approve your account at this time.\n\nReason: ${rejectionReason}\n\nIf you believe this is an error, please contact support.\n\nBest regards,\nThe QuantaHire Team`
    });
    // Remove the user from the pending queue by deleting their account
    await pgAdminQuery('DELETE FROM users WHERE id = $1', [selected.id]);
    setRecruiters((prev) => prev.filter((r) => r.id !== selected.id));
    setSelected(null);
    setRejectionReason("");
    setProcessing(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F3FF]">
      {/* Navbar */}
      <nav className="bg-white border-b border-border px-6 md:px-10 py-3 flex items-center sticky top-0 z-10">
        <span className="font-bold text-lg text-primary">QuantaHire Admin</span>
      </nav>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <Link to="/admin-dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Recruiter Approval Queue</h1>
          <p className="text-muted-foreground mt-1">Review and approve pending recruiter registrations</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : recruiters.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-14 text-center space-y-3">
            <Inbox className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="font-semibold text-foreground">No pending approvals</p>
            <p className="text-sm text-muted-foreground">All recruiter requests have been reviewed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List */}
            <div className="lg:col-span-1 space-y-3">
              {recruiters.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setSelected(r); setNote(""); setRejectionReason(""); }}
                  className={`w-full text-left bg-white border rounded-2xl p-4 transition-all hover:border-primary/40 ${selected?.id === r.id ? "border-primary shadow-sm" : "border-border"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{r.company || "Unknown Company"}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                    </div>
                    <Badge className="bg-orange-50 text-orange-500 border-orange-200 text-xs shrink-0">Pending</Badge>
                  </div>
                </button>
              ))}
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-2">
              {!selected ? (
                <div className="bg-white border border-border rounded-2xl p-10 text-center text-muted-foreground h-full flex items-center justify-center">
                  <p>Select a recruiter from the list to review</p>
                </div>
              ) : (
                <div className="bg-white border border-border rounded-2xl p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-foreground text-lg">{selected.company || "Unknown Company"}</h2>
                      <p className="text-sm text-muted-foreground">Registration request</p>
                    </div>
                    <Badge className="bg-orange-50 text-orange-500 border-orange-200">Pending Review</Badge>
                  </div>

                  {/* Company & Recruiter Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldBox icon={Building2} label="Company Name" value={selected.company} />
                    <FieldBox icon={User} label="Recruiter Name" value={selected.full_name} />
                    <FieldBox icon={Mail} label="Email" value={selected.email} />
                    <FieldBox icon={Phone} label="Phone" value={selected.phone} />
                    <FieldBox icon={Calendar} label="Registered On" value={selected.created_at ? new Date(selected.created_at).toLocaleString() : "—"} />
                    <FieldBox icon={Shield} label="Role" value={selected.role || "recruiter"} />
                  </div>

                  {/* Decision */}
                  <div className="space-y-4 pt-2 border-t border-border">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Approval Note <span className="text-muted-foreground font-normal">(Optional — sent to recruiter)</span></p>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add any welcome notes or special instructions..."
                        className="w-full h-20 rounded-xl border border-input bg-muted/40 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Rejection Reason <span className="text-muted-foreground font-normal">(Required if rejecting)</span></p>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explain why the application is being rejected..."
                        className="w-full h-20 rounded-xl border border-input bg-muted/40 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl h-11 gap-2" onClick={handleApprove} disabled={processing}>
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Approve & Notify
                      </Button>
                      <Button className="flex-1 bg-destructive hover:bg-destructive/90 text-white rounded-xl h-11 gap-2" onClick={handleReject} disabled={processing || !rejectionReason.trim()}>
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Reject & Notify
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground bg-muted rounded-xl px-4 py-3">
                      <span className="font-semibold text-foreground">Note: </span>
                      The recruiter will be notified by email once you approve or reject their application.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}