import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { T } from "./theme";
import {
  Card,
  CardHead,
  PageHeader,
  StatusBadge,
  FilterChips,
  ActionButton,
} from "./primitives";

/* ── Types ────────────────────────────────────────────────────────────── */

interface PipelineStep {
  name: string;
  operator: string;
  cost: string;
}

interface Blueprint {
  id: string;
  name: string;
  author: string;
  category: string;
  description: string;
  steps: PipelineStep[];
  avgCostPerRun: string;
  timesForkd: number;
  rating: number;
  successRate: number;
  estimatedRuntime: string;
}

/* ── Demo data ────────────────────────────────────────────────────────── */

const FEATURED: Blueprint = {
  id: "bp-featured",
  name: "DeFi Alpha Scanner",
  author: "AegisLabs",
  category: "Trading",
  description: "End-to-end pipeline that scans for DeFi alpha opportunities by combining sentiment analysis, whale tracking, DEX routing, and risk assessment into a single automated workflow.",
  steps: [
    { name: "Sentiment Scan", operator: "Sentiment Pulse Engine", cost: "$0.01" },
    { name: "Whale Monitor", operator: "Whale Wallet Tracker", cost: "$0.015" },
    { name: "Route Optimizer", operator: "50-DEX Swap Router", cost: "$0.02" },
    { name: "Risk Assessment", operator: "Contract Vulnerability Scanner", cost: "$0.05" },
    { name: "Execute Trade", operator: "Yield Strategy Optimizer", cost: "$0.03" },
  ],
  avgCostPerRun: "$0.125",
  timesForkd: 1247,
  rating: 4.9,
  successRate: 96.2,
  estimatedRuntime: "12s",
};

