/**
 * `gtm explain <path>` — summarize a path's history and ownership.
 */
import { Command } from 'commander';
import { analyzeExplain } from '../../core/analyzers/explainAnalyzer.js';
import { renderExplain } from '../../output/explainView.js';
import { resolveCommon, runCommand, withCommonOptions, type CommonCliOptions } from '../shared.js';

export function registerExplainCommand(program: Command): void {
  withCommonOptions(
    program
      .command('explain')
      .argument('<path>', 'file or directory to explain')
      .description('Summarize the history and ownership of a path'),
  ).action(async (target: string, options: CommonCliOptions) => {
    const { format, analysis } = resolveCommon(options);
    await runCommand({
      format,
      startText: `Explaining ${target}...`,
      task: () => analyzeExplain({ ...analysis, target }),
      render: renderExplain,
    });
  });
}
