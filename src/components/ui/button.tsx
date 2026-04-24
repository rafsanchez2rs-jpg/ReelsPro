"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({ className, variant = "default", size = "md", ...props }: ButtonProps) {
  const variantClass =
    variant === "default"
      ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-600)]"
      : variant === "outline"
        ? "border border-[var(--border)] bg-white hover:bg-slate-50"
        : "bg-transparent hover:bg-slate-100";

  const sizeClass =
    size === "sm" ? "h-8 px-3 text-xs"
    : size === "lg" ? "h-12 px-6 text-base"
    : "h-10 px-4 text-sm";

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variantClass,
        sizeClass,
        className
      )}
      {...props}
    />
  );
}
