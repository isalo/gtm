/**
 * `gtm timeline <path>` — chronological change timeline for a path.
 */
import { Command } from 'commander';
import { analyzeTimeline } from '../../core/analyzers/timelineAnalyzer.js';
import { renderTimeline } from '../../output/timelineView.js';
import { resolveCommon, runCommand, withCommonOptions, type CommonCliOptions } from '../shared.js';

export function registerTimelineCommand(program: Command): void {
  withCommonOptions(
    program
      .command('timeline')
      .argument('<path>', 'file or directory to show a timeline for')
      .description('Show a chronological change timeline for a path'),
  ).action(async (target: string, options: CommonCliOptions) => {
    const { format, analysis } = resolveCommon(options);
    await runCommand({
      format,
      startText: `Building timeline for ${target}...`,
      task: () => analyzeTimeline({ ...analysis, target }),
      render: renderTimeline,
    });
  });
}
