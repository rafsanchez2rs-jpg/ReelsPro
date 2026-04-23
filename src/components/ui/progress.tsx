"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Progress({ value = 0, className }: { value?: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-[var(--color-muted)]", className)}>
      <div
        className="h-full transition-all duration-300 ease-in-out bg-[var(--color-primary)]"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}