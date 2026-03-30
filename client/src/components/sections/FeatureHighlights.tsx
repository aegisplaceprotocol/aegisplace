import { useRef, useEffect, useCallback, useState } from "react";
import SectionLabel from "@/components/SectionLabel";
import { useInView } from "@/hooks/useInView";

/* ------------------------------------------------------------------ */
/*  Data -- Aegis's 4 strongest differentiators                        */
/* ------------------------------------------------------------------ */

interface Highlight {
  badge: string;
  title: string;
  desc: string;
  vizType: "network" | "waveform" | "grid" | "scatter";
}

const HIGHLIGHTS: Highlight[] = [
  {
    badge: "Quality Control",
    title: "Verified by Real Reviewers",
    desc: "Independent reviewers put up their own money to guarantee their reviews are honest. If they are right, they earn 15% of every job they verify. If they lie, they lose their deposit. Quality is backed by money, not promises.",
    vizType: "network",
  },
  {
    badge: "Money in Escrow",
    title: "Your Payment is Protected",
    desc: "Before any job starts, your payment is locked in a secure holding account. If the job fails, you get your money back automatically. No disputes, no waiting, no middleman.",
    vizType: "waveform",
  },
  {
    badge: "Insurance",
    title: "Built-in Safety Net",
    desc: "If an AI worker causes real damage, there is an insurance fund that pays you back. Credit cards have chargebacks. Most crypto has nothing. Aegis has actual insurance built into the protocol.",
    vizType: "grid",
  },
  {
    badge: "Mission Builder",
    title: "Chain Jobs Together",
    desc: "String multiple AI workers into a single workflow. Track costs in real time. Use pre-built templates or create your own. Every job earns revenue, every deposit guarantees quality, and every transaction makes the token more scarce.",
    vizType: "scatter",
  },
];

/* Brand green in RGB for canvas */
const BR = 193;
const BG = 255;
const BB = 114;

/* ------------------------------------------------------------------ */
/*  Interactive wireframe canvas component -- all brand green          */
/* ------------------------------------------------------------------ */

