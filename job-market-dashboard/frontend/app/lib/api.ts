/**
 * API client for the Job Market Intelligence backend.
 */

import type {
  DashboardSummary,
  FilterOptions,
  QuickStats,
  SkillDetail,
  CertificationDetail,
  DashboardFilters,
  ScrapeLog,
  AdminStats,
} from "@/app/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

class APIError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "APIError";
    this.status = status;
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new APIError(
      errorData.message || `API Error: ${response.status}`,
      response.status
    );
  }

  return response.json();
}

// Dashboard API
export async function getDashboardSummary(
  filters: Partial<DashboardFilters> = {}
): Promise<DashboardSummary> {
  const params = new URLSearchParams();

  if (filters.country) params.set("country", filters.country);
  if (filters.category) params.set("category", filters.category);
  if (filters.seniority) params.set("seniority", filters.seniority);
  if (filters.work_type) params.set("work_type", filters.work_type);
  if (filters.company) params.set("company", filters.company);
  if (filters.days) params.set("days", filters.days.toString());

  const query = params.toString();
  return fetchAPI<DashboardSummary>(
    `/dashboard/summary${query ? `?${query}` : ""}`
  );
}

export async function getFilterOptions(): Promise<FilterOptions> {
  return fetchAPI<FilterOptions>("/dashboard/filters");
}

export async function getQuickStats(): Promise<QuickStats> {
  return fetchAPI<QuickStats>("/dashboard/stats");
}

// Skills API
export async function getSkillDetails(
  skillId: number,
  days: number = 90
): Promise<SkillDetail> {
  return fetchAPI<SkillDetail>(`/skills/${skillId}?days=${days}`);
}

export async function searchSkills(
  query: string,
  limit: number = 50
): Promise<{ items: { id: number; name: string; total_mentions: number }[] }> {
  return fetchAPI(`/skills?search=${encodeURIComponent(query)}&limit=${limit}`);
}

// Certifications API
export async function getCertificationDetails(
  certId: number,
  days: number = 90
): Promise<CertificationDetail> {
  return fetchAPI<CertificationDetail>(`/certifications/${certId}?days=${days}`);
}

export async function searchCertifications(
  query: string,
  limit: number = 30
): Promise<{ items: { id: number; name: string; total_mentions: number }[] }> {
  return fetchAPI(
    `/certifications?search=${encodeURIComponent(query)}&limit=${limit}`
  );
}

// Export API
export function getExportUrl(
  type: "skills" | "certifications" | "full",
  filters: Partial<DashboardFilters> = {}
): string {
  const params = new URLSearchParams();

  if (filters.country) params.set("country", filters.country);
  if (filters.category) params.set("category", filters.category);
  if (filters.seniority) params.set("seniority", filters.seniority);
  if (filters.work_type) params.set("work_type", filters.work_type);
  if (filters.days) params.set("days", filters.days.toString());

  const query = params.toString();
  return `${API_BASE}/export/${type}${query ? `?${query}` : ""}`;
}

// Admin API (requires admin key)
export async function triggerScrape(
  adminKey: string,
  options: {
    categories?: string;
    locations?: string;
    remote_only?: boolean;
  } = {}
): Promise<{ status: string; message: string }> {
  const params = new URLSearchParams();
  if (options.categories) params.set("categories", options.categories);
  if (options.locations) params.set("locations", options.locations);
  if (options.remote_only) params.set("remote_only", "true");

  const query = params.toString();
  return fetchAPI(`/admin/scrape/trigger${query ? `?${query}` : ""}`, {
    method: "POST",
    headers: {
      "X-Admin-Key": adminKey,
    },
  });
}

export async function getScrapeLogs(
  adminKey: string,
  limit: number = 20
): Promise<ScrapeLog[]> {
  return fetchAPI(`/admin/scrape/logs?limit=${limit}`, {
    headers: {
      "X-Admin-Key": adminKey,
    },
  });
}

export async function getAdminStats(adminKey: string): Promise<AdminStats> {
  return fetchAPI("/admin/stats", {
    headers: {
      "X-Admin-Key": adminKey,
    },
  });
}

export async function clearCache(
  adminKey: string,
  pattern?: string
): Promise<{ message: string }> {
  const endpoint = pattern
    ? `/admin/cache/clear?pattern=${encodeURIComponent(pattern)}`
    : "/admin/cache/clear";

  return fetchAPI(endpoint, {
    method: "POST",
    headers: {
      "X-Admin-Key": adminKey,
    },
  });
}
