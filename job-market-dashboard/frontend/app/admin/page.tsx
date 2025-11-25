"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Skeleton } from "@/app/components/ui/Skeleton";
import {
  triggerScrape,
  getScrapeLogs,
  getAdminStats,
  clearCache,
} from "@/app/lib/api";
import { formatNumber, formatRelativeDate } from "@/app/lib/utils";
import type { ScrapeLog, AdminStats } from "@/app/types";
import {
  Settings,
  Play,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Database,
  BarChart3,
} from "lucide-react";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<ScrapeLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check for saved admin key
  useEffect(() => {
    const savedKey = localStorage.getItem("adminKey");
    if (savedKey) {
      setAdminKey(savedKey);
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated && adminKey) {
      fetchAdminData();
    }
  }, [isAuthenticated, adminKey]);

  async function fetchAdminData() {
    setLoading(true);
    try {
      const [statsData, logsData] = await Promise.all([
        getAdminStats(adminKey),
        getScrapeLogs(adminKey),
      ]);
      setStats(statsData);
      setLogs(logsData);
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
      setMessage({ type: "error", text: "Failed to fetch admin data. Check your admin key." });
      setIsAuthenticated(false);
      localStorage.removeItem("adminKey");
    } finally {
      setLoading(false);
    }
  }

  function handleLogin() {
    if (!adminKey.trim()) {
      setMessage({ type: "error", text: "Please enter an admin key." });
      return;
    }
    localStorage.setItem("adminKey", adminKey);
    setIsAuthenticated(true);
    setMessage(null);
  }

  function handleLogout() {
    localStorage.removeItem("adminKey");
    setAdminKey("");
    setIsAuthenticated(false);
    setStats(null);
    setLogs([]);
  }

  async function handleTriggerScrape() {
    setScraping(true);
    setMessage(null);
    try {
      const result = await triggerScrape(adminKey);
      setMessage({ type: "success", text: result.message });
      // Refresh logs after a delay
      setTimeout(fetchAdminData, 2000);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to trigger scrape." });
    } finally {
      setScraping(false);
    }
  }

  async function handleClearCache() {
    setClearing(true);
    setMessage(null);
    try {
      const result = await clearCache(adminKey);
      setMessage({ type: "success", text: result.message });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to clear cache." });
    } finally {
      setClearing(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>;
      case "running":
        return <Badge variant="primary"><RefreshCw className="mr-1 h-3 w-3 animate-spin" />Running</Badge>;
      case "failed":
        return <Badge variant="danger"><XCircle className="mr-1 h-3 w-3" />Failed</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="dashboard-container py-8">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Admin Access
              </CardTitle>
              <CardDescription>
                Enter your admin key to access administrative functions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {message && (
                <div
                  className={`mb-4 rounded-lg p-3 text-sm ${
                    message.type === "error"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  }`}
                >
                  {message.text}
                </div>
              )}
              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="Admin Key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button onClick={handleLogin} className="w-full">
                  Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Manage scraping jobs and clear caches
          </p>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 rounded-lg p-4 ${
            message.type === "error"
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "error" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : stats ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Database className="h-4 w-4" />
                Total Jobs
              </div>
              <div className="mt-1 text-3xl font-bold">
                {formatNumber(stats.totals.jobs)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                Jobs This Week
              </div>
              <div className="mt-1 text-3xl font-bold">
                {formatNumber(stats.jobs_this_week)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Successful Scrapes
              </div>
              <div className="mt-1 text-3xl font-bold text-green-600">
                {stats.scrapes.successful}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <XCircle className="h-4 w-4 text-red-500" />
                Failed Scrapes
              </div>
              <div className="mt-1 text-3xl font-bold text-red-600">
                {stats.scrapes.failed}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Actions */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Trigger Scrape
            </CardTitle>
            <CardDescription>
              Start a new scraping job to collect fresh job data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleTriggerScrape}
              disabled={scraping}
              className="w-full"
            >
              {scraping ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Scrape
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Clear Cache
            </CardTitle>
            <CardDescription>
              Clear all cached dashboard data to force fresh queries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleClearCache}
              disabled={clearing}
              className="w-full"
            >
              {clearing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Cache
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Scrape Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Scrape Jobs</CardTitle>
            <CardDescription>History of scraping operations</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchAdminData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center text-muted-foreground">No scrape jobs yet.</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(log.status)}
                      <span className="text-sm text-muted-foreground">
                        {log.source}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <span>Started: {formatRelativeDate(log.started_at)}</span>
                      {log.duration_seconds && (
                        <span className="ml-4">Duration: {log.duration_seconds}s</span>
                      )}
                    </div>
                    {log.error_message && (
                      <div className="mt-2 text-sm text-red-500">
                        Error: {log.error_message}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {formatNumber(log.jobs_found)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      jobs found
                    </div>
                    <div className="text-sm text-green-600">
                      +{formatNumber(log.jobs_new)} new
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
