import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatsCard from "../components/recruiter/StatsCard";
import ActionItemCard from "../components/recruiter/ActionItemCard";
import JobPostingCard from "../components/recruiter/JobPostingCard";

const STATS = [
  { label: "Total Applicants", value: "248", change: "+11%", subtext: "+24 from last week" },
  { label: "Avg. Match Score", value: "87%", change: "+3%", subtext: "+3% from last week" },
  { label: "AI Interviews Completed", value: "156", change: "+13%", subtext: "+18 from last week" },
  { label: "Pending Reviews", value: "18", change: "+38%", subtext: "+5 from last week" },
];

const ACTION_ITEMS = [
  { title: "High Match Candidates (>90%)", subtitle: "Senior Developer", count: 8 },
  { title: "New Applications Today", subtitle: "Product Manager", count: 15 },
  { title: "Applications Requiring Review", subtitle: "UX Designer", count: 12 },
];

const JOBS = [
  { title: "Senior Developer", status: "Active", applications: 45, avgMatch: "89%", postedDate: "Nov 8, 2025" },
  { title: "UX Designer", status: "Active", applications: 32, avgMatch: "85%", postedDate: "Nov 7, 2025" },
  { title: "Product Manager", status: "Active", applications: 28, avgMatch: "91%", postedDate: "Nov 6, 2025" },
  { title: "Data Analyst", status: "Inactive", applications: 14, avgMatch: "78%", postedDate: "Oct 20, 2025" },
];

const TABS = ["All Jobs", "Active", "Inactive"];

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All Jobs");
  const [search, setSearch] = useState("");

  const filteredJobs = JOBS.filter((job) => {
    const matchesTab =
      activeTab === "All Jobs" ||
      job.status === activeTab;
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Navbar */}
      <nav className="bg-white border-b border-border px-6 md:px-10 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <span className="font-bold text-lg text-primary">QuantaHire</span>
          <p className="text-xs text-muted-foreground">Recruiter Portal</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-medium hidden sm:block">recruiter@quantahire.com</span>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" asChild>
            <Link to="/">
              <LogOut className="w-4 h-4" />
              Logout
            </Link>
          </Button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-1">Recruiter Portal</p>
            <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
            <p className="text-muted-foreground mt-1">Here's what's happening with your recruitment today.</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 rounded-xl gap-2 h-11 px-5 self-start" onClick={() => navigate("/post-job")}>
            <Plus className="w-4 h-4" />
            Post New Job
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <StatsCard key={s.label} label={s.label} value={s.value} change={s.change} subtext={s.subtext} />
          ))}
        </div>

        {/* Action Items */}
        <div className="bg-white border border-border border-l-4 border-l-orange-400 rounded-2xl p-6">
          <div className="mb-5 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-orange-400 flex items-center justify-center">
              <span className="text-orange-400 text-xs font-bold">!</span>
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-lg leading-none">Action Items</h2>
              <p className="text-sm text-muted-foreground">AI-generated insights requiring your attention</p>
            </div>
          </div>
          <div className="space-y-3">
            {ACTION_ITEMS.map((item, i) => (
              <ActionItemCard key={item.title} {...item} index={i} onReview={() => navigate("/view-candidates")} />
            ))}
          </div>
        </div>

        {/* Job Postings */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-semibold text-foreground text-lg">Job Postings</h2>
              <p className="text-sm text-muted-foreground">Manage your job postings and view candidate applications</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl w-full sm:w-64"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {TABS.map((tab) => {
              const count = tab === "All Jobs" ? JOBS.length : JOBS.filter(j => j.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-primary text-white"
                      : "bg-white border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>

          {/* Job cards */}
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <JobPostingCard key={job.title} {...job} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}