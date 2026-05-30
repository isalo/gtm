/**
 * Public library surface for Git Time Machine.
 *
 * Programmatic consumers (e.g. a future HTML reporter, GitHub Action, or AI
 * summarizer) can import analyzers and types from here without touching the
 * CLI. The CLI is just one consumer of this same core.
 */
export * from './core/models/types.js';
export { GitClient } from './core/git/gitClient.js';
export type { GitLogOptions, NumstatCommit, NumstatFile } from './core/git/gitClient.js';
export { analyzeSummary, aggregateAuthors, computeAgeDays } from './core/analyzers/summaryAnalyzer.js';
export { analyzeHotspots } from './core/analyzers/hotspotsAnalyzer.js';
export { analyzeExplain, ownership } from './core/analyzers/explainAnalyzer.js';
export { analyzeTimeline } from './core/analyzers/timelineAnalyzer.js';
export { analyzeAuthor } from './core/analyzers/authorAnalyzer.js';
export { analyzeReport } from './core/analyzers/reportAnalyzer.js';
export { buildFileChurn, scoreHotspots } from './core/analyzers/churn.js';
export { identityKey, identityMatches } from './core/analyzers/identity.js';
export { renderSummary } from './output/summaryView.js';
export { renderHotspots } from './output/hotspotsView.js';
export { renderExplain } from './output/explainView.js';
export { renderTimeline } from './output/timelineView.js';
export { renderAuthor } from './output/authorView.js';
export { renderHtmlReport, escapeHtml } from './output/html/htmlReport.js';
export {
  GtmError,
  NotAGitRepoError,
  GitNotFoundError,
  PathNotFoundError,
  InvalidInputError,
  isGtmError,
} from './utils/errors.js';
