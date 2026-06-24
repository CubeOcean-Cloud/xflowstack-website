"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

// Layer sizes left-to-right. Six layers so the "deep network" read is obvious,
// shaped like an hourglass (wide hidden layers, narrow input/output).
const LAYER_SIZES = [3, 5, 6, 6, 5, 3];
const VIEW_W = 1200;
const VIEW_H = 640;
const PULSE_COUNT = 16;

interface NodePoint {
  x: number;
  y: number;
  li: number;
  ni: number;
}

function computeLayers(): NodePoint[][] {
  const marginX = 110;
  const marginY = 80;
  const usableW = VIEW_W - marginX * 2;
  const usableH = VIEW_H - marginY * 2;

  return LAYER_SIZES.map((count, li) => {
    const x = marginX + (usableW * li) / (LAYER_SIZES.length - 1);
    return Array.from({ length: count }, (_, ni) => {
      const y = count === 1 ? VIEW_H / 2 : marginY + (usableH * ni) / (count - 1);
      return { x, y, li, ni };
    });
  });
}

const LAYERS = computeLayers();

export default function NeuralNetworkHero() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Cache every node + line element once, keyed by id, instead of
    // re-querying the DOM on every pulse arrival.
    const nodeMap = new Map<string, SVGCircleElement>();
    const lineMap = new Map<string, SVGLineElement>();
    svg.querySelectorAll<SVGCircleElement>("[data-node]").forEach((el) => {
      nodeMap.set(el.dataset.node as string, el);
    });
    svg.querySelectorAll<SVGLineElement>("[data-line]").forEach((el) => {
      lineMap.set(el.dataset.line as string, el);
    });

    if (reduceMotion) {
      // Static, gently lit network — no motion for users who asked for less.
      nodeMap.forEach((el) => gsap.set(el, { fill: "#5EEAD4", fillOpacity: 0.35 }));
      return;
    }

    const timelines: gsap.core.Timeline[] = [];

    for (let p = 0; p < PULSE_COUNT; p++) {
      const pulseEl = svg.querySelector<SVGCircleElement>(`#pulse-${p}`);
      if (!pulseEl) continue;

      // A random walk: one node chosen per layer, left to right.
      const path: NodePoint[] = LAYERS.map((layerNodes) => {
        const idx = Math.floor(Math.random() * layerNodes.length);
        return layerNodes[idx];
      });

      const tl = gsap.timeline({
        repeat: -1,
        delay: Math.random() * 3.5,
        repeatDelay: 0.3 + Math.random() * 1.1,
      });

      tl.set(pulseEl, { attr: { cx: path[0].x, cy: path[0].y }, opacity: 0, scale: 1 });
      tl.to(pulseEl, { opacity: 1, duration: 0.12 });

      for (let i = 0; i < path.length - 1; i++) {
        const from = path[i];
        const to = path[i + 1];
        const lineId = `${from.li}-${from.ni}-${to.ni}`;
        const targetNodeId = `${to.li}-${to.ni}`;
        const lineEl = lineMap.get(lineId);
        const nodeEl = nodeMap.get(targetNodeId);
        const segmentDuration = 0.4 + Math.random() * 0.22;

        tl.to(pulseEl, {
          attr: { cx: to.x, cy: to.y },
          duration: segmentDuration,
          ease: "sine.inOut",
          onStart: () => {
            if (lineEl) {
              gsap.to(lineEl, {
                strokeOpacity: 0.55,
                duration: segmentDuration * 0.4,
                yoyo: true,
                repeat: 1,
              });
            }
          },
          onComplete: () => {
            if (nodeEl) {
              gsap.to(nodeEl, {
                attr: { r: 6.5 },
                fill: "#5EEAD4",
                fillOpacity: 1,
                duration: 0.18,
                yoyo: true,
                repeat: 1,
                ease: "power1.out",
              });
            }
          },
        });
      }

      tl.to(pulseEl, { opacity: 0, duration: 0.18 });
      timelines.push(tl);
    }

    return () => {
      timelines.forEach((tl) => tl.kill());
      gsap.killTweensOf(Array.from(nodeMap.values()));
      gsap.killTweensOf(Array.from(lineMap.values()));
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="nnGlow" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={VIEW_W} height={VIEW_H} fill="#0B0D10" />
      <rect width={VIEW_W} height={VIEW_H} fill="url(#nnGlow)" />

      {/* connections */}
      <g>
        {LAYERS.slice(0, -1).map((layerNodes, li) =>
          layerNodes.map((from) =>
            LAYERS[li + 1].map((to) => (
              <line
                key={`line-${li}-${from.ni}-${to.ni}`}
                data-line={`${li}-${from.ni}-${to.ni}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#5EEAD4"
                strokeWidth={1}
                strokeOpacity={0.055}
              />
            ))
          )
        )}
      </g>

      {/* nodes */}
      <g>
        {LAYERS.map((layerNodes) =>
          layerNodes.map((node) => (
            <circle
              key={`node-${node.li}-${node.ni}`}
              data-node={`${node.li}-${node.ni}`}
              cx={node.x}
              cy={node.y}
              r={3.5}
              fill="#3A3F47"
              fillOpacity={0.85}
            />
          ))
        )}
      </g>

      {/* traveling pulses */}
      <g>
        {Array.from({ length: PULSE_COUNT }).map((_, p) => (
          <circle key={`pulse-${p}`} id={`pulse-${p}`} cx={0} cy={0} r={3.2} fill="#5EEAD4" opacity={0} />
        ))}
      </g>
    </svg>
  );
}