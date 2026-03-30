/**
 * Aegis Design System — extracted from the actual site.
 * oklch(0.10 0.004 260) = #18181B (the real background)
 * No color accents. White at varying opacities. That's it.
 */

export const t = {
  bg: "#111113",
  fg: "#FFFFFF",
  /** Text hierarchy — white at opacity levels */
  t90: "rgba(255,255,255,0.90)",
  t70: "rgba(255,255,255,0.70)",
  t50: "rgba(255,255,255,0.50)",
  t30: "rgba(255,255,255,0.30)",
  t15: "rgba(255,255,255,0.15)",
  t08: "rgba(255,255,255,0.08)",
  t04: "rgba(255,255,255,0.04)",
  /** Borders */
  border: "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.14)",
  /** Surface */
  card: "rgba(255,255,255,0.03)",
  cardHover: "rgba(255,255,255,0.06)",
  /** Font */
  font: "'Aeonik', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
} as const;

/** Base text styles matching the site */
export const text = {
  headline: {
    fontFamily: t.font,
    fontWeight: 700,
    letterSpacing: "-0.03em",
    lineHeight: 1.08,
    color: t.fg,
  } as React.CSSProperties,
  body: {
    fontFamily: t.font,
    fontWeight: 400,
    lineHeight: 1.6,
    color: t.t50,
  } as React.CSSProperties,
  label: {
    fontFamily: t.font,
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    color: t.t30,
  } as React.CSSProperties,
  code: {
    fontFamily: t.mono,
    fontWeight: 400,
    color: t.t70,
  } as React.CSSProperties,
} as const;
