// ---------------------------------------------------------------------------
// Discovery Pipeline — orchestrates crawling, deduplication, analysis,
// security scanning, and onboarding of new AI tool operators.
// ---------------------------------------------------------------------------

import { crawlGitHubTrending, crawlAwesomeLists, crawlHuggingFace } from "./crawlers";
import type { DiscoveryCandidate } from "./crawlers";
import { analyzeCandidate } from "./analyzer";
import { scanCandidate } from "./scanner";
import { OperatorModel } from "../db";
import { broadcastEvent } from "../sse";
import { logAudit } from "../db";
import { logger } from "../logger";

export interface DiscoveryRun {
  startedAt: Date;
  completedAt: Date | null;
  candidatesFound: number;
  qualified: number;
  analyzed: number;
  securityPassed: number;
  onboarded: number;
  rejected: number;
  errors: string[];
}

const MAX_ONBOARD_PER_RUN = 50;
const MAX_STALENESS_DAYS = 90;
const MIN_STARS = 50;

// ---------------------------------------------------------------------------
// Main Pipeline
// ---------------------------------------------------------------------------

export async function runDiscoveryPipeline(): Promise<DiscoveryRun> {
  const run: DiscoveryRun = {
    startedAt: new Date(),
    completedAt: null,
    candidatesFound: 0,
    qualified: 0,
    analyzed: 0,
    securityPassed: 0,
    onboarded: 0,
    rejected: 0,
    errors: [],
  };

  logger.info("Discovery pipeline starting");

  // ── Stage 1: Discover ──────────────────────────────────────
  let allCandidates: DiscoveryCandidate[] = [];

  const crawlers = [
    { name: "GitHub", fn: crawlGitHubTrending },
    { name: "AwesomeLists", fn: crawlAwesomeLists },
    { name: "HuggingFace", fn: crawlHuggingFace },
  ];

  for (const crawler of crawlers) {
    try {
      const results = await crawler.fn();
      allCandidates = allCandidates.concat(results);
      logger.info({ crawler: crawler.name, count: results.length }, "Crawler found candidates");
    } catch (err) {
      const msg = `Crawler ${crawler.name} failed: ${err}`;
      run.errors.push(msg);
      logger.warn({ err, crawler: crawler.name }, "Crawler failed");
    }
  }

  run.candidatesFound = allCandidates.length;

  if (allCandidates.length === 0) {
    logger.info("No candidates found, pipeline complete");
    run.completedAt = new Date();
    return run;
  }

  // ── Stage 2: Deduplicate against existing DB ───────────────
  let existingUrls: Set<string>;
  let existingSlugs: Set<string>;

  try {
    const existing = await OperatorModel.find(
      {},
      { sourceUrl: 1, slug: 1 },
    ).lean() as Array<{ sourceUrl?: string; slug: string }>;
    existingUrls = new Set(
      existing.map((o) => o.sourceUrl).filter((u): u is string => Boolean(u)),
    );
    existingSlugs = new Set(existing.map((o) => o.slug));
  } catch {
    // If DB is not available, use empty sets (will skip onboarding)
    existingUrls = new Set();
    existingSlugs = new Set();
  }

  const newCandidates = allCandidates.filter((c) => !existingUrls.has(c.repoUrl));
  logger.info({ count: newCandidates.length }, "After dedup: new candidates");

  // ── Stage 3: Qualify ───────────────────────────────────────
  const qualified = newCandidates.filter((c) => {
    if (c.stars < MIN_STARS && c.source !== "awesome-list") return false;
    if (!c.license && c.source === "github-trending") return false;
    if (daysSince(c.lastUpdated) > MAX_STALENESS_DAYS) return false;
    return true;
  });

  run.qualified = qualified.length;
  logger.info({ count: qualified.length }, "Qualified candidates");

  // ── Stage 4: Analyze + Scan + Onboard ──────────────────────
  const toProcess = qualified.slice(0, MAX_ONBOARD_PER_RUN);

  for (const candidate of toProcess) {
    try {
      // Fetch README content
      const readme = await fetchReadme(candidate);

      // Analyze with Claude (or local fallback)
      const analysis = await analyzeCandidate(candidate, readme);
      run.analyzed++;

      if (analysis.rejected) {
        run.rejected++;
        logger.info({ candidate: candidate.name, reason: analysis.rejectionReason ?? "no reason" }, "Candidate rejected");
        continue;
      }

      // Security scan
      const security = await scanCandidate(candidate);

      if (!security.passed) {
        run.rejected++;
        logger.info({ candidate: candidate.name, score: security.score }, "Candidate failed security scan");
        continue;
      }

      run.securityPassed++;

      // Ensure unique slug
      let slug = analysis.slug;
      if (existingSlugs.has(slug)) {
        slug = `${slug}-${Date.now() % 10000}`;
      }
      existingSlugs.add(slug);

      // Onboard the operator
      try {
        await OperatorModel.create({
          slug,
          name: analysis.name,
          tagline: analysis.tagline,
          description: analysis.description,
          category: analysis.category,
          tags: analysis.tags,
          pricePerCall: analysis.suggestedPrice,
          creatorWallet: "AegsPrtc1D1scvryEngnWa11et1111111111111111",
          trustScore: Math.round(security.score * 0.7 + security.reputationScore * 0.3),
          isActive: true,
          isVerified: false,
          source: "discovery-engine",
          sourceUrl: candidate.repoUrl,
          sourceStars: candidate.stars,
          securityScore: security.score,
          laymanSummary: analysis.laymanSummary,
          discoveredAt: new Date(),
        });

        broadcastEvent("registration", {
          type: "operator.discovered",
          slug,
          name: analysis.name,
          summary: analysis.laymanSummary,
          source: candidate.source,
          stars: candidate.stars,
        });

        run.onboarded++;
        logger.info({ name: analysis.name, slug }, "Operator onboarded");

        // Audit log
        await logAudit({
          action: "discovery.onboard",
          details: {
            slug,
            name: analysis.name,
            source: candidate.source,
            repoUrl: candidate.repoUrl,
            securityScore: security.score,
          },
        } as any);
      } catch (dbErr) {
        run.errors.push(`DB insert failed for ${candidate.name}: ${dbErr}`);
        logger.warn({ err: dbErr, candidate: candidate.name }, "DB insert failed for candidate");
      }

      // Small delay between candidates to avoid hammering APIs
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      const msg = `Failed: ${candidate.name} — ${err}`;
      run.errors.push(msg);
      logger.warn({ err, candidate: candidate.name }, "Candidate processing failed");
    }
  }

  run.completedAt = new Date();

  logger.info({
    candidatesFound: run.candidatesFound,
    qualified: run.qualified,
    onboarded: run.onboarded,
    rejected: run.rejected,
    errors: run.errors.length,
  }, "Discovery pipeline complete");

  return run;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysSince(isoDate: string): number {
  const then = new Date(isoDate).getTime();
  if (isNaN(then)) return Infinity;
  return (Date.now() - then) / (24 * 60 * 60 * 1000);
}

async function fetchReadme(candidate: DiscoveryCandidate): Promise<string> {
  // Try the readmeUrl first
  if (candidate.readmeUrl) {
    try {
      const res = await fetch(candidate.readmeUrl, {
        headers: { "User-Agent": "Aegis-Discovery/1.0" },
      });
      if (res.ok) {
        const text = await res.text();
        return text.slice(0, 10000); // Cap at 10KB
      }
    } catch {
      // fall through
    }
  }

  // Try common README paths via GitHub API
  const ghMatch = candidate.repoUrl.match(/github\.com\/([\w.-]+\/[\w.-]+)/);
  if (ghMatch) {
    const fullName = ghMatch[1];
    for (const file of ["README.md", "readme.md", "Readme.md", "README.rst"]) {
      try {
        const res = await fetch(
          `https://raw.githubusercontent.com/${fullName}/HEAD/${file}`,
          { headers: { "User-Agent": "Aegis-Discovery/1.0" } },
        );
        if (res.ok) {
          const text = await res.text();
          return text.slice(0, 10000);
        }
      } catch {
        // try next
      }
    }
  }

  return "";
}
