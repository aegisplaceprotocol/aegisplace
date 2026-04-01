// ---------------------------------------------------------------------------
// Security Scanner - performs 4 checks on a discovery candidate:
//   1. Secret detection (API keys, tokens, passwords in code)
//   2. Malware pattern detection (obfuscated code, eval, crypto miners)
//   3. License check (OSI-approved vs. restrictive)
//   4. Reputation check (owner account age, followers, repo count)
// All checks use pattern matching and the GitHub API - no external tools.
// ---------------------------------------------------------------------------

import type { DiscoveryCandidate } from "./crawlers";

export interface SecurityReport {
  passed: boolean;
  score: number; // 0-100
  secretsFound: string[];
  malwareFlags: string[];
  licenseStatus: "clean" | "warning" | "blocked";
  reputationScore: number; // 0-100
  details: string[];
}

// ---------------------------------------------------------------------------
// Secret detection patterns
// ---------------------------------------------------------------------------

const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: "AWS Access Key", pattern: /AKIA[0-9A-Z]{16}/ },
  { name: "AWS Secret Key", pattern: /(?:aws_secret_access_key|secret_key)\s*[:=]\s*['"][A-Za-z0-9/+=]{40}['"]/ },
  { name: "GitHub Token", pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/ },
  { name: "Generic API Key", pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][A-Za-z0-9]{20,}['"]/ },
  { name: "Private Key Block", pattern: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/ },
  { name: "Slack Token", pattern: /xox[bpors]-[0-9]{10,}-[A-Za-z0-9-]+/ },
  { name: "Stripe Key", pattern: /sk_live_[0-9a-zA-Z]{24,}/ },
  { name: "Generic Password", pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{8,}['"]/ },
  { name: "JWT Secret", pattern: /(?:jwt[_-]?secret)\s*[:=]\s*['"][^'"]{10,}['"]/ },
  { name: "Database URL with creds", pattern: /(?:postgres|mysql|mongodb):\/\/[^:]+:[^@]+@[^/]+/ },
];

// ---------------------------------------------------------------------------
// Malware pattern detection
// ---------------------------------------------------------------------------

const MALWARE_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: "Obfuscated eval", pattern: /eval\s*\(\s*(?:atob|Buffer\.from|decodeURIComponent|unescape)\s*\(/ },
  { name: "Crypto miner", pattern: /(?:coinhive|cryptonight|stratum\+tcp|xmrig|minergate)/i },
  { name: "Reverse shell", pattern: /(?:\/bin\/(?:ba)?sh\s+-i|nc\s+-[elp]|python\s+-c\s+['"]import\s+socket)/i },
  { name: "Data exfiltration", pattern: /(?:webhook\.site|requestbin\.com|ngrok\.io|burpcollaborator)/i },
  { name: "Base64 encoded exec", pattern: /(?:exec|spawn|system)\s*\(\s*(?:Buffer\.from|atob)\s*\(/ },
  { name: "Suspicious download", pattern: /(?:curl|wget)\s+.*\|\s*(?:bash|sh|python)/ },
  { name: "Install script override", pattern: /(?:preinstall|postinstall).*(?:curl|wget|node\s+-e)/ },
];

// ---------------------------------------------------------------------------
// License classifications
// ---------------------------------------------------------------------------

const CLEAN_LICENSES = new Set([
  "MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC",
  "Unlicense", "0BSD", "BlueOak-1.0.0", "CC0-1.0",
]);

const WARNING_LICENSES = new Set([
  "GPL-2.0", "GPL-3.0", "LGPL-2.1", "LGPL-3.0",
  "MPL-2.0", "AGPL-3.0", "EUPL-1.2", "CPAL-1.0",
]);

const BLOCKED_LICENSES = new Set([
  "SSPL-1.0", "BSL-1.1", "Elastic-2.0", "Commons-Clause",
]);

// ---------------------------------------------------------------------------
// Files to sample from the repo for secret/malware scanning
// ---------------------------------------------------------------------------

const FILES_TO_CHECK = [
  "package.json",
  "setup.py",
  "pyproject.toml",
  ".env.example",
  "src/index.ts",
  "src/index.js",
  "index.ts",
  "index.js",
  "main.py",
  "app.py",
  "server.py",
  "Makefile",
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function scanCandidate(candidate: DiscoveryCandidate): Promise<SecurityReport> {
  const details: string[] = [];
  const secretsFound: string[] = [];
  const malwareFlags: string[] = [];

  // 1. Fetch sample files and scan them
  const fileContents = await fetchSampleFiles(candidate);
  details.push(`Scanned ${fileContents.length} files from repository`);

  for (const { path, content } of fileContents) {
    // Secret detection
    for (const { name, pattern } of SECRET_PATTERNS) {
      if (pattern.test(content)) {
        secretsFound.push(`${name} in ${path}`);
      }
    }

    // Malware detection
    for (const { name, pattern } of MALWARE_PATTERNS) {
      if (pattern.test(content)) {
        malwareFlags.push(`${name} in ${path}`);
      }
    }
  }

  if (secretsFound.length > 0) {
    details.push(`Found ${secretsFound.length} potential secret(s)`);
  }
  if (malwareFlags.length > 0) {
    details.push(`Found ${malwareFlags.length} malware indicator(s)`);
  }

  // 2. License check
  const licenseStatus = checkLicense(candidate.license);
  details.push(`License: ${candidate.license ?? "none"} (${licenseStatus})`);

  // 3. Reputation check
  const reputationScore = await checkReputation(candidate);
  details.push(`Reputation score: ${reputationScore}/100`);

  // Compute composite score
  let score = 100;

  // Deduct for secrets (15 points each, max -45)
  score -= Math.min(secretsFound.length * 15, 45);

  // Deduct for malware flags (25 points each, max -75)
  score -= Math.min(malwareFlags.length * 25, 75);

  // Deduct for license issues
  if (licenseStatus === "warning") score -= 10;
  if (licenseStatus === "blocked") score -= 30;

  // Blend with reputation
  score = Math.max(0, Math.min(100, score));

  // Threshold: pass if score >= 50 AND no malware AND license not blocked
  const passed =
    score >= 50 && malwareFlags.length === 0 && licenseStatus !== "blocked";

  if (!passed) {
    details.push("FAILED security scan");
  } else {
    details.push("PASSED security scan");
  }

  return {
    passed,
    score,
    secretsFound,
    malwareFlags,
    licenseStatus,
    reputationScore,
    details,
  };
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

interface FileContent {
  path: string;
  content: string;
}

async function fetchSampleFiles(candidate: DiscoveryCandidate): Promise<FileContent[]> {
  const results: FileContent[] = [];

  // Determine the GitHub raw URL base
  const ghMatch = candidate.repoUrl.match(/github\.com\/([\w.-]+\/[\w.-]+)/);
  if (!ghMatch) return results;
  const fullName = ghMatch[1];

  // Fetch files in parallel (max 6 at a time to avoid rate limits)
  const batches: string[][] = [];
  for (let i = 0; i < FILES_TO_CHECK.length; i += 6) {
    batches.push(FILES_TO_CHECK.slice(i, i + 6));
  }

  for (const batch of batches) {
    const fetches = batch.map(async (filePath) => {
      try {
        const url = `https://raw.githubusercontent.com/${fullName}/HEAD/${filePath}`;
        const res = await fetch(url, {
          headers: { "User-Agent": "Aegis-Discovery/1.0" },
        });
        if (!res.ok) return null;
        const text = await res.text();
        // Only scan files under 100KB
        if (text.length > 100_000) return null;
        return { path: filePath, content: text };
      } catch {
        return null;
      }
    });

    const batchResults = await Promise.all(fetches);
    for (const r of batchResults) {
      if (r) results.push(r);
    }
    // Small delay between batches
    await new Promise((r) => setTimeout(r, 500));
  }

  return results;
}

function checkLicense(license: string | null): "clean" | "warning" | "blocked" {
  if (!license) return "warning";
  if (CLEAN_LICENSES.has(license)) return "clean";
  if (WARNING_LICENSES.has(license)) return "warning";
  if (BLOCKED_LICENSES.has(license)) return "blocked";
  return "warning"; // unknown license
}

interface GitHubOwner {
  public_repos: number;
  followers: number;
  created_at: string;
}

async function checkReputation(candidate: DiscoveryCandidate): Promise<number> {
  // Skip for non-GitHub sources
  if (!candidate.repoUrl.includes("github.com")) {
    // Default moderate reputation for non-GitHub
    return candidate.stars >= 100 ? 70 : 50;
  }

  try {
    const res = await fetch(`https://api.github.com/users/${candidate.owner}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Aegis-Discovery/1.0",
      },
    });
    if (!res.ok) return 50;

    const user = (await res.json()) as GitHubOwner;

    let score = 30; // Base score

    // Account age (older = more trusted)
    const accountAge = Date.now() - new Date(user.created_at).getTime();
    const ageYears = accountAge / (365.25 * 24 * 60 * 60 * 1000);
    score += Math.min(Math.floor(ageYears * 5), 20); // up to +20

    // Followers
    if (user.followers >= 100) score += 15;
    else if (user.followers >= 10) score += 10;
    else if (user.followers >= 1) score += 5;

    // Repo count (established developers)
    if (user.public_repos >= 50) score += 15;
    else if (user.public_repos >= 10) score += 10;
    else if (user.public_repos >= 3) score += 5;

    // Stars bonus
    if (candidate.stars >= 1000) score += 20;
    else if (candidate.stars >= 500) score += 15;
    else if (candidate.stars >= 100) score += 10;
    else if (candidate.stars >= 50) score += 5;

    return Math.min(100, score);
  } catch {
    return 50; // Default on failure
  }
}
