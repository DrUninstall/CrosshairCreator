"use client";

import { Select } from "@/app/components/ui/Select";
import { Button } from "@/app/components/ui/Button";
import { capitalize } from "@/app/lib/utils";
import type { FilterOptions, DashboardFilters } from "@/app/types";
import { Filter, X, Download } from "lucide-react";

interface FilterBarProps {
  filters: DashboardFilters;
  filterOptions: FilterOptions;
  onFilterChange: (key: keyof DashboardFilters, value: string | number | null) => void;
  onClearFilters: () => void;
  onExport: () => void;
}

export function FilterBar({
  filters,
  filterOptions,
  onFilterChange,
  onClearFilters,
  onExport,
}: FilterBarProps) {
  const hasActiveFilters =
    filters.country || filters.category || filters.seniority || filters.work_type || filters.company;

  return (
    <div className="filter-bar">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">Filters</span>
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-3">
        {/* Country Filter */}
        <Select
          value={filters.country || ""}
          onChange={(e) => onFilterChange("country", e.target.value || null)}
          options={[
            { label: "All Countries", value: "" },
            ...filterOptions.countries.map((c) => ({ label: c, value: c })),
          ]}
          className="w-40"
        />

        {/* Category Filter */}
        <Select
          value={filters.category || ""}
          onChange={(e) => onFilterChange("category", e.target.value || null)}
          options={[
            { label: "All Categories", value: "" },
            ...filterOptions.categories.map((c) => ({
              label: capitalize(c),
              value: c,
            })),
          ]}
          className="w-48"
        />

        {/* Seniority Filter */}
        <Select
          value={filters.seniority || ""}
          onChange={(e) => onFilterChange("seniority", e.target.value || null)}
          options={[
            { label: "All Levels", value: "" },
            ...filterOptions.seniority_levels
              .filter((s) => s !== "unknown")
              .map((s) => ({
                label: capitalize(s),
                value: s,
              })),
          ]}
          className="w-36"
        />

        {/* Work Type Filter */}
        <Select
          value={filters.work_type || ""}
          onChange={(e) => onFilterChange("work_type", e.target.value || null)}
          options={[
            { label: "All Work Types", value: "" },
            { label: "Remote Only", value: "remote" },
            { label: "Hybrid", value: "hybrid" },
            { label: "On-site", value: "onsite" },
          ]}
          className="w-40"
        />

        {/* Date Range Filter */}
        <Select
          value={filters.days.toString()}
          onChange={(e) => onFilterChange("days", parseInt(e.target.value))}
          options={filterOptions.date_ranges.map((d) => ({
            label: d.label,
            value: d.value.toString(),
          }))}
          className="w-36"
        />

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground"
          >
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Export Button */}
      <Button variant="outline" size="sm" onClick={onExport}>
        <Download className="mr-1 h-4 w-4" />
        Export CSV
      </Button>
    </div>
  );
}
