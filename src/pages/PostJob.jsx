import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, Upload, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function TagInput({ tags, setTags, placeholder }) {
  const [input, setInput] = useState("");
  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) setTags([...tags, val]);
    setInput("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 bg-accent text-primary text-sm px-3 py-1 rounded-full">
            {t}
            <button onClick={() => setTags(tags.filter((x) => x !== t))}><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="h-10 rounded-xl"
        />
        <Button type="button" variant="outline" onClick={add} className="rounded-xl px-4">Add</Button>
      </div>
    </div>
  );
}

function SectionCard({ title, description, children }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-foreground text-lg">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

const SCHEDULES = ["Monday-Friday", "Weekends", "Flexible Hours", "Night Shift", "Rotating Shifts", "9-5"];

export default function PostJob() {
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [mustHave, setMustHave] = useState([]);
  const [niceToHave, setNiceToHave] = useState([]);
  const [certs, setCerts] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [hideSalary, setHideSalary] = useState(false);

  const toggleSchedule = (s) =>
    setSchedule((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 md:px-10 py-4 sticky top-0 z-10">
        <Link to="/recruiter-dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="mt-2">
          <h1 className="text-2xl font-bold text-foreground">Post a New Job</h1>
          <p className="text-sm text-muted-foreground">Create a comprehensive job posting and let our AI generate interview questions</p>
        </div>
      </div>

      <form className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-6" onSubmit={(e) => { e.preventDefault(); navigate("/recruiter-dashboard"); }}>

        {/* Job Information */}
        <SectionCard title="Job Information" description="Basic information about the position">
          <div className="space-y-1.5">
            <Label>Job Title *</Label>
            <Input placeholder="e.g., Senior Software Engineer" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Job Description *</Label>
            <Textarea placeholder="Describe the role, responsibilities, and requirements..." className="min-h-[120px] rounded-xl" />
            <p className="text-xs text-muted-foreground">Our NLP engine will extract key requirements from this description</p>
          </div>
          <div className="space-y-1.5">
            <Label>Experience Level *</Label>
            <Select>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select experience level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Entry Level</SelectItem>
                <SelectItem value="mid">Mid Level</SelectItem>
                <SelectItem value="senior">Senior Level</SelectItem>
                <SelectItem value="lead">Lead / Principal</SelectItem>
                <SelectItem value="executive">Executive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Required Skills *</Label>
            <TagInput tags={skills} setTags={setSkills} placeholder="Add a skill and press Enter" />
          </div>
          <div className="space-y-1.5">
            <Label>Company Goals / Culture</Label>
            <Textarea placeholder="Describe your company culture, values, and what makes your team unique..." className="min-h-[90px] rounded-xl" />
          </div>
        </SectionCard>

        {/* Qualifications */}
        <SectionCard title="Qualifications" description="Educational and certification requirements">
          <div className="space-y-1.5">
            <Label>Qualifications *</Label>
            <Input placeholder="e.g., Bachelor's degree in Computer Science or equivalent" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Qualifications Document</Label>
            <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 transition-colors">
              <Upload className="w-6 h-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Upload detailed qualifications (PDF or DOCX) - Optional</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Preferred Education</Label>
            <Select>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select education level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high_school">High School</SelectItem>
                <SelectItem value="associate">Associate Degree</SelectItem>
                <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                <SelectItem value="master">Master's Degree</SelectItem>
                <SelectItem value="phd">PhD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Preferred Certifications</Label>
            <TagInput tags={certs} setTags={setCerts} placeholder="e.g., AWS Certified Solutions Architect" />
          </div>
        </SectionCard>

        {/* Job Type & Work Conditions */}
        <SectionCard title="Job Type & Work Conditions" description="Employment type, location, and work arrangement details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Employment Type *</Label>
              <Select>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select employment type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Work Arrangement *</Label>
              <Select>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select work arrangement" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="onsite">On-site</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Location *</Label>
            <Input placeholder="e.g., Riyadh, Jeddah, or Dammam" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Work Schedule</Label>
            <div className="flex flex-wrap gap-2">
              {SCHEDULES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSchedule(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    schedule.includes(s)
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Compensation & Timing */}
        <SectionCard title="Compensation & Timing" description="Salary, benefits, and important dates">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Salary Range</Label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <Checkbox checked={hideSalary} onCheckedChange={setHideSalary} />
                Hide from candidates
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Minimum</Label>
                <Input defaultValue="50000" className="h-11 rounded-xl" type="number" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Maximum</Label>
                <Input defaultValue="80000" className="h-11 rounded-xl" type="number" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Currency</Label>
                <Select defaultValue="USD">
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="SAR">SAR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Period</Label>
                <Select defaultValue="year">
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="year">Per Year</SelectItem>
                    <SelectItem value="month">Per Month</SelectItem>
                    <SelectItem value="hour">Per Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Benefits</Label>
            <TagInput tags={benefits} setTags={setBenefits} placeholder="e.g., Health Insurance, 401k, Remote Work" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Application Deadline</Label>
              <Input type="date" className="h-11 rounded-xl" />
            </div>
          </div>
        </SectionCard>

        {/* Language Requirements */}
        <SectionCard title="Language Requirements" description="Required language proficiency levels">
          <div className="space-y-1.5">
            <Label>Required Languages</Label>
            <TagInput tags={languages} setTags={setLanguages} placeholder="e.g., English (C1), Arabic (Native)" />
            <p className="text-xs text-muted-foreground">Specify language and proficiency level (e.g., A1, A2, B1, B2, C1, C2, Native)</p>
          </div>
        </SectionCard>

        {/* AI Scoring Weights */}
        <SectionCard title="AI Scoring Weights" description="Separate skills into must-have and nice-to-have for better AI candidate matching">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Must-Have Skills</Label>
              <p className="text-xs text-muted-foreground">Critical requirement</p>
              <TagInput tags={mustHave} setTags={setMustHave} placeholder="Add must-have skill" />
              {mustHave.length === 0 && <p className="text-xs text-muted-foreground italic">No must-have skills added</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Nice-to-Have Skills</Label>
              <p className="text-xs text-muted-foreground">Preferred but not required</p>
              <TagInput tags={niceToHave} setTags={setNiceToHave} placeholder="Add nice-to-have skill" />
              {niceToHave.length === 0 && <p className="text-xs text-muted-foreground italic">No nice-to-have skills added</p>}
            </div>
          </div>

        </SectionCard>



        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <Button type="submit" className="bg-primary hover:bg-primary/90 rounded-xl h-12 px-8 text-base font-medium flex-1 sm:flex-none gap-2">
            <Sparkles className="w-4 h-4" />
            Post Job & Generate AI Questions
          </Button>
          <Button type="button" variant="outline" className="rounded-xl h-12 px-8" onClick={() => navigate("/recruiter-dashboard")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}