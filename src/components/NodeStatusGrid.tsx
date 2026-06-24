"use client";

import { useState } from "react";

type NodeStatus = "online" | "degraded" | "offline";

interface NodeData {
  id: string;
  region: string;
  shard: string;
  ping: number;
  status: NodeStatus;
}

const STATUS_STYLE: Record<NodeStatus, { dot: string; text: string; label: string }> = {
  online: { dot: "bg-signal-teal", text: "text-signal-teal", label: "Operational" },
  degraded: { dot: "bg-signal-amber", text: "text-signal-amber", label: "Degraded" },
  offline: { dot: "bg-signal-red", text: "text-signal-red", label: "Offline" },
};

export default function NodeStatusGrid() {
  const [nodes] = useState<NodeData[]>([]);

  if (nodes.length === 0) {
    return (
      <div className="rounded-2xl border border-base-border bg-base-raised p-8">
        <p className="font-mono text-sm text-ink-faint">
          Node telemetry is currently unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-base-border">
      <div className="flex items-center justify-between border-b border-base-border bg-base-raised px-6 py-4">
        <p className="font-mono text-xs uppercase tracking-wider text-ink-faint">
          Live node telemetry
        </p>
      </div>

      <div className="grid grid-cols-1 divide-y divide-base-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {nodes.map((node) => {
          const style = STATUS_STYLE[node.status];
          return (
            <div key={node.id} className="bg-base p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-ink-faint">{node.id}</span>
                <span className={`flex items-center gap-1.5 font-mono text-[11px] ${style.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                  {style.label}
                </span>
              </div>
              <p className="mt-3 font-display text-sm font-medium text-ink">
                {node.shard}
              </p>
              <p className="font-body text-xs text-ink-faint">{node.region}</p>
              <div className="mt-4 flex items-end justify-between">
                <span className="font-mono text-2xl text-ink">{node.ping}</span>
                <span className="font-mono text-xs text-ink-faint">ms</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
