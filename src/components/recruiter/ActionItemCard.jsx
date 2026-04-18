import React from "react";
import { Button } from "@/components/ui/button";

export default function ActionItemCard({ title, subtitle, count, onReview }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-foreground">{count}</span>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg border-primary text-primary hover:bg-accent"
          onClick={onReview}
        >
          Review
        </Button>
      </div>
    </div>
  );
}