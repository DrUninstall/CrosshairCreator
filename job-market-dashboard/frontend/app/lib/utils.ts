import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(dateString);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function capitalize(text: string): string {
  return text
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

// Colors for charts
export const CHART_COLORS = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  muted: "#6b7280",
};

export const CHART_COLOR_PALETTE = [
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#f97316", // orange
  "#14b8a6", // teal
  "#a855f7", // purple
];

// Degree level display names
export const DEGREE_LABELS: Record<string, string> = {
  none_required: "No Degree Required",
  high_school: "High School",
  associate: "Associate's",
  bachelor: "Bachelor's",
  master: "Master's",
  mba: "MBA",
  phd: "PhD",
  professional: "Professional (JD, MD)",
  unknown: "Not Specified",
};

// Work type display names
export const WORK_TYPE_LABELS: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
  unknown: "Not Specified",
};

// Seniority level display names
export const SENIORITY_LABELS: Record<string, string> = {
  intern: "Intern",
  junior: "Junior",
  mid: "Mid-Level",
  senior: "Senior",
  lead: "Lead/Staff",
  staff: "Staff",
  principal: "Principal",
  director: "Director",
  vp: "VP",
  executive: "Executive",
  unknown: "Not Specified",
};

// Job category display names
export const CATEGORY_LABELS: Record<string, string> = {
  software_engineering: "Software Engineering",
  data_science: "Data Science",
  data_engineering: "Data Engineering",
  machine_learning: "Machine Learning",
  devops: "DevOps & SRE",
  product_management: "Product Management",
  design: "Design",
  marketing: "Marketing",
  sales: "Sales",
  finance: "Finance",
  hr: "Human Resources",
  operations: "Operations",
  legal: "Legal",
  consulting: "Consulting",
  healthcare: "Healthcare",
  other: "Other",
};
