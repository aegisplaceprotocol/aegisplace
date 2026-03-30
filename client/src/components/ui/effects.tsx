"use client";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

// ═══════════════════════════════════════════════════════════
// 1. LAMP EFFECT. Conic gradient spotlight (from Aceternity)
// ═══════════════════════════════════════════════════════════
export function LampEffect({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative flex min-h-[60vh] w-full flex-col items-center justify-center overflow-hidden bg-zinc-950 ${className}`}>
      <div className="relative isolate z-0 flex w-full flex-1 scale-y-125 items-center justify-center">
        {/* Left conic gradient. Solana purple */}
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          style={{ backgroundImage: "conic-gradient(from 70deg at center top, #9945FF, transparent, transparent)" }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible"
        >
          <div className="absolute bottom-0 left-0 z-20 h-40 w-full bg-zinc-950 [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute bottom-0 left-0 z-20 h-full w-40 bg-zinc-950 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>

        {/* Right conic gradient. Solana green */}
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          style={{ backgroundImage: "conic-gradient(from 290deg at center top, transparent, transparent, #14F195)" }}
          className="absolute inset-auto left-1/2 h-56 overflow-visible"
        >
          <div className="absolute bottom-0 right-0 z-20 h-full w-40 bg-zinc-950 [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute bottom-0 right-0 z-20 h-40 w-full bg-zinc-950 [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>

        {/* Blur/glow layers */}
        <div className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 bg-zinc-950 blur-2xl" />
        <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md" />
        <div className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-[#9945FF] opacity-50 blur-3xl" />

        {/* Animated glow orb */}
        <motion.div
          initial={{ width: "8rem" }}
          whileInView={{ width: "16rem" }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-auto z-30 h-36 -translate-y-[6rem] rounded-full bg-[#14F195] opacity-30 blur-2xl"
        />

        {/* Horizontal glowing line */}
        <motion.div
          initial={{ width: "15rem" }}
          whileInView={{ width: "30rem" }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-auto z-50 h-0.5 -translate-y-[7rem] bg-gradient-to-r from-transparent via-[#9945FF] to-transparent"
        />

        <div className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-zinc-950" />
      </div>

      <div className="relative z-50 flex -translate-y-60 flex-col items-center px-5">
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 2. SPOTLIGHT. Mouse-following gradient spotlight
// ═══════════════════════════════════════════════════════════
export function Spotlight({ className = "", fill = "#9945FF" }: { className?: string; fill?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      className={`pointer-events-none absolute inset-0 ${className}`}
    >
      <svg className="absolute h-[150%] w-[150%] -top-[25%] -left-[25%]" viewBox="0 0 1200 1200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="600" cy="0" rx="400" ry="600" fill={fill} fillOpacity="0.08" />
      </svg>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// 3. MOVING BORDER. Animated rotating gradient border
// ═══════════════════════════════════════════════════════════
export function MovingBorder({ children, className = "", duration = 3, borderColor = "#9945FF" }: {
  children: React.ReactNode; className?: string; duration?: number; borderColor?: string
}) {
  return (
    <div className={`relative overflow-hidden p-[1px] rounded-xl ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-100%]"
        style={{
          background: `conic-gradient(from 0deg, transparent 0%, ${borderColor} 10%, transparent 20%)`,
        }}
      />
      <div className="relative bg-zinc-950 h-full w-full rounded-xl">
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 4. METEORS. Animated meteor shower background
// ═══════════════════════════════════════════════════════════
export function Meteors({ count = 20 }: { count?: number }) {
  const meteors = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 3,
    duration: 1 + Math.random() * 2,
    size: 1 + Math.random() * 2,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {meteors.map((m) => (
        <motion.div
          key={m.id}
          initial={{ top: "-5%", left: m.left, opacity: 0 }}
          animate={{ top: "105%", opacity: [0, 1, 1, 0] }}
          transition={{ duration: m.duration, delay: m.delay, repeat: Infinity, repeatDelay: Math.random() * 5 + 3 }}
          className="absolute"
          style={{ width: `${m.size}px` }}
        >
          <div className="h-[80px] w-full bg-gradient-to-b from-[#9945FF] to-transparent rounded-full" style={{ width: `${m.size}px` }} />
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 5. GLOWING CARD. Card with animated gradient glow on hover
// ═══════════════════════════════════════════════════════════
export function GlowCard({ children, className = "", glowColor = "#9945FF" }: {
  children: React.ReactNode; className?: string; glowColor?: string
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouse = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);

  const background = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, ${glowColor}15, transparent 80%)`;

  return (
    <div ref={ref} onMouseMove={handleMouse} className={`group relative ${className}`}>
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background }}
      />
      <div className="relative border border-white/[0.06] bg-white/[0.02] rounded-lg p-6 hover:bg-white/[0.04] transition-colors duration-300">
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 6. TEXT SHIMMER. Gradient shimmer text animation
// ═══════════════════════════════════════════════════════════
export function TextShimmer({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-block bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer ${className}`}
      style={{
        backgroundImage: "linear-gradient(90deg, #e8e8f0, #9945FF, #14F195, #e8e8f0)",
        animationDuration: "3s",
        animationTimingFunction: "linear",
        animationIterationCount: "infinite",
      }}
    >
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// 7. AURORA BACKGROUND. Animated gradient aurora
// ═══════════════════════════════════════════════════════════
export function AuroraBackground({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full opacity-[0.03]"
        style={{
          background: "radial-gradient(ellipse at center, #9945FF, transparent 70%)",
          animation: "aurora-drift 15s ease-in-out infinite alternate",
        }}
      />
      <div className="absolute -bottom-[40%] -right-[20%] w-[60%] h-[80%] rounded-full opacity-[0.03]"
        style={{
          background: "radial-gradient(ellipse at center, #14F195, transparent 70%)",
          animation: "aurora-drift 18s ease-in-out infinite alternate-reverse",
        }}
      />
      <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] rounded-full opacity-[0.02]"
        style={{
          background: "radial-gradient(ellipse at center, #00D4AA, transparent 70%)",
          animation: "aurora-drift 12s ease-in-out infinite alternate",
        }}
      />
      <style>{`
        @keyframes aurora-drift {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(5%, -5%) scale(1.1); }
          100% { transform: translate(-5%, 5%) scale(0.95); }
        }
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 8. BEAM BORDER. Animated beam traveling along border
// ═══════════════════════════════════════════════════════════
export function BeamBorder({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 rounded-lg">
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <motion.div
            animate={{
              background: [
                "conic-gradient(from 0deg at 50% 50%, #9945FF 0%, transparent 60%)",
                "conic-gradient(from 360deg at 50% 50%, #9945FF 0%, transparent 60%)",
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-1px] rounded-lg"
            style={{ padding: "1px" }}
          />
        </div>
      </div>
      <div className="relative bg-zinc-950 rounded-lg border border-white/[0.06]">
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 9. GRID BACKGROUND. Subtle dot/grid pattern
// ═══════════════════════════════════════════════════════════
export function GridBackground({ variant = "dots" }: { variant?: "dots" | "grid" | "none" }) {
  if (variant === "none") return null;

  const pattern = variant === "dots"
    ? "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)"
    : "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)";

  const size = variant === "dots" ? "24px 24px" : "48px 48px, 48px 48px";

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: pattern, backgroundSize: size }} />
  );
}

// ═══════════════════════════════════════════════════════════
// 10. PARTICLE FIELD. Floating particles
// ═══════════════════════════════════════════════════════════
export function ParticleField({ count = 40 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2,
    duration: 10 + Math.random() * 20,
    delay: Math.random() * 10,
    opacity: 0.1 + Math.random() * 0.2,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, opacity: p.opacity }}
          animate={{ y: [-20, 20, -20], x: [-10, 10, -10], opacity: [p.opacity, p.opacity * 1.5, p.opacity] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
