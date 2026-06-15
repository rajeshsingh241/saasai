"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Activity } from "lucide-react";

export function UsageCreditProgress({ remainingToken = 0 }) {
  const total = 5;
  const used = Math.max(0, total - remainingToken);
  const percentage = Math.max(0, (remainingToken / total) * 100);
  const isLow = remainingToken <= 1;

  return (
    <div className="p-3 rounded-xl border border-border/30 bg-card/50 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className={`h-3.5 w-3.5 ${isLow ? "text-red-400" : "text-blue-500"}`} />
          <span className="text-xs font-semibold">Free Plan</span>
        </div>
        <span className={`text-[10px] font-medium ${isLow ? "text-red-400" : "text-muted-foreground/60"}`}>
          {used}/{total} used
        </span>
      </div>
      <Progress
        value={percentage}
        className="h-1.5 bg-muted/30"
      />
      {isLow && (
        <p className="text-[10px] text-red-400/80">
          {remainingToken === 0 ? "No messages left" : "Running low on messages"}
        </p>
      )}
    </div>
  );
}
