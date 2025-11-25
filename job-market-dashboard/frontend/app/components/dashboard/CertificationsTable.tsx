"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { formatNumber } from "@/app/lib/utils";
import type { Certification } from "@/app/types";
import { ChevronRight, Award } from "lucide-react";
import Link from "next/link";

interface CertificationsTableProps {
  certifications: Certification[];
  title?: string;
  maxItems?: number;
}

export function CertificationsTable({
  certifications,
  title = "Top 30 Certifications",
  maxItems = 30,
}: CertificationsTableProps) {
  const [expanded, setExpanded] = useState(false);
  const displayCerts = expanded ? certifications.slice(0, maxItems) : certifications.slice(0, 15);

  const maxCount = certifications[0]?.count || 1;

  // Group by provider for color coding
  const providerColors: Record<string, string> = {
    AWS: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    Google: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    Microsoft: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    CNCF: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    CompTIA: "bg-red-500/10 text-red-600 dark:text-red-400",
    PMI: "bg-green-500/10 text-green-600 dark:text-green-400",
    ISC2: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  };

  const getProviderColor = (provider?: string) => {
    if (!provider) return "bg-muted text-muted-foreground";
    return providerColors[provider] || "bg-muted text-muted-foreground";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          {title}
        </CardTitle>
        {certifications.length > 15 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-primary hover:underline"
          >
            {expanded ? "Show Less" : "Show All"}
          </button>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-3 text-left font-medium">#</th>
                <th className="pb-3 text-left font-medium">Certification</th>
                <th className="pb-3 text-left font-medium">Provider</th>
                <th className="pb-3 text-right font-medium">Mentions</th>
                <th className="pb-3 text-left font-medium">Frequency</th>
              </tr>
            </thead>
            <tbody>
              {displayCerts.map((cert, index) => (
                <tr
                  key={cert.id}
                  className="group border-b border-border/50 hover:bg-muted/50"
                >
                  <td className="py-3 text-muted-foreground">{index + 1}</td>
                  <td className="py-3">
                    <Link
                      href={`/certification/${cert.id}`}
                      className="flex flex-col hover:text-primary"
                    >
                      <span className="font-medium text-foreground group-hover:text-primary">
                        {cert.acronym || cert.name}
                      </span>
                      {cert.acronym && (
                        <span className="text-xs text-muted-foreground">
                          {cert.name}
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getProviderColor(cert.provider)}`}>
                      {cert.provider || "Other"}
                    </span>
                  </td>
                  <td className="py-3 text-right font-medium">
                    {formatNumber(cert.count)}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{
                            width: `${(cert.count / maxCount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {((cert.count / maxCount) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
