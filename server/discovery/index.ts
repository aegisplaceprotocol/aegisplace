// ---------------------------------------------------------------------------
// Discovery Engine — exports
// ---------------------------------------------------------------------------

export { crawlGitHubTrending, crawlAwesomeLists, crawlHuggingFace } from "./crawlers";
export type { DiscoveryCandidate } from "./crawlers";

export { analyzeCandidate } from "./analyzer";
export type { AnalysisResult } from "./analyzer";

export { scanCandidate } from "./scanner";
export type { SecurityReport } from "./scanner";

export { runDiscoveryPipeline } from "./pipeline";
export type { DiscoveryRun } from "./pipeline";
