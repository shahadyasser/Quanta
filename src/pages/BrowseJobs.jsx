import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, MapPin, Clock, DollarSign, Star, Sparkles, Building2, X, Briefcase, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ARRANGEMENTS = ["On-site", "Remote", "Hybrid"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Internship"];
const LOCATIONS = ["Riyadh", "Jeddah", "Dammam", "Mecca", "Medina", "Khobar", "Tabuk", "Abha", "Najran", "Hail", "Remote"];

const JOBS = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    location: "Remote",
    remote: true,
    arrangement: "Remote",
    locationCity: "Remote",
    postedAgo: "2 days ago",
    match: 95,
    recommended: true,
    type: "Full-time",
    level: "Senior",
    salary: "12,000 - 15,000 SAR",
    description: "We're looking for an experienced frontend developer to join our innovative team building next-gen web applications.",
    skills: ["React", "TypeScript", "Tailwind CSS", "AI"],
    responsibilities: [
      "Collaborate with cross-functional teams to deliver high-quality solutions",
      "Drive technical excellence and innovation",
      "Mentor junior team members and contribute to team growth",
      "Stay current with industry trends and best practices",
    ],
    benefits: [
      "Competitive salary and equity package",
      "Comprehensive health, dental, and vision insurance",
      "Flexible work arrangements",
      "Professional development opportunities",
      "Modern tech stack and tools",
    ],
    matchReason: "This role is an excellent match based on your skills and experience.",
  },
  {
    id: 2,
    title: "AI/ML Engineer",
    company: "DataSystems Ltd",
    location: "Medina",
    remote: false,
    arrangement: "On-site",
    locationCity: "Medina",
    postedAgo: "3 days ago",
    match: 92,
    recommended: true,
    type: "Full-time",
    level: "Mid-level",
    salary: "10,000 - 14,000 SAR",
    description: "Join our AI team to develop cutting-edge machine learning models for enterprise solutions.",
    skills: ["Python", "TensorFlow", "ML", "Data Science"],
    responsibilities: [
      "Design and implement machine learning models",
      "Collaborate with data scientists and engineers",
      "Optimize model performance and scalability",
      "Stay current with AI/ML research and best practices",
    ],
    benefits: [
      "Competitive salary and equity package",
      "Comprehensive health, dental, and vision insurance",
      "Fully remote work",
      "Professional development opportunities",
      "GPU compute access",
    ],
    matchReason: "Your Python and data science background aligns well with this role.",
  },
  {
    id: 3,
    title: "Full Stack Engineer",
    company: "CloudVentures",
    location: "Riyadh",
    remote: false,
    arrangement: "On-site",
    locationCity: "Riyadh",
    postedAgo: "5 days ago",
    match: 88,
    recommended: true,
    type: "Full-time",
    level: "Mid-level",
    salary: "9,000 - 13,000 SAR",
    description: "Build scalable cloud-native applications using modern tech stack. Hybrid work environment available.",
    skills: ["Node.js", "React", "AWS", "Docker"],
    responsibilities: [
      "Build and maintain full-stack web applications",
      "Design and implement RESTful APIs",
      "Work with cloud infrastructure on AWS",
      "Participate in code reviews and architecture discussions",
    ],
    benefits: [
      "Competitive salary and equity package",
      "Health, dental, and vision insurance",
      "Hybrid work environment",
      "401k matching",
      "Commuter benefits",
    ],
    matchReason: "Your React and Node.js experience is a strong match for this role.",
  },
  {
    id: 4,
    title: "UX/UI Designer",
    company: "DesignHub",
    location: "Jeddah",
    remote: true,
    arrangement: "Hybrid",
    locationCity: "Jeddah",
    postedAgo: "1 week ago",
    match: 82,
    recommended: false,
    type: "Full-time",
    level: "Mid-level",
    salary: "8,000 - 11,000 SAR",
    description: "Create beautiful, user-centered designs for our portfolio of SaaS products.",
    skills: ["Figma", "UI/UX", "Design Systems", "Prototyping"],
    responsibilities: [
      "Create wireframes, prototypes, and high-fidelity designs",
      "Conduct user research and usability testing",
      "Collaborate with product and engineering teams",
      "Maintain and evolve our design system",
    ],
    benefits: [
      "Competitive salary",
      "Health insurance",
      "Remote-friendly",
      "Design tool subscriptions",
      "Creative freedom",
    ],
    matchReason: "Your design skills are a good match for this creative role.",
  },
  {
    id: 5,
    title: "DevOps Engineer",
    company: "Innovation Labs",
    location: "Remote",
    remote: true,
    arrangement: "Remote",
    locationCity: "Remote",
    postedAgo: "1 week ago",
    match: 79,
    recommended: false,
    type: "Contract",
    level: "Senior",
    salary: "11,000 - 15,000 SAR",
    description: "Manage and optimize our cloud infrastructure, CI/CD pipelines, and deployment processes.",
    skills: ["Kubernetes", "AWS", "CI/CD", "Terraform"],
    responsibilities: [
      "Design and maintain CI/CD pipelines",
      "Manage Kubernetes clusters and cloud infrastructure",
      "Implement infrastructure as code using Terraform",
      "Monitor and optimize system performance",
    ],
    benefits: [
      "Competitive contract rate",
      "Flexible schedule",
      "Remote work",
      "Latest tooling access",
    ],
    matchReason: "Your cloud infrastructure experience matches this contract role.",
  },
  {
    id: 6,
    title: "Product Manager",
    company: "StartupXYZ",
    location: "Dammam",
    remote: false,
    arrangement: "On-site",
    locationCity: "Dammam",
    postedAgo: "2 weeks ago",
    match: 75,
    recommended: false,
    type: "Full-time",
    level: "Senior",
    salary: "13,000 - 15,000 SAR",
    description: "Lead product strategy and execution for our flagship AI-powered analytics platform.",
    skills: ["Product Strategy", "Agile", "Analytics", "Leadership"],
    responsibilities: [
      "Define and execute product roadmap",
      "Work closely with engineering and design teams",
      "Analyze market trends and user feedback",
      "Lead cross-functional initiatives",
    ],
    benefits: [
      "Competitive salary and equity",
      "Full benefits package",
      "Leadership opportunities",
      "Startup culture",
    ],
    matchReason: "Your leadership and analytics background suits this PM role.",
  },
  {
    id: 7,
    title: "Backend Developer",
    company: "FinTech Solutions",
    location: "Khobar",
    remote: true,
    arrangement: "Hybrid",
    locationCity: "Khobar",
    postedAgo: "4 days ago",
    match: 84,
    recommended: false,
    type: "Full-time",
    level: "Mid-level",
    salary: "8,500 - 12,000 SAR",
    description: "Build robust, scalable backend services for financial applications with high performance requirements.",
    skills: ["Java", "Spring Boot", "Microservices", "PostgreSQL"],
    responsibilities: [
      "Design and implement backend microservices",
      "Optimize database queries and performance",
      "Ensure security and compliance in financial systems",
      "Write unit and integration tests",
    ],
    benefits: [
      "Competitive salary",
      "Health and dental insurance",
      "Remote-friendly",
      "401k with matching",
    ],
    matchReason: "Your backend experience aligns with fintech requirements.",
  },
  {
    id: 8,
    title: "Data Engineer",
    company: "Analytics Pro",
    location: "Tabuk",
    remote: false,
    arrangement: "On-site",
    locationCity: "Tabuk",
    postedAgo: "6 days ago",
    match: 81,
    recommended: false,
    type: "Full-time",
    level: "Mid-level",
    salary: "9,500 - 13,500 SAR",
    description: "Design and maintain data pipelines and warehouses for large-scale data processing.",
    skills: ["Python", "SQL", "ETL", "Big Data"],
    responsibilities: [
      "Build and maintain ETL pipelines",
      "Design scalable data warehouse architecture",
      "Collaborate with data scientists and analysts",
      "Monitor data quality and pipeline health",
    ],
    benefits: [
      "Competitive salary",
      "Fully remote",
      "Health, dental, and vision",
      "Learning budget",
    ],
    matchReason: "Your Python and SQL skills are a solid match for this data role.",
  },
];


