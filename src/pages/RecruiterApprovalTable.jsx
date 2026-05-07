import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

export default function RecruiterApprovalTable() {
  const navigate = useNavigate();
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    const init = async () => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) { navigate("/admin-auth"); return; }
      const me = await base44.auth.me();
      if (me?.role !== "admin") { navigate("/"); return; }

      const data = await base44.entities.RecruiterProfile.list();
      setRecruiters(data || []);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const handleApprove = async () => {
    if (!confirmDialog) return;
    await base44.asServiceRole.entities.RecruiterProfile.update(confirmDialog.id, {
      status: "approved",
      is_approved: true
    });
    setRecruiters(prev => prev.map(r => r.id === confirmDialog.id ? { ...r, status: "approved", is_approved: true } : r));
    setConfirmDialog(null);
  };

  const handleBlock = async () => {
    if (!confirmDialog) return;
    await base44.asServiceRole.entities.RecruiterProfile.update(confirmDialog.id, {
      status: "blocked"
    });
    setRecruiters(prev => prev.map(r => r.id === confirmDialog.id ? { ...r, status: "blocked" } : r));
    setConfirmDialog(null);
  };

  const pendingCount = recruiters.filter(r => r.status === "pending").length;
  const approvedCount = recruiters.filter(r => r.status === "approved").length;
  const blockedCount = recruiters.filter(r => r.status === "blocked").length;

  return (
    <div className="min-h-screen bg-[#F4F3FF]">
      {/* Navbar */}
      <nav className="bg-white border-b border-border px-6 md:px-10 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Shield className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold text-foreground">Recruiter Approvals</h1>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <button onClick={() => navigate("/admin-dashboard")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-orange-200 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-orange-500">{pendingCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending</p>
          </div>
          <div className="bg-white border border-green-200 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Approved</p>
          </div>
          <div className="bg-white border border-red-200 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-red-500">{blockedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Blocked</p>
          </div>
        </div>

        {/* Recruiters Table */}
        <div className="bg-white border border-border rounded-2xl p-6">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : recruiters.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No recruiters registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="pb-3 pr-6 font-medium">Name</th>
                    <th className="pb-3 pr-6 font-medium">Email</th>
                    <th className="pb-3 pr-6 font-medium">Company</th>
                    <th className="pb-3 pr-6 font-medium">Phone</th>
                    <th className="pb-3 pr-6 font-medium">Status</th>
                    <th className="pb-3 pr-6 font-medium">Registration</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recruiters.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 pr-6 font-medium text-foreground">{r.full_name || "—"}</td>
                      <td className="py-4 pr-6 text-muted-foreground">{r.email}</td>
                      <td className="py-4 pr-6 text-foreground">{r.company || "—"}</td>
                      <td className="py-4 pr-6 text-muted-foreground">{r.phone || "—"}</td>
                      <td className="py-4 pr-6">
                        <Badge className={
                          r.status === "approved" ? "bg-green-50 text-green-600 border-green-200" :
                          r.status === "blocked" ? "bg-red-50 text-red-500 border-red-200" :
                          "bg-orange-50 text-orange-500 border-orange-200"
                        }>
                          {r.status === "approved" ? "Approved" : r.status === "blocked" ? "Blocked" : "Pending"}
                        </Badge>
                      </td>
                      <td className="py-4 pr-6 text-xs text-muted-foreground">
                        {r.created_date ? new Date(r.created_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-4 flex gap-2">
                        {r.status === "pending" && (
                          <>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-8 px-3 text-xs" onClick={() => setConfirmDialog({ id: r.id, action: "approve", name: r.full_name || r.email })}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg h-8 px-3 text-xs" onClick={() => setConfirmDialog({ id: r.id, action: "block", name: r.full_name || r.email })}>
                              Block
                            </Button>
                          </>
                        )}
                        {r.status === "approved" && (
                          <Button size="sm" variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50 rounded-lg h-8 px-3 text-xs" onClick={() => setConfirmDialog({ id: r.id, action: "block", name: r.full_name || r.email })}>
                            Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setConfirmDialog(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
              <div className="flex items-center gap-3">
                {confirmDialog.action === "approve" && <CheckCircle className="w-6 h-6 text-green-600" />}
                {confirmDialog.action === "block" && <XCircle className="w-6 h-6 text-red-500" />}
                <h2 className="text-lg font-semibold text-foreground">
                  {confirmDialog.action === "approve" ? "Approve Recruiter" : "Block Recruiter"}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to {confirmDialog.action === "approve" ? "approve" : "block"} <strong>{confirmDialog.name}</strong>?
              </p>
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                {confirmDialog.action === "approve" 
                  ? "They will be able to log in and access the recruiter dashboard."
                  : "They will not be able to log in to the platform."}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-lg" onClick={() => setConfirmDialog(null)}>
                  Cancel
                </Button>
                <Button
                  className={`flex-1 rounded-lg text-white ${
                    confirmDialog.action === "approve" 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                  onClick={confirmDialog.action === "approve" ? handleApprove : handleBlock}
                >
                  {confirmDialog.action === "approve" ? "Approve" : "Block"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}