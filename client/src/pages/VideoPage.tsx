import { Player } from "@remotion/player";
import { AegisVideo } from "../video-scenes/AegisVideo";

export default function VideoPage() {
  return (
    <div
      style={{
        backgroundColor: "#0A0A0A",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily: "'Aeonik', system-ui, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 1280 }}>
        <Player
          component={AegisVideo}
          compositionWidth={1920}
          compositionHeight={1080}
          durationInFrames={1680}
          fps={30}
          style={{
            width: "100%",
            aspectRatio: "16/9",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
          controls
          autoPlay
          loop
        />
      </div>

      <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 20 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.20)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 400 }}>
          Aegis Protocol
        </span>
        <span style={{ color: "rgba(255,255,255,0.06)" }}>|</span>
        <span style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.15)" }}>
          56s · 1920x1080 · 30fps
        </span>
        <span style={{ color: "rgba(255,255,255,0.06)" }}>|</span>
        <a
          href="/videos/aegis-video.mp4"
          download="aegis-protocol.mp4"
          style={{
            fontSize: 12, fontWeight: 400,
            color: "rgba(255,255,255,0.30)",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "7px 18px", textDecoration: "none",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.60)"; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.30)"; }}
        >
          Download MP4
        </a>
      </div>
    </div>
  );
}
