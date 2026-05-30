/**
 * `gtm hotspots` — list risky, frequently-changed files.
 */
import { Command } from 'commander';
import { analyzeHotspots } from '../../core/analyzers/hotspotsAnalyzer.js';
import { renderHotspots } from '../../output/hotspotsView.js';
import { InvalidInputError } from '../../utils/errors.js';
import { resolveCommon, runCommand, withCommonOptions, type CommonCliOptions } from '../shared.js';

interface HotspotsCliOptions extends CommonCliOptions {
  top?: string;
}

export function registerHotspotsCommand(program: Command): void {
  withCommonOptions(
    program
      .command('hotspots')
      .description('List risky, frequently-changed files')
      .option('-t, --top <count>', 'number of files to show', '20'),
  ).action(async (options: HotspotsCliOptions) => {
    const { format, analysis } = resolveCommon(options);

    let limit = 20;
    if (options.top !== undefined) {
      limit = Number.parseInt(options.top, 10);
      if (Number.isNaN(limit) || limit <= 0) {
        throw new InvalidInputError(`--top must be a positive integer, got '${options.top}'.`);
      }
    }

    await runCommand({
      format,
      startText: 'Computing file churn...',
      task: () => analyzeHotspots({ ...analysis, limit }),
      render: renderHotspots,
    });
  });
}
