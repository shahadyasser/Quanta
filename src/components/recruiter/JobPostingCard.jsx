import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function JobPostingCard({ title, status, applications, avgMatch, postedDate }) {
  const isActive = status === "Active";
  const navigate = useNavigate();
  return (
    <div className="bg-white border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
          <span className="text-primary font-bold text-lg">{title[0]}</span>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{title}</h3>
            <Badge className={isActive ? "bg-green-50 text-green-600 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}>
              {status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {applications} applications &bull; Avg Match: {avgMatch} &bull; Posted {postedDate}
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="rounded-lg border-primary text-primary hover:bg-accent shrink-0"
        onClick={() => navigate(`/view-candidates?job=${encodeURIComponent(title)}&status=${encodeURIComponent(status)}`)}
      >
        View Candidates
      </Button>
    </div>
  );
}