"use client";

import { useEffect, useState } from "react";

const API_BASE = "https://apix.cubeocean.web.id/api/status";
const POLL_INTERVAL_MS = 60_000; // re-check every 60s, same cadence as the old revalidate

// ─── Uptime bar config ─────────────────────────────────────────────────────────
// 72 boxes covering 24h => each box represents a 20-minute bucket.
// Checks run every 2 minutes, so each bucket aggregates up to 10 raw results.
const BUCKET_COUNT = 72;
const BUCKET_MINUTES = 20;
const WINDOW_HOURS = 24;
const CHECK_INTERVAL_MINUTES = 2;
// Raw results needed to cover the full 24h window at a 2-minute cadence.
const RESULTS_LIMIT = Math.ceil((WINDOW_HOURS * 60) / CHECK_INTERVAL_MINUTES); // 720

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

type HealthResult = {
  id: number;
  check_id: number;
  is_healthy: number;
  status_code: number | null;
  response_time_ms: number | null;
  error: string | null;
  checked_at: string;
};

type StatusResult = {
  id: number;
  check_id: number;
  is_online: number;
  latency_ms: number | null;
  checked_at: string;
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

// ─── Bucket model ─────────────────────────────────────────────────────────────
// Every uptime bar renders the same shape regardless of source (health vs
// TCP checks), so results are normalized to a single "ok" boolean before
// bucketing.

type BucketStatus = "up" | "down" | "degraded" | "no-data";

type Bucket = {
  status: BucketStatus;
  startTime: number; // epoch ms
  endTime: number; // epoch ms
  count: number; // raw results aggregated into this bucket
};

type NormalizedResult = {
  ok: boolean;
  checked_at: string;
};

// ─── Timestamp parsing ─────────────────────────────────────────────────────────
// The API returns "checked_at" as "YYYY-MM-DD HH:mm:ss" with no "T" and no
// timezone offset (see docs: "2026-06-23 10:00:00"). That shape is outside
// ISO 8601, so `new Date(...)` parses it inconsistently across engines —
// some treat it as UTC, others as the browser's local time, and some return
// Invalid Date. The server stores/returns these in UTC, so we parse the
// pieces ourselves and build the UTC instant explicitly. Display formatting
// (toLocaleTimeString etc.) is left to do its normal job of converting that
// instant to whatever timezone the user's device is set to.
function parseServerTimestamp(value: string): number {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/
  );
  if (!match) return NaN;
  const [, y, mo, d, h, mi, s] = match;
  return Date.UTC(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(s)
  );
}

function bucketize(results: NormalizedResult[]): Bucket[] {
  const now = Date.now();
  const bucketMs = BUCKET_MINUTES * 60_000;
  const windowMs = WINDOW_HOURS * 60 * 60_000;
  const windowStart = now - windowMs;

  // raw[0] = oldest (24h ago), raw[BUCKET_COUNT - 1] = most recent
  const raw: NormalizedResult[][] = Array.from({ length: BUCKET_COUNT }, () => []);

  for (const r of results) {
    const t = parseServerTimestamp(r.checked_at);
    if (Number.isNaN(t) || t < windowStart || t > now) continue;
    const idx = Math.min(
      BUCKET_COUNT - 1,
      Math.floor((t - windowStart) / bucketMs)
    );
    raw[idx].push(r);
  }

  return raw.map((bucket, i) => {
    const startTime = windowStart + i * bucketMs;
    const endTime = startTime + bucketMs;

    let status: BucketStatus;
    if (bucket.length === 0) {
      status = "no-data";
    } else {
      const upCount = bucket.filter((b) => b.ok).length;
      status = upCount === bucket.length ? "up" : upCount === 0 ? "down" : "degraded";
    }

    return { status, startTime, endTime, count: bucket.length };
  });
}

// ─── Time formatting ──────────────────────────────────────────────────────────
// Renders in the viewer's own device timezone (no `timeZone` override passed
// to Intl), so two people in different countries see different wall-clock
// times for the same bucket — which is the correct behavior. Shows a date
// prefix only when the bucket's day differs from today, so the common case
// (today) stays compact: "14:20–14:40". Crossing midnight shows
// "Jun 24, 23:40–00:00".

