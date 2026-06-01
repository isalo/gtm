/**
 * Renderer for `gtm bus-factor`.
 */
import chalk from 'chalk';
import type { BusFactorReport, OutputFormat } from '../core/models/types.js';
import { heading, toJson } from './format.js';

export function renderBusFactor(report: BusFactorReport, format: OutputFormat): string {
  if (format === 'json') return toJson(report);

  const lines: string[] = [];
  lines.push(heading('Bus Factor'));
  lines.push(
    chalk.dim(
      `  ${report.siloedFiles}/${report.totalFiles} files are >=${Math.round(report.threshold * 100)}% owned by one author`,
    ),
  );

  if (report.files.length === 0) {
    lines.push('');
    lines.push('  No siloed files at this threshold — knowledge is well spread.');
    return lines.join('\n');
  }

  lines.push('');
  lines.push(chalk.dim(`  ${'OWNED'.padEnd(6)} ${'CHANGES'.padStart(7)}  OWNER / FILE`));
  for (const file of report.files) {
    const pct = `${Math.round(file.primaryShare * 100)}%`.padEnd(6);
    const colored = file.primaryShare >= 0.9 ? chalk.red(pct) : chalk.yellow(pct);
    lines.push(
      `  ${colored} ${String(file.commits).padStart(7)}  ${chalk.cyan(file.primaryAuthor.name)} — ${file.path}`,
    );
  }

  return lines.join('\n');
}
