import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Infrastructure status",
  description:
    "Live status for nodes, DNS, and domain checks, plus incident history.",
  alternates: { canonical: "/status" },
  openGraph: {
    title: "Infrastructure status",
    description: "Live status for nodes, DNS, and domain checks, plus incident history.",
    url: "/status",
  },
};

const API_BASE = "https://apix.cubeocean.web.id/api/status";

// ─── Types ────────────────────────────────────────────────────────────────────

type Slot = {
  slot_start: string;
  status: "online" | "degraded" | "offline" | null;
  total: number;
  up_count: number;
  avg_value: number | null;
};

type HealthItem = {
  id: number;
  label: string;
  category: string;
  is_healthy: number;
  status_code: number | null;
  response_time_ms: number | null;
  last_checked: string | null;
  uptime_24h: number | null;
  slots: Slot[];
};

type StatusItem = {
  id: number;
  label: string;
  category: string;
  is_online: number;
  latency_ms: number | null;
  last_checked: string | null;
  uptime_24h: number | null;
  slots: Slot[];
};

type Grouped<T> = Record<string, T[]>;

type Incident = {
  id: number;
  title: string;
  description: string;
  severity: string;
  status: string;
  created_at: string;
};

type ShardRegion = {
  region: string;
  shards: number;
  load: string;
};

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchHealthOverview(): Promise<{
  data: HealthItem[];
  grouped: Grouped<HealthItem>;
}> {
  try {
    const res = await fetch(`${API_BASE}/health/overview`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { data: [], grouped: {} };
    const json = await res.json();
    return {
      data: json.data || [],
      grouped: json.grouped || {},
    };
  } catch {
    return { data: [], grouped: {} };
  }
}

async function fetchChecksOverview(): Promise<{
  data: StatusItem[];
  grouped: Grouped<StatusItem>;
}> {
  try {
    const res = await fetch(`${API_BASE}/checks/overview`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { data: [], grouped: {} };
    const json = await res.json();
    return {
      data: json.data || [],
      grouped: json.grouped || {},
    };
  } catch {
    return { data: [], grouped: {} };
  }
}

async function fetchIncidents(): Promise<Incident[]> {
  try {
    const res = await fetch(`${API_BASE}/incidents`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

// ─── Slot bar component ───────────────────────────────────────────────────────

function SlotBar({ slots }: { slots: Slot[] }) {
  return (
    <div className="flex gap-px mt-3">
      {slots.map((slot, i) => {
        let bg = "bg-base-border"; // null = no data, grey
        if (slot.status === "online")   bg = "bg-signal-teal";
        if (slot.status === "degraded") bg = "bg-signal-amber";
        if (slot.status === "offline")  bg = "bg-red-500";

        const tooltip = slot.status === null
          ? "No data"
          : `${new Date(slot.slot_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — ${slot.status}${slot.avg_value ? ` · ${slot.avg_value}ms` : ""}`;

        return (
          <div
            key={i}
            title={tooltip}
            className={`h-8 flex-1 rounded-sm cursor-pointer transition-opacity hover:opacity-70 ${bg}`}
          />
        );
      })}
    </div>
  );
}

// ─── Row component ────────────────────────────────────────────────────────────

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
      <div className="flex justify-between mt-1">
        <span className="font-mono text-[10px] text-ink-faint">4h ago</span>
        <span className="font-mono text-[10px] text-ink-faint">now</span>
      </div>
      <SlotBar slots={item.slots} />
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
      <div className="flex justify-between mt-1">
        <span className="font-mono text-[10px] text-ink-faint">4h ago</span>
        <span className="font-mono text-[10px] text-ink-faint">now</span>
      </div>
      <SlotBar slots={item.slots} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function StatusPage() {
  const SHARD_SUMMARY: ShardRegion[] = []; // TODO: connect to your shard API

  const [healthOverview, checksOverview, incidents] = await Promise.all([
    fetchHealthOverview(),
    fetchChecksOverview(),
    fetchIncidents(),
  ]);

  const allHealthy =
    healthOverview.data.every((h) => h.is_healthy === 1) &&
    checksOverview.data.every((c) => c.is_online === 1);

  const hasOpenIncidents = incidents.some((i) => i.status === "open");

  const statusLabel = hasOpenIncidents
    ? "Partial degradation"
    : !allHealthy
    ? "Issues detected"
    : "All systems operational";

  const statusColor = allHealthy && !hasOpenIncidents ? "text-signal-teal" : "text-signal-amber";
  const statusBg    = allHealthy && !hasOpenIncidents
    ? "border-signal-teal/40 bg-signal-teal/10"
    : "border-signal-amber/40 bg-signal-amber/10";
  const statusDot   = allHealthy && !hasOpenIncidents ? "bg-signal-teal" : "bg-signal-amber";

  const healthCategories  = Object.entries(healthOverview.grouped);
  const checksCategories  = Object.entries(checksOverview.grouped);

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

      {/* Health checks — grouped by category */}
      {healthCategories.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-xl font-semibold text-ink">Website &amp; API Health</h2>
          <p className="mt-1 font-body text-sm text-ink-muted">
            Infrastucture checks
          </p>

          <div className="mt-6 space-y-8">
            {healthCategories.map(([category, items]) => (
              <div key={category}>
                <h3 className="font-mono text-xs uppercase tracking-wider text-ink-faint mb-3">
                  {category}
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
      )}

      {/* TCP checks — grouped by category */}
      {checksCategories.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-xl font-semibold text-ink">Node &amp; Infrastructure</h2>
          <p className="mt-1 font-body text-sm text-ink-muted">
            TCP checks 
          </p>

          <div className="mt-6 space-y-8">
            {checksCategories.map(([category, items]) => (
              <div key={category}>
                <h3 className="font-mono text-xs uppercase tracking-wider text-ink-faint mb-3">
                  {category}
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
      {healthCategories.length === 0 && checksCategories.length === 0 && (
        <div className="mt-14 rounded-2xl border border-base-border p-12 text-center">
          <p className="font-body text-sm text-ink-muted">
            No data{" "}
          </p>
        </div>
      )}

      {/* Shard distribution */}
      <div className="mt-14">
        <h2 className="font-display text-xl font-semibold text-ink">
          Shard distribution by region
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-base-border bg-base-border sm:grid-cols-2 lg:grid-cols-5">
          {SHARD_SUMMARY.length > 0 ? (
            SHARD_SUMMARY.map((s) => (
              <div key={s.region} className="bg-base-raised p-5">
                <p className="font-body text-sm text-ink-muted">{s.region}</p>
                <p className="mt-2 font-mono text-2xl text-ink">{s.shards}</p>
                <p className="font-mono text-xs text-ink-faint">shards active</p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-base-border">
                  <div
                    className="h-full rounded-full bg-signal-teal"
                    style={{ width: s.load }}
                  />
                </div>
                <p className="mt-1.5 font-mono text-xs text-ink-faint">{s.load} load</p>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-b-2xl bg-base-raised p-8 text-center font-body text-sm text-ink-muted">
              Shard distribution data is not available.
            </div>
          )}
        </div>
      </div>

      {/* Incidents */}
      <div className="mt-14">
        <h2 className="font-display text-xl font-semibold text-ink">Incident history</h2>
        <div className="mt-6 space-y-px overflow-hidden rounded-2xl border border-base-border">
          {incidents.length > 0 ? (
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
                  <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${
                    inc.severity === "critical" ? "border-red-500/40 text-red-400" :
                    inc.severity === "high"     ? "border-signal-amber/40 text-signal-amber" :
                    "border-base-border text-ink-muted"
                  }`}>
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