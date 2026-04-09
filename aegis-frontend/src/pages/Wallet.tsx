import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { fadeInView } from "@/lib/animations";
import { mcpConnectivityUrl } from "@/lib/api";

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

// The unified bridge config (coming soon)
const BRIDGE_CONFIG = `{
  "mcpServers": {
    "aegis": {
      "command": "npx",
      "args": ["@aegisprotocol/mcp-bridge", "--wallet", "my-agent"]
    }
  }
}`;

// Policy template
const POLICY_YAML = `name: aegis-spending-policy
wallets: ["my-agent"]
rules:
  - type: spending_limit
    chain: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"
    token: "USDC"
    max_per_tx: "1.00"
    max_per_hour: "10.00"
    max_per_day: "50.00"
  - type: simulation_required
    chains: ["solana:*"]
    min_value: "5.00"`;

function Code({ code, label = "bash" }: { code: string; label?: string }) {
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

export default function WalletPage() {
  const dualMcpConfig = buildDualMcpConfig(mcpConnectivityUrl());
  // suppress unused variable warning
  void BRIDGE_CONFIG;

  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />
      <div className="pt-24 pb-12">
        {/* Hero */}
        <div className="mx-auto max-w-[1520px] px-12 text-center pb-16">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-6">
            Open Wallet Standard
          </div>
          <h1 className="text-4xl md:text-5xl font-normal tracking-[-0.02em] text-white/90 mb-4">
            Agent Wallet
          </h1>
          <p className="text-[15px] text-white/35 leading-relaxed max-w-2xl mx-auto">
            Secure key management for AI agents. Keys never leave your machine.
            AES-256-GCM encrypted. Policy-controlled spending. Zero cloud
            dependency.
          </p>
        </div>

        {/* Architecture Stack */}
        <motion.div {...fadeInView} className="mx-auto max-w-[1520px] px-12 pb-16">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-4">
            The Aegis Stack
          </div>
          <div className="border border-white/[0.05]">
            {[
              { label: "AI Agent", sub: "Claude, GPT, Cursor, any MCP client" },
              {
                label: "Aegis Marketplace",
                sub: "180+ operators · 47 skills · AegisX CLI · NeMo guardrails",
              },
              {
                label: "x402 Payment Layer",
                sub: "HTTP 402 \u00b7 per-invocation USDC micropayment",
              },
              {
                label: "Open Wallet Standard",
                sub: "AES-256-GCM vault \u00b7 policy engine \u00b7 isolated signing",
              },
              {
                label: "Solana",
                sub: "400ms finality \u00b7 $0.00025 tx cost \u00b7 USDC settlement",
              },
            ].map((layer, i) => (
              <div
                key={i}
                className="border-b border-white/[0.03] last:border-0 px-5 py-4"
              >
                <div className="text-[14px] text-white/65 font-medium">
                  {layer.label}
                </div>
                <div className="text-[12px] text-white/25 mt-0.5">
                  {layer.sub}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Steps */}
        <motion.div {...fadeInView} className="mx-auto max-w-[1520px] px-12 pb-16">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-6">
            Setup in 3 Steps
          </div>

          {/* Step 1: Install */}
          <div className="flex gap-7 py-5 border-b border-white/[0.03]">
            <div className="text-[12px] text-white/12 font-light w-6 flex-shrink-0 pt-0.5 text-right">
              01
            </div>
            <div className="flex-1">
              <div className="text-[14px] text-white/65 font-medium mb-3">
                Install OWS
              </div>
              <Code
                code="curl -fsSL https://openwallet.sh/install.sh | bash"
                label="bash"
              />
            </div>
          </div>

          {/* Step 2: Create Wallet */}
          <div className="flex gap-7 py-5 border-b border-white/[0.03]">
            <div className="text-[12px] text-white/12 font-light w-6 flex-shrink-0 pt-0.5 text-right">
              02
            </div>
            <div className="flex-1">
              <div className="text-[14px] text-white/65 font-medium mb-3">
                Create Agent Wallet
              </div>
              <Code code='ows wallet create --name "my-agent"' label="bash" />
              <p className="text-[13px] text-white/30 mt-2">
                Fund the displayed Solana address with USDC to enable payments.
              </p>
            </div>
          </div>

          {/* Step 3: Connect */}
          <div className="flex gap-7 py-5 border-b border-white/[0.03] last:border-0">
            <div className="text-[12px] text-white/12 font-light w-6 flex-shrink-0 pt-0.5 text-right">
              03
            </div>
            <div className="flex-1">
              <div className="text-[14px] text-white/65 font-medium mb-3">
                Connect to Aegis
              </div>
              <Code code={dualMcpConfig} label="json" />
              <p className="text-[13px] text-white/30 mt-2">
                Add to your Claude/Cursor/Windsurf MCP config. Two servers:
                Aegis (marketplace) + OWS (wallet).
              </p>
            </div>
          </div>
        </motion.div>

        {/* Spending Policy */}
        <div className="mx-auto max-w-[1520px] px-12 pb-16">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-4">
            Spending Policy Template
          </div>
          <p className="text-[14px] text-white/35 leading-relaxed mb-6 max-w-xl">
            Control exactly how much your agent can spend. OWS enforces these
            limits at the signing level. The agent physically cannot
            overspend.
          </p>
          <Code code={POLICY_YAML} label="yaml" />
        </div>

        {/* How it works */}
        <div className="mx-auto max-w-[1520px] px-12 pb-16">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-6">
            How Agent Payments Work
          </div>
          <div>
            {[
              {
                step: "Agent calls aegis_invoke_operator",
                desc: "Discovers and selects an operator via MCP",
              },
              {
                step: "Aegis returns price: $0.01 USDC",
                desc: "HTTP 402 Payment Required with x402 payment details",
              },
              {
                step: "OWS checks spending policy",
                desc: "Validates against per-tx, hourly, and daily limits",
              },
              {
                step: "OWS signs USDC transfer",
                desc: "Key never leaves encrypted vault. Signing in isolated memory.",
              },
              {
                step: "Agent retries with payment proof",
                desc: "Includes Solana transaction signature as x402 proof",
              },
              {
                step: "Operator executes, agent gets result",
                desc: "NeMo guardrails check input/output. Success rate updated.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex gap-7 py-5 border-b border-white/[0.03] last:border-0"
              >
                <div className="text-[12px] text-white/12 font-light w-6 flex-shrink-0 pt-0.5 text-right">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <div className="text-[14px] text-white/65 font-medium mb-1.5">
                    {item.step}
                  </div>
                  <div className="text-[13px] text-white/30 leading-relaxed">
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key properties */}
        <div className="mx-auto max-w-[1520px] px-12 pb-16">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-6">
            Security Properties
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.03] border border-white/[0.05]">
            {[
              {
                label: "Key Exposure",
                value: "Zero",
                desc: "Keys never leave OWS vault",
              },
              {
                label: "Encryption",
                value: "AES-256",
                desc: "GCM with Argon2id KDF",
              },
              {
                label: "Signing",
                value: "Isolated",
                desc: "mlocked memory, zeroized",
              },
              {
                label: "Cloud",
                value: "None",
                desc: "Fully local, no dependency",
              },
            ].map((stat, i) => (
              <div key={i} className="bg-background p-6 text-center">
                <div className="text-[17px] font-normal text-white/60">
                  {stat.value}
                </div>
                <div className="text-[12px] text-white/50 font-medium mt-1">
                  {stat.label}
                </div>
                <div className="text-[10px] text-white/20 mt-1">
                  {stat.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
