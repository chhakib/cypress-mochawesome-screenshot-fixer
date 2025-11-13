# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2025-11-13

### Added
- New `--keepLastOnly` option to keep only the last screenshot when multiple are detected (useful for Cypress retry screenshots)
- When enabled, removes all screenshots except the last one in each test's context array

### Fixed
- Fixed ReferenceError crash in CLI when `options` was accessed before being defined in error handler
- Improved BOM (Byte Order Mark) handling for UTF-16 and UTF-8 encoded files
- Fixed parsing errors with UTF-16 LE/BE files by properly skipping BOM bytes before conversion
- Enhanced error messages to show file preview when JSON parsing fails

### Changed
- Improved encoding detection to use `buffer.slice()` for cleaner BOM removal
- Better error handling with more informative error messages

## [1.0.2] - 2025-11-09

### Fixed
- Fixed detection of screenshot paths starting with forward slash `/` (previously only detected backslashes `\`)
- Screenshot paths now correctly processed whether they start with `/` or `\`

### Changed
- Updated path detection logic to handle both Windows-style (`\`) and Unix-style (`/`) leading separators

## [1.0.1] - 2025-11-09

### Fixed
- Fixed scope error with `options` variable in CLI error handling that caused crashes when JSON parsing failed
- Added support for JSON files encoded in UTF-16 (both Little Endian and Big Endian) with BOM
- Added automatic BOM detection and removal for UTF-8, UTF-16 LE, and UTF-16 BE encoded files
- Improved error messages when JSON parsing fails

### Changed
- JSON files are now automatically converted to UTF-8 encoding when saved (normalized output)
- Enhanced verbose mode to display detected file encoding

## [1.0.0] - 2025-11-09

### Added
- Initial release of cypress-mochawesome-screenshot-fixer
- CLI interface for fixing screenshot paths in merged mochawesome JSON reports
- Programmatic API for Node.js integration
- Screenshot path transformation from Windows backslashes to forward slashes
- Support for nested test suites
- Verbose logging mode (`--verbose` flag)
- Debug logging mode (`--debug` flag)
- Zero external dependencies (uses only Node.js built-ins)
- Comprehensive error handling and validation
- Statistics reporting (tests processed, screenshots paths fixed)
- CI/CD integration examples for GitHub Actions and GitLab CI
- Complete documentation with usage examples

### Features
- Parses merged mochawesome JSON reports
- Fixes screenshot paths in JSON-encoded context fields
- Transforms `\\spec.cy.js\\screenshot.png` to `../screenshots/spec.cy.js/screenshot.png`
- Modifies JSON files in-place (no file copying)
- Production-ready with proper error handling
- Simple and focused: does one thing well

### Documentation
- Comprehensive README with installation, usage, and troubleshooting
- CLI help command (`--help`)
- Programmatic usage examples
- CI/CD integration guides
- MIT License

[1.0.3]: https://github.com/chhakib/cypress-mochawesome-screenshot-fixer/releases/tag/v1.0.3
[1.0.2]: https://github.com/chhakib/cypress-mochawesome-screenshot-fixer/releases/tag/v1.0.2
[1.0.1]: https://github.com/chhakib/cypress-mochawesome-screenshot-fixer/releases/tag/v1.0.1
[1.0.0]: https://github.com/chhakib/cypress-mochawesome-screenshot-fixer/releases/tag/v1.0.0
