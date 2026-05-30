/**
 * Typed error hierarchy for predictable, graceful failure handling.
 *
 * Commands throw these; the CLI top-level handler maps them to friendly
 * messages and exit codes instead of dumping stack traces on users.
 */

export class GtmError extends Error {
  /** Process exit code associated with this error category. */
  readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = new.target.name;
    this.exitCode = exitCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Raised when the target directory is not a git repository. */
export class NotAGitRepoError extends GtmError {
  constructor(path: string) {
    super(`'${path}' is not a git repository (or git is not installed).`, 2);
  }
}

/** Raised when the `git` executable cannot be found on the system. */
export class GitNotFoundError extends GtmError {
  constructor() {
    super('Could not find the "git" executable. Please install git and ensure it is on your PATH.', 127);
  }
}

/** Raised when a requested file/path does not exist in history. */
export class PathNotFoundError extends GtmError {
  constructor(path: string) {
    super(`No history found for path '${path}'.`, 3);
  }
}

/** Raised when user input (flags/args) is invalid. */
export class InvalidInputError extends GtmError {
  constructor(message: string) {
    super(message, 4);
  }
}

/** Type guard for our error hierarchy. */
export function isGtmError(error: unknown): error is GtmError {
  return error instanceof GtmError;
}

/** Best-effort extraction of a human-readable message from any thrown value. */
export function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error);
}
