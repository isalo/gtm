/**
 * Renderer for `gtm hotspots`.
 */
import chalk from 'chalk';
import type { HotspotsReport, OutputFormat } from '../core/models/types.js';
import { heading, relativeTime, toJson } from './format.js';

/** Color a 0..1 risk score: red (high), yellow (medium), green (low). */
function riskColor(score: number): (text: string) => string {
  if (score >= 0.66) return chalk.red;
  if (score >= 0.33) return chalk.yellow;
  return chalk.green;
}

export function renderHotspots(report: HotspotsReport, format: OutputFormat): string {
  if (format === 'json') return toJson(report);

  const lines: string[] = [];
  lines.push(heading('Hotspots'));
  lines.push(chalk.dim(`  Analyzed ${report.analyzedCommits} commits`));

  if (report.hotspots.length === 0) {
    lines.push('');
    lines.push('  No file changes found in the analyzed range.');
    return lines.join('\n');
  }

  lines.push('');
  lines.push(
    chalk.dim(
      `  ${'RISK'.padEnd(6)} ${'CHANGES'.padStart(7)} ${'AUTHORS'.padStart(7)}  LAST       FILE`,
    ),
  );
  for (const file of report.hotspots) {
    const color = riskColor(file.riskScore);
    const bar = color(file.riskScore.toFixed(2).padEnd(6));
    lines.push(
      `  ${bar} ${String(file.commits).padStart(7)} ${String(file.authors).padStart(7)}  ` +
        `${relativeTime(file.lastModified).padEnd(10)} ${file.path}`,
    );
  }

  return lines.join('\n');
}
