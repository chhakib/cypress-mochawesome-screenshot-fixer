# cypress-mochawesome-screenshot-fixer

> Fix screenshot paths in mochawesome JSON reports merged by mochawesome-merge

A simple, zero-dependency NPM package that fixes screenshot paths in merged mochawesome JSON reports by transforming Windows-style backslashes to forward slashes.

## The Problem

When running Cypress tests in parallel (e.g., using `cypress-split`), each job generates its own JSON report and screenshots. After merging these reports with `mochawesome-merge`, the screenshot paths in the merged JSON are broken because they contain Windows-style backslashes.

This package solves this by:
1. Transforming screenshot paths from `\\spec.cy.js\\screenshot.png` to `../screenshots/spec.cy.js/screenshot.png`
2. Modifying the JSON file in-place with the corrected paths
3. Preparing the report for `mochawesome-report-generator` to generate the final HTML with working screenshots

## Installation

```bash
# Install as a dev dependency
npm install --save-dev cypress-mochawesome-screenshot-fixer

# Or install globally
npm install -g cypress-mochawesome-screenshot-fixer
```

## Quick Start

```bash
# Basic usage (uses default ../screenshots path)
npx cypress-mochawesome-screenshot-fixer cypress/report/.jsons/merged.json

# With verbose output
npx cypress-mochawesome-screenshot-fixer cypress/report/.jsons/merged.json --verbose

# Custom screenshots path
npx cypress-mochawesome-screenshot-fixer cypress/report/.jsons/merged.json --screenshotsPath ./images

# Multiple options
npx cypress-mochawesome-screenshot-fixer cypress/report/.jsons/merged.json --screenshotsPath ../custom/path --verbose
```

## Usage

### Command Line Interface (CLI)

```bash
cypress-mochawesome-screenshot-fixer <json-path> [options]
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `<json-path>` | Path to the merged JSON file | Yes |

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--screenshotsPath <path>` | Screenshots path prefix | `../screenshots` |
| `--verbose` | Enable verbose logging | `false` |
| `--debug` | Enable debug mode (very verbose) | `false` |
| `--help` | Show help message | - |
| `--version` | Show version number | - |

### Programmatic Usage (Node.js)

```javascript
const fixScreenshotPaths = require('cypress-mochawesome-screenshot-fixer');

// Basic usage (uses default ../screenshots path)
fixScreenshotPaths('cypress/report/.jsons/merged.json');

// With custom screenshots path
fixScreenshotPaths('cypress/report/.jsons/merged.json', {
  screenshotsPath: './images'
});

// With all options
fixScreenshotPaths('cypress/report/.jsons/merged.json', {
  screenshotsPath: '../custom/screenshots',
  verbose: true,
  debug: false
});
```

## Complete Workflow

Here's how to use this package in your Cypress parallel testing workflow:

```bash
# 1. Run tests in parallel (generates multiple JSON files and screenshots)
npm run test:cy:split

# 2. Merge JSON reports
npx mochawesome-merge "cypress/report/.jsons/*.json" -o cypress/report/.jsons/merged.json

# 3. Fix screenshot paths (THIS PACKAGE!)
npx cypress-mochawesome-screenshot-fixer cypress/report/.jsons/merged.json --verbose

# 4. Generate HTML report
npx mochawesome-report-generator cypress/report/.jsons/merged.json -o cypress/report
```

### Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test:cy:split": "cypress-split run",
    "test:cy:merge": "mochawesome-merge \"cypress/report/.jsons/*.json\" -o cypress/report/.jsons/merged.json",
    "test:cy:fix": "cypress-mochawesome-screenshot-fixer cypress/report/.jsons/merged.json --verbose",
    "test:cy:generate": "mochawesome-report-generator cypress/report/.jsons/merged.json -o cypress/report",
    "test:cy:report": "npm run test:cy:merge && npm run test:cy:fix && npm run test:cy:generate",
    "test:cy:full": "npm run test:cy:split && npm run test:cy:report"
  }
}
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run Cypress Tests (Parallel)
  run: npm run test:cy:split

- name: Merge JSON Reports
  if: always()
  run: npx mochawesome-merge "cypress/report/.jsons/*.json" -o cypress/report/.jsons/merged.json

- name: Fix Screenshot Paths
  if: always()
  run: npx cypress-mochawesome-screenshot-fixer cypress/report/.jsons/merged.json

- name: Generate HTML Report
  if: always()
  run: npx mochawesome-report-generator cypress/report/.jsons/merged.json -o cypress/report

- name: Upload Report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: cypress-report
    path: cypress/report
