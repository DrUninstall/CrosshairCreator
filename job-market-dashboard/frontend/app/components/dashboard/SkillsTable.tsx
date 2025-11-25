"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { formatNumber } from "@/app/lib/utils";
import type { Skill } from "@/app/types";
import { ChevronRight, Code2, Users } from "lucide-react";
import Link from "next/link";

interface SkillsTableProps {
  skills: Skill[];
  title?: string;
  maxItems?: number;
  showViewAll?: boolean;
}

export function SkillsTable({
  skills,
  title = "Top 50 In-Demand Skills",
  maxItems = 50,
  showViewAll = true,
}: SkillsTableProps) {
  const [expanded, setExpanded] = useState(false);
  const displaySkills = expanded ? skills.slice(0, maxItems) : skills.slice(0, 20);

  const maxCount = skills[0]?.count || 1;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        {skills.length > 20 && (
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
                <th className="pb-3 text-left font-medium">Skill</th>
                <th className="pb-3 text-left font-medium">Type</th>
                <th className="pb-3 text-right font-medium">Mentions</th>
                <th className="pb-3 text-left font-medium">Frequency</th>
              </tr>
            </thead>
            <tbody>
              {displaySkills.map((skill, index) => (
                <tr
                  key={skill.id}
                  className="group border-b border-border/50 hover:bg-muted/50"
                >
                  <td className="py-3 text-muted-foreground">{index + 1}</td>
                  <td className="py-3">
                    <Link
                      href={`/skill/${skill.id}`}
                      className="flex items-center gap-2 font-medium text-foreground hover:text-primary"
                    >
                      {skill.name}
                      <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </td>
                  <td className="py-3">
                    <Badge variant={skill.is_hard_skill ? "primary" : "secondary"}>
                      {skill.is_hard_skill ? "Hard" : "Soft"}
                    </Badge>
                  </td>
                  <td className="py-3 text-right font-medium">
                    {formatNumber(skill.count)}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${(skill.count / maxCount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {((skill.count / maxCount) * 100).toFixed(0)}%
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
