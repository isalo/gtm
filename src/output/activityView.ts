/**
 * Renderer for `gtm activity`.
 */
import chalk from 'chalk';
import type { ActivityReport, OutputFormat } from '../core/models/types.js';
import { heading, toJson } from './format.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SHADES = [' ', '░', '▒', '▓', '█'];
const SPARK = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

/** Map a count to a 0..(levels-1) bucket relative to max. */
function level(count: number, max: number, levels: number): number {
  if (count === 0 || max === 0) return 0;
  return Math.min(levels - 1, 1 + Math.floor((count / max) * (levels - 2)));
}

export function renderActivity(report: ActivityReport, format: OutputFormat): string {
  if (format === 'json') return toJson(report);

  const lines: string[] = [];
  lines.push(heading('Commit Activity'));
  lines.push(
    chalk.dim(
      `  ${report.totalCommits} commits · busiest ${WEEKDAYS[report.busiestWeekday]} @ ${String(report.busiestHour).padStart(2, '0')}:00`,
    ),
  );

  if (report.totalCommits === 0) {
    lines.push('');
    lines.push('  No commits in the analyzed range.');
    return lines.join('\n');
  }

  const maxCell = Math.max(1, ...report.byWeekdayHour.flatMap((row) => [...row]));
  lines.push('');
  lines.push(chalk.dim('      0   3   6   9   12  15  18  21'));
  for (let d = 0; d < 7; d++) {
    const cells = report.byWeekdayHour[d]!.map(
      (c) => SHADES[level(c, maxCell, SHADES.length)]!,
    ).join('');
    lines.push(`  ${chalk.dim(WEEKDAYS[d]!)} ${cells}`);
  }

  if (report.byMonth.length > 0) {
    const maxMonth = Math.max(...report.byMonth.map((m) => m.count));
    const spark = report.byMonth
      .map((m) => SPARK[level(m.count, maxMonth, SPARK.length)]!)
      .join('');
    const first = report.byMonth[0]!.month;
    const last = report.byMonth[report.byMonth.length - 1]!.month;
    lines.push('');
    lines.push(heading('Monthly Trend'));
    lines.push(`  ${chalk.green(spark)}`);
    lines.push(chalk.dim(`  ${first} → ${last} (peak ${maxMonth}/mo)`));
  }

  return lines.join('\n');
}
