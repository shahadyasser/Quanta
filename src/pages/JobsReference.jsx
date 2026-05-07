import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Copy, CheckCircle, Briefcase, MapPin, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

const STATUS_STYLES = {
  Active: "bg-green-50 text-green-600 border-green-200",
  Inactive: "bg-muted text-muted-foreground border-border",
};

const LEVEL_STYLES = {
  "Entry-level": "bg-blue-50 text-blue-600 border-blue-200",
  "Mid-level": "bg-purple-50 text-purple-600 border-purple-200",
  Senior: "bg-orange-50 text-orange-600 border-orange-200",
  Lead: "bg-red-50 text-red-600 border-red-200",
};

const TYPE_STYLES = {
  "Full-time": "bg-primary/10 text-primary border-primary/20",
  "Part-time": "bg-yellow-50 text-yellow-600 border-yellow-200",
  Contract: "bg-indigo-50 text-indigo-600 border-indigo-200",
  Freelance: "bg-teal-50 text-teal-600 border-teal-200",
  Internship: "bg-pink-50 text-pink-600 border-pink-200",
};

function CopyId({ id }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 font-mono text-xs bg-muted border border-border rounded-lg px-2.5 py-1 hover:bg-accent transition-colors max-w-[200px]"
      title="Click to copy ID"
    >
      <span className="truncate text-muted-foreground">{id}</span>
      {copied ? <CheckCircle className="w-3 h-3 text-green-500 shrink-0" /> : <Copy className="w-3 h-3 text-muted-foreground shrink-0" />}
    </button>
  );
}

export default function JobsReference() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [recruiters, setRecruiters] = useState({}); // email -> profile
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [approvedOnly, setApprovedOnly] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Job.list("-created_date", 200),
      base44.entities.RecruiterProfile.filter({ status: "approved" }, undefined, 200),
    ]).then(([jobData, recruiterData]) => {
      setJobs(jobData);
      const map = {};
      recruiterData.forEach(r => { map[r.email] = r; });
      setRecruiters(map);
      setLoading(false);
    });
  }, []);

  const approvedEmails = new Set(Object.keys(recruiters));

  const filtered = jobs.filter((j) => {
    if (approvedOnly && !approvedEmails.has(j.recruiter_email)) return false;
    const q = search.toLowerCase();
    return (
      !q ||
      (j.title || "").toLowerCase().includes(q) ||
      (j.company || "").toLowerCase().includes(q) ||
      (j.id || "").toLowerCase().includes(q) ||
      (j.recruiter_email || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#F4F3FF]">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 md:px-10 py-4 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Jobs Reference Table</h1>
            <p className="text-sm text-muted-foreground">All job listings with IDs and full details — unified across all dashboards</p>
          </div>
          <div className="flex items-center gap-3 self-start">
            <button
              onClick={() => setApprovedOnly(v => !v)}
              className={`text-sm font-medium px-4 py-1.5 rounded-lg border transition-all ${approvedOnly ? "bg-green-50 text-green-700 border-green-300" : "bg-muted text-muted-foreground border-border hover:bg-accent"}`}
            >
              {approvedOnly ? "✓ Approved Recruiters Only" : "All Recruiters"}
            </button>
            <span className="bg-muted text-foreground text-sm font-semibold px-3 py-1.5 rounded-lg">{filtered.length} jobs</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, company, ID, or recruiter email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl bg-white"
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16 text-muted-foreground text-sm">Loading jobs...</div>
          ) : filtered.length === 0 ? (
            <div className="flex justify-center py-16 text-muted-foreground text-sm">No jobs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="px-5 py-3.5 font-semibold">Job ID</th>
                    <th className="px-5 py-3.5 font-semibold">Title</th>
                    <th className="px-5 py-3.5 font-semibold">Company</th>
                    <th className="px-5 py-3.5 font-semibold">Location</th>
                    <th className="px-5 py-3.5 font-semibold">Type</th>
                    <th className="px-5 py-3.5 font-semibold">Level</th>
                    <th className="px-5 py-3.5 font-semibold">Salary</th>
                    <th className="px-5 py-3.5 font-semibold">Arrangement</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                    <th className="px-5 py-3.5 font-semibold">Recruiter</th>
                    <th className="px-5 py-3.5 font-semibold">Skills</th>
                    <th className="px-5 py-3.5 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((job) => (
                    <tr key={job.id} className="hover:bg-muted/20 transition-colors align-top">
                      {/* ID */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <CopyId id={job.id} />
                      </td>

                      {/* Title */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
                            <Briefcase className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <span className="font-semibold text-foreground">{job.title || "—"}</span>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="px-5 py-4 whitespace-nowrap text-muted-foreground font-medium">{job.company || "—"}</td>

                      {/* Location */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {job.location || "—"}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge className={`text-xs ${TYPE_STYLES[job.type] || "bg-muted text-muted-foreground"}`}>{job.type || "—"}</Badge>
                      </td>

                      {/* Level */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge className={`text-xs ${LEVEL_STYLES[job.level] || "bg-muted text-muted-foreground"}`}>{job.level || "—"}</Badge>
                      </td>

                      {/* Salary */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-foreground font-medium">
                          <DollarSign className="w-3 h-3 text-muted-foreground shrink-0" />
                          {job.salary || "—"}
                        </span>
                      </td>

                      {/* Arrangement */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                          job.arrangement === "Remote" ? "bg-teal-50 text-teal-600 border-teal-200" :
                          job.arrangement === "Hybrid" ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                          "bg-blue-50 text-blue-600 border-blue-200"
                        }`}>{job.arrangement || "—"}</span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge className={`text-xs ${STATUS_STYLES[job.status] || "bg-muted text-muted-foreground"}`}>{job.status || "—"}</Badge>
                      </td>

                      {/* Recruiter */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3 shrink-0" />
                            {job.recruiter_email || "—"}
                          </span>
                          {job.recruiter_email && recruiters[job.recruiter_email] ? (
                            <span className="text-xs bg-green-50 text-green-600 border border-green-200 rounded-md px-1.5 py-0.5 w-fit">
                              ✓ Approved · {recruiters[job.recruiter_email].full_name || ""}
                            </span>
                          ) : job.recruiter_email ? (
                            <span className="text-xs bg-yellow-50 text-yellow-600 border border-yellow-200 rounded-md px-1.5 py-0.5 w-fit">
                              Not approved
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Skills */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {(job.skills || []).slice(0, 4).map((s) => (
                            <span key={s} className="text-xs bg-accent text-primary px-2 py-0.5 rounded-md">{s}</span>
                          ))}
                          {(job.skills || []).length > 4 && (
                            <span className="text-xs text-muted-foreground">+{job.skills.length - 4}</span>
                          )}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-5 py-4">
                        <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed line-clamp-3">{job.description || "—"}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Active Jobs", value: jobs.filter(j => j.status === "Active").length, color: "text-green-600" },
            { label: "Approved Recruiters", value: Object.keys(recruiters).length, color: "text-primary" },
            { label: "Remote Jobs", value: jobs.filter(j => j.arrangement === "Remote").length, color: "text-teal-600" },
            { label: "Unique Companies", value: new Set(jobs.map(j => j.company).filter(Boolean)).size, color: "text-purple-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-border rounded-2xl p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}