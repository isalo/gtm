/**
 * Git access layer.
 *
 * A thin, typed wrapper around the `git` CLI using execa. This is the ONLY
 * module that knows how git speaks. Analyzers depend on these methods, never
 * on raw git output, which keeps business logic testable and portable across
 * Windows/Linux/macOS.
 */
import { execa, ExecaError } from 'execa';
import path from 'node:path';
import { GitNotFoundError, NotAGitRepoError } from '../../utils/errors.js';
import type { CommitInfo, Identity } from '../models/types.js';

/** Unit separator + record separator used to safely parse `git log`. */
const FIELD = '\u001f';
const RECORD = '\u001e';

/**
 * Pretty format mapped 1:1 to {@link CommitInfo}. Order matters and must match
 * {@link parseCommits}. Body is last because it may contain newlines.
 */
const LOG_FORMAT = ['%H', '%h', '%an', '%ae', '%cn', '%ce', '%aI', '%s', '%b'].join(FIELD) + RECORD;

export interface GitLogOptions {
  /** Limit to the last N commits. */
  readonly maxCount?: number;
  /** Restrict to commits touching this path. */
  readonly path?: string;
  /** Only commits more recent than this git-parseable date string. */
  readonly since?: string;
  /** Filter by author name/email substring (git `--author`). */
  readonly author?: string;
  /** Follow renames for a single file (git `--follow`). */
  readonly follow?: boolean;
}

export class GitClient {
  /** Absolute path to the repository working directory. */
  readonly repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = path.resolve(repoPath);
  }

  /** Run a git subcommand, translating common failures into typed errors. */
  private async run(args: readonly string[]): Promise<string> {
    try {
      const result = await execa('git', args, {
        cwd: this.repoPath,
        // Force a stable, locale-independent output.
        env: { GIT_PAGER: 'cat', LC_ALL: 'C' },
        stripFinalNewline: false,
      });
      return result.stdout;
    } catch (error) {
      const execaError = error as ExecaError;
      if ((execaError as { code?: string }).code === 'ENOENT') {
        throw new GitNotFoundError();
      }
      throw error;
    }
  }

  /** Verify the directory is inside a git work tree. */
  async assertRepo(): Promise<void> {
    try {
      const out = await this.run(['rev-parse', '--is-inside-work-tree']);
      if (out.trim() !== 'true') {
        throw new NotAGitRepoError(this.repoPath);
      }
    } catch (error) {
      if (error instanceof GitNotFoundError) throw error;
      throw new NotAGitRepoError(this.repoPath);
    }
  }

  /** Whether HEAD points at a real commit (false on a fresh/unborn repo). */
  async hasCommits(): Promise<boolean> {
    try {
      await this.run(['rev-parse', '--verify', '--quiet', 'HEAD']);
      return true;
    } catch {
      return false;
    }
  }

  /** Current branch name, or a detached-HEAD placeholder. */
  async currentBranch(): Promise<string> {
    // `branch --show-current` works even on an unborn branch and never errors.
    const current = (await this.run(['branch', '--show-current'])).trim();
    if (current) return current;
    return '(detached HEAD)';
  }

  /** Total number of commits reachable from HEAD (0 on an empty repo). */
  async commitCount(): Promise<number> {
    if (!(await this.hasCommits())) return 0;
    const out = (await this.run(['rev-list', '--count', 'HEAD'])).trim();
    return Number.parseInt(out, 10) || 0;
  }

  /** Number of files tracked by git in the working tree. */
  async trackedFileCount(): Promise<number> {
    const out = await this.run(['ls-files']);
    return out.split('\n').filter((line) => line.length > 0).length;
  }

  /** Structured commit log, newest first. Empty on a repo with no commits. */
  async log(options: GitLogOptions = {}): Promise<CommitInfo[]> {
    if (!(await this.hasCommits())) return [];
    const args = ['log', `--pretty=format:${LOG_FORMAT}`, '--date=iso-strict'];
    if (options.maxCount !== undefined) args.push(`--max-count=${options.maxCount}`);
    if (options.since !== undefined) args.push(`--since=${options.since}`);
    if (options.author !== undefined) args.push(`--author=${options.author}`);
    if (options.follow) args.push('--follow');
    if (options.path !== undefined) {
      args.push('--', options.path);
    }
    const out = await this.run(args);
    return parseCommits(out);
  }

  /**
   * Numstat per commit: returns a map of commit hash -> file change rows.
   * Used by churn/hotspot/timeline analyzers.
   */
  async numstat(options: GitLogOptions = {}): Promise<NumstatCommit[]> {
    if (!(await this.hasCommits())) return [];
    const args = ['log', `--pretty=format:${RECORD}%H`, '--numstat', '--date=iso-strict'];
    if (options.maxCount !== undefined) args.push(`--max-count=${options.maxCount}`);
    if (options.since !== undefined) args.push(`--since=${options.since}`);
    if (options.author !== undefined) args.push(`--author=${options.author}`);
    if (options.follow) args.push('--follow');
    if (options.path !== undefined) args.push('--', options.path);
    const out = await this.run(args);
    return parseNumstat(out);
  }
}

/** A commit hash plus its per-file numstat rows. */
export interface NumstatCommit {
  readonly hash: string;
  readonly files: readonly NumstatFile[];
}

export interface NumstatFile {
  readonly path: string;
  /** Lines added; null for binary files. */
  readonly insertions: number | null;
  /** Lines removed; null for binary files. */
  readonly deletions: number | null;
}

/** Parse the structured `git log` output produced with {@link LOG_FORMAT}. */
export function parseCommits(raw: string): CommitInfo[] {
  return raw
    .split(RECORD)
    .map((chunk) => chunk.replace(/^\n+/, ''))
    .filter((chunk) => chunk.trim().length > 0)
    .map((chunk) => {
      const parts = chunk.split(FIELD);
      const author: Identity = { name: parts[2] ?? '', email: parts[3] ?? '' };
      const committer: Identity = { name: parts[4] ?? '', email: parts[5] ?? '' };
      const commit: CommitInfo = {
        hash: parts[0] ?? '',
        shortHash: parts[1] ?? '',
        author,
        committer,
        date: parts[6] ?? '',
        subject: parts[7] ?? '',
        body: (parts[8] ?? '').trim(),
      };
      return commit;
    });
}

/** Parse `git log --numstat` output keyed by record-separated commit hashes. */
export function parseNumstat(raw: string): NumstatCommit[] {
  const commits: NumstatCommit[] = [];
  const blocks = raw.split(RECORD).filter((block) => block.trim().length > 0);
  for (const block of blocks) {
    const lines = block.split('\n').filter((line) => line.length > 0);
    const hash = (lines.shift() ?? '').trim();
    if (!hash) continue;
    const files: NumstatFile[] = [];
    for (const line of lines) {
      const match = line.split('\t');
      if (match.length < 3) continue;
      const [add, del, file] = match;
      files.push({
        path: file ?? '',
        insertions: add === '-' ? null : Number.parseInt(add ?? '0', 10) || 0,
        deletions: del === '-' ? null : Number.parseInt(del ?? '0', 10) || 0,
      });
    }
    commits.push({ hash, files });
  }
  return commits;
}
