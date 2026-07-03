"use client";

import * as React from "react";
import Link from "next/link";
import {
  Layers,
  CalendarClock,
  Clock,
  Rocket,
  FlaskConical,
  Code2,
  Undo2,
  Flame,
  Bug,
  ArrowUpCircle,
  ArrowRightCircle,
  Package,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendLineChart, SimpleBarChart } from "@/components/charts/simple-charts";
import { dashboardApi } from "@/lib/api/resources";
import { formatDateTime, fullName } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface Summary {
  totalVersions: number;
  todaysReleases: number;
  pendingReleases: number;
  productionReleases: number;
  uatReleases: number;
  developmentReleases: number;
  rollbackCount: number;
  hotfixCount: number;
  bugFixCount: number;
  majorReleases: number;
  minorReleases: number;
  productsCount: number;
}

interface Charts {
  monthlyReleases: { month: string; count: number }[];
  productWiseReleases: { name: string; count: number }[];
  environmentWiseReleases: { name: string; count: number }[];
  releaseTrend: { month: string; count: number }[];
  developerContribution: { name: string; count: number }[];
  bugFixTrend: { month: string; count: number }[];
  topUpdatedModules: { module: string; count: number }[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [charts, setCharts] = React.useState<Charts | null>(null);
  const [activity, setActivity] = React.useState<any[]>([]);
  const [deployments, setDeployments] = React.useState<any[]>([]);
  const [approvals, setApprovals] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      dashboardApi.summary(),
      dashboardApi.charts(),
      dashboardApi.recentActivity(),
      dashboardApi.latestDeployments(),
      dashboardApi.pendingApprovals(),
    ])
      .then(([s, c, a, d, ap]) => {
        setSummary(s as Summary);
        setCharts(c as Charts);
        setActivity(a as any[]);
        setDeployments(d as any[]);
        setApprovals(ap as any[]);
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = summary
    ? [
        { label: "Total Versions", value: summary.totalVersions, icon: Layers, accent: "#0ea5e9" },
        { label: "Today's Releases", value: summary.todaysReleases, icon: CalendarClock, accent: "#22c55e" },
        { label: "Pending Releases", value: summary.pendingReleases, icon: Clock, accent: "#f59e0b" },
        { label: "Production Releases", value: summary.productionReleases, icon: Rocket, accent: "#16a34a" },
        { label: "UAT Releases", value: summary.uatReleases, icon: FlaskConical, accent: "#eab308" },
        { label: "Development Releases", value: summary.developmentReleases, icon: Code2, accent: "#6366f1" },
        { label: "Rollback Count", value: summary.rollbackCount, icon: Undo2, accent: "#7c3aed" },
        { label: "Hotfix Count", value: summary.hotfixCount, icon: Flame, accent: "#dc2626" },
        { label: "Bug Fix Count", value: summary.bugFixCount, icon: Bug, accent: "#ef4444" },
        { label: "Major Releases", value: summary.majorReleases, icon: ArrowUpCircle, accent: "#0891b2" },
        { label: "Minor Releases", value: summary.minorReleases, icon: ArrowRightCircle, accent: "#0d9488" },
        { label: "Products", value: summary.productsCount, icon: Package, accent: "#64748b" },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Welcome back, ${user?.firstName ?? ""}`} description="Executive overview of releases across every environment." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-[68px]" />)
          : cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Release Trend</CardTitle>
          </CardHeader>
          <CardContent>{loading || !charts ? <Skeleton className="h-[260px]" /> : <TrendLineChart data={charts.monthlyReleases} />}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bug Fix Trend</CardTitle>
          </CardHeader>
          <CardContent>{loading || !charts ? <Skeleton className="h-[260px]" /> : <TrendLineChart data={charts.bugFixTrend} />}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Product Wise Releases</CardTitle>
          </CardHeader>
          <CardContent>{loading || !charts ? <Skeleton className="h-[260px]" /> : <SimpleBarChart data={charts.productWiseReleases} />}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Environment Wise Releases</CardTitle>
          </CardHeader>
          <CardContent>{loading || !charts ? <Skeleton className="h-[260px]" /> : <SimpleBarChart data={charts.environmentWiseReleases} color="var(--color-chart-2)" />}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Developer Contribution</CardTitle>
          </CardHeader>
          <CardContent>{loading || !charts ? <Skeleton className="h-[260px]" /> : <SimpleBarChart data={charts.developerContribution} xKey="name" horizontal color="var(--color-chart-3)" />}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Updated Modules</CardTitle>
          </CardHeader>
          <CardContent>
            {loading || !charts ? <Skeleton className="h-[260px]" /> : <SimpleBarChart data={charts.topUpdatedModules} xKey="module" horizontal color="var(--color-chart-4)" />}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {approvals.length === 0 && <p className="text-sm text-muted-foreground">No pending approvals.</p>}
            {approvals.map((a) => (
              <div key={a.id} className="flex flex-col gap-0.5 rounded-md border p-2.5 text-sm">
                <span className="font-medium">{a.action.replaceAll("_", " ")}</span>
                <span className="text-xs text-muted-foreground">
                  Requested by {fullName(a.requestedBy)} · {formatDateTime(a.requestedAt)}
                </span>
              </div>
            ))}
            <Link href="/approvals" className="text-xs text-primary hover:underline">
              View all approvals →
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Latest Deployments</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {deployments.length === 0 && <p className="text-sm text-muted-foreground">No deployments recorded yet.</p>}
            {deployments.slice(0, 6).map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm">
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">{d.version?.releaseName}</span>
                  <span className="text-xs text-muted-foreground">{d.environment?.name} · {formatDateTime(d.deployedAt)}</span>
                </div>
                <Badge variant={d.result === "SUCCESS" ? "success" : d.result === "FAILED" ? "destructive" : "warning"}>{d.result}</Badge>
              </div>
            ))}
            <Link href="/deployments" className="text-xs text-primary hover:underline">
              View deployment history →
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {activity.length === 0 && <p className="text-sm text-muted-foreground">No recent activity.</p>}
            {activity.slice(0, 8).map((a) => (
              <div key={a.id} className="flex flex-col gap-0.5 text-sm">
                <span>
                  <span className="font-medium">{fullName(a.actor)}</span> {a.action.toLowerCase().replaceAll("_", " ")} {a.entityType?.toLowerCase().replaceAll("_", " ")}
                </span>
                <span className="text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
