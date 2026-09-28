import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#0C121C",
          color: "#FFFFFF",
          padding: 80,
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 8, textTransform: "uppercase" }}>
          JOOVA
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, marginTop: 24, lineHeight: 1.05 }}>
          No subscription. Ever.
        </div>
        <div style={{ fontSize: 28, marginTop: 28, color: "#FF5A05" }}>
          Fitness Band · Smart Ring · Joova Watch · Glasses · Buds · Share Pod
        </div>
      </div>
    ),
    size,
  );
}
