#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fixScreenshotPaths = require('../src/index.js');

// Package version
const packageJson = require('../package.json');
const VERSION = packageJson.version;

/**
 * Display help message
 */
function showHelp() {
  console.log(`
cypress-mochawesome-screenshot-fixer v${VERSION}

Fix screenshot paths in mochawesome JSON reports merged by mochawesome-merge

Usage:
  cypress-mochawesome-screenshot-fixer <json-path> [options]

Arguments:
  <json-path>              Path to the merged JSON file (required)

Options:
  --screenshotsPath <path> Screenshots path prefix (default: ../screenshots)
  --verbose                Enable verbose logging
  --debug                  Enable debug mode (very verbose)
  --help                   Show this help message
  --version                Show version number

Examples:
  cypress-mochawesome-screenshot-fixer cypress/report/.jsons/merged.json
  cypress-mochawesome-screenshot-fixer merged.json --verbose
  cypress-mochawesome-screenshot-fixer merged.json --screenshotsPath ./images
  cypress-mochawesome-screenshot-fixer merged.json --screenshotsPath ../custom/path --verbose

Documentation:
  https://github.com/chhakib/cypress-mochawesome-screenshot-fixer
`);
}

/**
 * Display version
 */
function showVersion() {
  console.log(`cypress-mochawesome-screenshot-fixer v${VERSION}`);
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  // Check for help or version flags
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    showVersion();
    process.exit(0);
  }

  // Get JSON path (first non-flag argument)
  const jsonPath = args.find(arg => !arg.startsWith('--'));

  if (!jsonPath) {
    console.error('Error: JSON file path is required\n');
    showHelp();
    process.exit(1);
  }

  // Parse options
  const options = {
    verbose: args.includes('--verbose'),
    debug: args.includes('--debug')
  };

  // Parse --screenshotsPath
  const screenshotsPathIndex = args.indexOf('--screenshotsPath');
  if (screenshotsPathIndex !== -1 && args[screenshotsPathIndex + 1]) {
    options.screenshotsPath = args[screenshotsPathIndex + 1];
  }

  return { jsonPath, options };
}

/**
 * Main CLI function
 */
function main() {
  let options;

  try {
    // Parse arguments
    const parsed = parseArgs();
    options = parsed.options;
    const jsonPath = parsed.jsonPath;

    // Display configuration if verbose
    if (options.verbose) {
      console.log('Configuration:');
      console.log(`  JSON file: ${jsonPath}`);
      console.log(`  Screenshots path: ${options.screenshotsPath || '../screenshots'}`);
      console.log('');
    }

    // Run the fixer
    const stats = fixScreenshotPaths(jsonPath, options);

    // Exit with appropriate code
    if (stats.errors && stats.errors.length > 0) {
      process.exit(0); // Exit with success even with warnings
    } else {
      process.exit(0);
    }

  } catch (error) {
    console.error(`\nFatal error: ${error.message}`);

    if (options && options.debug) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    process.exit(1);
  }
}

// Run CLI
main();
