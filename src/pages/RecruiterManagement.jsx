import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Users, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const INITIAL_RECRUITERS = [
  { company: "Microsoft Corporation", email: "hr@microsoft.com", name: "Alice Johnson", approvalDate: "11/15/2024", jobsPosted: 23, activeJobs: 8, status: "Active" },
  { company: "Google LLC", email: "talent@google.com", name: "Bob Smith", approvalDate: "11/20/2024", jobsPosted: 31, activeJobs: 12, status: "Active" },
  { company: "Amazon Web Services", email: "recruitment@aws.com", name: "Carol Davis", approvalDate: "10/5/2024", jobsPosted: 18, activeJobs: 0, status: "Suspended" },
  { company: "Meta Platforms", email: "careers@meta.com", name: "David Wilson", approvalDate: "12/1/2024", jobsPosted: 15, activeJobs: 7, status: "Active" },
  { company: "Apple Inc.", email: "jobs@apple.com", name: "Eve Martinez", approvalDate: "11/10/2024", jobsPosted: 27, activeJobs: 11, status: "Active" },
];

export default function RecruiterManagement() {
  const [recruiters, setRecruiters] = useState(INITIAL_RECRUITERS);
  const [search, setSearch] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null); // { email, action: 'suspend'|'activate' }

  const total = recruiters.length;
  const active = recruiters.filter((r) => r.status === "Active").length;
  const suspended = recruiters.filter((r) => r.status === "Suspended").length;

  const filtered = recruiters.filter(
    (r) =>
      r.company.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase())
  );

  const confirmToggle = (email) => {
    const recruiter = recruiters.find((r) => r.email === email);
    setConfirmDialog({ email, action: recruiter.status === "Active" ? "suspend" : "activate" });
  };

  const handleConfirm = () => {
    setRecruiters((prev) =>
      prev.map((r) =>
        r.email === confirmDialog.email
          ? { ...r, status: r.status === "Active" ? "Suspended" : "Active" }
          : r
      )
    );
    setConfirmDialog(null);
  };

  const deleteRecruiter = (email) => {
    setRecruiters((prev) => prev.filter((r) => r.email !== email));
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Navbar */}
      <nav className="bg-white border-b border-border px-6 md:px-10 py-3 flex items-center sticky top-0 z-10">
        <span className="font-bold text-lg text-primary">QuantaHire Admin</span>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Back */}
        <Link
          to="/admin-dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recruiter Management</h1>
          <p className="text-muted-foreground mt-1">Manage approved recruiter accounts</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Recruiters", value: total, icon: Users },
            { label: "Active Accounts", value: active, icon: UserCheck },
            { label: "Suspended", value: suspended, icon: UserX, highlight: true },
          ].map(({ label, value, icon: Icon, highlight }) => (
            <div key={label} className={`bg-white border rounded-2xl p-5 space-y-2 ${highlight ? "border-orange-200" : "border-border"}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground font-medium">{label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${highlight ? "bg-orange-50" : "bg-accent"}`}>
                  <Icon className={`w-4 h-4 ${highlight ? "text-orange-500" : "text-primary"}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold ${highlight ? "text-orange-500" : "text-foreground"}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Table Card */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-foreground">Approved Recruiters</h2>
              <p className="text-sm text-muted-foreground">Search and manage recruiter accounts</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by company name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl w-full sm:w-72"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  {["Company Name", "Email", "Recruiter Name", "Approval Date", "Jobs Posted", "Active Jobs", "Status", "Actions"].map((h) => (
                    <th key={h} className="pb-3 pr-4 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => (
                  <tr key={r.email}>
                    <td className="py-3.5 pr-4 font-medium text-foreground whitespace-nowrap">{r.company}</td>
                    <td className="py-3.5 pr-4 text-muted-foreground whitespace-nowrap">{r.email}</td>
                    <td className="py-3.5 pr-4 text-foreground whitespace-nowrap">{r.name}</td>
                    <td className="py-3.5 pr-4 text-muted-foreground whitespace-nowrap">{r.approvalDate}</td>
                    <td className="py-3.5 pr-4 text-foreground whitespace-nowrap">{r.jobsPosted}</td>
                    <td className="py-3.5 pr-4 text-foreground whitespace-nowrap">{r.activeJobs}</td>
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      <Badge className={r.status === "Active"
                        ? "bg-green-50 text-green-600 border-green-200"
                        : "bg-orange-50 text-orange-500 border-orange-200"
                      }>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className={`rounded-lg text-xs h-8 px-3 ${
                            r.status === "Active"
                              ? "border-orange-300 text-orange-500 hover:bg-orange-50"
                              : "border-green-300 text-green-600 hover:bg-green-50"
                          }`}
                          onClick={() => confirmToggle(r.email)}
                        >
                          {r.status === "Active" ? "Suspend" : "Activate"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg text-xs h-8 px-3 border-destructive/40 text-destructive hover:bg-destructive/5"
                          onClick={() => deleteRecruiter(r.email)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Confirmation Dialog */}
      {confirmDialog && (() => {
        const r = recruiters.find((rec) => rec.email === confirmDialog.email);
        const isActivate = confirmDialog.action === "activate";
        return (
          <Dialog open={true} onOpenChange={() => setConfirmDialog(null)}>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>{isActivate ? "Activate Recruiter Account?" : "Suspend Recruiter Account?"}</DialogTitle>
                <DialogDescription className="pt-1">
                  {isActivate
                    ? `Are you sure you want to reactivate ${r?.company}? This will restore their full access to the platform.`
                    : `Are you sure you want to suspend ${r?.company}? They will lose access to the platform.`}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-2 sm:gap-2 pt-2">
                <Button variant="outline" className="rounded-xl flex-1" onClick={() => setConfirmDialog(null)}>
                  Cancel
                </Button>
                <Button
                  className={`rounded-xl flex-1 ${isActivate ? "bg-green-600 hover:bg-green-700" : "bg-orange-500 hover:bg-orange-600"} text-white`}
                  onClick={handleConfirm}
                >
                  {isActivate ? "Activate Account" : "Suspend Account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}