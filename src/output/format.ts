/**
 * Output format primitives shared by all renderers.
 *
 * Today we support `text` (human, colored) and `json` (machine). Future
 * formats (e.g. `html`) only need to extend this union and add a renderer;
 * commands and analyzers stay untouched.
 */
import chalk from 'chalk';
import type { OutputFormat } from '../core/models/types.js';

export type { OutputFormat };

/** Serialize any value as pretty JSON for `--json`. */
export function toJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/** Format an ISO date as `YYYY-MM-DD`, or a dash when missing. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Human-friendly relative time, e.g. "3 days ago". */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  const diff = Date.now() - ms;
  const day = 1000 * 60 * 60 * 24;
  if (diff < day) return 'today';
  const days = Math.floor(diff / day);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

/** Section heading used by text renderers. */
export function heading(text: string): string {
  return chalk.bold.cyan(text);
}

/** Dim label : value line. */
export function field(label: string, value: string): string {
  return `  ${chalk.dim(label.padEnd(14))} ${value}`;
}
