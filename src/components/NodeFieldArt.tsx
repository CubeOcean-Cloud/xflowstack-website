export default function NodeFieldArt() {
  return (
    <svg
      viewBox="0 0 1200 640"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="glow" cx="50%" cy="38%" r="60%">
          <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lineFade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1200" height="640" fill="#0B0D10" />
      <rect width="1200" height="640" fill="url(#glow)" />

      {/* faint grid */}
      {Array.from({ length: 25 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="640" stroke="#1A1E24" strokeWidth="1" />
      ))}
      {Array.from({ length: 13 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 50} x2="1200" y2={i * 50} stroke="#1A1E24" strokeWidth="1" />
      ))}

      {/* connection lines between nodes */}
      <g stroke="url(#lineFade)" strokeWidth="1.2" fill="none">
        <path d="M 180 480 L 350 360 L 560 410 L 760 280" />
        <path d="M 350 360 L 420 200" />
        <path d="M 560 410 L 620 540" />
        <path d="M 760 280 L 920 340 L 1040 200" />
        <path d="M 920 340 L 880 480" />
        <path d="M 420 200 L 600 130" />
        <path d="M 600 130 L 760 280" />
      </g>

      {/* nodes */}
      {[
        { x: 180, y: 480, r: 5, active: true },
        { x: 350, y: 360, r: 7, active: true },
        { x: 560, y: 410, r: 5, active: false },
        { x: 760, y: 280, r: 8, active: true },
        { x: 420, y: 200, r: 4, active: false },
        { x: 600, y: 130, r: 5, active: true },
        { x: 920, y: 340, r: 6, active: true },
        { x: 1040, y: 200, r: 4, active: false },
        { x: 880, y: 480, r: 5, active: true },
        { x: 620, y: 540, r: 4, active: false },
      ].map((n, i) => (
        <g key={i}>
          {n.active && (
            <circle cx={n.x} cy={n.y} r={n.r + 7} fill="#5EEAD4" opacity="0.08" />
          )}
          <circle
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={n.active ? "#5EEAD4" : "#3A3F47"}
            opacity={n.active ? 0.9 : 0.6}
          />
        </g>
      ))}
    </svg>
  );
}
