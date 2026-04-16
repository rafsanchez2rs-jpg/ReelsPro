"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StepShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

export function StepShell({ title, description, children, className }: StepShellProps) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      {children}
    </Card>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}
