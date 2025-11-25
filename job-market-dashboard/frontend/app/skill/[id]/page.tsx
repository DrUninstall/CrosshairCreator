"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { SkillTrendChart } from "@/app/components/dashboard/Charts";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { getSkillDetails } from "@/app/lib/api";
import { formatNumber, formatRelativeDate } from "@/app/lib/utils";
import type { SkillDetail } from "@/app/types";
import {
  ArrowLeft,
  Code2,
  TrendingUp,
  Building2,
  MapPin,
  ExternalLink,
} from "lucide-react";

export default function SkillDetailPage() {
  const params = useParams();
  const skillId = parseInt(params.id as string);

  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSkill() {
      if (!skillId) return;

      setLoading(true);
      setError(null);
      try {
        const data = await getSkillDetails(skillId);
        setSkill(data);
      } catch (err) {
        console.error("Failed to fetch skill:", err);
        setError("Failed to load skill details.");
      } finally {
        setLoading(false);
      }
    }
    fetchSkill();
  }, [skillId]);

  if (loading) {
    return (
      <div className="dashboard-container py-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-8 h-4 w-96" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="mt-8 h-64" />
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="dashboard-container py-8">
        <Link href="/" className="mb-4 inline-flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="mt-8 text-center">
          <p className="text-lg text-muted-foreground">{error || "Skill not found"}</p>
        </div>
      </div>
    );
  }

  // Calculate trend
  const trend = skill.trend;
  const recentCount = trend.slice(-7).reduce((sum, d) => sum + d.count, 0);
  const previousCount = trend.slice(-14, -7).reduce((sum, d) => sum + d.count, 0);
  const trendPercentage = previousCount > 0
    ? ((recentCount - previousCount) / previousCount) * 100
    : 0;

  return (
    <div className="dashboard-container py-8">
      {/* Back Link */}
      <Link href="/" className="mb-4 inline-flex items-center text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Code2 className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{skill.name}</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Skill demand analysis based on recent job postings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Mentions</div>
            <div className="mt-1 text-3xl font-bold">
              {formatNumber(skill.total_mentions)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">7-Day Trend</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-3xl font-bold">{formatNumber(recentCount)}</span>
              <Badge variant={trendPercentage >= 0 ? "success" : "danger"}>
                <TrendingUp className={`mr-1 h-3 w-3 ${trendPercentage < 0 ? "rotate-180" : ""}`} />
                {Math.abs(trendPercentage).toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Sample Jobs</div>
            <div className="mt-1 text-3xl font-bold">
              {skill.sample_jobs.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <SkillTrendChart data={skill.trend} skillName={skill.name} />

      {/* Sample Jobs */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Sample Job Postings Mentioning "{skill.name}"
          </CardTitle>
        </CardHeader>
        <CardContent>
          {skill.sample_jobs.length === 0 ? (
            <p className="text-muted-foreground">No recent job postings found.</p>
          ) : (
            <div className="space-y-4">
              {skill.sample_jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-start justify-between rounded-lg border border-border p-4 hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{job.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {job.company}
                      </span>
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </span>
                      )}
                      {job.posted_date && (
                        <span>{formatRelativeDate(job.posted_date)}</span>
                      )}
                    </div>
                  </div>
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4"
                    >
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
