import { useRef, useEffect, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { fadeInView } from "@/lib/animations";

/* Monochrome white/gray wireframe colors */
const CR = 200, CG = 200, CB = 210;

interface Card {
  tag: string;
  title: string;
  body: string;
  vizType: "network" | "waveform" | "grid" | "scatter";
}

const CARDS: Card[] = [
  {
    tag: "BONDED OPERATORS",
    title: "Skin in the game.",
    body: "Every operator bonds $AEGIS to register. Bronze to Diamond tier. If their output fails quality checks, the bond gets slashed. Quality isn't a badge. It's collateral.",
    vizType: "network",
  },
  {
    tag: "NEMO GUARDRAILS",
    title: "Every call is checked.",
    body: "NVIDIA NeMo Guardrails scan every input and output. Prompt injection blocked. Toxic content caught. PII leaks stopped. Before the agent ever sees the result.",
    vizType: "waveform",
  },
  {
    tag: "INSURANCE FUND",
    title: "1.5% builds the safety net.",
    body: "1.5% of every invocation fee flows to the insurance fund. If an operator causes real damage, the fund pays you back. Credit cards have chargebacks. Aegis has on-chain insurance.",
    vizType: "grid",
  },
  {
    tag: "SETTLEMENT",
    title: "85/10/3/1.5/0.5. Every time.",
    body: "Every fee splits atomically on Solana. 85% creator, 10% validators, 3% treasury, 1.5% insurance, 0.5% burned forever. No invoices. No delays. No middlemen.",
    vizType: "scatter",
  },
];

function WireframeCanvas({ type }: { type: Card["vizType"] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const visibleRef = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    timeRef.current += 0.008;
    const t = timeRef.current;
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    if (type === "network") {
      const nodes: { x: number; y: number; z: number }[] = [];
      const count = 35;
      for (let i = 0; i < count; i++) {
        const phi = Math.acos(1 - 2 * (i + 0.5) / count);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i + t * 0.4;
        const r = 70 + Math.sin(t + i) * 15;
        const x3 = r * Math.sin(phi) * Math.cos(theta);
        const y3 = r * Math.sin(phi) * Math.sin(theta);
        const z3 = r * Math.cos(phi);
        const fov = 300;
        const scale = fov / (fov + z3 + 100);
        nodes.push({ x: w / 2 + x3 * scale + (mx - 0.5) * 30, y: h / 2 + y3 * scale + (my - 0.5) * 30, z: scale });
      }
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.strokeStyle = `rgba(${CR},${CG},${CB},${(1 - dist / 80) * 0.15 * Math.min(nodes[i].z, nodes[j].z)})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        const size = 1.5 * n.z + 0.5;
        const alpha = 0.2 + n.z * 0.4;
        ctx.fillStyle = `rgba(${CR},${CG},${CB},${alpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === "waveform") {
      for (let layer = 0; layer < 6; layer++) {
        ctx.strokeStyle = `rgba(${CR},${CG},${CB},${0.04 + layer * 0.025})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const freq = 0.015 + layer * 0.004 + mx * 0.008;
          const amp = 12 + layer * 7 + my * 18;
          const phase = t * (0.8 + layer * 0.25);
          const y = h / 2 + Math.sin(x * freq + phase) * amp + Math.cos(x * freq * 0.5 + phase * 0.6) * amp * 0.35;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (let x = 0; x <= w; x += 25) {
        const y = h / 2 + Math.sin(x * 0.025 + t) * 22 + (my - 0.5) * 15;
        ctx.fillStyle = `rgba(${CR},${CG},${CB},0.2)`;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === "grid") {
      const spacing = 11;
      const cols = Math.ceil(w / spacing);
      const rows = Math.ceil(h / spacing);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const px = col * spacing + spacing / 2;
          const py = row * spacing + spacing / 2;
          const dmx = px / w - mx;
          const dmy = py / h - my;
          const dist = Math.sqrt(dmx * dmx + dmy * dmy);
          const warp = Math.max(0, 1 - dist * 2);
          const offsetX = dmx * warp * -12;
          const offsetY = dmy * warp * -12;
          const pulse = Math.sin(t * 2 + col * 0.25 + row * 0.25) * 0.5 + 0.5;
          const size = 0.7 + pulse * 1 + warp * 2;
          const alpha = 0.04 + pulse * 0.08 + warp * 0.25;
          ctx.fillStyle = `rgba(${CR},${CG},${CB},${alpha})`;
          ctx.fillRect(px + offsetX - size / 2, py + offsetY - size / 2, size, size);
        }
      }
    } else if (type === "scatter") {
      const points: { x: number; y: number }[] = [];
      const count = 45;
      for (let i = 0; i < count; i++) {
        const px = (i / count) * w * 0.8 + w * 0.1;
        const base = h * 0.7 - (i / count) * h * 0.5;
        const noise = Math.sin(i * 2.1 + t) * 18 + Math.cos(i * 1.5 + t * 0.5) * 12;
        const py = base + noise + (my - 0.5) * 15;
        points.push({ x: px + (mx - 0.5) * 8, y: py });
      }
      ctx.strokeStyle = `rgba(${CR},${CG},${CB},0.08)`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.7);
      ctx.lineTo(w * 0.9, h * 0.2);
      ctx.stroke();
      ctx.setLineDash([]);
      for (const p of points) {
        const size = 1.5 + Math.sin(t + p.x * 0.01) * 0.8;
        ctx.fillStyle = `rgba(${CR},${CG},${CB},0.3)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = `rgba(${CR},${CG},${CB},0.04)`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.75);
      ctx.lineTo(w * 0.92, h * 0.75);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.15);
      ctx.lineTo(w * 0.08, h * 0.75);
      ctx.stroke();
    }

    if (visibleRef.current) animRef.current = requestAnimationFrame(draw);
  }, [type]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) animRef.current = requestAnimationFrame(draw);
        else cancelAnimationFrame(animRef.current);
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);
    return () => { cancelAnimationFrame(animRef.current); observer.disconnect(); };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseRef.current = { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
      }}
      onMouseLeave={() => { mouseRef.current = { x: 0.5, y: 0.5 }; }}
    />
  );
}

