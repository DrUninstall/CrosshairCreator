"use client";

import { Card } from "@/app/components/ui/Card";
import { formatNumber } from "@/app/lib/utils";
import {
  Briefcase,
  Code2,
  Award,
  TrendingUp,
} from "lucide-react";

interface StatsCardsProps {
  totalJobs: number;
  totalSkills: number;
  totalCerts: number;
  jobsToday?: number;
}

export function StatsCards({
  totalJobs,
  totalSkills,
  totalCerts,
  jobsToday = 0,
}: StatsCardsProps) {
  const stats = [
    {
      label: "Total Jobs (30d)",
      value: totalJobs,
      icon: Briefcase,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Unique Skills",
      value: totalSkills,
      icon: Code2,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
    {
      label: "Certifications",
      value: totalCerts,
      icon: Award,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Jobs Added Today",
      value: jobsToday,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {formatNumber(stat.value)}
              </p>
            </div>
            <div className={`rounded-lg p-2 ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
