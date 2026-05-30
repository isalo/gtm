/**
 * Thin logging helpers.
 *
 * All human-facing chatter goes to stderr so that stdout stays clean for
 * machine-readable output (e.g. `--json` piped to another tool).
 */
import chalk from 'chalk';

export const log = {
  info(message: string): void {
    process.stderr.write(`${message}\n`);
  },
  warn(message: string): void {
    process.stderr.write(`${chalk.yellow('warn')} ${message}\n`);
  },
  error(message: string): void {
    process.stderr.write(`${chalk.red('error')} ${message}\n`);
  },
};