const BLUEPRINTS: Blueprint[] = [
  {
    id: "bp1", name: "Smart Contract Audit Pipeline", author: "AuditDAO", category: "Security",
    description: "Automated security audit that scans, analyzes, and generates a comprehensive report for any smart contract.",
    steps: [
      { name: "Code Parse", operator: "Code Review Agent", cost: "$0.08" },
      { name: "Vuln Scan", operator: "Contract Vulnerability Scanner", cost: "$0.05" },
      { name: "Risk Score", operator: "Risk Assessment Engine", cost: "$0.02" },
      { name: "Report Gen", operator: "Report Generator", cost: "$0.03" },
    ],
    avgCostPerRun: "$0.18", timesForkd: 834, rating: 4.8, successRate: 98.1, estimatedRuntime: "18s",
  },
  {
    id: "bp2", name: "Token Research Report", author: "DeepSea", category: "Research",
    description: "Generates a full research report on any token including sentiment, whale activity, and price prediction.",
    steps: [
      { name: "Sentiment", operator: "Sentiment Pulse Engine", cost: "$0.01" },
      { name: "Whale Scan", operator: "Whale Wallet Tracker", cost: "$0.015" },
      { name: "On-chain", operator: "On-chain Analyzer", cost: "$0.02" },
      { name: "Report", operator: "Report Generator", cost: "$0.03" },
      { name: "Summarize", operator: "Cohere Summarizer", cost: "$0.006" },
    ],
    avgCostPerRun: "$0.081", timesForkd: 612, rating: 4.7, successRate: 97.4, estimatedRuntime: "15s",
  },
  {
    id: "bp3", name: "Portfolio Rebalancer", author: "YieldDAO", category: "Trading",
    description: "Monitors your portfolio drift and rebalances across DeFi protocols when thresholds are exceeded.",
    steps: [
      { name: "Check Drift", operator: "Portfolio Tracker", cost: "$0.005" },
      { name: "Find Yield", operator: "Yield Strategy Optimizer", cost: "$0.03" },
      { name: "Gas Timing", operator: "Gas Fee Oracle", cost: "$0.002" },
      { name: "Swap", operator: "50-DEX Swap Router", cost: "$0.02" },
    ],
    avgCostPerRun: "$0.057", timesForkd: 489, rating: 4.6, successRate: 95.8, estimatedRuntime: "8s",
  },
  {
    id: "bp4", name: "Whale Alert System", author: "DeepSea", category: "Monitoring",
    description: "Real-time whale monitoring with instant alerts and automatic position analysis when large moves detected.",
    steps: [
      { name: "Monitor", operator: "Whale Wallet Tracker", cost: "$0.015" },
      { name: "Analyze", operator: "Sentiment Pulse Engine", cost: "$0.01" },
      { name: "Alert", operator: "Alert Dispatcher", cost: "$0.001" },
    ],
    avgCostPerRun: "$0.026", timesForkd: 923, rating: 4.8, successRate: 99.1, estimatedRuntime: "3s",
  },
  {
    id: "bp5", name: "Content Generation Pipeline", author: "ContentDAO", category: "Content",
    description: "Multi-step content creation that researches, writes, translates, and formats content across languages.",
    steps: [
      { name: "Research", operator: "Claude Analyst", cost: "$0.034" },
      { name: "Write", operator: "GPT-4o Router", cost: "$0.012" },
      { name: "Translate", operator: "Legal Document Translator", cost: "$0.12" },
      { name: "Format", operator: "Report Generator", cost: "$0.03" },
      { name: "Summarize", operator: "Cohere Summarizer", cost: "$0.006" },
    ],
    avgCostPerRun: "$0.202", timesForkd: 341, rating: 4.5, successRate: 97.0, estimatedRuntime: "22s",
  },
  {
    id: "bp6", name: "NFT Collection Analyzer", author: "RarityLabs", category: "Analytics",
    description: "Comprehensive NFT collection analysis including rarity ranking, floor price tracking, and wash trading detection.",
    steps: [
      { name: "Rarity", operator: "NFT Rarity Ranker", cost: "$0.01" },
      { name: "Price", operator: "Price Estimator", cost: "$0.008" },
      { name: "Wash Detect", operator: "Wash Trade Detector", cost: "$0.015" },
      { name: "Report", operator: "Report Generator", cost: "$0.03" },
    ],
    avgCostPerRun: "$0.063", timesForkd: 278, rating: 4.4, successRate: 96.5, estimatedRuntime: "10s",
  },
  {
    id: "bp7", name: "Cross-Chain Bridge Monitor", author: "BridgeDAO", category: "Monitoring",
    description: "Monitors bridge health across 15 chains and alerts on anomalies, delays, or security incidents.",
    steps: [
      { name: "Scan Bridges", operator: "Multi-Chain Bridge Finder", cost: "$0.03" },
      { name: "Health Check", operator: "Health Monitor", cost: "$0.005" },
      { name: "Alert", operator: "Alert Dispatcher", cost: "$0.001" },
    ],
    avgCostPerRun: "$0.036", timesForkd: 456, rating: 4.6, successRate: 98.7, estimatedRuntime: "5s",
  },
  {
    id: "bp8", name: "Liquidation Guardian", author: "LiqBot", category: "Security",
    description: "Protects your positions by monitoring health factors and automatically repaying or closing before liquidation.",
    steps: [
      { name: "Monitor HF", operator: "Health Factor Monitor", cost: "$0.002" },
      { name: "Gas Check", operator: "Gas Fee Oracle", cost: "$0.002" },
      { name: "Repay/Close", operator: "Liquidation Sniper", cost: "$0.00" },
      { name: "Confirm", operator: "Transaction Verifier", cost: "$0.001" },
    ],
    avgCostPerRun: "$0.005", timesForkd: 567, rating: 4.7, successRate: 94.8, estimatedRuntime: "2s",
  },
  {
    id: "bp9", name: "Meeting-to-Action Workflow", author: "NoteAI", category: "Analytics",
    description: "Records a meeting, transcribes it, extracts action items, assigns owners, and creates tasks automatically.",
    steps: [
      { name: "Transcribe", operator: "Whisper Transcribe", cost: "$0.021" },
      { name: "Summarize", operator: "Meeting Summarizer", cost: "$0.15" },
      { name: "Extract Tasks", operator: "Task Extractor", cost: "$0.01" },
      { name: "Assign", operator: "Task Creator", cost: "$0.005" },
    ],
    avgCostPerRun: "$0.186", timesForkd: 198, rating: 4.5, successRate: 97.3, estimatedRuntime: "30s",
  },
];

