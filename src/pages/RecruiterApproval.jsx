import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, CheckCircle, XCircle, Building2, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

const RECRUITER = {
  company: "TechCorp Solutions",
  regNumber: "REG-2024-TC-001",
  location: "New York, USA",
  address: "123 Tech Street, Manhattan, NY 10001",
  website: "https://www.techcorp.com",
  email: "hr@techcorp.com",
  documents: ["Business License", "Tax Registration", "Identity Proof"],
  name: "Sarah Mitchell",
  phone: "+1 (555) 123-4567",
  type: "Self-registration",
  date: "12/15/2024, 10:30:00 AM",
};

export default function RecruiterApproval() {
  const navigate = useNavigate();
  const [approvalNote, setApprovalNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  return (
    <div className="min-h-screen bg-[#F4F3FF]">
      {/* Navbar */}
      <nav className="bg-white border-b border-border px-6 md:px-10 py-3 flex items-center sticky top-0 z-10">
        <span className="font-bold text-lg text-primary">QuantaHire Admin</span>
      </nav>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Back */}
        <Link
          to="/admin-dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Recruiter Approval</h1>
            <p className="text-muted-foreground mt-1">Review and approve recruiter registration</p>
          </div>
          <Badge className="bg-orange-50 text-orange-500 border border-orange-200 text-sm px-3 py-1">Pending</Badge>
        </div>

        {/* Company Information */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Company Information</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-3">Verify company details and business credentials</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label className="text-xs text-muted-foreground font-medium">Company Name</Label>
              <p className="mt-1 text-sm font-medium text-foreground">{RECRUITER.company}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-medium">Business Registration / License Number</Label>
              <p className="mt-1 text-sm font-medium text-foreground">{RECRUITER.regNumber}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-medium">Company Location</Label>
              <p className="mt-1 text-sm font-medium text-foreground">{RECRUITER.location}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-medium">Company Address</Label>
              <p className="mt-1 text-sm font-medium text-foreground">{RECRUITER.address}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-medium">Company Website</Label>
              <a href={RECRUITER.website} target="_blank" rel="noreferrer" className="mt-1 text-sm text-primary hover:underline block">{RECRUITER.website}</a>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-medium">Company Email</Label>
              <p className="mt-1 text-sm font-medium text-foreground">{RECRUITER.email}</p>
            </div>
          </div>

          {/* Documents */}
          <div>
            <Label className="text-xs text-muted-foreground font-medium">Submitted Documents</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {RECRUITER.documents.map((doc) => (
                <div key={doc} className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg text-sm text-foreground">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  {doc}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recruiter Information */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Recruiter Information</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-3">Primary contact person details</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label className="text-xs text-muted-foreground font-medium">Recruiter Name</Label>
              <p className="mt-1 text-sm font-medium text-foreground">{RECRUITER.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-medium">Recruiter Phone Number</Label>
              <p className="mt-1 text-sm font-medium text-foreground">{RECRUITER.phone}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-medium">Registration Type</Label>
              <p className="mt-1 text-sm font-medium text-foreground">{RECRUITER.type}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-medium">Registration Date</Label>
              <p className="mt-1 text-sm font-medium text-foreground">{RECRUITER.date}</p>
            </div>
          </div>
        </div>

        {/* Review Decision */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Review Decision</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-3">Approve or reject this recruiter registration</p>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Approval Note <span className="text-muted-foreground font-normal">(Optional)</span></Label>
            <textarea
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              placeholder="Add any internal notes or special conditions for this approval..."
              className="w-full h-24 rounded-xl border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Rejection Reason <span className="text-destructive">*</span>
            </Label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="If rejecting, please provide a clear reason that will be sent to the applicant..."
              className="w-full h-24 rounded-xl border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl h-11 gap-2" onClick={() => navigate("/admin-dashboard")}>
              <CheckCircle className="w-4 h-4" />
              Approve Recruiter
            </Button>
            <Button className="flex-1 bg-destructive hover:bg-destructive/90 text-white rounded-xl h-11 gap-2" onClick={() => navigate("/admin-dashboard")}>
              <XCircle className="w-4 h-4" />
              Reject Registration
            </Button>
          </div>

          {/* Note */}
          <p className="text-xs text-muted-foreground bg-muted rounded-xl px-4 py-3">
            <span className="font-semibold text-foreground">Note: </span>
            Approving this recruiter will grant them full access to the QuantaHire platform. They will be able to post jobs, review candidates, and conduct interviews.
          </p>
        </div>
      </div>
    </div>
  );
}