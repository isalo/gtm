/**
 * Renderer for `gtm coupling`.
 */
import chalk from 'chalk';
import type { CouplingReport, OutputFormat } from '../core/models/types.js';
import { heading, toJson } from './format.js';

/** Color a 0..1 coupling ratio. */
function couplingColor(value: number): (text: string) => string {
  if (value >= 0.66) return chalk.red;
  if (value >= 0.33) return chalk.yellow;
  return chalk.green;
}

/** Show the last two path segments to keep file labels compact. */
function shortPath(p: string): string {
  const parts = p.split('/');
  return parts.length <= 2 ? p : `.../${parts.slice(-2).join('/')}`;
}

export function renderCoupling(report: CouplingReport, format: OutputFormat): string {
  if (format === 'json') return toJson(report);

  const lines: string[] = [];
  lines.push(heading('Change Coupling'));
  lines.push(chalk.dim(`  Analyzed ${report.analyzedCommits} commits · min shared ${report.minShared}`));

  if (report.pairs.length === 0) {
    lines.push('');
    lines.push('  No coupled files found (try lowering --min-shared).');
    return lines.join('\n');
  }

  lines.push('');
  lines.push(chalk.dim(`  ${'COUPLE'.padEnd(7)} ${'SHARED'.padStart(6)}  FILES`));
  for (const pair of report.pairs) {
    const color = couplingColor(pair.coupling);
    const pct = color(`${Math.round(pair.coupling * 100)}%`.padEnd(7));
    lines.push(
      `  ${pct} ${String(pair.sharedCommits).padStart(6)}  ${shortPath(pair.fileA)} ${chalk.dim('<->')} ${shortPath(pair.fileB)}`,
    );
  }

  return lines.join('\n');
}
