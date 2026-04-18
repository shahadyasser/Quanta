import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, CheckCircle, XCircle, Building2, User, Clock,
  FileText, Globe, Mail, MapPin, Hash, Phone, Shield, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

function FieldBox({ icon: Icon, label, value, isLink, isDate }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="border border-border rounded-xl px-3 py-2.5 bg-white text-sm text-foreground min-h-[42px] flex items-center">
        {isLink ? (
          <a href={value} target="_blank" rel="noreferrer" className="text-primary hover:underline">{value}</a>
        ) : isDate ? (
          <span>
            {value.split(",")[0]},{" "}
            <span className="text-orange-500">{value.split(",")[1]}</span>
          </span>
        ) : (
          value
        )}
      </div>
    </div>
  );
}

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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recruiter Approval</h1>
          <p className="text-muted-foreground mt-1">Review and approve recruiter registration</p>
        </div>

        {/* Company Information */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">Company Information</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 ml-7">Verify company details and business credentials</p>
            </div>
            <Badge className="bg-muted text-foreground border border-border font-semibold text-sm px-3 py-1">Pending</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldBox icon={Building2} label="Company Name" value={RECRUITER.company} />
            <FieldBox icon={Hash} label="Business Registration / License Number" value={RECRUITER.regNumber} />
            <FieldBox icon={MapPin} label="Company Location" value={RECRUITER.location} />
            <FieldBox icon={MapPin} label="Company Address" value={RECRUITER.address} />
            <FieldBox icon={Globe} label="Company Website" value={RECRUITER.website} isLink />
            <FieldBox icon={Mail} label="Company Email" value={RECRUITER.email} />
          </div>

          {/* Documents */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Submitted Documents</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {RECRUITER.documents.map((doc) => (
                <div key={doc} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  {doc}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recruiter Information */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Recruiter Information</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 ml-7">Primary contact person details</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldBox icon={User} label="Recruiter Name" value={RECRUITER.name} />
            <FieldBox icon={Phone} label="Recruiter Phone Number" value={RECRUITER.phone} />
            <FieldBox icon={Shield} label="Registration Type" value={RECRUITER.type} />
            <FieldBox icon={Calendar} label="Registration Date" value={RECRUITER.date} isDate />
          </div>
        </div>

        {/* Review Decision */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-foreground">Review Decision</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Approve or reject this recruiter registration</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Approval Note <span className="text-muted-foreground font-normal">(Optional)</span></p>
            <textarea
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              placeholder="Add any internal notes or special conditions for this approval..."
              className="w-full h-24 rounded-xl border border-input bg-muted/40 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Rejection Reason <span className="text-destructive">*</span>
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="If rejecting, please provide a clear reason that will be sent to the applicant..."
              className="w-full h-24 rounded-xl border border-input bg-muted/40 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
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