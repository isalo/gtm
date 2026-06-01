/**
 * `gtm coupling` — files that frequently change together.
 */
import { Command } from 'commander';
import { analyzeCoupling } from '../../core/analyzers/couplingAnalyzer.js';
import { renderCoupling } from '../../output/couplingView.js';
import { InvalidInputError } from '../../utils/errors.js';
import { resolveCommon, runCommand, withCommonOptions, type CommonCliOptions } from '../shared.js';

interface CouplingCliOptions extends CommonCliOptions {
  top?: string;
  minShared?: string;
}

function positiveInt(value: string | undefined, fallback: number, flag: string): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new InvalidInputError(`${flag} must be a positive integer, got '${value}'.`);
  }
  return parsed;
}

export function registerCouplingCommand(program: Command): void {
  withCommonOptions(
    program
      .command('coupling')
      .description('Find files that frequently change together (temporal coupling)')
      .option('-t, --top <count>', 'number of pairs to show', '20')
      .option('-m, --min-shared <count>', 'minimum co-changes to report a pair', '3'),
  ).action(async (options: CouplingCliOptions) => {
    const { format, analysis } = resolveCommon(options);
    const top = positiveInt(options.top, 20, '--top');
    const minShared = positiveInt(options.minShared, 3, '--min-shared');

    await runCommand({
      format,
      startText: 'Computing change coupling...',
      task: () => analyzeCoupling({ ...analysis, top, minShared }),
      render: renderCoupling,
    });
  });
}
