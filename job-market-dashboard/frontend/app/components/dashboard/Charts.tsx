"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  CHART_COLOR_PALETTE,
  DEGREE_LABELS,
  WORK_TYPE_LABELS,
  SENIORITY_LABELS,
  formatNumber,
} from "@/app/lib/utils";
import type {
  DegreeDistribution,
  WorkTypeDistribution,
  SeniorityDistribution,
  TrendDataPoint,
} from "@/app/types";
import { GraduationCap, MapPin, BarChart3, TrendingUp } from "lucide-react";

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="mb-1 font-medium text-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatNumber(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Degree Distribution Chart
interface DegreeChartProps {
  data: DegreeDistribution[];
}

export function DegreeDistributionChart({ data }: DegreeChartProps) {
  const chartData = data.map((item) => ({
    name: DEGREE_LABELS[item.degree] || item.degree,
    value: item.count,
    percentage: item.percentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-green-500" />
          Degree Requirements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percentage }) =>
                  percentage > 5 ? `${percentage.toFixed(0)}%` : ""
                }
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                formatter={(value: string) => (
                  <span className="text-sm text-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Work Type Distribution Chart
interface WorkTypeChartProps {
  data: WorkTypeDistribution[];
}

export function WorkTypeChart({ data }: WorkTypeChartProps) {
  const chartData = data.map((item) => ({
    name: WORK_TYPE_LABELS[item.type] || item.type,
    value: item.count,
    percentage: item.percentage,
  }));

  const colors = {
    Remote: "#22c55e",
    Hybrid: "#f59e0b",
    "On-site": "#3b82f6",
    "Not Specified": "#6b7280",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-500" />
          Work Arrangement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[entry.name as keyof typeof colors] || "#6b7280"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Seniority Distribution Chart
interface SeniorityChartProps {
  data: SeniorityDistribution[];
}

export function SeniorityChart({ data }: SeniorityChartProps) {
  const chartData = data
    .filter((item) => item.level !== "unknown")
    .map((item) => ({
      name: SENIORITY_LABELS[item.level] || item.level,
      value: item.count,
      percentage: item.percentage,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-violet-500" />
          Seniority Levels
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Job Trend Chart
interface TrendChartProps {
  data: TrendDataPoint[];
  title?: string;
}

export function TrendChart({ data, title = "Job Posting Trend" }: TrendChartProps) {
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    count: item.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-cyan-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#colorCount)"
                name="Jobs"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Skill Trend Chart (for detail pages)
interface SkillTrendChartProps {
  data: TrendDataPoint[];
  skillName: string;
}

export function SkillTrendChart({ data, skillName }: SkillTrendChartProps) {
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    count: item.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Trend for "{skillName}" (Last 90 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Mentions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
