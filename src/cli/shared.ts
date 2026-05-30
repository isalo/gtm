/**
 * Shared CLI plumbing used by every command.
 *
 * Centralizes: common option parsing, the spinner lifecycle, and the
 * text/json output decision. Commands stay thin and consistent.
 */
import { Command, Option } from 'commander';
import ora from 'ora';
import path from 'node:path';
import process from 'node:process';
import type { AnalysisOptions, OutputFormat } from '../core/models/types.js';
import { InvalidInputError } from '../utils/errors.js';

/**
 * Attach the options every command shares. Defining them per-command (rather
 * than only globally) lets users place them naturally after the subcommand,
 * e.g. `gtm summary --json`.
 */
export function withCommonOptions(command: Command): Command {
  return command
    .option('--json', 'output machine-readable JSON instead of text')
    .option('-r, --repo <path>', 'path to the git repository (default: current directory)')
    .addOption(new Option('-n, --max <count>', 'limit analysis to the last N commits'))
    .addOption(new Option('--since <date>', 'only include commits since a date (git-parseable)'));
}

/** Raw option bag shared across commands (set up in program.ts). */
export interface CommonCliOptions {
  json?: boolean;
  repo?: string;
  max?: string;
  since?: string;
}

/** Resolved, validated common options. */
export interface ResolvedCommon {
  readonly format: OutputFormat;
  readonly analysis: AnalysisOptions;
}

export function resolveCommon(options: CommonCliOptions): ResolvedCommon {
  const repoPath = path.resolve(options.repo ?? process.cwd());

  let maxCommits: number | undefined;
  if (options.max !== undefined) {
    const parsed = Number.parseInt(options.max, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      throw new InvalidInputError(`--max must be a positive integer, got '${options.max}'.`);
    }
    maxCommits = parsed;
  }

  const analysis: AnalysisOptions = {
    repoPath,
    ...(maxCommits !== undefined ? { maxCommits } : {}),
    ...(options.since !== undefined ? { since: options.since } : {}),
  };

  return { format: options.json ? 'json' : 'text', analysis };
}

/**
 * Run an async task behind a spinner (suppressed for JSON output / non-TTY).
 * Returns the result so callers can render or write it as they see fit.
 */
export async function runTask<T>(
  task: () => Promise<T>,
  args: { format: OutputFormat; startText: string },
): Promise<T> {
  const useSpinner = args.format === 'text' && process.stderr.isTTY;
  const spinner = useSpinner ? ora({ text: args.startText, stream: process.stderr }).start() : null;
  try {
    const result = await task();
    spinner?.stop();
    return result;
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

/**
 * Run an analyzer with a spinner and print the rendered result to stdout.
 * Errors propagate to the top-level handler.
 */
export async function runCommand<T>(args: {
  format: OutputFormat;
  startText: string;
  task: () => Promise<T>;
  render: (result: T, format: OutputFormat) => string;
}): Promise<void> {
  const result = await runTask(args.task, { format: args.format, startText: args.startText });
  process.stdout.write(args.render(result, args.format) + '\n');
}
