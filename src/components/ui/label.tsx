"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={cn("mb-1.5 block text-sm font-medium text-slate-700", props.className)} />;
}
