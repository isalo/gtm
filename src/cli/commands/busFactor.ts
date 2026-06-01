/**
 * `gtm bus-factor` — files dominated by a single author (knowledge silos).
 */
import { Command } from 'commander';
import { analyzeBusFactor } from '../../core/analyzers/busFactorAnalyzer.js';
import { renderBusFactor } from '../../output/busFactorView.js';
import { InvalidInputError } from '../../utils/errors.js';
import { resolveCommon, runCommand, withCommonOptions, type CommonCliOptions } from '../shared.js';

interface BusFactorCliOptions extends CommonCliOptions {
  threshold?: string;
  top?: string;
}

export function registerBusFactorCommand(program: Command): void {
  withCommonOptions(
    program
      .command('bus-factor')
      .description('Find files whose history is dominated by a single author')
      .option('-t, --top <count>', 'number of files to show', '20')
      .option('--threshold <0-100>', 'single-author dominance percent to flag', '80'),
  ).action(async (options: BusFactorCliOptions) => {
    const { format, analysis } = resolveCommon(options);

    let top = 20;
    if (options.top !== undefined) {
      top = Number.parseInt(options.top, 10);
      if (Number.isNaN(top) || top <= 0) {
        throw new InvalidInputError(`--top must be a positive integer, got '${options.top}'.`);
      }
    }

    let threshold = 0.8;
    if (options.threshold !== undefined) {
      const pct = Number.parseInt(options.threshold, 10);
      if (Number.isNaN(pct) || pct <= 0 || pct > 100) {
        throw new InvalidInputError(
          `--threshold must be between 1 and 100, got '${options.threshold}'.`,
        );
      }
      threshold = pct / 100;
    }

    await runCommand({
      format,
      startText: 'Computing knowledge ownership...',
      task: () => analyzeBusFactor({ ...analysis, top, threshold }),
      render: renderBusFactor,
    });
  });
}
