"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

interface ProgressProps {
  value: number;
}

export function Progress({ value }: ProgressProps) {
  return (
    <ProgressPrimitive.Root className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <ProgressPrimitive.Indicator
        className="h-full bg-[var(--brand)] transition-all"
        style={{ transform: `translateX(-${100 - Math.max(0, Math.min(value, 100))}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
