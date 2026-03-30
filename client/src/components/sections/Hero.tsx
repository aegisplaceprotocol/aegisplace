import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { NvidiaBadge } from "@/components/NvidiaLogo";
import { LogoBar } from "@/components/BrandLogos";

/* Operator callsigns orbiting the mesh */
const AGENT_NAMES = [
  "SPECTRE", "SENTINEL", "PHANTOM", "VANGUARD",
  "CIPHER-9", "RECON-7", "FORGE-12", "GHOST-3",
  "IRONCLAD", "WATCHDOG", "ARSENAL", "OVERWATCH",
  "NEXUS-4", "ORACLE", "TEMPEST", "AEGIS-PRIME",
];

/* Interactive Wireframe Mesh (mouse-driven) */
function WireframeMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const visibleRef = useRef(true);
  const nodesRef = useRef<{
    x: number; y: number; z: number;
    baseX: number; baseY: number; baseZ: number;
    vx: number; vy: number;
  }[]>([]);
  const orbitRef = useRef<{
    angle: number; speed: number; radius: number;
    name: string; opacity: number;
  }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let time = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const initNodes = () => {
      const nodes: typeof nodesRef.current = [];
      const count = 240;
      const spread = 750;
      for (let i = 0; i < count; i++) {
        const phi = Math.acos(1 - 2 * (i + 0.5) / count);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        const r = spread * (0.5 + Math.random() * 0.5);
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        nodes.push({
          x, y, z, baseX: x, baseY: y, baseZ: z,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
        });
      }
      nodesRef.current = nodes;
    };

    const initOrbits = () => {
      orbitRef.current = AGENT_NAMES.map((name, i) => ({
        angle: (Math.PI * 2 * i) / AGENT_NAMES.length,
        speed: 0.0006 + Math.random() * 0.0005,
        radius: 400 + Math.random() * 300,
        name,
        opacity: 0.3 + Math.random() * 0.25,
      }));
    };

    const project = (x: number, y: number, z: number, cx: number, cy: number) => {
      const fov = 800;
      const scale = fov / (fov + z + 400);
      return { px: cx + x * scale, py: cy + y * scale, scale };
    };

    const draw = () => {
      time += 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.5;
      const mx = (mouseRef.current.x - 0.5) * 0.4;
      const my = (mouseRef.current.y - 0.5) * 0.4;
      const rotY = time * 0.002 + mx;
      const rotX = my * 0.4;
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const projected = nodesRef.current.map((n) => {
        const bx = n.baseX + Math.sin(time * 0.008 + n.baseX * 0.008) * 12;
        const by = n.baseY + Math.cos(time * 0.01 + n.baseY * 0.008) * 12;
        const bz = n.baseZ + Math.sin(time * 0.006 + n.baseZ * 0.008) * 12;
        const x1 = bx * cosY - bz * sinY;
        const z1 = bx * sinY + bz * cosY;
        const y1 = by * cosX - z1 * sinX;
        const z2 = by * sinX + z1 * cosX;
        return project(x1, y1, z2, cx, cy);
      });

      // Draw connections
      const maxDist = 220;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].px - projected[j].px;
          const dy = projected[i].py - projected[j].py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.12 * Math.min(projected[i].scale, projected[j].scale);
            ctx.strokeStyle = `rgba(200,200,210,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(projected[i].px, projected[i].py);
            ctx.lineTo(projected[j].px, projected[j].py);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const p of projected) {
        const r = 2 * p.scale;
        const alpha = 0.15 + p.scale * 0.25;
        ctx.fillStyle = `rgba(210,210,220,${Math.min(alpha, 0.35)})`;
        ctx.beginPath();
        ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center glow
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 400);
      gradient.addColorStop(0, "rgba(200,200,220,0.032)");
      gradient.addColorStop(0.3, "rgba(180,180,200,0.016)");
      gradient.addColorStop(0.6, "rgba(161,161,170,0.008)");
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // Orbiting agent names
      ctx.font = "600 11px 'Aeonik', system-ui, sans-serif";
      ctx.textAlign = "center";
      for (const orb of orbitRef.current) {
        orb.angle += orb.speed;
        const ox = cx + Math.cos(orb.angle) * orb.radius;
        const oy = cy + Math.sin(orb.angle) * orb.radius * 0.45;
        const pulse = 0.75 + Math.sin(time * 0.015 + orb.angle) * 0.25;
        const nameAlpha = Math.min(orb.opacity * pulse * 1.8, 0.2);
        ctx.fillStyle = `rgba(220,220,230,${nameAlpha})`;
        ctx.fillText(orb.name, ox, oy);

        ctx.fillStyle = `rgba(220,220,230,${nameAlpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(ox - ctx.measureText(orb.name).width / 2 - 10, oy - 4, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (visibleRef.current) {
        raf = requestAnimationFrame(draw);
      }
    };

    resize();
    initNodes();
    initOrbits();
    draw();

    const handleMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) raf = requestAnimationFrame(draw);
      },
      { threshold: 0.05 }
    );
    if (canvas) observer.observe(canvas);

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMove);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

/* Hero Section */
export default function Hero() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <section id="about" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <WireframeMesh />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060606]/90 via-[#060606]/40 to-[#060606]/95 pointer-events-none z-[2]" />
      <div className="absolute inset-0 pointer-events-none z-[2]" style={{
        background: "radial-gradient(ellipse at 50% 48%, rgba(200,200,220,0.06) 0%, transparent 50%)",
      }} />

      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 relative z-10 text-center">
        {/* HEADLINE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[0.95] tracking-tight">
            Every agent call.<br />
            <span className="text-zinc-500">Verified. Paid. Receipted.</span>
          </h1>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="text-sm md:text-base text-zinc-400 max-w-xl mx-auto mb-12 leading-relaxed"
        >
          Operators bond real money. Validators stake their reputation.
          Bad work gets slashed. 432 skills. Sub-second settlement on Solana.
          No middlemen. No permission.
        </motion.p>

        {/* Dual CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-20"
        >
          <a
            href="/earn"
            className="group inline-flex items-center gap-2.5 text-[14px] sm:text-[15px] font-normal bg-white text-zinc-900 px-7 py-3.5 rounded hover:bg-zinc-200 transition-all duration-300"
          >
            Start Earning
          </a>
          <a
            href="/marketplace"
            className="inline-flex items-center gap-2 text-[14px] sm:text-[15px] font-medium text-zinc-400 hover:text-zinc-200 border border-white/[0.10] hover:border-white/[0.20] px-7 py-3.5 rounded transition-all duration-300 hover:bg-white/[0.04]"
          >
            Explore Marketplace
          </a>
        </motion.div>
      </div>

      {/* Logo bar - pinned to bottom of hero, centered */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={visible ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="absolute bottom-10 left-0 right-0 z-10 flex justify-center"
      >
        <LogoBar
          variant="hero"
          label="Skills on Aegis leverage the entire AI and blockchain stack"
          className="max-w-7xl mx-auto"
        />
      </motion.div>
    </section>
  );
}
