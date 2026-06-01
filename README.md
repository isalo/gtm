# Git Time Machine (`gtm`)

[![npm version](https://img.shields.io/npm/v/@isalo/gtm.svg)](https://www.npmjs.com/package/@isalo/gtm)
[![npm downloads](https://img.shields.io/npm/dm/@isalo/gtm.svg)](https://www.npmjs.com/package/@isalo/gtm)
[![CI](https://github.com/isalo/gtm/actions/workflows/ci.yml/badge.svg)](https://github.com/isalo/gtm/actions/workflows/ci.yml)
[![Publish](https://github.com/isalo/gtm/actions/workflows/publish.yml/badge.svg)](https://github.com/isalo/gtm/actions/workflows/publish.yml)
[![provenance](https://img.shields.io/badge/npm-provenance-blue?logo=npm)](https://www.npmjs.com/package/@isalo/gtm)
[![license](https://img.shields.io/npm/l/@isalo/gtm.svg)](./LICENSE)
[![node](https://img.shields.io/node/v/@isalo/gtm.svg)](https://nodejs.org)

> Analyze Git history to understand **why** code is the way it is.

`git log` and `git blame` show raw data but rarely the _story_. Git Time Machine
summarizes repository history, finds risky files, explains a file's evolution,
and reveals who owns which parts of the codebase — perfect for onboarding into
legacy projects.

## Install / Run

No install needed — run via `npx`:

```bash
npx @isalo/gtm summary
```

Or install globally:

```bash
npm install -g @isalo/gtm
gtm summary
```

## Commands

| Command               | Status       | Description                                                                  |
| --------------------- | ------------ | ---------------------------------------------------------------------------- |
| `gtm summary`         | ✅ available | High-level overview: commits, authors, age, top contributors, recent commits |
| `gtm hotspots`        | ✅ available | List risky, frequently-changed files (ranked by churn + author spread)       |
| `gtm explain <path>`  | ✅ available | Summarize the history and ownership of a path                                |
| `gtm timeline <path>` | ✅ available | Chronological change timeline for a path                                     |
| `gtm author <name>`   | ✅ available | Contribution profile for an author (matched by name or email)                |
| `gtm coupling`        | ✅ available | Files that frequently change together (temporal coupling)                    |
| `gtm bus-factor`      | ✅ available | Files dominated by a single author (knowledge silos)                         |
| `gtm activity`        | ✅ available | Commit cadence: weekday/hour heatmap + monthly trend                         |
| `gtm report`          | ✅ available | Self-contained HTML dashboard (all of the above combined)                    |

Per-command extras:

- `gtm hotspots` — `-t, --top <count>` (default 20)
- `gtm coupling` — `-t, --top <count>` (default 20), `-m, --min-shared <count>` (default 3)
- `gtm bus-factor` — `-t, --top <count>` (default 20), `--threshold <0-100>` (default 80)
- `gtm report` — `-o, --output <file>` (default `gtm-report.html`), `-t, --top <count>`

## Global options

Every command supports:

| Flag                | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| `--json`            | Output machine-readable JSON (for scripts / CI / future AI) |
| `-r, --repo <path>` | Target repository (default: current directory)              |
| `-n, --max <count>` | Limit analysis to the last N commits                        |
| `--since <date>`    | Only include commits since a git-parseable date             |

### Examples

```bash
gtm summary                       # overview of the current repo
gtm summary --repo ../other-repo  # overview of another repo
gtm summary --json                # JSON output for tooling
gtm summary --since "3 months ago"

gtm hotspots --top 10             # 10 riskiest files
gtm explain src/app/index.ts      # history + ownership of a file
gtm timeline src/app/index.ts     # chronological change timeline
gtm author "Jane"                 # contribution profile (name or email)
gtm coupling --top 15             # files that change together
gtm bus-factor --threshold 90     # files >=90% owned by one author
gtm activity                      # commit cadence heatmap + trend
gtm report -o report.html         # self-contained HTML dashboard
gtm report --json                 # combined dataset as JSON (for CI/AI)
```

## Architecture

Clean, layered, and dependency-directed (`cli → analyzers → git`):

```
src/
  index.ts            # programmatic library entry
  cli/                # commander wiring + thin command adapters
    main.ts           # bin entry, single top-level error handler
    program.ts        # global options + command registration
    shared.ts         # option parsing, spinner, output dispatch
    commands/         # one file per command
  core/
    git/              # the only layer that talks to `git` (execa)
    analyzers/        # pure business logic, unit-testable, no I/O
    models/           # typed domain models (the stable contract)
  output/             # renderers (text/json today; html/ai later)
  utils/              # typed errors, logging
```

### Design principles

- **Strict TypeScript** (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- **Separation of concerns**: analyzers never print; renderers never call git.
- **Graceful errors**: typed `GtmError` hierarchy → friendly messages + exit codes.
- **Cross-platform**: pure `git` CLI via `execa`, locale-pinned output.
- **Extensible**: `--json` everywhere; the same core powers future HTML reports,
  AI summaries, a local cache, and GitHub Actions.

## Roadmap

- [x] `summary`, `hotspots`, `explain`, `timeline`, `author` commands
- [x] `coupling`, `bus-factor`, `activity` commands
- [x] HTML report renderer (`gtm report`)
- [ ] AI-assisted summaries (opt-in, no API required for core features)
- [ ] Local SQLite cache for large repositories
- [ ] GitHub Actions integration

## Development

```bash
npm install
npm run build        # compile to dist/
npm run typecheck    # type-only check
npm run lint         # eslint
npm run format       # prettier --write
npm test             # run the vitest suite
node dist/cli/main.js summary
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for conventions and the full check
suite, and [CHANGELOG.md](./CHANGELOG.md) for release notes.

## Author

Created and maintained by **Ivan Salo** ([@isalo](https://github.com/isalo)).

## License

[MIT](./LICENSE) © Ivan Salo
