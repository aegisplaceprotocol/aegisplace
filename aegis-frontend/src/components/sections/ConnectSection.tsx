import { motion } from "framer-motion";
import { fadeInView } from "@/lib/animations";

const MCP_CONFIG = `{
  "mcpServers": {
    "aegis": {
      "url": "https://aegisplace.com/api/mcp"
    }
  }
}`;

const SDK_CODE = `import { AegisClient } from '@aegisprotocol/sdk';
const aegis = new AegisClient({ wallet: 'agent-treasury' });
const tools = await aegis.tools(); // 432 operators`;

export default function ConnectSection() {
  return (
    <section className="py-24 sm:py-32 border-t border-white/[0.04]">
      <div className="container">
        <motion.div {...fadeInView}>
          <div className="flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
            <span className="text-[11px] font-medium tracking-wider uppercase text-zinc-500">
              CONNECT
            </span>
          </div>

          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-normal text-white leading-[1.1] tracking-tight mb-4">
            One config line. 432 skills.
          </h2>
        </motion.div>

        <motion.div {...fadeInView} className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-12 sm:mt-16">
          {/* MCP Config */}
          <div className="rounded border border-zinc-800 bg-zinc-900/40 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white/30" />
              <span className="text-[11px] font-mono text-zinc-500">mcp.json</span>
            </div>
            <pre className="p-5 text-[13px] font-mono text-zinc-300 leading-relaxed overflow-x-auto">
              {MCP_CONFIG}
            </pre>
          </div>

          {/* SDK Example */}
          <div className="rounded border border-zinc-800 bg-zinc-900/40 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white/20" />
              <span className="text-[11px] font-mono text-zinc-500">agent.ts</span>
            </div>
            <pre className="p-5 text-[13px] font-mono text-zinc-300 leading-relaxed overflow-x-auto">
              {SDK_CODE}
            </pre>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