function WireframeCanvas({ type }: { type: Highlight["vizType"] }) {
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
      /* 3D-ish rotating network graph */
      const nodes: { x: number; y: number; z: number }[] = [];
      const count = 35;
      for (let i = 0; i < count; i++) {
        const phi = Math.acos(1 - 2 * (i + 0.5) / count);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i + t * 0.4;
        const r = 70 + Math.sin(t + i) * 15;
        const x3 = r * Math.sin(phi) * Math.cos(theta);
        const y3 = r * Math.sin(phi) * Math.sin(theta);
        const z3 = r * Math.cos(phi);
        /* Simple perspective */
        const fov = 300;
        const scale = fov / (fov + z3 + 100);
        nodes.push({
          x: w / 2 + x3 * scale + (mx - 0.5) * 30,
          y: h / 2 + y3 * scale + (my - 0.5) * 30,
          z: scale,
        });
      }
      /* Edges */
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            const alpha = (1 - dist / 80) * 0.2 * Math.min(nodes[i].z, nodes[j].z);
            ctx.strokeStyle = `rgba(${BR},${BG},${BB},${alpha})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      /* Nodes */
      for (const n of nodes) {
        const size = 1.5 * n.z + 0.5;
        const alpha = 0.25 + n.z * 0.5;
        ctx.fillStyle = `rgba(${BR},${BG},${BB},${alpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
        ctx.fill();
        if (alpha > 0.5) {
          ctx.fillStyle = `rgba(${BR},${BG},${BB},${alpha * 0.12})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, size * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (type === "waveform") {
      /* Multi-layer waveform */
      for (let layer = 0; layer < 6; layer++) {
        ctx.strokeStyle = `rgba(${BR},${BG},${BB},${0.06 + layer * 0.03})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const freq = 0.015 + layer * 0.004 + mx * 0.008;
          const amp = 12 + layer * 7 + my * 18;
          const phase = t * (0.8 + layer * 0.25);
          const y = h / 2 + Math.sin(x * freq + phase) * amp + Math.cos(x * freq * 0.5 + phase * 0.6) * amp * 0.35;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      /* Peak dots */
      for (let x = 0; x <= w; x += 25) {
        const y = h / 2 + Math.sin(x * 0.025 + t) * 22 + (my - 0.5) * 15;
        ctx.fillStyle = `rgba(${BR},${BG},${BB},0.25)`;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === "grid") {
      /* Animated dot grid that warps with mouse */
      const spacing = 11;
      const cols = Math.ceil(w / spacing);
      const rows = Math.ceil(h / spacing);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const px = col * spacing + spacing / 2;
          const py = row * spacing + spacing / 2;
          const dmx = (px / w - mx);
          const dmy = (py / h - my);
          const dist = Math.sqrt(dmx * dmx + dmy * dmy);
          const warp = Math.max(0, 1 - dist * 2);
          const offsetX = dmx * warp * -12;
          const offsetY = dmy * warp * -12;
          const pulse = Math.sin(t * 2 + col * 0.25 + row * 0.25) * 0.5 + 0.5;
          const size = 0.7 + pulse * 1 + warp * 2;
          const alpha = 0.06 + pulse * 0.12 + warp * 0.3;
          ctx.fillStyle = `rgba(${BR},${BG},${BB},${alpha})`;
          ctx.fillRect(px + offsetX - size / 2, py + offsetY - size / 2, size, size);
        }
      }
    } else if (type === "scatter") {
      /* Scatter with trend line -- represents settlement speed */
      const points: { x: number; y: number }[] = [];
      const count = 45;
      for (let i = 0; i < count; i++) {
        const px = (i / count) * w * 0.8 + w * 0.1;
        const base = h * 0.7 - (i / count) * h * 0.5;
        const noise = Math.sin(i * 2.1 + t) * 18 + Math.cos(i * 1.5 + t * 0.5) * 12;
        const py = base + noise + (my - 0.5) * 15;
        points.push({ x: px + (mx - 0.5) * 8, y: py });
      }
      /* Trend line */
      ctx.strokeStyle = `rgba(${BR},${BG},${BB},0.12)`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.7);
      ctx.lineTo(w * 0.9, h * 0.2);
      ctx.stroke();
      ctx.setLineDash([]);
      /* Dots */
      for (const p of points) {
        const size = 1.5 + Math.sin(t + p.x * 0.01) * 0.8;
        ctx.fillStyle = `rgba(${BR},${BG},${BB},0.35)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      /* Axes */
      ctx.strokeStyle = `rgba(${BR},${BG},${BB},0.06)`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.75);
      ctx.lineTo(w * 0.92, h * 0.75);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.15);
      ctx.lineTo(w * 0.08, h * 0.75);
      ctx.stroke();
      /* Axis labels */
      ctx.font = "500 9px 'JetBrains Mono', monospace";
      ctx.fillStyle = `rgba(${BR},${BG},${BB},0.15)`;
      ctx.fillText("TPS", w * 0.04, h * 0.14);
      ctx.fillText("400ms", w * 0.85, h * 0.8);
    }

    if (visibleRef.current) {
      animRef.current = requestAnimationFrame(draw);
    }
  }, [type]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          animRef.current = requestAnimationFrame(draw);
        } else {
          cancelAnimationFrame(animRef.current);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(animRef.current);
      observer.disconnect();
    };
  }, [draw]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: 0.5, y: 0.5 };
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Highlight card                                                     */
/* ------------------------------------------------------------------ */

function HighlightCard({ item, index, inView }: { item: Highlight; index: number; inView: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`group relative bg-white/[0.015] border border-white/[0.04] overflow-hidden ${hovered ? "border-white/20 bg-white/[0.015]" : ""}`}
      style={{ transitionDelay: `${200 + index * 150}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Canvas area */}
      <div className="relative h-48 sm:h-56 border-b border-white/[0.04] bg-white/[0.015]">
        <WireframeCanvas type={item.vizType} />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Badge -- all brand green */}
        <span
          className="inline-block text-[11px] font-medium tracking-wide uppercase px-3 py-1 border mb-5 text-zinc-300 border-white/[0.04] bg-white/[0.015]"
        >
          {item.badge}
        </span>

        <h3 className={`text-xl font-normal mb-3 transition-colors duration-300 ${hovered ? "text-white" : "text-white/85"}`}>
          {item.title}
        </h3>

        <p className="text-[14px] leading-[1.7] text-white/35">
          {item.desc}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section                                                            */
/* ------------------------------------------------------------------ */

export default function FeatureHighlights() {
  const { ref, inView } = useInView(0.05);

  return (
    <section id="highlights" className="py-16 sm:py-32 lg:py-40 border-t border-white/[0.04]" ref={ref}>
      <div className="container">
        <SectionLabel text="THE AEGIS ADVANTAGE" />

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
          <div className={``}>
            <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-normal text-white leading-[1.05] tracking-tight">
              Why Aegis is Different.
              <br className="hidden lg:block" />
              <span className="text-white/35 font-normal">Four protections. One system.</span>
            </h2>
          </div>
          <p className={`text-[14px] text-white/30 max-w-md leading-relaxed lg:text-right`}>
            Quality checks, payment protection, insurance, and workflow tools.
            Each one works on its own. Together they make AI agents safe to use and profitable to run.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {HIGHLIGHTS.map((item, i) => (
            <HighlightCard key={item.title} item={item} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