const FILTER_CATEGORIES = [
  { id: "All", label: "All" },
  { id: "Trading", label: "Trading" },
  { id: "Research", label: "Research" },
  { id: "Monitoring", label: "Monitoring" },
  { id: "Content", label: "Content" },
  { id: "Analytics", label: "Analytics" },
  { id: "Security", label: "Security" },
];

/* ── Helpers ──────────────────────────────────────────────────────────── */

function renderStars(rating: number): React.ReactNode {
  const full = Math.floor(rating);
  const half = rating - full >= 0.3;
  const stars: React.ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const filled = i < full || (i === full && half);
    stars.push(
      <span key={i} style={{ color: filled ? T.text50 : T.white4, fontSize: 12 }}>{"\u2605"}</span>
    );
  }
  return <span style={{ display: "inline-flex", gap: 1 }}>{stars}</span>;
}

const STEP_COLORS = ["rgba(255,255,255,0.35)", "rgba(255,255,255,0.28)", "rgba(255,255,255,0.22)", "rgba(255,255,255,0.16)", "rgba(255,255,255,0.10)"];

/* ── Pipeline Node ────────────────────────────────────────────────────── */

function PipelinePreview({ steps, compact }: { steps: PipelineStep[]; compact?: boolean }) {
  const dotSize = compact ? 10 : 14;
  const gap = compact ? 6 : 10;
  return (
    <div style={{ display: "flex", alignItems: "center", gap }}>
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div
            title={step.name}
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              background: STEP_COLORS[i % STEP_COLORS.length],
              flexShrink: 0,
              opacity: 0.8,
            }}
          />
          {i < steps.length - 1 && (
            <div style={{ width: compact ? 12 : 20, height: 1, background: T.border, flexShrink: 0 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Component ────────────────────────────────────────────────────────── */

export default function MissionBlueprintsPanel() {
  // Pre-fetch stats so data is warm for other panels
  trpc.stats.overview.useQuery(undefined, { staleTime: 60_000 });
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    if (category === "All") return BLUEPRINTS;
    return BLUEPRINTS.filter((bp) => bp.category === category);
  }, [category]);

  return (
    <div>
      <PageHeader
        title="Mission Blueprints"
        subtitle="Pre-built pipeline templates \u2014 fork and customize"
      />

      {/* Featured Blueprint */}
      <Card style={{ marginBottom: 24, border: `1px solid ${T.borderHover}` }}>
        <CardHead
          label="Featured Blueprint"
          action={<StatusBadge status="Featured" color="purple" />}
        />
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 400, color: T.text80, marginBottom: 4 }}>{FEATURED.name}</div>
              <div style={{ fontSize: 12, color: T.text30 }}>by {FEATURED.author}</div>
            </div>
            <StatusBadge status={FEATURED.category} color="blue" />
          </div>

          <div style={{ fontSize: 13, color: T.text50, lineHeight: 1.6, marginBottom: 24, maxWidth: 700 }}>
            {FEATURED.description}
          </div>

          {/* Pipeline visualization */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            overflowX: "auto",
            padding: "16px 0",
            marginBottom: 20,
          }}>
            {FEATURED.steps.map((step, i) => (
              <React.Fragment key={i}>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 120,
                  gap: 6,
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    background: `${STEP_COLORS[i % STEP_COLORS.length]}20`,
                    border: `2px solid ${STEP_COLORS[i % STEP_COLORS.length]}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 500,
                    color: STEP_COLORS[i % STEP_COLORS.length],
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.text50, textAlign: "center" }}>{step.name}</div>
                  <div style={{ fontSize: 10, color: T.text30, textAlign: "center" }}>{step.operator}</div>
                  <div style={{ fontSize: 10, color: T.text20, fontVariantNumeric: "tabular-nums" }}>{step.cost}</div>
                </div>
                {i < FEATURED.steps.length - 1 && (
                  <div style={{
                    width: 40,
                    height: 2,
                    background: T.borderSubtle,
                    opacity: 0.4,
                    flexShrink: 0,
                    marginTop: -20,
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: T.text20, letterSpacing: "0.02em" }}>Total Cost</div>
              <div style={{ fontSize: 18, fontWeight: 400, color: T.text80, fontVariantNumeric: "tabular-nums" }}>{FEATURED.avgCostPerRun}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.text20, letterSpacing: "0.02em" }}>Est. Runtime</div>
              <div style={{ fontSize: 18, fontWeight: 400, color: T.text50 }}>{FEATURED.estimatedRuntime}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.text20, letterSpacing: "0.02em" }}>Success Rate</div>
              <div style={{ fontSize: 18, fontWeight: 400, color: T.positive }}>{FEATURED.successRate}%</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.text20, letterSpacing: "0.02em" }}>Times Forked</div>
              <div style={{ fontSize: 18, fontWeight: 400, color: T.text30 }}>{FEATURED.timesForkd.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.text20, letterSpacing: "0.02em" }}>Rating</div>
              <div>{renderStars(FEATURED.rating)} <span style={{ fontSize: 13, fontWeight: 600, color: T.text50, marginLeft: 4 }}>{FEATURED.rating}</span></div>
            </div>
          </div>

          <ActionButton label="Fork This Blueprint" variant="primary" />
        </div>
      </Card>

      {/* Filter chips */}
      <div style={{ marginBottom: 20 }}>
        <FilterChips options={FILTER_CATEGORIES} active={category} onChange={setCategory} />
      </div>

      {/* Blueprint cards grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 12,
        marginBottom: 32,
      }}>
        {filtered.map((bp) => (
          <Card key={bp.id}>
            <div style={{ padding: 20 }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.text80, marginBottom: 2 }}>{bp.name}</div>
                  <div style={{ fontSize: 11, color: T.text25 }}>by {bp.author}</div>
                </div>
                <StatusBadge status={bp.category} color="blue" />
              </div>

              {/* Description */}
              <div style={{
                fontSize: 12,
                color: T.text30,
                lineHeight: 1.5,
                marginBottom: 12,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {bp.description}
              </div>

              {/* Stats row */}
              <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
                <div style={{ fontSize: 11, color: T.text50 }}>
                  <span style={{ fontWeight: 500 }}>{bp.steps.length}</span>
                  <span style={{ color: T.text20, marginLeft: 3 }}>steps</span>
                </div>
                <div style={{ fontSize: 11, color: T.text50, fontVariantNumeric: "tabular-nums" }}>
                  <span style={{ fontWeight: 500 }}>{bp.avgCostPerRun}</span>
                  <span style={{ color: T.text20, marginLeft: 3 }}>avg cost</span>
                </div>
                <div style={{ fontSize: 11, color: T.text50, fontVariantNumeric: "tabular-nums" }}>
                  <span style={{ fontWeight: 500 }}>{bp.timesForkd.toLocaleString()}</span>
                  <span style={{ color: T.text20, marginLeft: 3 }}>forks</span>
                </div>
              </div>

              {/* Rating */}
              <div style={{ marginBottom: 12 }}>
                {renderStars(bp.rating)} <span style={{ fontSize: 11, color: T.text30, marginLeft: 4 }}>{bp.rating}</span>
              </div>

              {/* Pipeline preview */}
              <div style={{ marginBottom: 14 }}>
                <PipelinePreview steps={bp.steps} compact />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <ActionButton label="Fork & Customize" variant="primary" />
                <ActionButton label="Preview" variant="default" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Submit CTA */}
      <Card>
        <div style={{ padding: "32px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: T.text80, marginBottom: 8 }}>
            Submit Your Blueprint
          </div>
          <div style={{ fontSize: 12, color: T.text30, maxWidth: 440, margin: "0 auto", lineHeight: 1.6, marginBottom: 16 }}>
            Share your pipeline templates with the community. Top blueprints are featured on the marketplace
            and earn referral rewards when others fork and run them.
          </div>
          <ActionButton label="Submit Blueprint" variant="primary" />
        </div>
      </Card>
    </div>
  );
}
