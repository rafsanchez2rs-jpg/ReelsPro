"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
}

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  const variantClass =
    variant === "default"
      ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-600)]"
      : variant === "outline"
        ? "border border-[var(--border)] bg-white hover:bg-slate-50"
        : "bg-transparent hover:bg-slate-100";

  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variantClass,
        className
      )}
      {...props}
    />
  );
}
