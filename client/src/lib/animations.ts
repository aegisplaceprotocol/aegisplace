import type { Variants, Transition } from "framer-motion";

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

/* ── Stagger Container ── */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

/* ── Stagger Item ── */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE },
  },
};

/* ── Fade In on Scroll ── */
export const fadeInView = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: EASE } satisfies Transition,
};

/* ── Scale In (modals, cards) ── */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

/* ── Hover Card ── */
export const hoverCard: Variants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.015,
    y: -3,
    transition: { type: "spring", stiffness: 400, damping: 20 },
  },
  tap: { scale: 0.98 },
};

/* ── Slide Up ── */
export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

/* ── Number Spring Config ── */
export const numberSpring = {
  type: "spring" as const,
  stiffness: 60,
  damping: 20,
  mass: 0.8,
};
