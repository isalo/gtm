# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- ESLint (flat config) + Prettier with `lint`, `lint:fix`, `format`, and
  `format:check` npm scripts.
- Vitest unit test suite covering analyzers, churn scoring, git output parsing,
  identity grouping, activity bucketing, and output formatting.
- `.editorconfig` for consistent editor defaults.
- `CONTRIBUTING.md` and this `CHANGELOG.md`.

### Changed

- CI now lints, checks formatting, type-checks, tests, and builds across
  Node 18, 20, and 22. The publish workflow also lints and tests before release.

## [0.1.0]

### Added

- Initial release with `summary`, `hotspots`, `explain`, `timeline`, `author`,
  `coupling`, `bus-factor`, `activity`, and `report` commands.
- `--json` output for every command and a self-contained HTML report renderer.

[Unreleased]: https://github.com/isalo/gtm/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/isalo/gtm/releases/tag/v0.1.0
