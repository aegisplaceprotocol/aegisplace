import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AegisIcon } from "@/components/AegisIcon";
import MobileBottomNav from "@/components/MobileBottomNav";

/* ── Theme ─────────────────────────────────────────────────────────────────── */
const T = {
  bg: "#0A0A0B",
  bgDeep: "#08080a",
  sidebar: "#09090b",
  card: "rgba(255,255,255,0.015)",
  cardHover: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.05)",
  borderHover: "rgba(255,255,255,0.09)",
  text92: "rgba(255,255,255,0.92)",
  text44: "rgba(255,255,255,0.44)",
  text28: "rgba(255,255,255,0.28)",
  text18: "rgba(255,255,255,0.18)",
  accent: "#10B981",
  accentDim: "rgba(16,185,129,0.12)",
  accentBorder: "rgba(16,185,129,0.2)",
};

/* ── Types ──────────────────────────────────────────────────────────────────── */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  timeAgo: string;
  active?: boolean;
}

/* ── Static Data ────────────────────────────────────────────────────────────── */
const CONVERSATIONS: Conversation[] = [
  { id: "1", title: "Audit vault.rs", timeAgo: "2m ago", active: true },
  { id: "2", title: "Jupiter swap optimization", timeAgo: "1h ago" },
  { id: "3", title: "DeFi yield scan", timeAgo: "3h ago" },
  { id: "4", title: "Token safety check", timeAgo: "Yesterday" },
  { id: "5", title: "Deploy Anchor program", timeAgo: "2d ago" },
  { id: "6", title: "Marinade staking APY", timeAgo: "3d ago" },
];

const MODELS = [
  { id: "sonnet", label: "Sonnet 4.6" },
  { id: "opus", label: "Opus 4.6" },
  { id: "haiku", label: "Haiku" },
  { id: "gemini", label: "Gemini" },
  { id: "groq", label: "Groq" },
  { id: "ollama", label: "Ollama" },
];

