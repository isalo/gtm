/**
 * `gtm activity` — commit cadence (weekday/hour heatmap + monthly trend).
 */
import { Command } from 'commander';
import { analyzeActivity } from '../../core/analyzers/activityAnalyzer.js';
import { renderActivity } from '../../output/activityView.js';
import { resolveCommon, runCommand, withCommonOptions, type CommonCliOptions } from '../shared.js';

export function registerActivityCommand(program: Command): void {
  withCommonOptions(
    program.command('activity').description('Show commit cadence by weekday, hour, and month'),
  ).action(async (options: CommonCliOptions) => {
    const { format, analysis } = resolveCommon(options);
    await runCommand({
      format,
      startText: 'Computing commit activity...',
      task: () => analyzeActivity(analysis),
      render: renderActivity,
    });
  });
}
