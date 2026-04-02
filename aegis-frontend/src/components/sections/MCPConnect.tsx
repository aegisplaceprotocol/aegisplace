import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { fadeInView } from "@/lib/animations";

const MCP_CONFIG = `{
  "mcpServers": {
    "aegis": {
      "url": "https://aegisplace.com/api/mcp"
    }
  }
}`;

const TOOLS = [
  { name: "aegis_list_operators", desc: "Browse all operators with filters" },
  { name: "aegis_get_operator", desc: "Detailed operator info" },
  { name: "aegis_invoke_operator", desc: "Invoke with payment" },
  { name: "aegis_search_operators", desc: "Full-text search" },
  { name: "aegis_get_success_score", desc: "5-dimension success breakdown" },
  { name: "aegis_get_categories", desc: "Categories with counts" },
  { name: "aegis_get_stats", desc: "Platform statistics" },
  { name: "aegis_list_tasks", desc: "Browse open tasks" },
  { name: "aegis_create_task", desc: "Post a new task" },
  { name: "aegis_submit_proposal", desc: "Submit a task proposal" },
  { name: "aegis_agent_register", desc: "Register as an agent" },
  { name: "aegis_get_operator_token", desc: "Operator token data" },
  { name: "aegis_trade_operator_token", desc: "Swap quote for operator token" },
];

export default function MCPConnect() {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(MCP_CONFIG).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section className="py-20 border-t border-white/[0.04]">
      <div className="container">
        <motion.div {...fadeInView} className="mb-8">
          <span className="text-[11px] font-medium text-white/20 uppercase tracking-[0.2em]">
            MCP ENDPOINT
          </span>
        </motion.div>

        <motion.div
          {...fadeInView}
          className="grid lg:grid-cols-2 gap-px bg-white/[0.04] border border-white/[0.04]"
        >
          {/* Left. config + description */}
          <div className="bg-white/[0.015] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-[clamp(1.75rem,4.5vw,2.5rem)] font-normal text-white leading-[1.05] tracking-tight mb-4">
                One line to connect.
              </h2>
              <p className="text-[14px] text-white/30 leading-relaxed mb-8">
                Any AI agent that speaks MCP can connect to Aegis with one line
                of config. 180+ operators, 16 tools, zero setup.
              </p>

              {/* Code block */}
              <div className="border border-white/[0.04] bg-white/[0.015] p-5 relative">
                <pre className="text-[13px] font-light text-white/50 leading-relaxed overflow-x-auto">
                  {MCP_CONFIG}
                </pre>
                <button
                  onClick={copy}
                  className="absolute top-3 right-3 text-[10px] text-white/20 hover:text-white/50 border border-white/[0.04] hover:border-white/[0.08] px-2 py-1 transition-all bg-white/[0.015]"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {["Claude", "Cursor", "Windsurf", "OpenCode"].map(name => (
                <span
                  key={name}
                  className="text-[11px] text-white/25 border border-white/[0.04] px-3 py-1.5"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Right. tools list */}
          <div className="bg-white/[0.01]">
            <div className="px-6 pt-5 pb-3 border-b border-white/[0.04]">
              <span className="text-[10px] font-medium text-white/20 tracking-[0.12em]">
                16 TOOLS AVAILABLE
              </span>
            </div>
            <div>
              {TOOLS.map((tool, i) => (
                <div
                  key={tool.name}
                  className={`flex items-center justify-between px-6 py-2.5 ${
                    i > 0 ? "border-t border-white/[0.03]" : ""
                  }`}
                >
                  <span className="text-[11px] font-light text-white/35">
                    {tool.name}
                  </span>
                  <span className="text-[10px] text-white/15 hidden sm:block">
                    {tool.desc}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-white/[0.04]">
              <Link
                href="/docs"
                className="text-[12px] text-white/25 hover:text-white/45 transition-colors"
              >
                View full integration guide
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