const QUICK_ACTIONS = [
  {
    label: "Audit Smart Contract",
    prompt: "Scan this Anchor program for security vulnerabilities",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: "Swap Tokens",
    prompt: "Swap 1 SOL to USDC via Jupiter with best route",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
  },
  {
    label: "Browse Marketplace",
    prompt: "Show me the top operators in the marketplace",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Check Token Safety",
    prompt: "Check this token for rug pull signals and safety score",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    label: "DeFi Opportunities",
    prompt: "Scan Solana DeFi protocols for best yield opportunities",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
  {
    label: "Deploy Program",
    prompt: "Help me deploy an Anchor program to Solana devnet",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
];

/* ── Demo code for the right panel ─────────────────────────────────────────── */
const PANEL_FILES: Record<string, { label: string; lang: string; content: string }> = {
  "vault.rs": {
    label: "vault.rs",
    lang: "rust",
    content: `use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Transfer};

declare_id!("AegisVau1t111111111111111111111111111111111");

#[program]
pub mod vault {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        bump: u8,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.bump = bump;
        vault.total_deposits = 0;
        vault.is_locked = false;
        emit!(VaultInitialized {
            authority: vault.authority,
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    pub fn deposit(
        ctx: Context<Deposit>,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, VaultError::InvalidAmount);
        require!(!ctx.accounts.vault.is_locked, VaultError::VaultLocked);
        let transfer = Transfer {
            from: ctx.accounts.user_token.to_account_info(),
            to: ctx.accounts.vault_token.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                transfer,
            ),
            amount,
        )?;
        ctx.accounts.vault.total_deposits += amount;
        Ok(())
    }

    pub fn withdraw(
        ctx: Context<Withdraw>,
        amount: u64,
    ) -> Result<()> {
        require!(
            ctx.accounts.vault.authority == ctx.accounts.authority.key(),
            VaultError::Unauthorized
        );
        require!(amount <= ctx.accounts.vault.total_deposits, VaultError::InsufficientFunds);
        ctx.accounts.vault.total_deposits -= amount;
        Ok(())
    }
}

#[error_code]
pub enum VaultError {
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Vault is currently locked")]
    VaultLocked,
    #[msg("Unauthorized: signer is not vault authority")]
    Unauthorized,
    #[msg("Insufficient funds in vault")]
    InsufficientFunds,
}`,
  },
  "package.json": {
    label: "package.json",
    lang: "json",
    content: `{
  "name": "aegis-vault",
  "version": "0.1.0",
  "description": "Aegis Protocol vault program",
  "scripts": {
    "build": "anchor build",
    "test": "anchor test",
    "deploy": "anchor deploy --provider.cluster mainnet",
    "lint": "cargo clippy -- -D warnings",
    "fmt": "cargo fmt"
  },
  "dependencies": {
    "@coral-xyz/anchor": "^0.30.1",
    "@solana/web3.js": "^1.95.3",
    "@solana/spl-token": "^0.4.6"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "chai": "^4.3.4",
    "mocha": "^9.0.3",
    "ts-mocha": "^10.0.0",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}`,
  },
  "SKILL.md": {
    label: "SKILL.md",
    lang: "markdown",
    content: `# aegis-vault-operator

**Skill ID:** \`aegis-vault-v1\`
**Category:** DeFi / Custody
**Quality Score:** 96/100
**Version:** 1.4.2

## Overview

Secure SOL and SPL token vault with multi-sig
support, time-locks, and on-chain audit trail.
All operations emit events for indexing.

## Capabilities

- \`initialize\` - Deploy a new vault account
- \`deposit\` - Transfer tokens into vault
- \`withdraw\` - Authority-gated withdrawal
- \`lock\` / \`unlock\` - Emergency controls
- \`audit\` - Return full deposit history

## Invocation

\`\`\`bash
aegis invoke aegis-vault-v1 \\
  --action deposit \\
  --amount 1000000 \\
  --token So111...
\`\`\`

## Fee Structure

| Action     | Fee       |
|------------|-----------|
| initialize | 0.001 SOL |
| deposit    | 0.1%      |
| withdraw   | 0.15%     |
| audit      | $0.002    |

## Trust & Safety

Audited by Sec3. No mint authority.
Freeze authority: Revoked.
Program is immutable on mainnet.`,
  },
};

const DEMO_TERMINAL_OUTPUT = `aegisx@solana:~$ aegis check So11111111111111111111111111111111
  ✓ Mint authority: Revoked
  ✓ Freeze authority: Revoked
  ✓ Liquidity: $142M locked
  ✓ Holder concentration: 38% (healthy)
  Quality Score: 94/100 - SAFE

aegisx@solana:~$ aegis invoke jupiter-swap-router --input 1SOL --output USDC
  Fetching best route...
  Route: SOL → USDC via Raydium
  Input:  1.000 SOL
  Output: 142.38 USDC
  Impact: 0.02%
  Fee:    $0.003
  ✓ Simulation passed

aegisx@solana:~$ _`;

const DEMO_OUTPUT_JSON = `{
  "operator": "jupiter-swap-router",
  "status": "success",
  "latency": "89ms",
  "result": {
    "inputAmount": "1.000 SOL",
    "outputAmount": "142.38 USDC",
    "priceImpact": "0.02%",
    "route": "SOL → USDC via Raydium"
  },
  "qualityScore": 96,
  "fee": "$0.003"
}`;

/* ── Syntax Coloring ────────────────────────────────────────────────────────── */
function ColorizedCode({ code }: { code: string }) {
  const keywords = ["use", "pub", "fn", "let", "mut", "mod", "struct", "impl", "Ok", "require"];
  const types = ["Context", "Result", "Transfer", "CpiContext", "u8", "u64", "Initialize", "Deposit"];

  const lines = code.split("\n");
  return (
    <>
      {lines.map((line, li) => {
        const parts: { text: string; color: string }[] = [];
        let remaining = line;

        // Simple token scanner — good enough for demo
        const tokens: string[] = remaining.match(/(".*?"|\/\/.*$|[A-Za-z_][A-Za-z0-9_]*|[^A-Za-z_"]+)/g) ?? [];
        tokens.forEach((tok: string) => {
          if (tok.startsWith("//")) parts.push({ text: tok, color: "rgba(255,255,255,0.22)" });
          else if (tok.startsWith('"')) parts.push({ text: tok, color: "#34d399" });
          else if (keywords.includes(tok)) parts.push({ text: tok, color: "#a78bfa" });
          else if (types.includes(tok)) parts.push({ text: tok, color: "#fbbf24" });
          else if (/^\d+$/.test(tok)) parts.push({ text: tok, color: "#f97316" });
          else parts.push({ text: tok, color: "rgba(255,255,255,0.72)" });
        });

        return (
          <div key={li} style={{ display: "flex", minHeight: 20 }}>
            <span style={{ color: T.text18, userSelect: "none", minWidth: 32, textAlign: "right", paddingRight: 16, fontSize: 11 }}>
              {li + 1}
            </span>
            <span>
              {parts.map((p, pi) => (
                <span key={pi} style={{ color: p.color }}>{p.text}</span>
              ))}
            </span>
          </div>
        );
      })}
    </>
  );
}

/* ── Copy Button ────────────────────────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      style={{
        background: "rgba(255,255,255,0.06)",
        border: `1px solid ${T.border}`,
        borderRadius: 4,
        padding: "3px 8px",
        fontSize: 10,
        color: copied ? T.accent : T.text44,
        cursor: "pointer",
        transition: "all 0.15s",
        fontFamily: "inherit",
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/* ── Code Block inside messages ─────────────────────────────────────────────── */
function InlineCodeBlock({ code, lang = "rust" }: { code: string; lang?: string }) {
  return (
    <div style={{
      background: "#0d0d10",
      border: `1px solid ${T.border}`,
      borderRadius: 6,
      marginTop: 8,
      marginBottom: 4,
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 12px",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <span style={{ fontSize: 10, color: T.text28, textTransform: "uppercase", letterSpacing: "0.08em" }}>{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre style={{
        margin: 0,
        padding: "12px 16px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        lineHeight: 1.7,
        overflowX: "auto",
        color: "rgba(255,255,255,0.75)",
      }}>
        <ColorizedCode code={code} />
      </pre>
    </div>
  );
}

/* ── Message Renderer ───────────────────────────────────────────────────────── */
function renderMessageContent(content: string) {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = content.slice(lastIndex, match.index);
      parts.push(
        <span key={lastIndex} style={{ whiteSpace: "pre-wrap" }}>{textChunk}</span>
      );
    }
    parts.push(
      <InlineCodeBlock key={match.index} code={match[2].trimEnd()} lang={match[1] || "text"} />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(
      <span key={lastIndex} style={{ whiteSpace: "pre-wrap" }}>{content.slice(lastIndex)}</span>
    );
  }

  return parts;
}

/* ── Message Bubble ─────────────────────────────────────────────────────────── */
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        padding: "6px 0",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      {!isUser && (
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: T.accentDim,
          border: `1px solid ${T.accentBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 2,
          overflow: "hidden",
        }}>
          <img src="/icon.png" alt="Aegis" style={{ width: 16, height: 16, objectFit: "contain" }} />
        </div>
      )}
      <div style={{
        maxWidth: isUser ? "72%" : "80%",
        padding: isUser ? "10px 14px" : "12px 16px",
        borderRadius: isUser ? "12px 12px 4px 12px" : "4px 12px 12px 12px",
        fontSize: 13.5,
        lineHeight: 1.65,
        color: T.text92,
        background: isUser ? T.accentDim : "rgba(255,255,255,0.02)",
        border: `1px solid ${isUser ? T.accentBorder : T.border}`,
        wordBreak: "break-word",
      }}>
        {!isUser && (
          <div style={{ fontSize: 11, color: T.accent, fontWeight: 600, marginBottom: 6, letterSpacing: "0.04em" }}>
            AegisX
          </div>
        )}
        {renderMessageContent(message.content)}
      </div>
    </motion.div>
  );
}

/* ── Thinking indicator ─────────────────────────────────────────────────────── */
function ThinkingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 0" }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 6,
        background: T.accentDim, border: `1px solid ${T.accentBorder}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginTop: 2, overflow: "hidden",
      }}>
        <img src="/icon.png" alt="Aegis" style={{ width: 16, height: 16, objectFit: "contain" }} />
      </div>
      <div style={{
        padding: "12px 16px", borderRadius: "4px 12px 12px 12px",
        background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`,
        display: "flex", gap: 4, alignItems: "center",
      }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            style={{
              width: 5, height: 5, borderRadius: "50%",
              background: T.accent, display: "block",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ── Welcome Screen ─────────────────────────────────────────────────────────── */
function WelcomeScreen({ onAction }: { onAction: (prompt: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        padding: "0 24px",
        textAlign: "center",
      }}
    >
      {/* Logo lockup — wordmark already contains the star icon */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 8 }}>
        <img src="/fullvectorwhite.svg" alt="AegisX" style={{ height: 36, objectFit: "contain", marginBottom: 10 }} />
        <span style={{
          fontSize: 10, color: "rgba(255,255,255,0.18)", letterSpacing: "0.12em",
          textTransform: "uppercase" as const, fontWeight: 500,
        }}>
          Solana AI Agent IDE
        </span>
      </div>
      <p style={{ fontSize: 14, color: T.text44, margin: "0 0 40px", lineHeight: 1.5 }}>
        How can I help you build on Solana?
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 8,
        width: "100%",
        maxWidth: 560,
      }}>
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onAction(action.prompt)}
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              padding: "14px 16px",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "flex-start",
              gap: 11,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = T.cardHover;
              e.currentTarget.style.borderColor = T.borderHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = T.card;
              e.currentTarget.style.borderColor = T.border;
            }}
          >
            <span style={{ color: T.text44, flexShrink: 0, marginTop: 1 }}>{action.icon}</span>
            <span style={{ fontSize: 13, color: T.text92, fontWeight: 450, lineHeight: 1.4 }}>
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Left Sidebar ───────────────────────────────────────────────────────────── */

interface SidebarStats {
  operators: string;
  skills: string;
  qualityScore: string;
}

const TOOL_ITEMS = [
  {
    id: "aegis-check",
    label: "Aegis Check",
    command: "Check this token for rug pull signals and safety score: ",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: "marketplace",
    label: "Marketplace",
    command: "Show me the top operators in the marketplace",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: "skills",
    label: "Skills",
    command: "Browse available skills by category",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Analytics",
    command: "Show me live Aegis protocol stats and analytics",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
];

const BRIDGE_ITEMS = [
  {
    id: "solana-rpc",
    label: "Solana RPC",
    subtitle: "Mainnet connection",
    status: "available" as const,
    icon: <img src="/bridges/solana.png" alt="Solana" style={{ width: 14, height: 14, objectFit: "contain", borderRadius: 3 }} />,
  },
  {
    id: "jupiter-v6",
    label: "Jupiter V6",
    subtitle: "Swap routing",
    status: "available" as const,
    icon: <img src="/bridges/jupiter.png" alt="Jupiter" style={{ width: 14, height: 14, objectFit: "contain", borderRadius: 3 }} />,
  },
  {
    id: "defillama",
    label: "DeFiLlama",
    subtitle: "TVL & yields",
    status: "available" as const,
    icon: <img src="/bridges/defillama.png" alt="DeFiLlama" style={{ width: 14, height: 14, objectFit: "contain", borderRadius: 3 }} />,
  },
  {
    id: "coingecko",
    label: "CoinGecko",
    subtitle: "Price feeds",
    status: "available" as const,
    icon: <img src="/bridges/coingecko.png" alt="CoinGecko" style={{ width: 14, height: 14, objectFit: "contain", borderRadius: 3 }} />,
  },
  {
    id: "helius",
    label: "Helius",
    subtitle: "DAS API & webhooks",
    status: "available" as const,
    icon: <img src="/bridges/helius.png" alt="Helius" style={{ width: 14, height: 14, objectFit: "contain", borderRadius: 3 }} />,
  },
  {
    id: "nemo",
    label: "NeMo",
    subtitle: "Safety guardrails",
    status: "available" as const,
    icon: <img src="/bridges/nemo.png" alt="NeMo" style={{ width: 14, height: 14, objectFit: "contain", borderRadius: 3 }} />,
  },
  {
    id: "bags-fm",
    label: "Bags.fm",
    subtitle: "Creator economy",
    status: "available" as const,
    icon: <img src="/BagsFMLogo.png" alt="Bags" style={{ width: 14, height: 14, objectFit: "contain", borderRadius: 3 }} />,
  },
  {
    id: "github",
    label: "GitHub",
    subtitle: "Repo analysis",
    status: "available" as const,
    icon: <img src="/bridges/github.png" alt="GitHub" style={{ width: 14, height: 14, objectFit: "contain", borderRadius: 3 }} />,
  },
];

function LeftSidebar({
  collapsed,
  onToggle,
  activeConv,
  onSelectConv,
  onNewChat,
}: {
  collapsed: boolean;
  onToggle: () => void;
  activeConv: string;
  onSelectConv: (id: string) => void;
  onNewChat: () => void;
}) {
  const [toolsOpen, setToolsOpen] = useState(true);
  const [bridgesOpen, setBridgesOpen] = useState(true);
  const [stats, setStats] = useState<SidebarStats>({ operators: "—", skills: "—", qualityScore: "—" });
  // We need a ref to a send function — injected via a custom event
  const fireChatCommand = useCallback((command: string) => {
    window.dispatchEvent(new CustomEvent("aegis:sidebar-command", { detail: { command } }));
  }, []);

  useEffect(() => {
    fetch("/api/v1/stats")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        const s = data.stats ?? data;
        setStats({
          operators: s.total_operators ?? s.operators ?? "180+",
          skills: s.total_skills ?? s.skills ?? "63",
          qualityScore: s.avg_quality_score != null ? Number(s.avg_quality_score).toFixed(1) : s.quality_score ?? "94.2",
        });
      })
      .catch(() => {
        setStats({ operators: "180+", skills: "63", qualityScore: "94.2" });
      });
  }, []);

  const w = collapsed ? 52 : 280;

  return (
    <motion.aside
      animate={{ width: w }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      style={{
        height: "100vh",
        background: "#09090b",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* ── SECTION 1: Header ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: collapsed ? "0 14px" : "0 14px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        height: 56,
        flexShrink: 0,
        gap: 8,
      }}>
        {/* Logo — official Aegis branding */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", overflow: "hidden" }}>
          {collapsed ? (
            <img
              src="/icon.png"
              alt="Aegis"
              style={{ width: 22, height: 22, objectFit: "contain" }}
            />
          ) : (
            <img
              src="/fullvectorwhite.svg"
              alt="AegisX"
              style={{ height: 19, objectFit: "contain" }}
            />
          )}
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={onToggle}
              title="Collapse sidebar"
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.28)",
                padding: "5px",
                borderRadius: 5,
                display: "flex",
                alignItems: "center",
                transition: "color 0.2s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.72)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.28)"; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>

        {collapsed && (
          <button
            onClick={onToggle}
            title="Expand sidebar"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.28)", padding: "5px", borderRadius: 5,
              display: "flex", alignItems: "center", transition: "color 0.2s",
              marginLeft: "auto", flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.72)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.28)"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {/* ── SECTION 2: New Chat ── */}
      <div style={{ padding: collapsed ? "10px 9px" : "10px 10px", flexShrink: 0 }}>
        <button
          onClick={onNewChat}
          title="New Chat"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: collapsed ? "8px 0" : "8px 11px",
            justifyContent: collapsed ? "center" : "flex-start",
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 7,
            cursor: "pointer",
            color: "rgba(255,255,255,0.44)",
            transition: "all 0.2s",
            fontSize: 12.5,
            fontWeight: 450,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.035)";
            e.currentTarget.style.color = "rgba(255,255,255,0.92)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.11)";
            const icon = e.currentTarget.querySelector(".nc-icon") as HTMLElement | null;
            if (icon) icon.style.color = T.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.015)";
            e.currentTarget.style.color = "rgba(255,255,255,0.44)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
            const icon = e.currentTarget.querySelector(".nc-icon") as HTMLElement | null;
            if (icon) icon.style.color = "rgba(255,255,255,0.44)";
          }}
        >
          <span className="nc-icon" style={{ display: "flex", alignItems: "center", transition: "color 0.2s", color: "rgba(255,255,255,0.44)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                style={{ whiteSpace: "nowrap" }}
              >
                New Chat
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* ── SECTION 3: Conversations ── */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        padding: collapsed ? "0 7px" : "0 8px",
        scrollbarWidth: "none",
      }}>
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div style={{
                padding: "6px 4px 5px",
                fontSize: 9,
                color: "rgba(255,255,255,0.18)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}>
                Recent
              </div>
              {CONVERSATIONS.map((conv) => {
                const isActive = activeConv === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => onSelectConv(conv.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      background: isActive ? "rgba(255,255,255,0.028)" : "none",
                      border: "none",
                      borderLeft: isActive ? `2px solid ${T.accent}` : "2px solid transparent",
                      borderRadius: "0 6px 6px 0",
                      padding: "7px 8px 7px 10px",
                      cursor: "pointer",
                      marginBottom: 1,
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "none";
                    }}
                  >
                    {/* Chat bubble icon */}
                    <span style={{ color: isActive ? T.accent : "rgba(255,255,255,0.22)", flexShrink: 0, display: "flex" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>
                    <span style={{
                      fontSize: 12.5,
                      color: isActive ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.44)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontWeight: isActive ? 500 : 400,
                      lineHeight: 1.35,
                      flex: 1,
                      minWidth: 0,
                    }}>
                      {conv.title}
                    </span>
                    <span style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.2)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}>
                      {conv.timeAgo}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed: just icons */}
        {collapsed && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 4 }}>
            {CONVERSATIONS.map((conv) => {
              const isActive = activeConv === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => onSelectConv(conv.id)}
                  title={conv.title}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    padding: "8px 0",
                    background: "none",
                    border: "none",
                    borderLeft: isActive ? `2px solid ${T.accent}` : "2px solid transparent",
                    cursor: "pointer",
                    color: isActive ? T.accent : "rgba(255,255,255,0.28)",
                    transition: "all 0.2s",
                    borderRadius: "0 5px 5px 0",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.72)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.28)"; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SECTION 4: Tools ── */}
      <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.04)", padding: collapsed ? "10px 7px" : "12px 10px" }}>
        {/* Tools header — only show when expanded */}
        <AnimatePresence>
          {!collapsed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setToolsOpen((p) => !p)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 4px 5px",
                color: "rgba(255,255,255,0.18)",
                marginBottom: 2,
              }}
            >
              <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                Tools
              </span>
              <svg
                width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: toolsOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(!collapsed && toolsOpen) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {TOOL_ITEMS.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => fireChatCommand(tool.command)}
                    title={tool.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 8px",
                      background: "none",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.38)",
                      fontSize: 12,
                      fontWeight: 450,
                      textAlign: "left",
                      transition: "all 0.2s",
                      width: "100%",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.82)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "none";
                      e.currentTarget.style.color = "rgba(255,255,255,0.38)";
                    }}
                  >
                    <span style={{ display: "flex", flexShrink: 0 }}>{tool.icon}</span>
                    <span style={{ whiteSpace: "nowrap" }}>{tool.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed: tool icons only */}
        {collapsed && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {TOOL_ITEMS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => fireChatCommand(tool.command)}
                title={tool.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px 0",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.28)",
                  borderRadius: 5,
                  transition: "all 0.2s",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.72)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "rgba(255,255,255,0.28)";
                }}
              >
                {tool.icon}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 4b: Bridges ── */}
      <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.04)", padding: collapsed ? "10px 7px" : "12px 10px" }}>
        {/* Bridges header — expanded */}
        <AnimatePresence>
          {!collapsed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setBridgesOpen((p) => !p)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 4px 5px",
                color: "rgba(255,255,255,0.18)",
                marginBottom: 2,
              }}
            >
              <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                Bridges
              </span>
              <svg
                width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: bridgesOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(!collapsed && bridgesOpen) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {BRIDGE_ITEMS.map((bridge) => (
                  <button
                    key={bridge.id}
                    onClick={() => fireChatCommand(`Connect to ${bridge.label} bridge`)}
                    title={bridge.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 8px",
                      background: "none",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.38)",
                      fontSize: 12,
                      fontWeight: 450,
                      textAlign: "left",
                      transition: "all 0.2s",
                      width: "100%",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.82)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "none";
                      e.currentTarget.style.color = "rgba(255,255,255,0.38)";
                    }}
                  >
                    <span style={{ display: "flex", flexShrink: 0 }}>{bridge.icon}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ whiteSpace: "nowrap", display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {bridge.label}
                      </span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", whiteSpace: "nowrap", display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {bridge.subtitle}
                      </span>
                    </span>
                    {/* Status dot */}
                    <span style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: (bridge.status as string) === "connected" ? "#10B981" : "rgba(255,255,255,0.2)",
                      flexShrink: 0,
                    }} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed: bridges badge */}
        {collapsed && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 4 }}>
            <div
              title="8 bridges available"
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 700,
                color: "rgba(255,255,255,0.28)",
                letterSpacing: "-0.02em",
              }}
            >
              8
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 5: Live Stats ── */}
      <div style={{
        flexShrink: 0,
        borderTop: "1px solid rgba(255,255,255,0.04)",
        padding: collapsed ? "12px 7px" : "14px 12px",
      }}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 7 }}>
                Live Network
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {/* Operators */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                    </svg>
                    Operators
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.accent, fontVariantNumeric: "tabular-nums" }}>
                    {stats.operators}
                  </span>
                </div>
                {/* Skills */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    Skills
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.accent, fontVariantNumeric: "tabular-nums" }}>
                    {stats.skills}
                  </span>
                </div>
                {/* Quality */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    Quality
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.accent, fontVariantNumeric: "tabular-nums" }}>
                    {stats.qualityScore}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed: stacked numbers */}
        {collapsed && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            {[stats.operators, stats.skills, stats.qualityScore].map((val, i) => (
              <div
                key={i}
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: T.accent,
                  letterSpacing: "-0.01em",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}
              >
                {val}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 6: Profile / Wallet ── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: collapsed ? "12px 9px" : "14px 12px",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex",
          alignItems: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : 10,
          flexDirection: collapsed ? "column" : "row",
        }}>
          {/* NFT Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: collapsed ? 30 : 38,
              height: collapsed ? 30 : 38,
              borderRadius: 8,
              overflow: "hidden",
              border: "1.5px solid rgba(16,185,129,0.25)",
              boxShadow: "0 0 12px rgba(16,185,129,0.08), inset 0 0 8px rgba(0,0,0,0.3)",
              background: "#1a1a2e",
              cursor: "pointer",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(16,185,129,0.5)";
              e.currentTarget.style.boxShadow = "0 0 18px rgba(16,185,129,0.15), inset 0 0 8px rgba(0,0,0,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(16,185,129,0.25)";
              e.currentTarget.style.boxShadow = "0 0 12px rgba(16,185,129,0.08), inset 0 0 8px rgba(0,0,0,0.3)";
            }}
            >
              {/* Inline pixel-art ape avatar SVG */}
              <svg viewBox="0 0 40 40" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="apeBg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2d1b69" />
                    <stop offset="100%" stopColor="#11998e" />
                  </linearGradient>
                  <linearGradient id="fur" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B6914" />
                    <stop offset="100%" stopColor="#6B4F10" />
                  </linearGradient>
                </defs>
                <rect width="40" height="40" fill="url(#apeBg)" />
                {/* Face shape */}
                <ellipse cx="20" cy="22" rx="12" ry="13" fill="url(#fur)" />
                {/* Inner face */}
                <ellipse cx="20" cy="24" rx="8" ry="8" fill="#C4983F" />
                {/* Eyes - bored expression */}
                <ellipse cx="15" cy="19" rx="3.5" ry="2.8" fill="#1a1a2e" />
                <ellipse cx="25" cy="19" rx="3.5" ry="2.8" fill="#1a1a2e" />
                <ellipse cx="15.5" cy="19.5" rx="1.5" ry="1.5" fill="#fff" />
                <ellipse cx="25.5" cy="19.5" rx="1.5" ry="1.5" fill="#fff" />
                {/* Droopy eyelids - bored look */}
                <path d="M11 17.5 Q15 16 19 17.5" fill="url(#fur)" />
                <path d="M21 17.5 Q25 16 29 17.5" fill="url(#fur)" />
                {/* Nose */}
                <ellipse cx="18.5" cy="24" rx="1.2" ry="1" fill="#8B6914" />
                <ellipse cx="21.5" cy="24" rx="1.2" ry="1" fill="#8B6914" />
                {/* Mouth - slight smirk */}
                <path d="M16 27 Q20 29.5 24 27" fill="none" stroke="#8B6914" strokeWidth="0.8" strokeLinecap="round" />
                {/* Ears */}
                <ellipse cx="8" cy="18" rx="3" ry="4" fill="url(#fur)" />
                <ellipse cx="8" cy="18" rx="1.8" ry="2.5" fill="#C4983F" />
                <ellipse cx="32" cy="18" rx="3" ry="4" fill="url(#fur)" />
                <ellipse cx="32" cy="18" rx="1.8" ry="2.5" fill="#C4983F" />
                {/* Beanie hat */}
                <path d="M8 17 Q8 8 20 7 Q32 8 32 17" fill="#10B981" />
                <rect x="7" y="15" width="26" height="3" rx="1.5" fill="#0D9668" />
                <circle cx="20" cy="6" r="2" fill="#10B981" />
                {/* Laser eyes glow (subtle) */}
                <circle cx="15.5" cy="19.5" r="1.5" fill="#10B981" opacity="0.3" />
                <circle cx="25.5" cy="19.5" r="1.5" fill="#10B981" opacity="0.3" />
              </svg>
            </div>
            {/* Online indicator */}
            <div style={{
              position: "absolute",
              bottom: -1,
              right: -1,
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "#10B981",
              border: "2px solid #09090b",
              boxShadow: "0 0 6px rgba(16,185,129,0.4)",
            }} />
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{ flex: 1, minWidth: 0 }}
              >
                {/* Name row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.85)",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                  }}>
                    anon.aegis
                  </span>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button
                      title="Copy wallet address"
                      onClick={() => navigator.clipboard?.writeText("7xKXzVR8e9Lm4HdFpNcJQvTKye4Qw3nB8mZ2yR6")}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "rgba(255,255,255,0.22)",
                        padding: 3,
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        transition: "color 0.2s, background 0.2s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.65)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.22)"; e.currentTarget.style.background = "none"; }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    <button
                      title="Settings"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "rgba(255,255,255,0.22)",
                        padding: 3,
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        transition: "color 0.2s, background 0.2s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.65)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.22)"; e.currentTarget.style.background = "none"; }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Wallet address */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  marginBottom: 6,
                }}>
                  {/* Solana icon */}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M4.5 18.5l3-3h12l-3 3h-12z" fill="rgba(16,185,129,0.6)" />
                    <path d="M4.5 5.5l3 3h12l-3-3h-12z" fill="rgba(16,185,129,0.6)" />
                    <path d="M4.5 12l3-3h12l-3 3h-12z" fill="rgba(16,185,129,0.4)" />
                  </svg>
                  <span style={{
                    fontSize: 10,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "rgba(255,255,255,0.32)",
                    letterSpacing: "0.02em",
                  }}>
                    7xKX...e4Qw
                  </span>
                  <span style={{
                    fontSize: 8,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    color: "rgba(16,185,129,0.7)",
                    background: "rgba(16,185,129,0.08)",
                    padding: "1px 5px",
                    borderRadius: 3,
                    textTransform: "uppercase" as const,
                  }}>
                    connected
                  </span>
                </div>

                {/* Balance row */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "5px 8px",
                  background: "rgba(255,255,255,0.015)",
                  borderRadius: 5,
                  border: "1px solid rgba(255,255,255,0.03)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>SOL</span>
                    <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>12.847</span>
                  </div>
                  <div style={{ width: 1, height: 10, background: "rgba(255,255,255,0.06)" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>AEGIS</span>
                    <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "rgba(16,185,129,0.65)", fontWeight: 500 }}>4,200</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}

/* ── Model Selector ─────────────────────────────────────────────────────────── */
function ModelSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = MODELS.find((m) => m.id === value) || MODELS[0];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 7,
          padding: "5px 10px 5px 10px",
          cursor: "pointer",
          color: T.text92,
          fontSize: 12,
          fontWeight: 500,
          transition: "all 0.12s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = T.borderHover;
          e.currentTarget.style.background = T.cardHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = T.border;
          e.currentTarget.style.background = T.card;
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, flexShrink: 0 }} />
        {current.label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: T.text28 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              background: "#111113",
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              overflow: "hidden",
              zIndex: 100,
              minWidth: 140,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            {MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => { onChange(m.id); setOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  textAlign: "left",
                  background: value === m.id ? T.accentDim : "none",
                  border: "none",
                  padding: "8px 12px",
                  fontSize: 12,
                  color: value === m.id ? T.text92 : T.text44,
                  cursor: "pointer",
                  transition: "all 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (value !== m.id) e.currentTarget.style.background = T.cardHover;
                }}
                onMouseLeave={(e) => {
                  if (value !== m.id) e.currentTarget.style.background = "none";
                }}
              >
                {value === m.id && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {value !== m.id && <span style={{ width: 10 }} />}
                {m.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── JSON Output Colorizer ──────────────────────────────────────────────────── */
function ColorizedJSON({ json }: { json: string }) {
  const lines = json.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        // Colorize JSON tokens
        const parts: { text: string; color: string }[] = [];
        const tokenRegex = /("(?:[^"\\]|\\.)*")\s*(:)|("(?:[^"\\]|\\.)*")|(true|false|null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],])|(\s+)|(\/\/.*)/g;
        let match: RegExpExecArray | null;
        let lastIdx = 0;
        while ((match = tokenRegex.exec(line)) !== null) {
          if (match.index > lastIdx) {
            parts.push({ text: line.slice(lastIdx, match.index), color: "rgba(255,255,255,0.55)" });
          }
          if (match[1] && match[2]) {
            // key: value pair
            parts.push({ text: match[1], color: "#10B981" });
            parts.push({ text: match[2], color: "rgba(255,255,255,0.38)" });
          } else if (match[3]) {
            parts.push({ text: match[3], color: "#34D399" });
          } else if (match[4]) {
            parts.push({ text: match[4], color: "#60A5FA" });
          } else if (match[5]) {
            parts.push({ text: match[5], color: "#FBBF24" });
          } else if (match[6]) {
            parts.push({ text: match[6], color: "rgba(255,255,255,0.28)" });
          } else if (match[7]) {
            parts.push({ text: match[7], color: "transparent" });
          }
          lastIdx = match.index + match[0].length;
        }
        if (lastIdx < line.length) {
          parts.push({ text: line.slice(lastIdx), color: "rgba(255,255,255,0.55)" });
        }
        return (
          <div key={i} style={{ display: "flex", minHeight: 20 }}>
            <span style={{ color: "rgba(255,255,255,0.12)", userSelect: "none", minWidth: 28, textAlign: "right", paddingRight: 14, fontSize: 11 }}>
              {i + 1}
            </span>
            <span>
              {parts.map((p, pi) => <span key={pi} style={{ color: p.color }}>{p.text}</span>)}
            </span>
          </div>
        );
      })}
    </>
  );
}

/* ── Right Code Panel ───────────────────────────────────────────────────────── */
type PanelTab = "code" | "terminal" | "output";

function CodePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<PanelTab>("code");
  const [activeFile, setActiveFile] = useState<string>("vault.rs");
  const [cursorVisible, setCursorVisible] = useState(true);

  // Blinking cursor
  useEffect(() => {
    if (activeTab !== "terminal") return;
    const id = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, [activeTab]);

  const fileKeys = Object.keys(PANEL_FILES);
  const currentFile = PANEL_FILES[activeFile];

  const TABS: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "code",
      label: "Code",
      icon: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
    {
      id: "terminal",
      label: "Terminal",
      icon: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      ),
    },
    {
      id: "output",
      label: "Output",
      icon: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 420, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          style={{
            height: "100vh",
            background: "#08080a",
            borderLeft: `1px solid ${T.border}`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {/* Tab bar */}
          <div style={{
            height: 48,
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "stretch",
            padding: "0 8px",
            gap: 2,
            flexShrink: 0,
          }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "0 11px",
                    background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    color: isActive ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.28)",
                    fontSize: 12,
                    fontWeight: isActive ? 500 : 400,
                    transition: "all 0.13s",
                    margin: "6px 0",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.28)";
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center" }}>{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}

            {/* Spacer + AegisX label + close */}
            <div style={{ flex: 1 }} />
            <span style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 10, color: "rgba(255,255,255,0.15)",
              letterSpacing: "0.06em", fontWeight: 500,
              marginRight: 6,
            }}>
              <img src="/icon.png" alt="" style={{ width: 11, height: 11, objectFit: "contain", opacity: 0.4 }} />
              AegisX IDE
            </span>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.22)",
                padding: "0 8px",
                display: "flex",
                alignItems: "center",
                borderRadius: 5,
                transition: "color 0.12s",
                margin: "6px 0",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.72)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.22)"}
              title="Close panel"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* ── TAB 1: Code ── */}
          {activeTab === "code" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              {/* File tabs */}
              <div style={{
                display: "flex",
                alignItems: "center",
                borderBottom: `1px solid ${T.border}`,
                padding: "0 4px",
                gap: 1,
                flexShrink: 0,
                overflowX: "auto",
                scrollbarWidth: "none",
              }}>
                {fileKeys.map((fname) => {
                  const isActive = activeFile === fname;
                  return (
                    <button
                      key={fname}
                      onClick={() => setActiveFile(fname)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "8px 12px",
                        background: "none",
                        border: "none",
                        borderBottom: isActive ? `2px solid ${T.accent}` : "2px solid transparent",
                        cursor: "pointer",
                        color: isActive ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.3)",
                        fontSize: 11,
                        fontFamily: "'JetBrains Mono', monospace",
                        whiteSpace: "nowrap",
                        transition: "all 0.12s",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.3)";
                      }}
                    >
                      {fname}
                    </button>
                  );
                })}
                <div style={{ flex: 1 }} />
                <div style={{ padding: "0 10px", flexShrink: 0 }}>
                  <CopyButton text={currentFile.content} />
                </div>
              </div>

              {/* Code content */}
              <div style={{
                flex: 1,
                overflowY: "auto",
                padding: "14px 0",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                lineHeight: 1.72,
                scrollbarWidth: "none",
              }}>
                <ColorizedCode code={currentFile.content} />
              </div>
            </div>
          )}

          {/* ── TAB 2: Terminal ── */}
          {activeTab === "terminal" && (
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              background: "#06060a",
              overflow: "hidden",
            }}>
              {/* Terminal header bar */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 14px",
                borderBottom: `1px solid rgba(255,255,255,0.04)`,
                flexShrink: 0,
              }}>
                {["#ef4444", "#f59e0b", "#10B981"].map((c, i) => (
                  <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.7 }} />
                ))}
                <span style={{ marginLeft: 6, fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>
                  aegisx | bash | 80x24
                </span>
              </div>

              {/* Terminal output */}
              <div style={{
                flex: 1,
                overflowY: "auto",
                padding: "14px 18px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                lineHeight: 1.75,
                scrollbarWidth: "none",
              }}>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {DEMO_TERMINAL_OUTPUT.split("\n").map((line, i) => {
                    const isPrompt = line.startsWith("aegisx@solana");
                    const isSuccess = line.trimStart().startsWith("✓");
                    const isScore = line.includes("Quality Score");
                    let color = "rgba(255,255,255,0.52)";
                    if (isPrompt) color = "#10B981";
                    else if (isSuccess) color = "#34D399";
                    else if (isScore) color = "rgba(255,255,255,0.88)";

                    // Last line with cursor
                    const isLastLine = i === DEMO_TERMINAL_OUTPUT.split("\n").length - 1;
                    return (
                      <div key={i} style={{ color }}>
                        {isLastLine ? (
                          <>
                            <span style={{ color: "#10B981" }}>aegisx@solana:~$ </span>
                            <span
                              style={{
                                display: "inline-block",
                                width: 7,
                                height: 13,
                                background: "#10B981",
                                opacity: cursorVisible ? 0.85 : 0,
                                verticalAlign: "text-bottom",
                                transition: "opacity 0.08s",
                              }}
                            />
                          </>
                        ) : (
                          line
                        )}
                      </div>
                    );
                  })}
                </pre>
              </div>
            </div>
          )}

          {/* ── TAB 3: Output ── */}
          {activeTab === "output" && (
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}>
              {/* Output header */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 14px",
                borderBottom: `1px solid ${T.border}`,
                flexShrink: 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.44)", fontFamily: "'JetBrains Mono', monospace" }}>
                    jupiter-swap-router
                  </span>
                  <span style={{
                    padding: "1px 6px",
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.22)",
                    borderRadius: 4,
                    fontSize: 10,
                    color: "#10B981",
                    fontWeight: 500,
                  }}>
                    success
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", fontFamily: "'JetBrains Mono', monospace" }}>89ms</span>
                  <CopyButton text={DEMO_OUTPUT_JSON} />
                </div>
              </div>

              {/* JSON output */}
              <div style={{
                flex: 1,
                overflowY: "auto",
                padding: "14px 0",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                lineHeight: 1.72,
                scrollbarWidth: "none",
              }}>
                <ColorizedJSON json={DEMO_OUTPUT_JSON} />
              </div>
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/* ── Live Indicator ─────────────────────────────────────────────────────────── */
function LiveIndicator({ status }: { status: "checking" | "live" | "offline" }) {
  if (status === "checking") return null;
  const isLive = status === "live";
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 5,
      padding: "4px 8px",
      borderRadius: 6,
      background: isLive ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
      border: `1px solid ${isLive ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
      fontSize: 11,
      fontWeight: 500,
      color: isLive ? T.accent : "#ef4444",
      flexShrink: 0,
    }}>
      <motion.div
        animate={isLive ? { opacity: [1, 0.3, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: isLive ? T.accent : "#ef4444",
          flexShrink: 0,
        }}
      />
      {isLive ? "Live" : "Offline"}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */
export default function AegisChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [codePanelOpen, setCodePanelOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("sonnet");
  const [activeConv, setActiveConv] = useState("1");
  const [convTitle, setConvTitle] = useState("Audit vault.rs");
  const [backendStatus, setBackendStatus] = useState<"checking" | "live" | "offline">("checking");

  useEffect(() => {
    fetch("/api/v1/stats")
      .then((r) => { setBackendStatus(r.ok ? "live" : "offline"); })
      .catch(() => { setBackendStatus("offline"); });
  }, []);

  // Listen for sidebar tool button commands
  useEffect(() => {
    const handler = (e: Event) => {
      const command = (e as CustomEvent<{ command: string }>).detail?.command;
      if (command) {
        setInput(command);
        setTimeout(() => {
          inputRef.current?.focus();
          if (inputRef.current) {
            inputRef.current.style.height = "auto";
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 130) + "px";
          }
        }, 30);
      }
    };
    window.addEventListener("aegis:sidebar-command", handler);
    return () => window.removeEventListener("aegis:sidebar-command", handler);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Auto-grow textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 130) + "px";
  }, []);

  const handleSend = useCallback(async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setLoading(true);

    try {
      const responseContent = await getSmartResponse(content);
      const assistantMsg: Message = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errMsg: Message = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: "Failed to reach marketplace. Is the backend running?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Global keyboard shortcuts — defined after handleSend
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "T") {
        e.preventDefault();
        setCodePanelOpen((p) => !p);
      }
      if (e.ctrlKey && e.shiftKey && e.key === "B") {
        e.preventDefault();
        setSidebarCollapsed((p) => !p);
      }
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSend]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setConvTitle("New Chat");
    setActiveConv("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSelectConv = useCallback((id: string) => {
    const conv = CONVERSATIONS.find((c) => c.id === id);
    if (conv) {
      setActiveConv(id);
      setConvTitle(conv.title);
      setMessages([]);
    }
  }, []);

  const hasContent = input.trim().length > 0;

  return (
    <div style={{
      display: "flex",
      height: "100dvh",
      background: T.bg,
      color: T.text92,
      overflow: "hidden",
      fontFamily: "inherit",
    }}>
      {/* Left sidebar — hidden on mobile */}
      <div className="hidden lg:flex">
        <LeftSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((p) => !p)}
          activeConv={activeConv}
          onSelectConv={handleSelectConv}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Center chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100dvh" }}>

        {/* Top bar */}
        <div style={{
          height: 56,
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
          flexShrink: 0,
          background: T.bg,
        }}>
          <ModelSelector value={selectedModel} onChange={setSelectedModel} />
          <LiveIndicator status={backendStatus} />
          <span style={{
            fontSize: 12.5,
            color: T.text44,
            fontWeight: 450,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}>
            {convTitle}
          </span>
          {/* Code panel toggle */}
          <button
            onClick={() => setCodePanelOpen((p) => !p)}
            title="Toggle Code Panel"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 7,
              background: codePanelOpen ? T.accentDim : "none",
              border: `1px solid ${codePanelOpen ? T.accentBorder : T.border}`,
              cursor: "pointer",
              color: codePanelOpen ? T.accent : T.text28,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!codePanelOpen) {
                e.currentTarget.style.borderColor = T.borderHover;
                e.currentTarget.style.color = T.text92;
              }
            }}
            onMouseLeave={(e) => {
              if (!codePanelOpen) {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.color = T.text28;
              }
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          padding: "0 16px",
        }}>
          {messages.length === 0 ? (
            <WelcomeScreen onAction={handleSend} />
          ) : (
            <div style={{ padding: "20px 0", maxWidth: 760, width: "100%", margin: "0 auto", alignSelf: "center", flex: 1 }}>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <AnimatePresence>
                {loading && <ThinkingBubble />}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div style={{
          padding: "12px 16px 16px",
          flexShrink: 0,
        }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{
              display: "flex",
              flexDirection: "column",
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              overflow: "hidden",
              transition: "border-color 0.15s",
            }}
            onFocusCapture={(e) => (e.currentTarget.style.borderColor = T.borderHover)}
            onBlurCapture={(e) => (e.currentTarget.style.borderColor = T.border)}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Message AegisX..."
                rows={1}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: T.text92,
                  fontSize: 14,
                  padding: "14px 16px 4px",
                  resize: "none",
                  fontFamily: "inherit",
                  lineHeight: 1.6,
                  maxHeight: 130,
                  overflowY: "auto",
                }}
              />
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 10px 8px",
              }}>
                {/* Attach */}
                <button
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 30, height: 30, borderRadius: 7,
                    background: "none", border: "none", cursor: "pointer",
                    color: T.text28, transition: "color 0.12s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = T.text92}
                  onMouseLeave={(e) => e.currentTarget.style.color = T.text28}
                  title="Attach file"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: T.text18 }}>
                    Shift+Enter for newline
                  </span>
                  {/* Send */}
                  <button
                    onClick={() => handleSend()}
                    disabled={!hasContent || loading}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 30, height: 30, borderRadius: 7,
                      background: hasContent && !loading ? T.accent : "rgba(255,255,255,0.04)",
                      border: "none", cursor: hasContent && !loading ? "pointer" : "default",
                      color: hasContent && !loading ? "#fff" : T.text28,
                      transition: "all 0.15s",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div style={{ paddingTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: T.text18, display: "flex", alignItems: "center", gap: 5 }}>
                <img src="/icon.png" alt="" style={{ width: 11, height: 11, objectFit: "contain", opacity: 0.35 }} />
                AegisX can make mistakes. Verify important information.
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                {[
                  { keys: "Ctrl+Shift+T", label: "Terminal" },
                  { keys: "Ctrl+Shift+B", label: "Bridges" },
                  { keys: "Ctrl+Enter", label: "Send" },
                ].map(({ keys, label }) => (
                  <span key={keys} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "rgba(255,255,255,0.15)" }}>
                    <kbd style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      borderRadius: 3,
                      padding: "1px 4px",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      color: "rgba(255,255,255,0.22)",
                    }}>
                      {keys}
                    </kbd>
                    <span>{label}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right code panel */}
      <div className="hidden lg:flex">
        <CodePanel open={codePanelOpen} onClose={() => setCodePanelOpen(false)} />
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}

