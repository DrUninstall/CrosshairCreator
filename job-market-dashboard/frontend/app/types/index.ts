// API Response Types

export interface Skill {
  id: number;
  name: string;
  count: number;
  is_hard_skill: boolean;
}

export interface Certification {
  id: number;
  name: string;
  acronym?: string;
  provider?: string;
  category?: string;
  count: number;
}

export interface DegreeDistribution {
  degree: string;
  count: number;
  percentage: number;
}

export interface WorkTypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface SeniorityDistribution {
  level: string;
  count: number;
  percentage: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface Company {
  name: string;
  type?: string;
  count: number;
}

export interface TrendDataPoint {
  date: string;
  count: number;
}

export interface UniversityMention {
  name: string;
  count: number;
}

export interface DashboardSummary {
  total_jobs: number;
  top_skills: Skill[];
  top_certifications: Certification[];
  degree_distribution: DegreeDistribution[];
  notable_universities: UniversityMention[];
  work_type_distribution: WorkTypeDistribution[];
  seniority_distribution: SeniorityDistribution[];
  category_distribution: CategoryDistribution[];
  top_companies: Company[];
  recent_trend: TrendDataPoint[];
  filters_applied: DashboardFilters;
  generated_at: string;
}

export interface DashboardFilters {
  country?: string | null;
  category?: string | null;
  seniority?: string | null;
  work_type?: string | null;
  company?: string | null;
  days: number;
}

export interface FilterOptions {
  countries: string[];
  categories: string[];
  seniority_levels: string[];
  work_types: string[];
  companies: string[];
  date_ranges: { label: string; value: number }[];
}

export interface QuickStats {
  total_jobs: number;
  total_skills: number;
  total_certifications: number;
  jobs_today: number;
  last_updated: string;
}

export interface SkillDetail {
  id: number;
  name: string;
  total_mentions: number;
  trend: TrendDataPoint[];
  sample_jobs: SampleJob[];
}

export interface CertificationDetail {
  id: number;
  name: string;
  acronym?: string;
  provider?: string;
  category?: string;
  total_mentions: number;
  trend: TrendDataPoint[];
  sample_jobs: SampleJob[];
}

export interface SampleJob {
  id: number;
  title: string;
  company: string;
  location?: string;
  url?: string;
  posted_date?: string;
  work_type?: string;
}

export interface ScrapeLog {
  id: number;
  source: string;
  status: "pending" | "running" | "completed" | "failed" | "partial";
  jobs_found: number;
  jobs_new: number;
  duration_seconds?: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  triggered_by: string;
}

export interface AdminStats {
  totals: {
    jobs: number;
    skills: number;
    certifications: number;
  };
  jobs_this_week: number;
  scrapes: {
    successful: number;
    failed: number;
  };
  last_scrape?: {
    started_at: string;
    status: string;
    jobs_found: number;
  };
  generated_at: string;
}
