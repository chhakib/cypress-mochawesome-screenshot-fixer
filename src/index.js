const fs = require('fs');

/**
 * Main function to fix screenshot paths in merged mochawesome JSON
 * Transforms paths from backslashes to forward slashes and adds custom prefix
 * @param {string} jsonPath - Path to the merged JSON file
 * @param {object} options - Configuration options
 * @param {string} options.screenshotsPath - Screenshots path prefix (default: ../screenshots)
 * @param {boolean} options.verbose - Verbose logging (default: false)
 * @param {boolean} options.debug - Debug mode (default: false)
 */
function fixScreenshotPaths(jsonPath, options = {}) {
  // Default options
  const config = {
    screenshotsPath: options.screenshotsPath || '../screenshots',
    verbose: options.verbose || false,
    debug: options.debug || false
  };

  // Statistics
  const stats = {
    testsProcessed: 0,
    screenshotsProcessed: 0,
    errors: []
  };

  try {
    // Step 1: Read and parse JSON file
    if (config.verbose) {
      console.log(`Reading JSON file: ${jsonPath}`);
    }

    if (!fs.existsSync(jsonPath)) {
      throw new Error(`JSON file not found: ${jsonPath}`);
    }

    // Read file as buffer to detect encoding
    const buffer = fs.readFileSync(jsonPath);
    let jsonContent;

    // Detect BOM and encoding
    if (buffer.length >= 2) {
      // Check for UTF-16 LE BOM (FF FE)
      if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
        if (config.verbose) {
          console.log('Detected UTF-16 LE encoding with BOM');
        }
        jsonContent = buffer.toString('utf16le').replace(/^\uFEFF/, ''); // Remove BOM
      }
      // Check for UTF-16 BE BOM (FE FF)
      else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
        if (config.verbose) {
          console.log('Detected UTF-16 BE encoding with BOM');
        }
        // Convert from BE to LE
        const leBuffer = Buffer.alloc(buffer.length);
        for (let i = 0; i < buffer.length; i += 2) {
          leBuffer[i] = buffer[i + 1];
          leBuffer[i + 1] = buffer[i];
        }
        jsonContent = leBuffer.toString('utf16le').replace(/^\uFEFF/, '');
      }
      // Check for UTF-8 BOM (EF BB BF)
      else if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        if (config.verbose) {
          console.log('Detected UTF-8 encoding with BOM');
        }
        jsonContent = buffer.toString('utf8').replace(/^\uFEFF/, ''); // Remove BOM
      }
      // No BOM, assume UTF-8
      else {
        jsonContent = buffer.toString('utf8');
      }
    } else {
      jsonContent = buffer.toString('utf8');
    }

    let reportData;

    try {
      reportData = JSON.parse(jsonContent);
    } catch (parseError) {
      throw new Error(`Invalid JSON file: ${parseError.message}`);
    }

    // Step 2: Validate structure
    if (!reportData.results || !Array.isArray(reportData.results)) {
      console.warn('Warning: No results array found in JSON. Exiting.');
      return stats;
    }

    // Step 3: Process all tests
    if (config.verbose) {
      console.log('Processing tests and fixing screenshot paths...');
    }

    reportData.results.forEach(result => {
      if (result.suites && Array.isArray(result.suites)) {
        processSuites(result.suites, config, stats);
      }
    });

    // Step 4: Rewrite JSON file
    if (config.verbose) {
      console.log(`Rewriting JSON file: ${jsonPath}`);
    }

    fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2), 'utf8');

    // Step 5: Print summary
    printSummary(stats, config);

    return stats;

  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error;
  }
}

/**
 * Recursively process suites to find and fix tests
 * @param {Array} suites - Array of test suites
 * @param {object} config - Configuration object
 * @param {object} stats - Statistics object
 */
