# Contributing to Git Time Machine

Thanks for your interest in improving `gtm`! This guide covers the local setup
and the conventions the project follows.

## Prerequisites

- Node.js >= 18
- `git` available on your `PATH`

## Setup

```bash
npm install
```

## Everyday commands

| Command                 | What it does                      |
| ----------------------- | --------------------------------- |
| `npm run build`         | Compile TypeScript to `dist/`     |
| `npm run typecheck`     | Type-only check (no emit)         |
| `npm run lint`          | Run ESLint                        |
| `npm run lint:fix`      | Auto-fix lint issues              |
| `npm run format`        | Format the codebase with Prettier |
| `npm run format:check`  | Verify formatting (used in CI)    |
| `npm test`              | Run the unit test suite once      |
| `npm run test:watch`    | Run tests in watch mode           |
| `npm run test:coverage` | Run tests with a coverage report  |

Run the local build directly:

```bash
node dist/cli/main.js summary
```

## Architecture conventions

The codebase is layered and dependency-directed (`cli → analyzers → git`):

- **`core/git/`** is the only layer allowed to shell out to `git`.
- **`core/analyzers/`** holds pure business logic — no console or git I/O — so
  it stays unit-testable. New analyzer logic should be covered by a test under
  `test/`.
- **`output/`** renders results; renderers never call git.

Please keep these boundaries intact, favor small focused functions, and match
the existing strict-TypeScript style.

## Before opening a pull request

Make sure the full check suite passes locally:

```bash
npm run lint && npm run format:check && npm run typecheck && npm test && npm run build
```

Add or update tests for any behavior change, and add a `CHANGELOG.md` entry
under **Unreleased**.

## Commit messages

Short, imperative subject lines (e.g. "Add coupling threshold option"). Group
unrelated changes into separate commits where practical.

## License

By contributing, you agree that your contributions are licensed under the
project's [MIT License](./LICENSE).
