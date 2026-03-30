import { motion } from "framer-motion";
import { fadeInView } from "@/lib/animations";

export default function PreFooterCTA() {
  return (
    <section className="py-24 sm:py-32 border-t border-white/[0.05]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <motion.div {...fadeInView} className="relative overflow-hidden rounded border border-zinc-800" style={{ padding: '64px 32px' }}>
          {/* Background video */}
          <video
            autoPlay loop muted playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          >
            <source src="/videos/AegisSprite.mp4" type="video/mp4" />
          </video>

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 to-zinc-950/90" />

          {/* Content */}
          <div className="relative z-10 text-center">
            <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-bold text-white leading-[1.05] tracking-tight mb-6">
              Upload your skill.
              <br className="hidden sm:block" />
              <span className="text-white/30"> Get paid every time an agent uses it.</span>
            </h2>

            <p className="text-[15px] text-white/30 leading-relaxed max-w-lg mx-auto mb-12">
              432 operators live. Sub-second settlement on Solana.
              The economy is running. Your operator could be next.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="/earn"
                className="group inline-flex items-center gap-2.5 text-[14px] font-normal bg-white text-zinc-900 px-8 py-3.5 rounded hover:bg-zinc-200 transition-all duration-300"
              >
                Upload Your Operator
              </a>
              <a
                href="/docs"
                className="inline-flex items-center gap-2 text-[14px] font-medium text-zinc-300/70 hover:text-zinc-300 border border-white/20 hover:border-white/40 px-8 py-3.5 rounded transition-all duration-300 hover:bg-white/[0.04]"
              >
                Read the Docs
              </a>
            </div>

            {/* Social — just Twitter + Telegram */}
            <div className="flex items-center justify-center gap-4 mt-12">
              <a href="#" className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.07] rounded hover:border-white/20 transition-all text-white/25 hover:text-white/50">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                <span className="text-[12px]">Twitter</span>
              </a>
              <a href="#" className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.07] rounded hover:border-white/20 transition-all text-white/25 hover:text-white/50">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                <span className="text-[12px]">Telegram</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
