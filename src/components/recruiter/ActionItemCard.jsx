import React from "react";
import { Button } from "@/components/ui/button";

const DOT_COLORS = {
  0: "bg-red-500",
  1: "bg-orange-400",
  2: "bg-yellow-400",
};

export default function ActionItemCard({ title, subtitle, count, index = 0, onReview }) {
  return (
    <div className="flex items-center justify-between py-4 px-4 bg-white border border-border rounded-xl">
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${DOT_COLORS[index] || "bg-gray-400"}`} />
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold text-foreground bg-muted rounded-lg w-10 h-10 flex items-center justify-center">{count}</span>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          onClick={onReview}
        >
          Review
        </Button>
      </div>
    </div>
  );
}