const LEVELS = ["Entry-level", "Mid-level", "Senior", "Lead"];

export default function BrowseJobs() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedArrangements, setSelectedArrangements] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const toggleItem = (list, setList, item) => {
    setList((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
  };

  const filtered = JOBS.filter((job) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || job.title.toLowerCase().includes(q) || job.company.toLowerCase().includes(q) || job.skills.some(s => s.toLowerCase().includes(q));
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(job.type);
    const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(job.level);
    const matchesArrangement = selectedArrangements.length === 0 || selectedArrangements.includes(job.arrangement);
    const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(job.locationCity);
    const matchesRemote = !remoteOnly || job.remote;
    return matchesSearch && matchesType && matchesLevel && matchesArrangement && matchesLocation && matchesRemote;
  });

  return (
    <div className="min-h-screen bg-[#F4F3FF]">
      {/* Top bar */}
      <div className="bg-white border-b border-border px-6 md:px-10 py-3 sticky top-0 z-10">
        <button
          onClick={() => navigate("/candidate-dashboard")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-primary">Browse Jobs</h1>
          <p className="text-sm text-muted-foreground">AI-matched opportunities for you</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search roles, companies, or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12 rounded-xl bg-white border-border text-sm"
          />
        </div>

        <div className="flex gap-6 items-start">
          {/* Sidebar Filters */}
          <aside className="hidden md:block w-56 bg-white border border-border rounded-2xl p-5 space-y-5 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground text-sm">Filters</span>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Employment Type</p>
              {EMPLOYMENT_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-border" checked={selectedTypes.includes(type)} onChange={() => toggleItem(selectedTypes, setSelectedTypes, type)} />
                  <span className="text-sm text-foreground">{type}</span>
                </label>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Experience Level</p>
              {LEVELS.map((level) => (
                <label key={level} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-border" checked={selectedLevels.includes(level)} onChange={() => toggleItem(selectedLevels, setSelectedLevels, level)} />
                  <span className="text-sm text-foreground">{level}</span>
                </label>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Work Arrangement</p>
              {ARRANGEMENTS.map((arr) => (
                <label key={arr} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-border" checked={selectedArrangements.includes(arr)} onChange={() => toggleItem(selectedArrangements, setSelectedArrangements, arr)} />
                  <span className="text-sm text-foreground">{arr}</span>
                </label>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</p>
              {LOCATIONS.map((loc) => (
                <label key={loc} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-border" checked={selectedLocations.includes(loc)} onChange={() => toggleItem(selectedLocations, setSelectedLocations, loc)} />
                  <span className="text-sm text-foreground">{loc}</span>
                </label>
              ))}
            </div>
          </aside>

          {/* Job List */}
          <div className="flex-1 space-y-4 min-w-0">
            <p className="text-sm text-muted-foreground">{filtered.length} jobs found</p>
            {filtered.map((job) => (
              <div key={job.id} className="bg-white border border-border rounded-2xl p-5 border-l-4 border-l-primary">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground text-base">{job.title}</h3>
                        {job.recommended && (
                          <span className="inline-flex items-center gap-1 bg-primary text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3" />
                            Recommended
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{job.company}</span>
                      </div>

                      <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                        {job.remote && <span className="bg-muted text-foreground px-2 py-0.5 rounded-md font-medium">Remote</span>}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.postedAgo}</span>
                      </div>

                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{job.description}</p>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {job.skills.map((skill) => (
                          <span key={skill} className="bg-muted text-foreground text-xs px-2.5 py-1 rounded-md border border-border">{skill}</span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 mt-3">
                        <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                          {job.salary}
                        </span>
                        <span className="bg-muted text-foreground text-xs px-2.5 py-1 rounded-md border border-border font-medium">{job.level}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      <Star className="w-3 h-3 fill-white" />{job.match}% Match
                    </span>
                    <Button size="sm" className="bg-foreground hover:bg-foreground/80 text-white rounded-xl text-xs h-8 px-4 w-28" onClick={() => setSelectedJob(job)}>
                      View Details
                    </Button>

                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Side Panel Overlay */}
      {selectedJob && (
        <>
          <div className="fixed inset-0 bg-black/30 z-20" onClick={() => setSelectedJob(null)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-30 shadow-2xl overflow-y-auto flex flex-col">
            {/* Panel header */}
            <div className="flex items-start justify-between p-6 border-b border-border">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground text-lg leading-tight">{selectedJob.title}</h2>
                  <p className="text-sm text-muted-foreground">{selectedJob.company}</p>
                </div>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-muted-foreground hover:text-foreground transition-colors mt-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {/* AI Match Score */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">AI Match Score</span>
                  <span className="text-2xl font-bold text-green-600">{selectedJob.match}%</span>
                </div>
                <p className="text-xs text-muted-foreground">{selectedJob.matchReason}</p>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Job Type</p>
                  <p className="text-sm font-semibold text-foreground">{selectedJob.type}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Experience Level</p>
                  <p className="text-sm font-semibold text-foreground">{selectedJob.level}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Salary Range</p>
                  <p className="text-sm font-semibold text-foreground">{selectedJob.salary}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Posted</p>
                  <p className="text-sm font-semibold text-foreground">{selectedJob.postedAgo}</p>
                </div>
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Job Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedJob.description}</p>
                <div className="space-y-2 mt-3">
                  <p className="text-sm text-muted-foreground font-medium">We are seeking a talented professional to:</p>
                  <ul className="space-y-1.5">
                    {selectedJob.responsibilities.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Required Skills */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Required Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.skills.map((skill) => (
                    <span key={skill} className="bg-accent text-primary text-xs px-2.5 py-1 rounded-md font-medium">{skill}</span>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Benefits</h3>
                <ul className="space-y-1.5">
                  {selectedJob.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Panel footer */}
            <div className="p-6 border-t border-border flex gap-3">
              <Button className="flex-1 bg-primary hover:bg-primary/90 rounded-xl">Apply Now</Button>
              <Button variant="outline" className="flex-1 rounded-xl">Save for Later</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}