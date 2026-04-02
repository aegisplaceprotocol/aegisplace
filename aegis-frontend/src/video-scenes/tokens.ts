/** Aegis Video Design Tokens - V3. Pure monochrome. Zero color. */

export const colors = {
  bg: '#0A0A0A',
  surface: 'rgba(255, 255, 255, 0.01)',
  surfaceBright: 'rgba(255, 255, 255, 0.03)',
  border: 'rgba(255, 255, 255, 0.06)',
  borderBright: 'rgba(255, 255, 255, 0.10)',
  text: {
    primary: 'rgba(255, 255, 255, 0.90)',
    secondary: 'rgba(255, 255, 255, 0.50)',
    muted: 'rgba(255, 255, 255, 0.30)',
    label: 'rgba(255, 255, 255, 0.15)',
    ghost: 'rgba(255, 255, 255, 0.06)',
  },
} as const;

export const fonts = {
  family: 'Aeonik, Outfit, system-ui, sans-serif',
  weight: { light: 400, regular: 400, medium: 400, semibold: 700, bold: 700 },
} as const;

export const layout = {
  width: 1920,
  height: 1080,
  contentMaxWidth: 1280,
  paddingX: 320,
  paddingY: 120,
} as const;

export const AEGIS_ICON = "M3208.07,3796.37l-2615.76-.32c-48.09,0-93.08-23.88-125.67-56.43l-408.41-407.8C18.64,3292.3,0,3243.97,0,3187.4L.31,602.1c0-53.71,20.51-99.79,57.39-136.65L463.91,59.35C503.28,20,551.7.02,608.48.02L3181.8,0c51.19,0,103.53,11.53,139.9,47.86l420.72,420.19c32.21,32.17,47.22,69.1,54.5,114.82l.07,2628.9c-5.47,46.75-22.17,84.78-54.77,117.43l-409.96,410.52c-34.13,33.03-72.47,52.94-124.18,56.66ZM1898.98,3454.17c30.79-226.1,100.71-443.28,208.56-645.83,271.77-510.41,768.15-830.59,1336.77-908.1,8.93-4.63,8.28-5.29-2.28-3.53-312.24-44.12-611.89-163.02-863.58-353.73-381.66-289.19-618.74-727.91-679.42-1200.13-62.79,466.74-283.9,883.94-649.77,1176.81-254.56,203.77-580.77,336.6-903.93,378.5,262.62,36.92,509.35,121.09,732.03,258.18,82.78,50.96,158.05,104.59,230.58,169.24,106.06,94.54,200.64,198.38,280.96,316.28,139.94,205.44,242.15,434.59,286.02,678.58l24.05,133.74Z";

export const AGENTS = ["SENTINEL", "WATCHDOG", "OVERWATCH", "REACTOR", "ARSENAL", "CIPHER-9", "FORGE-12", "GHOST-3", "PHANTOM", "VANGUARD", "RECON-7", "IRONCLAD"];

export const FEE_SPLIT = [
  { pct: 85, label: "Creator", dollar: 0.60 },
  { pct: 15, label: "Validators", dollar: 0.15 },
  { pct: 12, label: "Stakers", dollar: 0.12 },
  { pct: 8, label: "Treasury", dollar: 0.08 },
  { pct: 3, label: "Insurance", dollar: 0.03 },
  { pct: 2, label: "Burned", dollar: 0.02 },
] as const;

export const ease = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const prog = (frame: number, start: number, end: number): number => {
  const raw = Math.max(0, Math.min(1, (frame - start) / (end - start)));
  return ease(raw);
};

export const appear = (frame: number, start: number): React.CSSProperties => {
  const p = prog(frame, start, start + 8);
  return { opacity: p, transform: `translateY(${(1 - p) * 12}px)` };
};

export const stagger = (frame: number, start: number, i: number, gap = 2): React.CSSProperties =>
  appear(frame, start + i * gap);

export const label: React.CSSProperties = {
  fontFamily: fonts.family,
  fontWeight: fonts.weight.regular,
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: colors.text.label,
};

export const headline: React.CSSProperties = {
  fontFamily: fonts.family,
  fontWeight: fonts.weight.regular,
  letterSpacing: '-0.025em',
  lineHeight: 1.08,
  color: colors.text.primary,
};

export const body: React.CSSProperties = {
  fontFamily: fonts.family,
  fontWeight: fonts.weight.regular,
  lineHeight: 1.6,
  letterSpacing: '-0.011em',
  color: colors.text.secondary,
};

export const sceneBase: React.CSSProperties = {
  backgroundColor: colors.bg,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

export const container: React.CSSProperties = {
  maxWidth: 1280,
  width: '100%',
  textAlign: 'center' as const,
};
