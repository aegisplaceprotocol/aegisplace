import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { fadeInView } from "@/lib/animations";
import { mcpConnectivityUrl } from "@/lib/api";

const TOOLS = [
  { name: "aegisx_launch", description: "Launch a token on Bags.fm with custom fee vaults and creator royalties" },
  { name: "aegisx_audit", description: "Audit a Solana program for 15 vulnerability classes including missing signers and unsafe CPI" },
  { name: "aegisx_trade", description: "Execute swaps, limit orders, and DCA strategies via Jupiter V6" },
  { name: "aegisx_research", description: "Search Reddit, Hacker News, GitHub, and DexScreener for any topic" },
  { name: "aegisx_codemap", description: "Generate Solana-aware architecture maps with PDA and CPI analysis" },
  { name: "aegisx_intel", description: "Track competitors across GitHub, CoinGecko, and DexScreener in real time" },
  { name: "aegisx_browser", description: "Automate browser tasks with Puppeteer for testing and data extraction" },
  { name: "aegisx_video", description: "Generate AI images and videos with FLUX, Veo, and 40+ models" },
  { name: "aegisx_swarm", description: "Orchestrate up to 16 parallel agents working on different tasks" },
  { name: "aegisx_payments", description: "Accept and send micropayments via x402 and Stripe" },
];

function buildConfigJson(url: string) {
  return `{
  "mcpServers": {
    "aegis": {
      "url": "${url}"
    }
  }
}`;
}

function buildDualMcpConfig(url: string) {
  return `{
  "mcpServers": {
    "aegis": {
      "url": "${url}"
    },
    "ows": {
      "command": "ows",
      "args": ["serve", "--mcp"]
    }
  }
}`;
}

const COMPATIBLE = [
  { name: "Claude", icon: "" },
  { name: "Cursor", icon: "" },
  { name: "Windsurf", icon: "" },
  { name: "OpenCode", icon: "" },
];

function Code({ code, label = "json" }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="border border-white/[0.05] bg-background">
      <div className="flex items-center justify-between px-5 py-2 border-b border-white/[0.03]">
        <span className="text-[9px] uppercase tracking-[0.2em] text-white/15 select-none">
          {label}
        </span>
        <button
          onClick={copy}
          className="text-[9px] uppercase tracking-[0.2em] text-white/20 hover:text-white/50 transition-colors cursor-pointer select-none"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="px-5 py-4 text-[12.5px] font-light text-white/40 leading-[1.85] overflow-x-auto whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

export default function Connect() {
  const mcpUrl = mcpConnectivityUrl();
  const configJson = buildConfigJson(mcpUrl);
  const dualMcpConfig = buildDualMcpConfig(mcpUrl);

  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />
      <div className="pt-24 pb-12">
        {/* Hero */}
        <motion.div {...fadeInView} className="mx-auto max-w-[1520px] px-12 text-center pb-16">
          <h1 className="text-4xl md:text-5xl font-normal tracking-[-0.02em] text-white/90 mb-4">
            Connect to AegisX
          </h1>
          <p className="text-[15px] text-white/35 leading-relaxed max-w-2xl mx-auto">
            Any MCP-compatible AI agent can access 180+ operators and 47 skills with one line of
            config. Works with Claude, Cursor, Windsurf, and OpenCode.
          </p>
        </motion.div>

        {/* MCP Config */}
        <motion.div {...fadeInView} className="mx-auto max-w-[1520px] px-12 pb-16">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-4">
            MCP Configuration
          </div>
          <Code code={configJson} label="json" />
        </motion.div>

        {/* OWS Section */}
        <div className="mx-auto max-w-[1520px] px-12 pb-16">
          <div className="border border-white/[0.06] bg-white/[0.01] p-6">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-3">
              Open Wallet Standard
            </div>
            <h3 className="text-[17px] font-medium text-white/75 mb-2">
              Agent Wallet Integration
            </h3>
            <p className="text-[14px] text-white/35 leading-relaxed mb-6 max-w-xl">
              Connect Aegis with OWS for secure, policy-controlled agent
              payments. Keys never leave your machine.
            </p>
            <Code code={dualMcpConfig} label="json" />
            <a
              href="/docs"
              className="inline-flex items-center gap-2 text-[13px] font-medium text-white/50 hover:text-white/80 transition-colors mt-4"
            >
              Full wallet setup guide
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* Compatible With */}
        <div className="mx-auto max-w-[1520px] px-12 pb-16">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-6">
            Compatible Clients
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.03] border border-white/[0.05] items-stretch">
            {COMPATIBLE.map(client => (
              <div key={client.name} className="bg-background p-6 text-center">
                <span className="text-[14px] font-medium text-white/60">
                  {client.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tools */}
        <motion.div {...fadeInView} className="mx-auto max-w-[1520px] px-12 pb-16">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-6">
            61 Tools Available
          </div>
          <div className="border border-white/[0.05] overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.015]">
                  <th className="px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-white/25 font-medium whitespace-nowrap">
                    Tool
                  </th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-white/25 font-medium whitespace-nowrap">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {TOOLS.map(tool => (
                  <tr
                    key={tool.name}
                    className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.01] transition-colors"
                  >
                    <td className="px-5 py-3.5 text-[13px] text-white/60 font-medium font-light whitespace-nowrap">
                      {tool.name}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-white/35">
                      {tool.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
