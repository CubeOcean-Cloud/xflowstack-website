import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0B0D10",
          backgroundImage:
            "linear-gradient(to right, rgba(94,234,212,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(94,234,212,0.07) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              border: "2px solid rgba(94,234,212,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: 4, background: "#5EEAD4" }} />
          </div>
          <span style={{ fontSize: 34, color: "#E8EAED", fontWeight: 600 }}>
            {SITE_NAME}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 920 }}>
          <span
            style={{
              fontSize: 60,
              lineHeight: 1.15,
              color: "#E8EAED",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            {SITE_TAGLINE}
          </span>
          <div style={{ display: "flex", gap: 14 }}>
            {["99.97% uptime", "38 nodes", "4 regions"].map((stat) => (
              <div
                key={stat}
                style={{
                  display: "flex",
                  padding: "8px 18px",
                  borderRadius: 999,
                  border: "1px solid #3A3F47",
                  color: "#9AA1AC",
                  fontSize: 20,
                }}
              >
                {stat}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
