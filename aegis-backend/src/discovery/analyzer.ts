// ---------------------------------------------------------------------------
// Candidate Analyzer - uses Claude Sonnet (via Anthropic API) to analyze
// discovery candidates, with a local fallback when no API key is available.
// ---------------------------------------------------------------------------

import type { DiscoveryCandidate } from "./crawlers";
import { logger } from "../logger";

export interface AnalysisResult {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  laymanSummary: string;
  category: string;
  tags: string[];
  suggestedPrice: string;
  riskLevel: "low" | "medium" | "high";
  capabilities: string[];
  limitations: string[];
  rejected?: boolean;
  rejectionReason?: string;
}

// Valid categories in the schema
const VALID_CATEGORIES = [
  "code-review",
  "sentiment-analysis",
  "data-extraction",
  "image-generation",
  "text-generation",
  "translation",
  "summarization",
  "classification",
  "search",
  "financial-analysis",
  "security-audit",
  "other",
] as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function analyzeCandidate(
  candidate: DiscoveryCandidate,
  readmeContent: string,
): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return generateLocalAnalysis(candidate);
  }

  try {
    return await analyzeWithClaude(candidate, readmeContent, apiKey);
  } catch (err) {
    logger.warn({ err, candidate: candidate.name }, "Claude analysis failed, using local fallback");
    return generateLocalAnalysis(candidate);
  }
}

// ---------------------------------------------------------------------------
// Claude-powered analysis
// ---------------------------------------------------------------------------

interface AnthropicMessage {
  content: Array<{ type: string; text?: string }>;
}

