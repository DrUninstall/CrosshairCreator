"use client";

import { useState, useEffect, useCallback } from "react";
import { StatsCards } from "@/app/components/dashboard/StatsCards";
import { SkillsTable } from "@/app/components/dashboard/SkillsTable";
import { CertificationsTable } from "@/app/components/dashboard/CertificationsTable";
import {
  DegreeDistributionChart,
  WorkTypeChart,
  SeniorityChart,
  TrendChart,
} from "@/app/components/dashboard/Charts";
import { FilterBar } from "@/app/components/dashboard/FilterBar";
import {
  SkeletonStats,
  SkeletonTable,
  SkeletonChart,
} from "@/app/components/ui/Skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/Card";
import {
  getDashboardSummary,
  getFilterOptions,
  getQuickStats,
  getExportUrl,
} from "@/app/lib/api";
import type {
  DashboardSummary,
  FilterOptions,
  QuickStats,
  DashboardFilters,
} from "@/app/types";
import { Building2, AlertCircle } from "lucide-react";

const DEFAULT_FILTERS: DashboardFilters = {
  country: null,
  category: null,
  seniority: null,
  work_type: null,
  company: null,
  days: 30,
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch filter options on mount
  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        const [options, stats] = await Promise.all([
          getFilterOptions(),
          getQuickStats(),
        ]);
        setFilterOptions(options);
        setQuickStats(stats);
      } catch (err) {
        console.error("Failed to fetch filter options:", err);
        // Use defaults if API fails
        setFilterOptions({
          countries: ["United States", "United Kingdom", "Canada", "Remote"],
          categories: [
            "software_engineering",
            "data_science",
            "data_engineering",
            "devops",
            "product_management",
          ],
          seniority_levels: ["junior", "mid", "senior", "lead", "staff"],
          work_types: ["remote", "hybrid", "onsite"],
          companies: [],
          date_ranges: [
            { label: "Last 7 days", value: 7 },
            { label: "Last 30 days", value: 30 },
            { label: "Last 90 days", value: 90 },
          ],
        });
      }
    }
    fetchFilterOptions();
  }, []);

  // Fetch dashboard data when filters change
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardSummary(filters);
      setSummary(data);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle filter changes
  const handleFilterChange = (
    key: keyof DashboardFilters,
    value: string | number | null
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleExport = () => {
    const url = getExportUrl("full", filters);
    window.open(url, "_blank");
  };

  // Error state
  if (error && !summary) {
    return (
      <div className="dashboard-container py-8">
        <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-12 text-center dark:border-red-900 dark:bg-red-950">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-lg font-semibold text-red-700 dark:text-red-400">
            Unable to Load Data
          </h2>
          <p className="mb-4 text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
          <button
            onClick={fetchDashboardData}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Job Market Skills Intelligence
        </h1>
        <p className="mt-2 text-muted-foreground">
          Discover the most in-demand skills, certifications, and degree requirements
          based on recent job postings.
        </p>
      </div>

      {/* Stats Cards */}
      {loading && !summary ? (
        <SkeletonStats />
      ) : summary ? (
        <StatsCards
          totalJobs={summary.total_jobs}
          totalSkills={summary.top_skills.length}
          totalCerts={summary.top_certifications.length}
          jobsToday={quickStats?.jobs_today}
        />
      ) : null}

      {/* Filters */}
      {filterOptions && (
        <div className="mt-6">
          <FilterBar
            filters={filters}
            filterOptions={filterOptions}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            onExport={handleExport}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="mt-8 space-y-8">
        {/* Top Skills */}
        {loading && !summary ? (
          <SkeletonTable rows={10} />
        ) : summary ? (
          <SkillsTable skills={summary.top_skills} />
        ) : null}

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {loading && !summary ? (
            <>
              <SkeletonChart />
              <SkeletonChart />
            </>
          ) : summary ? (
            <>
              <DegreeDistributionChart data={summary.degree_distribution} />
              <WorkTypeChart data={summary.work_type_distribution} />
            </>
          ) : null}
        </div>

        {/* Certifications */}
        {loading && !summary ? (
          <SkeletonTable rows={10} />
        ) : summary ? (
          <CertificationsTable certifications={summary.top_certifications} />
        ) : null}

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {loading && !summary ? (
            <>
              <SkeletonChart />
              <SkeletonChart />
            </>
          ) : summary ? (
            <>
              <SeniorityChart data={summary.seniority_distribution} />
              <TrendChart data={summary.recent_trend} />
            </>
          ) : null}
        </div>

        {/* Top Companies */}
        {summary && summary.top_companies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Top Hiring Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {summary.top_companies.slice(0, 20).map((company, index) => (
                  <button
                    key={index}
                    onClick={() => handleFilterChange("company", company.name)}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-sm hover:bg-accent"
                  >
                    <span className="font-medium">{company.name}</span>
                    <span className="text-muted-foreground">({company.count})</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Last Updated */}
      {summary && (
        <div className="mt-8 text-center text-xs text-muted-foreground">
          Data last updated:{" "}
          {new Date(summary.generated_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}
