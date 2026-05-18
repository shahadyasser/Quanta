import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, FileText, ChevronDown, ChevronUp, Search, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

const STATUS_COLORS = {
  Open: "bg-green-50 text-green-600 border-green-200",
  Closed: "bg-red-50 text-red-500 border-red-200",
  Draft: "bg-muted text-muted-foreground border-border",
  Reopened: "bg-blue-50 text-blue-600 border-blue-200",
  open: "bg-green-50 text-green-600 border-green-200",
};

const APP_STATUS_COLORS = {
  pending: "bg-orange-50 text-orange-500 border-orange-200",
  processed: "bg-green-50 text-green-600 border-green-200",
  shortlisted: "bg-blue-50 text-blue-600 border-blue-200",
  accepted: "bg-emerald-50 text-emerald-600 border-emerald-200",
  interview: "bg-purple-50 text-purple-600 border-purple-200",
  rejected: "bg-red-50 text-red-500 border-red-200",
};

export default function AdminAllJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedJob, setExpandedJob] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Job.list("-created_date", 200),
      base44.entities.Application.list("-created_date", 500),
    ]).then(([jobsData, appsData]) => {
      setJobs(jobsData || []);
      setApplications(appsData || []);
      setLoading(false);
    });
  }, []);

  // Group applications by job_id
  const appsByJob = applications.reduce((acc, app) => {
    if (!acc[app.job_id]) acc[app.job_id] = [];
    acc[app.job_id].push(app);
    return acc;
  }, {});

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    return !q || (j.title || "").toLowerCase().includes(q) || (j.company || "").toLowerCase().includes(q) || (j.location || "").toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#F4F3FF]">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 md:px-10 py-4 sticky top-0 z-10">
        <button
          onClick={() => navigate("/admin-dashboard")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">All Jobs & Applications</h1>
            <p className="text-sm text-muted-foreground">View every job listing and the CVs submitted for each role</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-muted text-foreground text-sm font-semibold px-3 py-1.5 rounded-lg">{filtered.length} jobs</span>
            <span className="bg-primary/10 text-primary text-sm font-semibold px-3 py-1.5 rounded-lg">{applications.length} total CVs</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by job title, company, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl bg-white"
          />
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="flex justify-center py-16 text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex justify-center py-16 text-muted-foreground text-sm">No jobs found.</div>
        ) : (
          filtered.map((job) => {
            const jobApps = appsByJob[job.id] || [];
            const isExpanded = expandedJob === job.id;

            return (
              <div key={job.id} className="bg-white border border-border rounded-2xl overflow-hidden">
                {/* Job Header Row */}
                <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{job.title}</h3>
                      <Badge className={`text-xs ${STATUS_COLORS[job.status] || "bg-muted text-muted-foreground"}`}>{job.status}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{job.company || "—"}</span>
                      {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                      {job.arrangement && <span>{job.arrangement}</span>}
                      {job.type && <span>{job.type}</span>}
                      {job.salary && <span>{job.salary}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
                      <Users className="w-4 h-4" />
                      {jobApps.length} CV{jobApps.length !== 1 ? "s" : ""}
                    </div>
                    <button
                      onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors"
                    >
                      {isExpanded ? <><ChevronUp className="w-4 h-4" />Hide CVs</> : <><ChevronDown className="w-4 h-4" />View CVs</>}
                    </button>

                  </div>
                </div>

                {/* Expanded CVs */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 px-6 py-4">
                    {jobApps.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No applications submitted for this job yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-muted-foreground border-b border-border">
                              {["Candidate", "Email", "Match Score", "Experience", "Status", "CV"].map((h) => (
                                <th key={h} className="pb-3 pr-6 font-medium whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {jobApps.map((app) => (
                              <tr key={app.id} className="hover:bg-white/70 transition-colors">
                                <td className="py-3 pr-6 whitespace-nowrap font-medium text-foreground">{app.candidate_name || "—"}</td>
                                <td className="py-3 pr-6 whitespace-nowrap text-muted-foreground text-xs">{app.candidate_email}</td>
                                <td className="py-3 pr-6 whitespace-nowrap">
                                  {app.match_score ? (
                                    <span className={`font-bold ${app.match_score >= 80 ? "text-green-600" : app.match_score >= 60 ? "text-orange-500" : "text-muted-foreground"}`}>
                                      {app.match_score}%
                                    </span>
                                  ) : <span className="text-muted-foreground text-xs">Pending</span>}
                                </td>
                                <td className="py-3 pr-6 whitespace-nowrap text-muted-foreground text-xs">
                                  {app.years_of_experience ? `${app.years_of_experience} yrs` : "—"}
                                </td>
                                <td className="py-3 pr-6 whitespace-nowrap">
                                  <Badge className={`text-xs ${APP_STATUS_COLORS[app.status] || "bg-muted text-muted-foreground"}`}>
                                    {app.status === "processed" ? "CV Analyzed" : app.status || "pending"}
                                  </Badge>
                                </td>
                                <td className="py-3">
                                  {app.cv_url ? (
                                    <a href={app.cv_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                                      <FileText className="w-3.5 h-3.5" />View CV
                                    </a>
                                  ) : <span className="text-muted-foreground text-xs">—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}