export default function Protections() {
  return (
    <section className="py-24 sm:py-32 border-t border-white/[0.04]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <motion.div {...fadeInView}>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
            <div>
              <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-normal text-white leading-[1.1] tracking-tight mb-2">
                Why Aegis is Different.
              </h2>
              <p className="text-zinc-500 text-base">Four guarantees. Zero assumptions.</p>
            </div>
            <p className="text-[14px] text-zinc-500 max-w-md leading-relaxed lg:text-right">
              Bonded operators, NeMo guardrails, on-chain insurance, and atomic settlement.
              Each one enforces quality independently. Together they make the agent economy verifiable.
            </p>
          </div>
        </motion.div>

        <motion.div {...fadeInView} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CARDS.map((card, i) => (
            <div key={card.tag} className="rounded border border-zinc-800 bg-zinc-900/40 overflow-hidden flex flex-col">
              {/* Canvas illustration */}
              <div className="relative h-48 sm:h-56 border-b border-zinc-800 bg-zinc-950/50">
                <WireframeCanvas type={card.vizType} />
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-zinc-900/80 to-transparent pointer-events-none" />
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8 flex flex-col flex-1">
                <span className="text-xs font-medium text-zinc-400 border border-zinc-700 rounded px-2.5 py-1 uppercase tracking-wider self-start mb-5">
                  {card.tag}
                </span>
                <h3 className="text-xl font-normal text-white mb-3">{card.title}</h3>
                <p className="text-[14px] text-zinc-400 leading-relaxed flex-1">{card.body}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
