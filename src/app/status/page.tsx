"use client";

import { useEffect, useState } from "react";

const API_BASE = "https://apix.cubeocean.web.id/api/status";
const POLL_INTERVAL_MS = 60_000; // re-check every 60s, same cadence as the old revalidate

// ─── Types ────────────────────────────────────────────────────────────────────
// Shapes match the official API docs exactly — no guessing, no fallback chains.

type HealthItem = {
  id: number;
  url: string;
  label: string;
  added_by: string;
  is_healthy: number;
  status_code: number | null;
  response_time_ms: number | null;
  last_checked: string | null;
  created_at: string;
  uptime_24h: number | null;
};

type StatusItem = {
  id: number;
  host: string;
  port: number;
  label: string;
  added_by: string;
  is_online: number;
  latency_ms: number | null;
  last_checked: string | null;
  created_at: string;
  uptime_24h: number | null;
};

type Incident = {
  id: number;
  title: string;
  severity: string;
  description: string;
  status: string;
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
};

// ─── Grouping ─────────────────────────────────────────────────────────────────
// The API has no `category` field on health/checks items, so groups are
// derived from keywords found in `label` (case-insensitive).

const GROUP_KEYWORDS: { group: string; keywords: string[] }[] = [
  { group: "API", keywords: ["api"] },
  { group: "Database", keywords: ["db", "database", "postgres", "mysql", "redis", "mongo"] },
  { group: "Bot", keywords: ["bot"] },
  { group: "Website", keywords: ["website", "web", "site", "frontend"] },
];

function groupForLabel(label: string): string {
  const lower = label.toLowerCase();
  for (const { group, keywords } of GROUP_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) return group;
  }
  return "Other";
}

function groupByLabel<T extends { label: string }>(items: T[]): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  for (const item of items) {
    const group = groupForLabel(item.label);
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(item);
  }
  return grouped;
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────
// Correct paths per docs: /api/status/health and /api/status/checks
// (no "/overview" suffix — that endpoint doesn't exist in this API).

