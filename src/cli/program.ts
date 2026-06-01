/**
 * Commander program assembly.
 *
 * Defines global options shared by all commands and registers each command
 * module. Kept separate from the bin entry so it can be imported by tests.
 */
import { Command } from 'commander';
import { registerSummaryCommand } from './commands/summary.js';
import { registerHotspotsCommand } from './commands/hotspots.js';
import { registerExplainCommand } from './commands/explain.js';
import { registerTimelineCommand } from './commands/timeline.js';
import { registerAuthorCommand } from './commands/author.js';
import { registerReportCommand } from './commands/report.js';
import { registerCouplingCommand } from './commands/coupling.js';
import { registerBusFactorCommand } from './commands/busFactor.js';
import { registerActivityCommand } from './commands/activity.js';

export const VERSION = '0.1.0';

export function buildProgram(): Command {
  const program = new Command();

  program
    .name('gtm')
    .description('Git Time Machine — understand why code is the way it is.')
    .version(VERSION, '-v, --version', 'output the current version');

  // Common options (--json, --repo, --max, --since) are attached per-command
  // via `withCommonOptions` so they can be placed after the subcommand.
  registerSummaryCommand(program);
  registerHotspotsCommand(program);
  registerExplainCommand(program);
  registerTimelineCommand(program);
  registerAuthorCommand(program);
  registerCouplingCommand(program);
  registerBusFactorCommand(program);
  registerActivityCommand(program);
  registerReportCommand(program);

  return program;
}
