export interface OperatorReview {
  reviewer: string;
  reviewerAddress: string;
  reviewerTier: "Diamond" | "Gold" | "Silver" | "Bronze";
  rating: number;
  text: string;
  date: string;
  helpful: number;
}

export interface OperatorVersion {
  version: string;
  date: string;
  changelog: string[];
  breaking?: boolean;
}

export interface OperatorValidator {
  address: string;
  tier: "Grandmaster" | "Master" | "Journeyman" | "Apprentice";
  bond: number;
  score: number;
  reviews: number;
  attestedAt: string;
}

export interface OperatorInvocation {
  caller: string;
  amount: string;
  status: "completed" | "failed" | "disputed";
  time: string;
  duration: string;
}

export interface Operator {
  id: string;
  slug: string;
  name: string;
  namespace: string;
  author: string;
  authorAddress: string;
  description: string;
  fullDescription: string;
  category: string;
  price: number;
  priceDisplay: string;
  bond: string;
  reputation: number;
  tier: "Diamond" | "Gold" | "Silver" | "Bronze";
  invocations: number;
  stars: number;
  validators: number;
  avgScore: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  status: "active" | "challenged" | "suspended";
  compatibility: string[];
  featured?: boolean;
  trending?: boolean;
  license: string;
  language: string;
  repo: string;
  versions: OperatorVersion[];
  reviews: OperatorReview[];
  validatorList: OperatorValidator[];
  recentInvocations: OperatorInvocation[];
}

export function tierColor(tier: string) {
  switch (tier) {
    case "Diamond": return "text-zinc-300";
    case "Gold": return "text-amber-400";
    case "Silver": return "text-white/40";
    default: return "text-orange-400";
  }
}

export function statusStyle(status: string) {
  switch (status) {
    case "active": return "bg-white/8 text-zinc-300 border-white/15";
    case "challenged": return "bg-yellow-500/8 text-amber-400 border-amber-400/12";
    case "suspended": return "bg-red-500/8 text-red-400 border-red-500/15";
    default: return "bg-white/5 text-white/30 border-white/10";
  }
}

export function repColor(score: number) {
  if (score >= 80) return "#A1A1AA";
  if (score >= 60) return "#71717A";
  if (score >= 40) return "#eab308";
  return "#ef4444";
}

export const COMPAT_ICONS: Record<string, string> = {
  "Codex CLI": "CX",
  "Codex App": "CA",
  "Aegis": "AG",
};

export const CATEGORIES = [
  "All", "Development", "Security", "Data", "Productivity",
  "AI / ML", "Infrastructure", "DeFi", "Social", "Knowledge",
  "Documentation", "Automation",
];
