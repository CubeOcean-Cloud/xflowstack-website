import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0D10",
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 28,
            border: "5px solid rgba(94,234,212,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 9,
              background: "#5EEAD4",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