async function analyzeWithClaude(
  candidate: DiscoveryCandidate,
  readmeContent: string,
  apiKey: string,
): Promise<AnalysisResult> {
  const truncatedReadme = readmeContent.slice(0, 6000);
  const validCategoryList = VALID_CATEGORIES.join(", ");

  const prompt = `You are an AI tool analyst for a marketplace called Aegis Protocol. Analyze the following GitHub repository and produce a structured JSON assessment.

Repository: ${candidate.name}
URL: ${candidate.repoUrl}
Description: ${candidate.description}
Stars: ${candidate.stars}
Language: ${candidate.language}
License: ${candidate.license ?? "none"}
Topics: ${candidate.topics.join(", ")}
Owner: ${candidate.owner}

README (truncated):
${truncatedReadme}

Produce a JSON object with these exact fields:
- name: string - A clean, display-ready name for the tool
- slug: string - URL-safe slug (lowercase, hyphens only, max 64 chars)
- tagline: string - One-line description (max 120 chars)
- description: string - 2-3 paragraph description of the tool, its purpose, and how it works
- laymanSummary: string - A simple explanation a non-technical person could understand (1-2 sentences)
- category: string - One of: ${validCategoryList}
- tags: string[] - 3-6 relevant tags
- suggestedPrice: string - Suggested price per API call in USD (e.g. "0.003")
- riskLevel: "low" | "medium" | "high" - Based on what the tool accesses/modifies
- capabilities: string[] - 3-5 things this tool can do
- limitations: string[] - 2-3 known limitations
- rejected: boolean - Set to true if this is NOT a useful AI tool/service (e.g., it's just a tutorial, template, or collection of links)
- rejectionReason: string | null - Reason for rejection, if rejected

IMPORTANT:
- If the repository is not actually a usable AI tool or service, set rejected to true.
- Only output valid JSON, no markdown fences or extra text.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "llm-analysis-model",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "unknown");
    throw new Error(`Anthropic API returned ${res.status}: ${errText}`);
  }

  const message = (await res.json()) as AnthropicMessage;
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock?.text) {
    throw new Error("No text in Anthropic response");
  }

  // Strip markdown code fences if present
  let jsonStr = textBlock.text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

  // Validate and coerce category
  const rawCategory = String(parsed.category ?? "other");
  const category = (VALID_CATEGORIES as readonly string[]).includes(rawCategory) ? rawCategory : "other";

  return {
    name: String(parsed.name ?? candidate.name),
    slug: toSlug(String(parsed.slug ?? candidate.name)),
    tagline: String(parsed.tagline ?? candidate.description).slice(0, 512),
    description: String(parsed.description ?? candidate.description),
    laymanSummary: String(parsed.laymanSummary ?? candidate.description).slice(0, 500),
    category,
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 10) : [],
    suggestedPrice: String(parsed.suggestedPrice ?? "0.003"),
    riskLevel: validateRiskLevel(parsed.riskLevel),
    capabilities: Array.isArray(parsed.capabilities) ? parsed.capabilities.map(String) : [],
    limitations: Array.isArray(parsed.limitations) ? parsed.limitations.map(String) : [],
    rejected: Boolean(parsed.rejected),
    rejectionReason: parsed.rejectionReason ? String(parsed.rejectionReason) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Local fallback analysis (works without API key)
// ---------------------------------------------------------------------------

function generateLocalAnalysis(candidate: DiscoveryCandidate): AnalysisResult {
  const category = inferCategory(candidate);
  const slug = toSlug(candidate.name);
  const tags = deriveTags(candidate);

  // Reject clearly non-tool repos
  const rejectPatterns = /\b(awesome-list|tutorial|course|cheat-?sheet|interview|roadmap)\b/i;
  const isRejected =
    rejectPatterns.test(candidate.name) || rejectPatterns.test(candidate.description);

  return {
    name: cleanName(candidate.name),
    slug,
    tagline: candidate.description.slice(0, 120) || `${candidate.name} - AI tool`,
    description: candidate.description || `An open-source AI tool: ${candidate.name} by ${candidate.owner}.`,
    laymanSummary: generateLaymanSummary(candidate),
    category,
    tags,
    suggestedPrice: inferPrice(category),
    riskLevel: inferRisk(candidate),
    capabilities: inferCapabilities(candidate),
    limitations: [
      "Analysis generated automatically - manual review recommended",
      "Pricing is estimated and may need adjustment",
    ],
    rejected: isRejected,
    rejectionReason: isRejected ? "Repository appears to be a non-tool resource (list, tutorial, etc.)" : undefined,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function cleanName(name: string): string {
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function inferCategory(candidate: DiscoveryCandidate): string {
  const text = `${candidate.name} ${candidate.description} ${candidate.topics.join(" ")}`.toLowerCase();

  const mapping: Array<[RegExp, string]> = [
    [/\b(code.?review|lint|static.?analysis|code.?quality)\b/, "code-review"],
    [/\b(sentiment|emotion|opinion)\b/, "sentiment-analysis"],
    [/\b(extract|scrape|parse|crawl|web.?scrap)\b/, "data-extraction"],
    [/\b(image.?gen|diffusion|dall-?e|stable.?diffusion|text.?to.?image)\b/, "image-generation"],
    [/\b(text.?gen|llm|gpt|chat|convers|language.?model)\b/, "text-generation"],
    [/\b(translat|i18n|locali[zs])\b/, "translation"],
    [/\b(summar|abstract|digest|tldr)\b/, "summarization"],
    [/\b(classif|categoriz|label|detect)\b/, "classification"],
    [/\b(search|retriev|rag|vector|embedd)\b/, "search"],
    [/\b(financ|trading|stock|portfolio|market)\b/, "financial-analysis"],
    [/\b(secur|vuln|audit|pentest|malware)\b/, "security-audit"],
  ];

  for (const [pattern, cat] of mapping) {
    if (pattern.test(text)) return cat;
  }
  return "other";
}

function deriveTags(candidate: DiscoveryCandidate): string[] {
  const tags = new Set<string>();

  // From topics
  for (const t of candidate.topics.slice(0, 4)) {
    tags.add(t.toLowerCase());
  }

  // From language
  if (candidate.language && candidate.language !== "unknown") {
    tags.add(candidate.language.toLowerCase());
  }

  // Ensure at least one tag
  if (tags.size === 0) {
    tags.add("ai-tool");
  }

  return Array.from(tags).slice(0, 6);
}

function inferPrice(category: string): string {
  const priceMap: Record<string, string> = {
    "image-generation": "0.01",
    "text-generation": "0.005",
    "code-review": "0.008",
    "data-extraction": "0.003",
    "financial-analysis": "0.01",
    "security-audit": "0.01",
    search: "0.002",
  };
  return priceMap[category] ?? "0.003";
}

function inferRisk(candidate: DiscoveryCandidate): "low" | "medium" | "high" {
  const text = `${candidate.name} ${candidate.description}`.toLowerCase();
  if (/\b(execut|shell|sudo|root|admin|file.?system|database)\b/.test(text)) return "high";
  if (/\b(api|network|http|fetch|download|upload)\b/.test(text)) return "medium";
  return "low";
}

function inferCapabilities(candidate: DiscoveryCandidate): string[] {
  const caps: string[] = [];
  const text = `${candidate.name} ${candidate.description}`.toLowerCase();

  if (/api|rest|endpoint/i.test(text)) caps.push("Provides API endpoints");
  if (/mcp|server/i.test(text)) caps.push("MCP-compatible server");
  if (/cli|command/i.test(text)) caps.push("Command-line interface");
  if (/generat|creat|produc/i.test(text)) caps.push("Content generation");
  if (/analy[zs]|process|transform/i.test(text)) caps.push("Data analysis and processing");

  if (caps.length === 0) {
    caps.push("AI-powered tool", `Built with ${candidate.language}`);
  }

  return caps.slice(0, 5);
}

function generateLaymanSummary(candidate: DiscoveryCandidate): string {
  if (candidate.description) {
    // Simplify the existing description
    const desc = candidate.description.replace(/\s+/g, " ").trim();
    if (desc.length <= 200) return desc;
    return desc.slice(0, 197) + "...";
  }
  return `${cleanName(candidate.name)} is an AI tool by ${candidate.owner} that automates tasks using artificial intelligence.`;
}

function validateRiskLevel(value: unknown): "low" | "medium" | "high" {
  if (value === "low" || value === "medium" || value === "high") return value;
  return "medium";
}
