"use client";

import { cn } from "@/app/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("skeleton h-4 w-full", className)} />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <Skeleton className="mb-4 h-6 w-1/3" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-2 h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-border">
      <div className="bg-muted px-4 py-3">
        <Skeleton className="h-4 w-full" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-t border-border px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <Skeleton className="mb-4 h-6 w-1/3" />
      <div className="flex h-64 items-end justify-around gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="w-8"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-6">
          <Skeleton className="mb-2 h-4 w-1/2" />
          <Skeleton className="h-8 w-2/3" />
        </div>
      ))}
    </div>
  );
}
