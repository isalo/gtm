/**
 * `gtm report` — generate a self-contained HTML report for the repository.
 *
 * Writes an HTML file by default (a shareable dashboard). With `--json` it
 * emits the underlying combined dataset to stdout instead, keeping the
 * machine-readable contract consistent across commands.
 */
import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { analyzeReport } from '../../core/analyzers/reportAnalyzer.js';
import { renderHtmlReport } from '../../output/html/htmlReport.js';
import { toJson } from '../../output/format.js';
import { InvalidInputError } from '../../utils/errors.js';
import { log } from '../../utils/logger.js';
import { resolveCommon, runTask, withCommonOptions, type CommonCliOptions } from '../shared.js';

interface ReportCliOptions extends CommonCliOptions {
  output?: string;
  top?: string;
}

const DEFAULT_OUTPUT = 'gtm-report.html';

export function registerReportCommand(program: Command): void {
  withCommonOptions(
    program
      .command('report')
      .description('Generate a self-contained HTML report (or JSON with --json)')
      .option('-o, --output <file>', 'output HTML file path', DEFAULT_OUTPUT)
      .option('-t, --top <count>', 'number of hotspot files to include', '15'),
  ).action(async (options: ReportCliOptions) => {
    const { format, analysis } = resolveCommon(options);

    let hotspotLimit = 15;
    if (options.top !== undefined) {
      hotspotLimit = Number.parseInt(options.top, 10);
      if (Number.isNaN(hotspotLimit) || hotspotLimit <= 0) {
        throw new InvalidInputError(`--top must be a positive integer, got '${options.top}'.`);
      }
    }

    const data = await runTask(() => analyzeReport({ ...analysis, hotspotLimit }), {
      format,
      startText: 'Building report...',
    });

    if (format === 'json') {
      process.stdout.write(toJson(data) + '\n');
      return;
    }

    const outputPath = path.resolve(process.cwd(), options.output ?? DEFAULT_OUTPUT);
    fs.writeFileSync(outputPath, renderHtmlReport(data), 'utf8');
    log.info(`HTML report written to ${outputPath}`);
  });
}
