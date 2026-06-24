import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#0B0D10",
          raised: "#12151A",
          surface: "#1A1E24",
          border: "#2A2F37",
          borderlight: "#3A3F47",
        },
        ink: {
          DEFAULT: "#E8EAED",
          muted: "#9AA1AC",
          faint: "#5C636E",
        },
        signal: {
          teal: "#5EEAD4",
          tealdim: "#1F4E47",
          amber: "#F5A623",
          red: "#F0554A",
          violet: "#8B8FF7",
        },
      },
      fontFamily: {
        display: ["var(--font-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "node-grid":
          "linear-gradient(to right, rgba(94,234,212,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(94,234,212,0.06) 1px, transparent 1px)",
      },
      animation: {
        "pulse-slow": "pulse 3.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        scan: "scan 2.4s linear infinite",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