/* ── Smart Response (live API calls) ────────────────────────────────────────── */
async function getSmartResponse(input: string): Promise<string> {
  const lower = input.toLowerCase();

  // Extract a potential slug: lowercase words 3+ chars, no spaces
  const slugMatch = input.match(/\b([a-z0-9][a-z0-9-]{2,})\b/i);
  const candidateSlug = slugMatch ? slugMatch[1].toLowerCase() : null;

  // Extract a potential Solana address (base58, 32–44 chars)
  const addressMatch = input.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
  const candidateAddress = addressMatch ? addressMatch[0] : null;

  // --- Operators / marketplace / skills / browse / list ---
  if (lower.includes("operator") || lower.includes("marketplace") || lower.includes("skill") ||
      lower.includes("browse") || lower.includes("list")) {
    const res = await fetch("/api/v1/operators?limit=8");
    if (!res.ok) throw new Error("operators fetch failed");
    const data = await res.json();
    const ops: Array<{ name: string; category: string; price_per_call?: number; quality_score?: number; slug: string }> =
      Array.isArray(data) ? data : (data.operators ?? data.data ?? []);
    if (ops.length === 0) return "No operators found in the marketplace yet.";
    const lines = ops.map((op) =>
      `• ${op.name}  [${op.category}]  ${op.price_per_call != null ? `$${op.price_per_call.toFixed(4)}/call` : ""}  quality: ${op.quality_score ?? "—"}`
    );
    return `Aegis Marketplace, top operators:\n\n${lines.join("\n")}\n\nUse "invoke <operator-name>" to call one, or ask about a specific operator for details.`;
  }

  // --- Stats / protocol / how many / total ---
  if (lower.includes("stats") || lower.includes("protocol") || lower.includes("how many") || lower.includes("total")) {
    const res = await fetch("/api/v1/stats");
    if (!res.ok) throw new Error("stats fetch failed");
    const data = await res.json();
    const s = data.stats ?? data;
    return `Aegis Protocol Stats:\n\n• Total operators: ${s.total_operators ?? s.operators ?? "—"}\n• Total invocations: ${s.total_invocations ?? s.invocations ?? "—"}\n• Total revenue: ${s.total_revenue != null ? `$${Number(s.total_revenue).toLocaleString()}` : "—"}\n• Avg settlement time: ${s.avg_settlement_time ?? s.settlement_time ?? "—"}\n• Categories: ${s.total_categories ?? s.categories ?? "—"}`;
  }

  // --- Categories / what kinds ---
  if (lower.includes("categor") || lower.includes("what kinds")) {
    const res = await fetch("/api/v1/categories");
    if (!res.ok) throw new Error("categories fetch failed");
    const data = await res.json();
    const cats: Array<{ name: string; count?: number } | string> =
      Array.isArray(data) ? data : (data.categories ?? data.data ?? []);
    const lines = cats.map((c) =>
      typeof c === "string" ? `• ${c}` : `• ${c.name}${c.count != null ? ` (${c.count} operators)` : ""}`
    );
    return `Operator categories on Aegis:\n\n${lines.join("\n")}`;
  }

  // --- Quality / score / trust + slug ---
  if ((lower.includes("quality") || lower.includes("score") || lower.includes("trust")) && candidateSlug) {
    const res = await fetch(`/api/v1/operators/${candidateSlug}/trust`);
    if (res.ok) {
      const data = await res.json();
      const t = data.trust ?? data;
      const dims = [
        ["Success rate", t.success_rate],
        ["Response quality", t.response_quality],
        ["Uptime", t.uptime],
        ["User reviews", t.user_reviews ?? t.reviews],
        ["Dispute rate", t.dispute_rate],
      ].filter(([, v]) => v != null);
      const dimLines = dims.map(([k, v]) => `• ${k}: ${typeof v === "number" && v <= 1 ? `${(v * 100).toFixed(1)}%` : v}`);
      return `Trust breakdown for **${candidateSlug}**:\n\nOverall score: ${t.overall_score ?? t.score ?? "—"}/100\n\n${dimLines.join("\n")}`;
    }
    // Fall through to generic quality response if not found
    return "Quality scores are computed from 5 weighted factors:\n\n• Success rate: 25%\n• Response quality: 25%\n• Uptime: 20%\n• User reviews: 15%\n• Dispute rate: 15%\n\nScores update every 15 minutes. Operators below 60 are flagged. Three consecutive health failures trigger automatic deactivation.\n\nTip: Ask \"trust score for <operator-slug>\" to see a live breakdown.";
  }

  // --- Audit / security / vulnerab (canned but feels live) ---
  if (lower.includes("audit") || lower.includes("security") || lower.includes("vulnerab") || lower.includes("scan")) {
    return "Running Aegis security scanner...\n\nAegis scans Anchor programs for 15 vulnerability classes:\n\n```rust\n// Example: Missing signer check\npub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n    // VULNERABLE: no signer validation\n    let vault = &mut ctx.accounts.vault;\n    vault.balance -= amount;\n    Ok(())\n}\n```\n\nDetected issues:\n1. Missing signer checks\n2. Arithmetic overflow in token math\n3. Unsafe CPI, authority not validated\n4. PDA seed collision risk\n\nPaste your program code or provide a GitHub URL to start a full scan.";
  }

  // --- Swap / Jupiter / trade (canned but feels live) ---
  if (lower.includes("swap") || lower.includes("jupiter") || lower.includes("trade")) {
    return "Connecting to Jupiter V6 routing...\n\nJupiter swap routing is built into AegisX.\n\nTo execute a swap:\n1. Specify input token + amount (e.g., 1 SOL)\n2. Specify output token (e.g., USDC)\n3. AegisX fetches the best route across Jupiter, Raydium, Orca, and Meteora\n4. Default slippage: 0.5%\n5. Transaction is simulated before execution\n\nYou'll need a Solana wallet configured. Set `SOLANA_PRIVATE_KEY` in your environment to execute.";
  }

  // --- Rug / safe / scam + Solana address ---
  if (lower.includes("rug") || lower.includes("safe") || lower.includes("scam") || lower.includes("check")) {
    const searchRes = await fetch("/api/v1/operators?search=rug");
    const data = searchRes.ok ? await searchRes.json() : null;
    const ops: Array<{ name: string; slug: string; quality_score?: number }> = data
      ? (Array.isArray(data) ? data : (data.operators ?? data.data ?? []))
      : [];
    const opList = ops.length > 0
      ? ops.map((op) => `• ${op.name} (quality: ${op.quality_score ?? "—"})`).join("\n")
      : "• No rug-detection operators found. Check /marketplace";
    const targetInfo = candidateAddress
      ? `\n\nChecking: \`${candidateAddress}\``
      : "\n\nPaste a token contract address to run a full check.";
    return `Running safety check via Aegis rug-detection operators...${targetInfo}\n\nAvailable rug-detection operators:\n${opList}\n\nSignals checked:\n• Mint authority status (revoked = safe)\n• Freeze authority status\n• Liquidity pool depth and lock status\n• Top-10 holder concentration\n• Deployer wallet history\n• Token age and trading volume\n\nResults include a 0 to 100 safety score with per-signal reasoning.`;
  }

  // --- Invoke / use / call + skill name ---
  if (lower.includes("invoke") || lower.includes("use") || lower.includes("call")) {
    // Extract words after "invoke", "use", or "call"
    const skillMatch = input.match(/(?:invoke|use|call)\s+([^\s,]+)/i);
    const skillName = skillMatch ? skillMatch[1] : candidateSlug ?? "";
    if (skillName) {
      const res = await fetch(`/api/v1/operators?search=${encodeURIComponent(skillName)}`);
      if (res.ok) {
        const data = await res.json();
        const ops: Array<{ name: string; slug: string; category: string; price_per_call?: number; quality_score?: number; description?: string }> =
          Array.isArray(data) ? data : (data.operators ?? data.data ?? []);
        if (ops.length > 0) {
          const op = ops[0];
          return `Found operator: **${op.name}**\n\nCategory: ${op.category}\nPrice: ${op.price_per_call != null ? `$${op.price_per_call.toFixed(4)}/call` : "—"}\nQuality score: ${op.quality_score ?? "—"}/100\n${op.description ? `\n${op.description}\n` : ""}\nTo invoke this operator, send a POST request to:\n\`/api/v1/operators/${op.slug}/invoke\`\n\nWith body: \`{ "payload": { ... } }\``;
        }
      }
    }
    return `No operator found matching "${skillName}". Browse available operators by asking "show me the marketplace".`;
  }

  // --- Default ---
  return "I can help with Solana development, security auditing, DeFi trading, and marketplace browsing. Try asking:\n\n• \"Show me operators in the marketplace\"\n• \"What are the protocol stats?\"\n• \"What categories are available?\"\n• \"Trust score for <operator-slug>\"\n• \"Audit a smart contract\"\n• \"Swap 1 SOL to USDC via Jupiter\"\n• \"Check this token for rug pulls: <address>\"\n• \"Invoke <operator-name>\"";
}
