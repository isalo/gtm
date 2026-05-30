/**
 * `gtm author <name>` — contribution profile for an author.
 */
import { Command } from 'commander';
import { analyzeAuthor } from '../../core/analyzers/authorAnalyzer.js';
import { renderAuthor } from '../../output/authorView.js';
import { resolveCommon, runCommand, withCommonOptions, type CommonCliOptions } from '../shared.js';

export function registerAuthorCommand(program: Command): void {
  withCommonOptions(
    program
      .command('author')
      .argument('<name>', 'author name or email to look up')
      .description('Show contribution profile for an author'),
  ).action(async (query: string, options: CommonCliOptions) => {
    const { format, analysis } = resolveCommon(options);
    await runCommand({
      format,
      startText: `Profiling ${query}...`,
      task: () => analyzeAuthor({ ...analysis, query }),
      render: renderAuthor,
    });
  });
}