function processSuites(suites, config, stats) {
  suites.forEach(suite => {
    // Process tests in this suite
    if (suite.tests && Array.isArray(suite.tests)) {
      suite.tests.forEach(test => {
        processTest(test, config, stats);
      });
    }

    // Process nested suites recursively
    if (suite.suites && Array.isArray(suite.suites)) {
      processSuites(suite.suites, config, stats);
    }
  });
}

/**
 * Process a single test to fix screenshot paths
 * @param {object} test - Test object
 * @param {object} config - Configuration object
 * @param {object} stats - Statistics object
 */
function processTest(test, config, stats) {
  stats.testsProcessed++;

  // Check if test has context
  if (!test.context || typeof test.context !== 'string') {
    return;
  }

  try {
    // Parse the JSON-encoded context
    const contextObj = JSON.parse(test.context);

    if (config.debug) {
      console.log(`\nProcessing test: ${test.title}`);
      console.log(`Context before: ${test.context}`);
    }

    // Check if context has the expected structure
    if (!contextObj.value || !Array.isArray(contextObj.value)) {
      return;
    }

    // Process screenshot paths in context.value
    let modified = false;

    contextObj.value.forEach((valueArray, arrayIndex) => {
      if (Array.isArray(valueArray)) {
        valueArray.forEach((screenshotPath, pathIndex) => {
          if (typeof screenshotPath === 'string' && screenshotPath.includes('\\')) {
            // This is a screenshot path that needs fixing
            const fixedPath = fixScreenshotPath(screenshotPath, config);

            if (fixedPath !== screenshotPath) {
              contextObj.value[arrayIndex][pathIndex] = fixedPath;
              modified = true;
              stats.screenshotsProcessed++;

              if (config.verbose) {
                console.log(`  Fixed: ${screenshotPath} -> ${fixedPath}`);
              }
            }
          }
        });
      }
    });

    // Update the test context if modified
    if (modified) {
      test.context = JSON.stringify(contextObj);

      if (config.debug) {
        console.log(`Context after: ${test.context}`);
      }
    }

  } catch (parseError) {
    if (config.debug) {
      console.warn(`Warning: Could not parse context for test "${test.title}": ${parseError.message}`);
    }
    stats.errors.push(`Failed to parse context for test "${test.title}"`);
  }
}

/**
 * Fix a single screenshot path (transform only, no file copy)
 * @param {string} screenshotPath - Original path with backslashes
 * @param {object} config - Configuration object
 * @returns {string} Fixed path with forward slashes and custom prefix
 */
function fixScreenshotPath(screenshotPath, config) {
  // Step 1: Remove leading backslashes and normalize path
  // Original: "\\spec.cy.js\\template spec -- passes (failed).png"
  let normalizedPath = screenshotPath.replace(/^\\+/, ''); // Remove leading backslashes
  normalizedPath = normalizedPath.replace(/\\/g, '/'); // Replace all backslashes with forward slashes

  if (config.debug) {
    console.log(`    Original path: ${screenshotPath}`);
    console.log(`    Normalized path: ${normalizedPath}`);
  }

  // Step 2: Add the custom screenshots prefix
  const fixedPath = `${config.screenshotsPath}/${normalizedPath}`;

  if (config.debug) {
    console.log(`    Screenshots path prefix: ${config.screenshotsPath}`);
    console.log(`    Fixed path: ${fixedPath}`);
  }

  return fixedPath;
}

/**
 * Print summary of operations
 * @param {object} stats - Statistics object
 * @param {object} config - Configuration object
 */
function printSummary(stats, config) {
  console.log('\n=== Summary ===');
  console.log(`Tests processed: ${stats.testsProcessed}`);
  console.log(`Screenshots paths fixed: ${stats.screenshotsProcessed}`);

  if (stats.errors.length > 0 && config.verbose) {
    console.log('\nWarnings/Errors:');
    stats.errors.forEach(error => {
      console.log(`  - ${error}`);
    });
  }

  console.log('\nDone!');
}

module.exports = fixScreenshotPaths;