async function fetchHealth(): Promise<HealthItem[]> {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function fetchChecks(): Promise<StatusItem[]> {
  try {
    const res = await fetch(`${API_BASE}/checks`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function fetchIncidents(): Promise<Incident[]> {
  try {
    const res = await fetch(`${API_BASE}/incidents`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

// ─── Row components ───────────────────────────────────────────────────────────
// No SlotBar here: the API doesn't return a `slots` timeline array anywhere
// in the docs, so the per-check timeline bar from the original design isn't
// backed by real data. Uptime % and latency are shown instead.

function HealthRow({ item }: { item: HealthItem }) {
  const healthy = item.is_healthy === 1;
  return (
    <div className="px-6 py-4 border-b border-base-border last:border-b-0">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-body text-sm font-medium text-ink">{item.label}</p>
          <p className="font-mono text-xs text-ink-faint mt-0.5">
            {item.uptime_24h !== null ? `${item.uptime_24h.toFixed(2)}% uptime` : "No data yet"}
            {item.response_time_ms ? ` · ${item.response_time_ms}ms` : ""}
          </p>
        </div>
        <span className={`flex items-center gap-1.5 font-mono text-xs ${healthy ? "text-signal-teal" : "text-red-400"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${healthy ? "bg-signal-teal" : "bg-red-500"}`} />
          {healthy ? "Healthy" : "Unhealthy"}
        </span>
      </div>
    </div>
  );
}

function StatusRow({ item }: { item: StatusItem }) {
  const online = item.is_online === 1;
  return (
    <div className="px-6 py-4 border-b border-base-border last:border-b-0">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-body text-sm font-medium text-ink">{item.label}</p>
          <p className="font-mono text-xs text-ink-faint mt-0.5">
            {item.uptime_24h !== null ? `${item.uptime_24h.toFixed(2)}% uptime` : "No data yet"}
            {item.latency_ms ? ` · ${item.latency_ms}ms` : ""}
          </p>
        </div>
        <span className={`flex items-center gap-1.5 font-mono text-xs ${online ? "text-signal-teal" : "text-red-400"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-signal-teal" : "bg-red-500"}`} />
          {online ? "Online" : "Offline"}
        </span>
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="px-6 py-4 border-b border-base-border last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="w-2/3">
          <div className="h-4 w-1/2 animate-pulse rounded bg-base-border" />
          <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-base-border" />
        </div>
        <div className="h-3 w-16 animate-pulse rounded bg-base-border" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StatusPage() {
  const [health, setHealth] = useState<HealthItem[]>([]);
  const [checks, setChecks] = useState<StatusItem[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      const [h, c, i] = await Promise.all([fetchHealth(), fetchChecks(), fetchIncidents()]);
      if (cancelled) return;
      setHealth(h);
      setChecks(c);
      setIncidents(i);
      setLoading(false);
    }

    loadAll();
    const interval = setInterval(loadAll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const allHealthy =
    health.every((h) => h.is_healthy === 1) && checks.every((c) => c.is_online === 1);
  const hasOpenIncidents = incidents.some((i) => i.status === "open");

  const statusLabel = loading
    ? "Checking systems"
    : hasOpenIncidents
    ? "Partial degradation"
    : !allHealthy
    ? "Issues detected"
    : "All systems operational";

  const statusColor = allHealthy && !hasOpenIncidents ? "text-signal-teal" : "text-signal-amber";
  const statusBg =
    allHealthy && !hasOpenIncidents
      ? "border-signal-teal/40 bg-signal-teal/10"
      : "border-signal-amber/40 bg-signal-amber/10";
  const statusDot = allHealthy && !hasOpenIncidents ? "bg-signal-teal" : "bg-signal-amber";

  const healthGroups = Object.entries(groupByLabel(health));
  const checksGroups = Object.entries(groupByLabel(checks));

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      {/* Header */}
      <div className="flex flex-col gap-8 border-b border-base-border pb-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-wider text-signal-teal">Status</p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-ink md:text-5xl">
            Infrastructure, in the open
          </h1>
          <p className="mt-5 font-body text-base leading-relaxed text-ink-muted">
            Every domain check and node we run, refreshed every minute.
          </p>
        </div>
        <div className={`flex items-center gap-3 rounded-full border ${statusBg} px-4 py-2.5`}>
          <span className={`h-2 w-2 animate-pulse rounded-full ${statusDot}`} />
          <span className={`font-mono text-sm ${statusColor}`}>{statusLabel}</span>
        </div>
      </div>

      {/* Health checks — grouped by label keyword */}
      {loading ? (
        <div className="mt-14">
          <h2 className="font-display text-xl font-semibold text-ink">Website &amp; API Health</h2>
          <p className="mt-1 font-body text-sm text-ink-muted">HTTP/HTTPS checks</p>
          <div className="mt-6 overflow-hidden rounded-2xl border border-base-border bg-base-raised">
            <RowSkeleton />
            <RowSkeleton />
          </div>
        </div>
      ) : (
        healthGroups.length > 0 && (
          <div className="mt-14">
            <h2 className="font-display text-xl font-semibold text-ink">Website &amp; API Health</h2>
            <p className="mt-1 font-body text-sm text-ink-muted">HTTP/HTTPS checks</p>

            <div className="mt-6 space-y-8">
              {healthGroups.map(([group, items]) => (
                <div key={group}>
                  <h3 className="font-mono text-xs uppercase tracking-wider text-ink-faint mb-3">
                    {group}
                  </h3>
                  <div className="overflow-hidden rounded-2xl border border-base-border bg-base-raised">
                    {items.map((item) => (
                      <HealthRow key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* TCP checks — grouped by label keyword */}
      {!loading && checksGroups.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-xl font-semibold text-ink">Node &amp; Infrastructure</h2>
          <p className="mt-1 font-body text-sm text-ink-muted">TCP checks</p>

          <div className="mt-6 space-y-8">
            {checksGroups.map(([group, items]) => (
              <div key={group}>
                <h3 className="font-mono text-xs uppercase tracking-wider text-ink-faint mb-3">
                  {group}
                </h3>
                <div className="overflow-hidden rounded-2xl border border-base-border bg-base-raised">
                  {items.map((item) => (
                    <StatusRow key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && healthGroups.length === 0 && checksGroups.length === 0 && (
        <div className="mt-14 rounded-2xl border border-base-border p-12 text-center">
          <p className="font-body text-sm text-ink-muted">No data</p>
        </div>
      )}

      {/* Incidents */}
      <div className="mt-14">
        <h2 className="font-display text-xl font-semibold text-ink">Incident history</h2>
        <div className="mt-6 space-y-px overflow-hidden rounded-2xl border border-base-border">
          {loading ? (
            <div className="bg-base-raised px-6 py-8 text-center font-body text-sm text-ink-muted">
              Loading incidents…
            </div>
          ) : incidents.length > 0 ? (
            incidents.map((inc) => (
              <div key={inc.id} className="bg-base-raised px-6 py-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs text-ink-faint">
                    {new Date(inc.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${
                      inc.severity === "critical"
                        ? "border-red-500/40 text-red-400"
                        : inc.severity === "high"
                        ? "border-signal-amber/40 text-signal-amber"
                        : "border-base-border text-ink-muted"
                    }`}
                  >
                    {inc.severity}
                  </span>
                  <span className="rounded-full border border-base-border px-2.5 py-0.5 font-mono text-[11px] text-ink-muted">
                    {inc.status}
                  </span>
                </div>
                <p className="mt-2 font-body text-sm font-medium text-ink">{inc.title}</p>
                <p className="mt-1.5 font-body text-sm leading-relaxed text-ink-muted">{inc.description}</p>
              </div>
            ))
          ) : (
            <div className="bg-base-raised px-6 py-8 text-center font-body text-sm text-ink-muted">
              No incidents recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}