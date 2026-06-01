#!/usr/bin/env node
/**
 * Binary entry point for the `gtm` CLI.
 *
 * Owns the single top-level try/catch so that every command benefits from
 * consistent, graceful error handling: typed {@link GtmError}s map to friendly
 * messages and specific exit codes; anything else is reported without leaking
 * a raw stack trace to end users.
 *
 * @author Ivan Salo <https://github.com/isalo>
 * @license MIT
 */
import process from 'node:process';
import { buildProgram } from './program.js';
import { isGtmError, toMessage } from '../utils/errors.js';
import { log } from '../utils/logger.js';

async function main(): Promise<void> {
  const program = buildProgram();
  await program.parseAsync(process.argv);
}

main().catch((error: unknown) => {
  if (isGtmError(error)) {
    log.error(error.message);
    process.exit(error.exitCode);
  }
  log.error(toMessage(error));
  process.exit(1);
});