function formatBucketRange(startTime: number, endTime: number): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();

  const timeFmt = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  const isToday = start.toDateString() === now.toDateString();
  const startStr = timeFmt(start);
  const endStr = timeFmt(end);

  if (isToday) return `${startStr}\u2013${endStr}`;

  const dateFmt = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${dateFmt}, ${startStr}\u2013${endStr}`;
}

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

async function fetchHealthResults(id: number): Promise<HealthResult[]> {
  try {
    const res = await fetch(`${API_BASE}/health/${id}/results?limit=${RESULTS_LIMIT}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.results ?? [];
  } catch {
    return [];
  }
}

async function fetchCheckResults(id: number): Promise<StatusResult[]> {
  try {
    const res = await fetch(`${API_BASE}/checks/${id}/results?limit=${RESULTS_LIMIT}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.results ?? [];
  } catch {
    return [];
  }
}

// ─── Uptime bar ───────────────────────────────────────────────────────────────
// Renders 72 boxes (20-minute buckets) covering the last 24 hours.
// Green = up, Red = down, Amber = degraded (mixed), Gray = no data.

const BUCKET_COLOR: Record<BucketStatus, string> = {
  up: "bg-signal-teal",
  down: "bg-red-500",
  degraded: "bg-signal-amber",
  "no-data": "bg-base-border",
};

const BUCKET_LABEL: Record<BucketStatus, string> = {
  up: "Healthy",
  down: "Down",
  degraded: "Degraded",
  "no-data": "No data",
};

function UptimeBar({ buckets }: { buckets: Bucket[] }) {
  return (
    <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex h-6 items-end gap-[2px] sm:gap-[3px]">
        {buckets.map((bucket, i) => (
          <div
            key={i}
            title={`${BUCKET_LABEL[bucket.status]} \u00b7 ${formatBucketRange(
              bucket.startTime,
              bucket.endTime
            )}`}
            className={`h-6 w-[6px] shrink-0 rounded-sm sm:w-auto sm:flex-1 ${BUCKET_COLOR[bucket.status]}`}
          />
        ))}
      </div>
    </div>
  );
}

function UptimeBarSkeleton() {
  return (
    <div className="flex h-6 items-end gap-[2px] overflow-hidden sm:gap-[3px]">
      {Array.from({ length: BUCKET_COUNT }).map((_, i) => (
        <div
          key={i}
          className="h-6 w-[6px] shrink-0 animate-pulse rounded-sm bg-base-border sm:w-auto sm:flex-1"
        />
      ))}
    </div>
  );
}

// ─── Row components ───────────────────────────────────────────────────────────

function HealthRow({ item, buckets }: { item: HealthItem; buckets: Bucket[] | null }) {
  const healthy = item.is_healthy === 1;
  return (
    <div className="px-4 py-4 border-b border-base-border last:border-b-0 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="sm:min-w-[180px] sm:shrink-0">
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${healthy ? "bg-signal-teal" : "bg-red-500"}`} />
            <p className="font-body text-sm font-medium text-ink truncate">{item.label}</p>
          </div>
          <p className="font-mono text-xs text-ink-faint mt-0.5">
            {item.uptime_24h !== null ? `${item.uptime_24h.toFixed(2)}% uptime` : "No data yet"}
            {item.response_time_ms ? ` · ${item.response_time_ms}ms` : ""}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          {buckets ? <UptimeBar buckets={buckets} /> : <UptimeBarSkeleton />}
          <div className="mt-1 flex justify-between font-mono text-[10px] text-ink-faint">
            <span>{WINDOW_HOURS}h ago</span>
            <span>now</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ item, buckets }: { item: StatusItem; buckets: Bucket[] | null }) {
  const online = item.is_online === 1;
  return (
    <div className="px-4 py-4 border-b border-base-border last:border-b-0 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="sm:min-w-[180px] sm:shrink-0">
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${online ? "bg-signal-teal" : "bg-red-500"}`} />
            <p className="font-body text-sm font-medium text-ink truncate">{item.label}</p>
          </div>
          <p className="font-mono text-xs text-ink-faint mt-0.5">
            {item.uptime_24h !== null ? `${item.uptime_24h.toFixed(2)}% uptime` : "No data yet"}
            {item.latency_ms ? ` · ${item.latency_ms}ms` : ""}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          {buckets ? <UptimeBar buckets={buckets} /> : <UptimeBarSkeleton />}
          <div className="mt-1 flex justify-between font-mono text-[10px] text-ink-faint">
            <span>{WINDOW_HOURS}h ago</span>
            <span>now</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="px-4 py-4 border-b border-base-border last:border-b-0 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="sm:min-w-[180px] sm:shrink-0">
          <div className="h-4 w-28 animate-pulse rounded bg-base-border" />
          <div className="mt-2 h-3 w-20 animate-pulse rounded bg-base-border" />
        </div>
        <div className="min-w-0 flex-1">
          <UptimeBarSkeleton />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StatusPage() {
  const [health, setHealth] = useState<HealthItem[]>([]);
  const [checks, setChecks] = useState<StatusItem[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [healthBuckets, setHealthBuckets] = useState<Record<number, Bucket[]>>({});
  const [checkBuckets, setCheckBuckets] = useState<Record<number, Bucket[]>>({});
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

      // Histories are fetched after the lists resolve, in parallel, and
      // applied incrementally per item so bars render progressively
      // instead of blocking on the slowest one.
      h.forEach((item) => {
        fetchHealthResults(item.id).then((results) => {
          if (cancelled) return;
          const normalized: NormalizedResult[] = results.map((r) => ({
            ok: r.is_healthy === 1,
            checked_at: r.checked_at,
          }));
          setHealthBuckets((prev) => ({ ...prev, [item.id]: bucketize(normalized) }));
        });
      });

      c.forEach((item) => {
        fetchCheckResults(item.id).then((results) => {
          if (cancelled) return;
          const normalized: NormalizedResult[] = results.map((r) => ({
            ok: r.is_online === 1,
            checked_at: r.checked_at,
          }));
          setCheckBuckets((prev) => ({ ...prev, [item.id]: bucketize(normalized) }));
        });
      });
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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
      {/* Header */}
      <div className="flex flex-col gap-6 border-b border-base-border pb-8 sm:gap-8 sm:pb-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-wider text-signal-teal">Status</p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-ink sm:mt-4 sm:text-4xl md:text-5xl">
            Infrastructure, in the open
          </h1>
          <p className="mt-4 font-body text-sm leading-relaxed text-ink-muted sm:mt-5 sm:text-base">
            Every domain check and node we run, refreshed every minute.
          </p>
        </div>
        <div className={`flex items-center gap-3 self-start rounded-full border ${statusBg} px-4 py-2.5 md:self-auto`}>
          <span className={`h-2 w-2 shrink-0 animate-pulse rounded-full ${statusDot}`} />
          <span className={`font-mono text-sm ${statusColor}`}>{statusLabel}</span>
        </div>
      </div>

      {/* Health checks — grouped by label keyword */}
      {loading ? (
        <div className="mt-10 sm:mt-14">
          <h2 className="font-display text-xl font-semibold text-ink">Website &amp; API Health</h2>
          <p className="mt-1 font-body text-sm text-ink-muted">HTTP/HTTPS checks</p>
          <div className="mt-6 overflow-hidden rounded-2xl border border-base-border bg-base-raised">
            <RowSkeleton />
            <RowSkeleton />
          </div>
        </div>
      ) : (
        healthGroups.length > 0 && (
          <div className="mt-10 sm:mt-14">
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
                      <HealthRow key={item.id} item={item} buckets={healthBuckets[item.id] ?? null} />
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
        <div className="mt-10 sm:mt-14">
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
                    <StatusRow key={item.id} item={item} buckets={checkBuckets[item.id] ?? null} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && healthGroups.length === 0 && checksGroups.length === 0 && (
        <div className="mt-10 rounded-2xl border border-base-border p-8 text-center sm:mt-14 sm:p-12">
          <p className="font-body text-sm text-ink-muted">No data</p>
        </div>
      )}

      {/* Incidents */}
      <div className="mt-10 sm:mt-14">
        <h2 className="font-display text-xl font-semibold text-ink">Incident history</h2>
        <div className="mt-6 space-y-px overflow-hidden rounded-2xl border border-base-border">
          {loading ? (
            <div className="bg-base-raised px-4 py-8 text-center font-body text-sm text-ink-muted sm:px-6">
              Loading incidents…
            </div>
          ) : incidents.length > 0 ? (
            incidents.map((inc) => (
              <div key={inc.id} className="bg-base-raised px-4 py-5 sm:px-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs text-ink-faint">
                    {new Date(parseServerTimestamp(inc.created_at)).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
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
            <div className="bg-base-raised px-4 py-8 text-center font-body text-sm text-ink-muted sm:px-6">
              No incidents recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}