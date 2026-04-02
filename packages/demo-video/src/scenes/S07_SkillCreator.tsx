import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Sequence,
  Img,
  staticFile,
} from "remotion";

/**
 * SkillCreator Video v3 - Aegis Protocol
 * 34.5s @ 30fps = 1035 frames
 *
 * FAST. CENTERED. REAL SCREENSHOTS. AEGIS LOGO.
 */

const fontFamily = "Inter, system-ui, -apple-system, sans-serif";
const monoFont = "'JetBrains Mono', 'SF Mono', monospace";

/* ── Tokens ─────────────────────────────────────────────── */

const C = {
  bg: "#08080A",
  fg: "#FFFFFF",
  t90: "rgba(255,255,255,0.92)",
  t60: "rgba(255,255,255,0.60)",
  t40: "rgba(255,255,255,0.40)",
  t20: "rgba(255,255,255,0.20)",
  t10: "rgba(255,255,255,0.10)",
  t05: "rgba(255,255,255,0.05)",
  em: "#10B981",
  emDim: "rgba(16,185,129,0.12)",
  border: "rgba(255,255,255,0.06)",
} as const;

/* ── Primitives ─────────────────────────────────────────── */

const Fade: React.FC<{ d?: number; children: React.ReactNode; s?: React.CSSProperties }> = ({
  d = 0, children, s,
}) => {
  const f = useCurrentFrame();
  return (
    <div style={{
      opacity: interpolate(f, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      transform: `translateY(${interpolate(f, [d, d + 12], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
      ...s,
    }}>
      {children}
    </div>
  );
};

const Num: React.FC<{
  from: number; to: number; start: number; dur: number;
  pre?: string; suf?: string; s?: React.CSSProperties;
}> = ({ from, to, start, dur, pre = "", suf = "", s }) => {
  const f = useCurrentFrame();
  const v = Math.floor(from + (to - from) * interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  }));
  return <span style={s}>{pre}{v.toLocaleString()}{suf}</span>;
};

/* ── S1: Logo + Tagline (3s) ───────────────────────────── */

const S1: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame: f, fps, config: { damping: 28, stiffness: 260 } });
  const exit = interpolate(f, [72, 90], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, justifyContent: "center", alignItems: "center", opacity: exit }}>
      <div style={{ opacity: interpolate(f, [0, 15], [0, 1], { extrapolateRight: "clamp" }), transform: `scale(${sc})` }}>
        <Img src={staticFile("aegis-full-logo.svg")} style={{ height: 64 }} />
      </div>
      <Fade d={20}>
        <p style={{ fontFamily, fontWeight: 300, fontSize: 22, color: C.t40, marginTop: 20, letterSpacing: "0.12em", textTransform: "uppercase" as const }}>
          THE AI SKILL MARKETPLACE
        </p>
      </Fade>
    </AbsoluteFill>
  );
};

/* ── S2: Headline + Stats (5s) ─────────────────────────── */

const S2: React.FC = () => {
  const f = useCurrentFrame();
  const exit = interpolate(f, [130, 150], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, justifyContent: "center", alignItems: "center", opacity: exit }}>
      <Fade d={5}>
        <h1 style={{ fontFamily, fontWeight: 300, fontSize: 76, color: C.fg, textAlign: "center", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Build a skill once.
        </h1>
      </Fade>
      <Fade d={18}>
        <h1 style={{ fontFamily, fontWeight: 300, fontSize: 76, color: C.t40, textAlign: "center", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Earn every time its used.
        </h1>
      </Fade>
      <Fade d={40} s={{ display: "flex", gap: 80, marginTop: 56 }}>
        {[
          { label: "SKILLS", val: 2838, suf: "" },
          { label: "INVOCATIONS", val: 21, suf: "M+" },
          { label: "REVENUE", val: 307, pre: "$", suf: "K" },
        ].map((s, i) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <p style={{ fontFamily, fontWeight: 300, fontSize: 11, letterSpacing: "0.16em", color: C.t20, margin: "0 0 6px 0", textTransform: "uppercase" as const }}>{s.label}</p>
            <p style={{ fontFamily, fontWeight: 300, fontSize: 48, color: C.fg, margin: 0 }}>
              <Num from={0} to={s.val} start={45 + i * 8} dur={25} pre={s.pre || ""} suf={s.suf} />
            </p>
          </div>
        ))}
      </Fade>
    </AbsoluteFill>
  );
};

/* ── S3: Real Marketplace Screenshot (5.5s) ────────────── */

const S3: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame: f - 15, fps, config: { damping: 25, stiffness: 120 } });
  const exit = interpolate(f, [145, 165], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, justifyContent: "center", alignItems: "center", opacity: exit }}>
      <Fade d={3}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <Img src={staticFile("aegis-mark.svg")} style={{ height: 20, opacity: 0.4 }} />
          <span style={{ fontFamily, fontWeight: 300, fontSize: 11, letterSpacing: "0.16em", color: C.t20, textTransform: "uppercase" as const }}>MARKETPLACE</span>
          <span style={{ fontFamily, fontWeight: 300, fontSize: 11, color: C.t10, marginLeft: 16 }}>2,838 operators across 19 categories</span>
        </div>
      </Fade>
      <div style={{
        opacity: interpolate(f, [10, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        transform: `scale(${0.92 + sc * 0.08}) perspective(1200px) rotateX(${interpolate(f, [10, 60], [3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}deg)`,
        width: "85%",
      }}>
        <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 40px 120px rgba(0,0,0,0.7)" }}>
          <Img src={staticFile("fresh-marketplace.png")} style={{ width: "100%", display: "block" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ── S4: Real Dashboard Screenshot (5s) ────────────────── */

const S4: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame: f - 15, fps, config: { damping: 25, stiffness: 120 } });
  const exit = interpolate(f, [130, 150], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, justifyContent: "center", alignItems: "center", opacity: exit }}>
      <Fade d={3}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <Img src={staticFile("aegis-mark.svg")} style={{ height: 20, opacity: 0.4 }} />
          <span style={{ fontFamily, fontWeight: 300, fontSize: 11, letterSpacing: "0.16em", color: C.t20, textTransform: "uppercase" as const }}>PROTOCOL OVERVIEW</span>
        </div>
      </Fade>
      <div style={{
        opacity: interpolate(f, [10, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        transform: `scale(${0.92 + sc * 0.08})`,
        width: "85%",
      }}>
        <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 40px 120px rgba(0,0,0,0.7)" }}>
          <Img src={staticFile("fresh-dashboard.png")} style={{ width: "100%", display: "block" }} />
        </div>
      </div>
      <Fade d={50} s={{ position: "absolute", bottom: 56, display: "flex", gap: 48 }}>
        {["21,064,008 invocations", "$307,549 USDC", "100% guardrail pass"].map((t) => (
          <span key={t} style={{ fontFamily: monoFont, fontWeight: 400, fontSize: 13, color: C.em }}>{t}</span>
        ))}
      </Fade>
    </AbsoluteFill>
  );
};

/* ── S5: Register + Fee Split (7s) ─────────────────────── */

const S5: React.FC = () => {
  const f = useCurrentFrame();
  const exit = interpolate(f, [190, 210], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const blink = Math.floor(f / 14) % 2 === 0;

  const code = [
    { t: "aegis_register_operator({", d: 8, c: C.t60 },
    { t: '  name: "Code Review Agent",', d: 16, c: C.t90 },
    { t: '  category: "security",', d: 24, c: C.t90 },
    { t: '  price: "0.005",', d: 32, c: C.t90 },
    { t: '  endpoint: "https://api.you.com/review"', d: 40, c: C.t90 },
    { t: "})", d: 48, c: C.t60 },
  ];

  const splits = [
    { l: "YOU", p: 60, c: C.em },
    { l: "Validators", p: 15, c: C.t40 },
    { l: "Stakers", p: 12, c: C.t40 },
    { l: "Treasury", p: 8, c: C.t20 },
    { l: "Insurance", p: 3, c: C.t20 },
    { l: "Burned", p: 2, c: C.t20 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, padding: "60px 100px", opacity: exit, display: "flex", flexDirection: "row", gap: 60, alignItems: "center" }}>
      {/* Left: code */}
      <div style={{ flex: 1 }}>
        <Fade d={3}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <Img src={staticFile("aegis-mark.svg")} style={{ height: 18, opacity: 0.4 }} />
            <span style={{ fontFamily, fontWeight: 300, fontSize: 11, letterSpacing: "0.16em", color: C.t20, textTransform: "uppercase" as const }}>REGISTER YOUR SKILL</span>
          </div>
        </Fade>
        <div style={{ backgroundColor: "rgba(0,0,0,0.6)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "24px 28px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[C.t10, C.t05, C.t05].map((c, i) => <div key={i} style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c }} />)}
          </div>
          {code.map((l, i) => (
            <Fade key={i} d={l.d}>
              <p style={{ fontFamily: monoFont, fontSize: 16, color: l.c, margin: "2px 0", lineHeight: 1.9 }}>
                {l.t}{i === code.length - 1 && blink ? <span style={{ color: C.t40 }}>|</span> : null}
              </p>
            </Fade>
          ))}
        </div>
        <Fade d={60} s={{ display: "flex", gap: 20, marginTop: 20 }}>
          {["Live", "Guardrails active", "Trust: 5000"].map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.em }} />
              <span style={{ fontFamily, fontWeight: 300, fontSize: 11, color: C.t40 }}>{s}</span>
            </div>
          ))}
        </Fade>
      </div>

      {/* Right: fee split */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Fade d={70}>
          <span style={{ fontFamily, fontWeight: 300, fontSize: 11, letterSpacing: "0.16em", color: C.t20, textTransform: "uppercase" as const }}>EVERY CALL SPLITS ON CHAIN</span>
        </Fade>
        <div style={{ marginTop: 24 }}>
          {splits.map((s, i) => {
            const w = interpolate(f, [80 + i * 8, 105 + i * 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <Fade key={s.l} d={75 + i * 8}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                  <span style={{ fontFamily, fontWeight: i === 0 ? 400 : 300, fontSize: 13, color: s.c, width: 72, textAlign: "right" }}>{s.l}</span>
                  <div style={{
                    height: i === 0 ? 28 : 18,
                    width: `${s.p * w * 7}px`,
                    backgroundColor: i === 0 ? C.emDim : C.t05,
                    border: `1px solid ${i === 0 ? "rgba(16,185,129,0.18)" : C.border}`,
                    borderRadius: 2,
                    display: "flex", alignItems: "center", paddingLeft: 8,
                  }}>
                    <span style={{ fontFamily: monoFont, fontSize: i === 0 ? 14 : 11, color: s.c }}>{s.p}%</span>
                  </div>
                </div>
              </Fade>
            );
          })}
        </div>
        <Fade d={140}>
          <div style={{ marginTop: 28, padding: "16px 20px", backgroundColor: C.t05, border: `1px solid ${C.border}`, borderRadius: 6 }}>
            <span style={{ fontFamily, fontWeight: 300, fontSize: 11, letterSpacing: "0.14em", color: C.t20, textTransform: "uppercase" as const }}>MONTHLY EARNINGS</span>
            <p style={{ fontFamily, fontWeight: 300, fontSize: 40, color: C.fg, margin: "6px 0 0 0" }}>
              $<Num from={0} to={4847} start={145} dur={35} />
              <span style={{ fontFamily, fontWeight: 300, fontSize: 15, color: C.t20, marginLeft: 8 }}>USDC</span>
            </p>
          </div>
        </Fade>
      </div>
    </AbsoluteFill>
  );
};

/* ── S6: SkillFi Royalties (5.5s) ─────────────────────── */

const S6: React.FC = () => {
  const f = useCurrentFrame();
  const exit = interpolate(f, [145, 165], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const levels = [
    { name: "Your Skill: Token Price Oracle", ml: 0, d: 30, tag: "$0.002/call", tagColor: C.em, border: "rgba(16,185,129,0.25)", bg: C.emDim, nameColor: C.em },
    { name: "Portfolio Analyzer", ml: 56, d: 55, tag: "YOU EARN 5%", tagColor: C.em, border: C.border, bg: C.t05, nameColor: C.t60 },
    { name: "Trading Bot", ml: 112, d: 75, tag: "YOU STILL EARN", tagColor: C.em, border: C.border, bg: C.t05, nameColor: C.t40 },
    { name: "Fund Manager", ml: 168, d: 95, tag: "5 LEVELS DEEP", tagColor: C.em, border: C.border, bg: C.t05, nameColor: C.t20 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, justifyContent: "center", alignItems: "center", opacity: exit }}>
      <div style={{ width: "70%", maxWidth: 900 }}>
        <Fade d={3}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <Img src={staticFile("aegis-mark.svg")} style={{ height: 18, opacity: 0.4 }} />
            <span style={{ fontFamily, fontWeight: 300, fontSize: 11, letterSpacing: "0.16em", color: C.t20, textTransform: "uppercase" as const }}>SKILLFI ROYALTIES</span>
          </div>
        </Fade>
        <Fade d={8}>
          <h2 style={{ fontFamily, fontWeight: 300, fontSize: 44, color: C.fg, margin: "0 0 8px 0", letterSpacing: "-0.02em" }}>Build the foundation.</h2>
        </Fade>
        <Fade d={16}>
          <h2 style={{ fontFamily, fontWeight: 300, fontSize: 44, color: C.t40, margin: "0 0 40px 0", letterSpacing: "-0.02em" }}>Earn from everything above.</h2>
        </Fade>

        {levels.map((lv, i) => (
          <div key={lv.name}>
            {i > 0 && <div style={{ width: 1, height: 20, backgroundColor: C.t10, marginLeft: lv.ml + 24 }} />}
            <Fade d={lv.d}>
              <div style={{ marginLeft: lv.ml, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ padding: "12px 20px", backgroundColor: lv.bg, border: `1px solid ${lv.border}`, borderRadius: 4 }}>
                  <span style={{ fontFamily, fontWeight: i === 0 ? 400 : 300, fontSize: 15, color: lv.nameColor }}>{lv.name}</span>
                </div>
                <span style={{ fontFamily, fontWeight: 300, fontSize: 11, letterSpacing: "0.1em", color: lv.tagColor }}>{lv.tag}</span>
              </div>
            </Fade>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ── S7: Close (3.5s) ──────────────────────────────────── */

const S7: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame: f - 3, fps, config: { damping: 30, stiffness: 200 } });

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }}>
      <div style={{ opacity: interpolate(f, [3, 18], [0, 1], { extrapolateRight: "clamp" }), transform: `scale(${sc})`, marginBottom: 28 }}>
        <Img src={staticFile("aegis-full-logo.svg")} style={{ height: 52 }} />
      </div>
      <Fade d={15}>
        <h1 style={{ fontFamily, fontWeight: 300, fontSize: 52, color: C.fg, textAlign: "center", margin: 0, letterSpacing: "-0.02em" }}>
          Build once. Earn forever.
        </h1>
      </Fade>
      <Fade d={30}>
        <p style={{ fontFamily, fontWeight: 300, fontSize: 18, color: C.t40, textAlign: "center", marginTop: 16 }}>
          aegisplace.com
        </p>
      </Fade>
      <Fade d={40} s={{ display: "flex", gap: 36, marginTop: 40 }}>
        {["2,838 skills", "21M invocations", "$307K settled", "Solana"].map((s) => (
          <span key={s} style={{ fontFamily, fontWeight: 300, fontSize: 12, color: C.t10 }}>{s}</span>
        ))}
      </Fade>
    </AbsoluteFill>
  );
};

/* ── Composition (40s total) ───────────────────────────── */

export const SkillCreatorVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Sequence from={0} durationInFrames={90}><S1 /></Sequence>
    <Sequence from={90} durationInFrames={150}><S2 /></Sequence>
    <Sequence from={240} durationInFrames={165}><S3 /></Sequence>
    <Sequence from={405} durationInFrames={150}><S4 /></Sequence>
    <Sequence from={555} durationInFrames={210}><S5 /></Sequence>
    <Sequence from={765} durationInFrames={165}><S6 /></Sequence>
    <Sequence from={930} durationInFrames={105}><S7 /></Sequence>
  </AbsoluteFill>
);
