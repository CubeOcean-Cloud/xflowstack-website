"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE = "https://apix.cubeocean.web.id/api/version";
const POLL_INTERVAL_MS = 60_000; // re-check every 60s, same cadence as the old revalidate

type VersionData = {
  id: number;
  target: string;
  channel: "stable" | "beta" | "experimental";
  version: string;
  changelog: string;
  author_name: string;
  created_at: string;
};

type Target = "website" | "bot" | "api";

async function fetchVersion(target: Target): Promise<VersionData | null> {
  try {
    const res = await fetch(`${API_BASE}/${target}`, {
      // client-side fetch: no `next.revalidate`, that option only exists
      // for server-side fetches inside Next.js and is ignored/invalid here.
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.latest ?? null;
  } catch {
    return null;
  }
}

const channelStyle: Record<string, string> = {
  stable: "bg-signal-teal/10 text-signal-teal border border-signal-teal/30",
  beta: "bg-signal-amber/10 text-signal-amber border border-signal-amber/30",
  experimental: "bg-purple-500/10 text-purple-400 border border-purple-500/30",
};

const channelDot: Record<string, string> = {
  stable: "bg-signal-teal",
  beta: "bg-signal-amber",
  experimental: "bg-purple-400",
};

function VersionRow({
  label,
  data,
  loading,
}: {
  label: string;
  data: VersionData | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="mt-5 flex items-center gap-2 font-mono text-xs text-ink-faint">
        <span className="h-1.5 w-1.5 rounded-full bg-base-border animate-pulse" />
        <span className="text-ink-faint">{label}</span>
        <span className="ml-1 text-ink-faint/50">Memuat…</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mt-5 flex items-center gap-2 font-mono text-xs text-ink-faint">
        <span className="h-1.5 w-1.5 rounded-full bg-base-border" />
        <span className="text-ink-faint">{label}</span>
        <span className="ml-1 text-ink-faint/50">— No release published</span>
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-wrap items-start gap-2">
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className={`h-1.5 w-1.5 rounded-full ${channelDot[data.channel] ?? "bg-base-border"}`} />
        <span className="text-ink">{label}</span>
        <span className="text-ink-faint">v{data.version}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-mono capitalize ${channelStyle[data.channel] ?? ""}`}
        >
          {data.channel}
        </span>
      </div>
      {data.changelog && (
        <p className="w-full pl-4 font-body text-xs text-ink-muted leading-relaxed line-clamp-2">
          {data.changelog}
        </p>
      )}
    </div>
  );
}

export default function VersionBadges() {
  const [website, setWebsite] = useState<VersionData | null>(null);
  const [api, setApi] = useState<VersionData | null>(null);
  const [bot, setBot] = useState<VersionData | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      const [w, a, b] = await Promise.all([
        fetchVersion("website"),
        fetchVersion("api"),
        fetchVersion("bot"),
      ]);
      if (cancelled) return;
      setWebsite(w);
      setApi(a);
      setBot(b);
      setLoading(false);
    }

    // initial load
    loadAll();

    // poll periodically so already-open tabs pick up new releases too,
    // without needing a rebuild/redeploy of the static site
    intervalRef.current = setInterval(loadAll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <>
      <VersionRow label="Website" data={website} loading={loading} />
      <VersionRow label="API" data={api} loading={loading} />
      <VersionRow label="Bot" data={bot} loading={loading} />
    </>
  );
}