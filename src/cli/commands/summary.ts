/**
 * `gtm summary` — high-level overview of the repository.
 *
 * Thin adapter: parse options -> call analyzer -> render. No logic here.
 */
import { Command } from 'commander';
import { analyzeSummary } from '../../core/analyzers/summaryAnalyzer.js';
import { renderSummary } from '../../output/summaryView.js';
import { resolveCommon, runCommand, withCommonOptions, type CommonCliOptions } from '../shared.js';

export function registerSummaryCommand(program: Command): void {
  withCommonOptions(
    program.command('summary').description('Show a high-level overview of the repository history'),
  ).action(async (options: CommonCliOptions) => {
    const { format, analysis } = resolveCommon(options);
    await runCommand({
      format,
      startText: 'Analyzing repository history...',
      task: () => analyzeSummary(analysis),
      render: renderSummary,
    });
  });
}