```

### GitLab CI

```yaml
test:
  script:
    - npm run test:cy:split
  after_script:
    - npx mochawesome-merge "cypress/report/.jsons/*.json" -o cypress/report/.jsons/merged.json
    - npx cypress-mochawesome-screenshot-fixer cypress/report/.jsons/merged.json --verbose
    - npx mochawesome-report-generator cypress/report/.jsons/merged.json -o cypress/report
  artifacts:
    when: always
    paths:
      - cypress/report
```

## How It Works

### Input (Before)

The merged JSON contains screenshot paths with Windows-style backslashes:

```json
{
  "tests": [
    {
      "title": "Template spec -- passes",
      "context": "{\"title\":\"cypress-mochawesome-reporter-screenshots\",\"value\":[[\"\\\\spec.cy.js\\\\screenshot.png\"]]}"
    }
  ]
}
```

### Output (After)

The package transforms these paths in the JSON:

```json
{
  "tests": [
    {
      "title": "Template spec -- passes",
      "context": "{\"title\":\"cypress-mochawesome-reporter-screenshots\",\"value\":[[\"../screenshots/spec.cy.js/screenshot.png\"]]}"
    }
  ]
}
```

### File Operations

```
Before:
├─ cypress/screenshots/spec.cy.js/screenshot.png (exists)
└─ cypress/report/.jsons/merged.json (broken paths with backslashes)

After:
├─ cypress/screenshots/spec.cy.js/screenshot.png (unchanged)
└─ cypress/report/.jsons/merged.json (fixed paths with forward slashes)
```

**Note:** This package only modifies the JSON file. Your screenshots must already be in the `cypress/screenshots/` directory. The HTML report generator will reference them from there using the relative path `../screenshots/` (or your custom path).

## Custom Screenshots Path

By default, the package transforms paths to use `../screenshots/` as the prefix. You can customize this using the `--screenshotsPath` option:

```bash
# Default behavior
cypress-mochawesome-screenshot-fixer merged.json
# Result: ../screenshots/spec.cy.js/screenshot.png

# Custom path (relative)
cypress-mochawesome-screenshot-fixer merged.json --screenshotsPath ./images
# Result: ./images/spec.cy.js/screenshot.png

# Custom path (absolute or different relative)
cypress-mochawesome-screenshot-fixer merged.json --screenshotsPath /var/www/screenshots
# Result: /var/www/screenshots/spec.cy.js/screenshot.png
```

**Use Cases:**
- Different directory structure in your project
- Multiple report outputs with different paths
- Custom CI/CD configurations

## Path Transformation Details

The package performs the following transformation:

```
Original (in context):  \\spec.cy.js\\template spec -- passes (failed).png
                       ↓ (remove leading backslashes)
Step 1:                spec.cy.js\\template spec -- passes (failed).png
                       ↓ (replace \\ with /)
Step 2:                spec.cy.js/template spec -- passes (failed).png
                       ↓ (add ../screenshots/ prefix)
Final:                 ../screenshots/spec.cy.js/template spec -- passes (failed).png
```

## Troubleshooting

### Screenshots not appearing in HTML report

Make sure you run the commands in the correct order:
1. Merge JSON files
2. Fix screenshot paths (this package)
3. Generate HTML report

### Permission errors when modifying JSON

Make sure the process has write permissions to the JSON file. In CI/CD, this is usually not an issue.

### JSON parsing errors

Make sure your JSON file is valid and was generated by mochawesome-merge. You can validate it with:

```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('merged.json', 'utf8')))"
```

## Requirements

- Node.js >= 12.0.0
- No external dependencies (uses only Node.js built-ins: `fs`, `path`)

## Features

- Zero external dependencies
- Fast and lightweight
- Works with any mochawesome-merge output
- Handles nested test suites
- Graceful error handling
- Verbose and debug logging modes
- Compatible with Windows, macOS, and Linux
- CI/CD friendly

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions:
- Open an issue on [GitHub](https://github.com/chhakib/cypress-mochawesome-screenshot-fixer/issues)
- Check the [troubleshooting section](#troubleshooting) above

## Related Packages

- [mochawesome](https://www.npmjs.com/package/mochawesome) - Awesome test reporter for Mocha
- [mochawesome-merge](https://www.npmjs.com/package/mochawesome-merge) - Merge multiple mochawesome JSON reports
- [mochawesome-report-generator](https://www.npmjs.com/package/mochawesome-report-generator) - Generate HTML reports from mochawesome JSON
- [cypress-split](https://github.com/bahmutov/cypress-split) - Split Cypress tests for parallel execution

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.
