import React from "react";
import { Star } from "lucide-react";

export default function RatingStars({ rating = 0 }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < rating);

  return (
    <div className="flex gap-0.5">
      {stars.map((filled, i) => (
        <Star key={i} className={`w-3 h-3 ${filled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
      ))}
    </div>
  );
}