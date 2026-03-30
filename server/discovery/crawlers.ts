// ---------------------------------------------------------------------------
// Discovery Crawlers - fetch AI tool candidates from GitHub, awesome lists,
// and HuggingFace. Each crawler returns DiscoveryCandidate[].
// ---------------------------------------------------------------------------

import { logger } from "../logger";

export interface DiscoveryCandidate {
  repoUrl: string;
  name: string;
  description: string;
  stars: number;
  language: string;
  license: string | null;
  lastUpdated: string;
  owner: string;
  topics: string[];
  source: string;
  readmeUrl?: string;
}

// ---------------------------------------------------------------------------
// GitHub Trending / Search
// ---------------------------------------------------------------------------

interface GitHubSearchResponse {
  items?: GitHubRepo[];
}

interface GitHubRepo {
  full_name: string;
  html_url: string;
  name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  license: { spdx_id: string } | null;
  pushed_at: string;
  owner: { login: string };
  topics: string[];
}

/**
 * Crawl GitHub search for AI agent / MCP / LLM tools.
 * Uses the public GitHub REST API (unauthenticated - rate-limited to 10 req/min).
 */
export async function crawlGitHubTrending(): Promise<DiscoveryCandidate[]> {
  const queries = [
    "topic:ai-agent stars:>50 pushed:>2026-01-01",
    "topic:mcp-server stars:>30 pushed:>2026-01-01",
    "topic:llm-tools stars:>50 pushed:>2026-01-01",
    '"MCP server" in:readme stars:>30 pushed:>2026-01-01',
    '"AI agent" in:readme stars:>100 pushed:>2026-01-01',
    "topic:rag stars:>50 pushed:>2026-01-01",
    "topic:web-scraping stars:>100 pushed:>2026-01-01",
  ];

  const candidates: DiscoveryCandidate[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&per_page=30`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Aegis-Discovery/1.0",
          },
        },
      );
      if (!res.ok) continue;
      const data = (await res.json()) as GitHubSearchResponse;
      for (const repo of data.items ?? []) {
        if (seen.has(repo.full_name)) continue;
        seen.add(repo.full_name);
        candidates.push({
          repoUrl: repo.html_url,
          name: repo.name,
          description: repo.description ?? "",
          stars: repo.stargazers_count,
          language: repo.language ?? "unknown",
          license: repo.license?.spdx_id ?? null,
          lastUpdated: repo.pushed_at,
          owner: repo.owner.login,
          topics: repo.topics ?? [],
          source: "github-trending",
          readmeUrl: `https://raw.githubusercontent.com/${repo.full_name}/HEAD/README.md`,
        });
      }
      // Respect rate limits - 2 s between queries
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      logger.warn({ err, query: q }, "GitHub search failed");
    }
  }

  return candidates;
}

// ---------------------------------------------------------------------------
// Awesome Lists - parse awesome-list markdown for repo links
// ---------------------------------------------------------------------------

const AWESOME_LISTS = [
  "https://raw.githubusercontent.com/punkpeye/awesome-mcp-servers/main/README.md",
  "https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/README.md",
  "https://raw.githubusercontent.com/e2b-dev/awesome-ai-agents/main/README.md",
];

/**
 * Parse awesome-list markdown files and extract GitHub repo links.
 * For each unique repo found, fetch basic metadata from the GitHub API.
 */
export async function crawlAwesomeLists(): Promise<DiscoveryCandidate[]> {
  const candidates: DiscoveryCandidate[] = [];
  const seen = new Set<string>();

  for (const url of AWESOME_LISTS) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Aegis-Discovery/1.0" },
      });
      if (!res.ok) continue;
      const markdown = await res.text();

      // Extract GitHub repo URLs from markdown links
      const repoRegex = /https?:\/\/github\.com\/([\w.-]+\/[\w.-]+)/g;
      let match: RegExpExecArray | null;
      const repoNames: string[] = [];

      while ((match = repoRegex.exec(markdown)) !== null) {
        const fullName = match[1].replace(/\.git$/, "");
        if (!seen.has(fullName) && !fullName.includes("/blob/") && !fullName.includes("/tree/")) {
          seen.add(fullName);
          repoNames.push(fullName);
        }
      }

      // Fetch metadata for up to 20 repos per list (to stay within rate limits)
      for (const fullName of repoNames.slice(0, 20)) {
        try {
          const repoRes = await fetch(`https://api.github.com/repos/${fullName}`, {
            headers: {
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "Aegis-Discovery/1.0",
            },
          });
          if (!repoRes.ok) continue;
          const repo = (await repoRes.json()) as GitHubRepo;
          candidates.push({
            repoUrl: repo.html_url,
            name: repo.name,
            description: repo.description ?? "",
            stars: repo.stargazers_count,
            language: repo.language ?? "unknown",
            license: repo.license?.spdx_id ?? null,
            lastUpdated: repo.pushed_at,
            owner: repo.owner.login,
            topics: repo.topics ?? [],
            source: "awesome-list",
            readmeUrl: `https://raw.githubusercontent.com/${repo.full_name}/HEAD/README.md`,
          });
          // Rate limit
          await new Promise((r) => setTimeout(r, 1500));
        } catch {
          // skip individual repo failures
        }
      }
    } catch (err) {
      logger.warn({ err, url }, "Awesome-list fetch failed");
    }
  }

  return candidates;
}

// ---------------------------------------------------------------------------
// HuggingFace - fetch trending spaces
// ---------------------------------------------------------------------------

interface HFSpace {
  id: string;
  author: string;
  lastModified: string;
  likes: number;
  tags: string[];
  cardData?: {
    title?: string;
    short_description?: string;
    license?: string;
  };
}

/**
 * Fetch trending HuggingFace Spaces tagged with relevant AI topics.
 */
export async function crawlHuggingFace(): Promise<DiscoveryCandidate[]> {
  const candidates: DiscoveryCandidate[] = [];
  const seen = new Set<string>();

  try {
    const res = await fetch(
      "https://huggingface.co/api/spaces?sort=likes&direction=-1&limit=50",
      { headers: { "User-Agent": "Aegis-Discovery/1.0" } },
    );
    if (!res.ok) return candidates;
    const spaces = (await res.json()) as HFSpace[];

    for (const space of spaces) {
      if (seen.has(space.id)) continue;
      seen.add(space.id);

      // Only include spaces with decent traction
      if (space.likes < 20) continue;

      const nameParts = space.id.split("/");
      const owner = nameParts[0] ?? space.author;
      const name = nameParts[1] ?? space.id;

      candidates.push({
        repoUrl: `https://huggingface.co/spaces/${space.id}`,
        name,
        description: space.cardData?.short_description ?? `HuggingFace Space: ${space.id}`,
        stars: space.likes,
        language: "python",
        license: space.cardData?.license ?? null,
        lastUpdated: space.lastModified ?? new Date().toISOString(),
        owner,
        topics: space.tags ?? [],
        source: "huggingface",
      });
    }
  } catch (err) {
    logger.warn({ err }, "HuggingFace fetch failed");
  }

  return candidates;
}
