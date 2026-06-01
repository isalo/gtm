/**
 * Public library surface for Git Time Machine.
 *
 * Programmatic consumers (e.g. a future HTML reporter, GitHub Action, or AI
 * summarizer) can import analyzers and types from here without touching the
 * CLI. The CLI is just one consumer of this same core.
 *
 * @packageDocumentation
 * @author Ivan Salo <https://github.com/isalo>
 * @license MIT
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
export { analyzeCoupling } from './core/analyzers/couplingAnalyzer.js';
export { analyzeBusFactor } from './core/analyzers/busFactorAnalyzer.js';
export { analyzeActivity, parseLocalParts } from './core/analyzers/activityAnalyzer.js';
export { buildFileChurn, scoreHotspots } from './core/analyzers/churn.js';
export { identityKey, identityMatches } from './core/analyzers/identity.js';
export { renderSummary } from './output/summaryView.js';
export { renderHotspots } from './output/hotspotsView.js';
export { renderExplain } from './output/explainView.js';
export { renderTimeline } from './output/timelineView.js';
export { renderAuthor } from './output/authorView.js';
export { renderCoupling } from './output/couplingView.js';
export { renderBusFactor } from './output/busFactorView.js';
export { renderActivity } from './output/activityView.js';
export { renderHtmlReport, escapeHtml } from './output/html/htmlReport.js';
export {
  GtmError,
  NotAGitRepoError,
  GitNotFoundError,
  PathNotFoundError,
  InvalidInputError,
  isGtmError,
} from './utils/errors.js';
