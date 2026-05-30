/**
 * Core domain models for Git Time Machine.
 *
 * These types are the stable contract between the git access layer, the
 * analyzers (business logic), and the output renderers. Keeping them isolated
 * here means future features (HTML report, JSON export, AI summary, cache)
 * can consume the same shapes without depending on git internals.
 */

/** Supported output formats. Extend here to add e.g. 'html' in the future. */
export type OutputFormat = 'text' | 'json';

/** A single person identified by name + email as recorded by git. */
export interface Identity {
  readonly name: string;
  readonly email: string;
}

/** A normalized representation of one git commit. */
export interface CommitInfo {
  readonly hash: string;
  readonly shortHash: string;
  readonly author: Identity;
  readonly committer: Identity;
  /** Author date in ISO-8601. */
  readonly date: string;
  readonly subject: string;
  readonly body: string;
}

/** Number of files / lines changed by a single commit. */
export interface CommitStats {
  readonly filesChanged: number;
  readonly insertions: number;
  readonly deletions: number;
}

/** Aggregated contribution metrics for one author. */
export interface AuthorContribution {
  readonly author: Identity;
  readonly commits: number;
  readonly insertions: number;
  readonly deletions: number;
  /** ISO date of the author's first commit in the analyzed range. */
  readonly firstCommit: string;
  /** ISO date of the author's most recent commit in the analyzed range. */
  readonly lastCommit: string;
}

/** Per-file churn metrics used for hotspot detection. */
export interface FileChurn {
  readonly path: string;
  /** How many commits touched this file. */
  readonly commits: number;
  readonly insertions: number;
  readonly deletions: number;
  /** Distinct authors who touched the file. */
  readonly authors: number;
  readonly lastModified: string;
}

/** A file flagged as risky, with a normalized risk score (0..1). */
export interface Hotspot extends FileChurn {
  /** Normalized 0..1 risk score combining churn and author spread. */
  readonly riskScore: number;
}

/** Ownership breakdown for a single file or module. */
export interface OwnershipEntry {
  readonly author: Identity;
  readonly commits: number;
  /** Share of commits to the target, 0..1. */
  readonly share: number;
}

/** Result of `gtm summary`. */
export interface RepoSummary {
  readonly repoPath: string;
  readonly branch: string;
  readonly totalCommits: number;
  readonly totalAuthors: number;
  readonly firstCommitDate: string | null;
  readonly lastCommitDate: string | null;
  /** Inclusive age of the repository in days. */
  readonly ageDays: number;
  readonly trackedFiles: number;
  readonly topAuthors: readonly AuthorContribution[];
  readonly recentCommits: readonly CommitInfo[];
}

/** Result of `gtm hotspots`. */
export interface HotspotsReport {
  readonly repoPath: string;
  readonly analyzedCommits: number;
  readonly hotspots: readonly Hotspot[];
}

/** Result of `gtm explain <path>`. */
export interface ExplainReport {
  readonly path: string;
  readonly exists: boolean;
  readonly totalCommits: number;
  readonly authors: readonly OwnershipEntry[];
  readonly createdAt: string | null;
  readonly lastModified: string | null;
  readonly recentCommits: readonly CommitInfo[];
}

/** A single entry in `gtm timeline <path>`. */
export interface TimelineEntry {
  readonly commit: CommitInfo;
  readonly stats: CommitStats;
}

/** Result of `gtm timeline <path>`. */
export interface TimelineReport {
  readonly path: string;
  readonly entries: readonly TimelineEntry[];
}

/** Result of `gtm author <name>`. */
export interface AuthorReport {
  readonly query: string;
  readonly matched: readonly Identity[];
  readonly contribution: AuthorContribution | null;
  readonly topFiles: readonly FileChurn[];
  readonly recentCommits: readonly CommitInfo[];
}

/**
 * Combined dataset for `gtm report`, aggregating multiple analyses into a
 * single shareable document (consumed by the HTML renderer).
 */
export interface ReportData {
  /** ISO timestamp of when the report was produced. */
  readonly generatedAt: string;
  readonly summary: RepoSummary;
  readonly hotspots: HotspotsReport;
}

/** Options shared by every analyzer, derived from CLI flags. */
export interface AnalysisOptions {
  /** Absolute path to the repository working directory. */
  readonly repoPath: string;
  /** Limit analysis to the last N commits (undefined = all). */
  readonly maxCommits?: number;
  /** Only include commits after this ISO date / git-parseable string. */
  readonly since?: string;
}
