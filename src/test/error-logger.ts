import * as fs from 'fs';
import * as path from 'path';

/**
 * Structure for error information
 */
export interface ErrorInfo {
  componentName: string;
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  errorLocation?: string;
  testName: string;
}

/**
 * Structure for accessibility issues
 */
export interface AccessibilityIssue {
  componentName: string;
  issueType: string;
  element: string;
  suggestion: string;
}

// Store all errors to be written to a single summary file
const allErrors: Record<string, ErrorInfo[]> = {};
const allAccessibilityIssues: Record<string, AccessibilityIssue[]> = {};

// List of error patterns to ignore in the final report
const ignoredErrorPatterns = [];

/**
 * Checks if an error should be ignored in the report
 */
function shouldIgnoreError(error: ErrorInfo): boolean {
  // // Check if the component itself is AI SDK related
  // if (error.componentName === 'AiTest' || error.componentName.includes('AiSdk')) {
  //   return true;
  // }

  // Check if error message matches any of the ignored patterns
  return ignoredErrorPatterns.some(
    (pattern) =>
      error.errorMessage.includes(pattern) ||
      (error.errorStack && error.errorStack.includes(pattern)),
  );
}

/**
 * Creates the logs directory if it doesn't exist
 */
function ensureLogDirectory(): string {
  const logDir = path.resolve(process.cwd(), 'dist/logs');
  if (!fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
    fs.mkdirSync(path.resolve(process.cwd(), 'dist'));
  }
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  return logDir;
}

/**
 * Formats error instructions based on error type
 */
function getFixInstructions(error: ErrorInfo): string {
  // Special handling for import/dependency errors
  if (
    error.errorMessage.includes('Failed to resolve import') ||
    error.errorMessage.includes('Cannot find module')
  ) {
    // Extract the import name using regex
    const importMatch = error.errorMessage.match(
      /Failed to resolve import ["'](.+?)["']|Cannot find module ["'](.+?)["']/,
    );
    const missingImport = importMatch
      ? importMatch[1] || importMatch[2]
      : 'unknown module';

    return `
- Missing import: \`${missingImport}\`
- Ensure the dependency is properly installed or linked
- Run \`npm install\` or \`npm link ${missingImport}\` to resolve
- Check if the import path is correct`;
  }

  if (
    error.errorMessage.includes('undefined') ||
    error.errorMessage.includes('null')
  ) {
    return `
- Add null checks before accessing properties
- Use optional chaining: \`user?.name\` instead of \`user.name\`
- Provide default values: \`user?.name || 'No name'\`
- Add conditional rendering: \`{user && <Component user={user} />}\``;
  }

  if (error.errorMessage.includes('is not a function')) {
    return `
- Check if the method exists before calling it
- Ensure the object is properly initialized
- Use optional chaining for method calls: \`obj?.method?()\``;
  }

  if (error.testName.includes('Accessibility')) {
    return `
- Ensure all images have alt text
- Add labels to all form inputs
- Use semantic HTML elements
- Check ARIA attributes`;
  }

  // Generic instructions for other errors
  return `
- Review the error message and stack trace
- Check for undefined/null values
- Implement proper error handling
- Consider adding try/catch blocks for risky operations`;
}

/**
 * Generates a summary of all errors
 */
function generateErrorSummary(): string {
  // Filter out errors related to AI SDK modules
  const filteredErrors: Record<string, ErrorInfo[]> = {};
  Object.entries(allErrors).forEach(([componentName, errors]) => {
    const relevantErrors = errors.filter((error) => !shouldIgnoreError(error));
    if (relevantErrors.length > 0) {
      filteredErrors[componentName] = relevantErrors;
    }
  });

  let summary = '# React Component Error Summary\n\n';

  // Quick summary section at the top (with filtered counts)
  const errorCount = Object.values(filteredErrors).reduce(
    (sum, errors) => sum + errors.length,
    0,
  );
  const issueCount = Object.values(allAccessibilityIssues).reduce(
    (sum, issues) => sum + issues.length,
    0,
  );
  const componentCount = new Set([
    ...Object.keys(filteredErrors),
    ...Object.keys(allAccessibilityIssues),
  ]).size;

  summary += '## Overview\n\n';
  summary += `- **Total Components with Issues**: ${componentCount}\n`;
  summary += `- **Total Rendering Errors**: ${errorCount}\n`;
  summary += `- **Total Accessibility Issues**: ${issueCount}\n\n`;

  // Add errors by component (filtered)
  if (Object.keys(filteredErrors).length > 0) {
    summary += '## Rendering Errors\n\n';

    Object.entries(filteredErrors).forEach(([componentName, errors]) => {
      summary += `### ${componentName}\n\n`;

      errors.forEach((error, index) => {
        summary += `#### Error ${index + 1}: ${error.errorType}\n`;
        summary += `- **Message**: ${error.errorMessage}\n`;
        summary += `- **Test**: ${error.testName}\n`;
        if (error.errorLocation) {
          summary += `- **Location**: ${error.errorLocation}\n`;
        }

        summary += '\n**Instructions to fix:**\n';
        summary += getFixInstructions(error);
        summary += '\n\n';
      });
    });
  } else {
    summary += '## Rendering Errors\n\n';
    summary += 'No rendering errors detected.\n\n';
  }

  // Add accessibility issues by component
  if (Object.keys(allAccessibilityIssues).length > 0) {
    summary += '## Accessibility Issues\n\n';

    Object.entries(allAccessibilityIssues).forEach(
      ([componentName, issues]) => {
        summary += `### ${componentName}\n\n`;

        // Group issues by type
        const issuesByType: Record<string, AccessibilityIssue[]> = {};
        issues.forEach((issue) => {
          if (!issuesByType[issue.issueType]) {
            issuesByType[issue.issueType] = [];
          }
          issuesByType[issue.issueType].push(issue);
        });

        Object.entries(issuesByType).forEach(([issueType, typeIssues]) => {
          summary += `#### ${issueType}\n\n`;

          typeIssues.forEach((issue) => {
            summary += `- **Element**: ${issue.element}\n`;
          });

          summary += '\n**How to fix:**\n';
          summary += `- ${typeIssues[0].suggestion}\n\n`;
        });
      },
    );
  }

  // Concise error summary at the end (filtered)
  if (errorCount > 0 || issueCount > 0) {
    summary += '## Error Summary\n\n';
    summary += '| Component | Error Type | Count | Common Fix |\n';
    summary += '|-----------|------------|-------|------------|\n';

    // Group rendering errors by type for each component
    Object.entries(filteredErrors).forEach(([componentName, errors]) => {
      const errorsByType: Record<string, ErrorInfo[]> = {};
      errors.forEach((error) => {
        const errorType = error.errorType;
        if (!errorsByType[errorType]) {
          errorsByType[errorType] = [];
        }
        errorsByType[errorType].push(error);
      });

      Object.entries(errorsByType).forEach(([errorType, typeErrors]) => {
        const mostCommonError = typeErrors[0];
        const fixSummary = getFixSummary(mostCommonError);
        summary += `| ${componentName} | ${errorType} | ${typeErrors.length} | ${fixSummary} |\n`;
      });
    });

    // Group accessibility issues by type for each component
    Object.entries(allAccessibilityIssues).forEach(
      ([componentName, issues]) => {
        const issuesByType: Record<string, AccessibilityIssue[]> = {};
        issues.forEach((issue) => {
          if (!issuesByType[issue.issueType]) {
            issuesByType[issue.issueType] = [];
          }
          issuesByType[issue.issueType].push(issue);
        });

        Object.entries(issuesByType).forEach(([issueType, typeIssues]) => {
          summary += `| ${componentName} | ${issueType} | ${typeIssues.length} | ${typeIssues[0].suggestion} |\n`;
        });
      },
    );

    summary += '\n';
  }

  summary += '## Common Fixes for React Components\n\n';

  summary += '### Handling Undefined/Null Values\n\n';
  summary += '```tsx\n';
  summary +=
    '// Instead of directly accessing potentially undefined properties:\n';
  summary += 'return <p>{user.name}</p>;\n\n';
  summary += '// Use conditional rendering:\n';
  summary += 'return user ? <p>{user.name}</p> : <p>No user available</p>;\n\n';
  summary += '// Or use optional chaining with fallbacks:\n';
  summary += "return <p>{user?.name || 'No name available'}</p>;\n";
  summary += '```\n\n';

  summary += '### Handling Loading States\n\n';
  summary += '```tsx\n';
  summary += 'const [isLoading, setIsLoading] = useState(true);\n';
  summary += 'const [data, setData] = useState<DataType | null>(null);\n\n';
  summary += '// In your component:\n';
  summary += 'if (isLoading) return <p>Loading...</p>;\n';
  summary += 'if (!data) return <p>No data available</p>;\n\n';
  summary += '// Then safely use data\n';
  summary += 'return <Component data={data} />;\n';
  summary += '```\n\n';

  summary += '### Accessibility Best Practices\n\n';
  summary += '```tsx\n';
  summary += '// Always add alt text to images\n';
  summary += '<img src="image.jpg" alt="Description of image" />\n\n';
  summary += '// Always label form elements\n';
  summary += '<label htmlFor="email">Email</label>\n';
  summary += '<input id="email" type="email" />\n\n';
  summary += '// Or use aria-label\n';
  summary += '<input type="email" aria-label="Email" />\n';
  summary += '```\n';

  return summary;
}

/**
 * Get a one-line summary of the fix for an error
 */
function getFixSummary(error: ErrorInfo): string {
  if (
    error.errorMessage.includes('Failed to resolve import') ||
    error.errorMessage.includes('Cannot find module')
  ) {
    // Extract the import name using regex
    const importMatch = error.errorMessage.match(
      /Failed to resolve import ["'](.+?)["']|Cannot find module ["'](.+?)["']/,
    );
    const missingImport = importMatch
      ? importMatch[1] || importMatch[2]
      : 'unknown module';
    return `Install/link missing dependency: ${missingImport}`;
  }

  if (
    error.errorMessage.includes('undefined') ||
    error.errorMessage.includes('null')
  ) {
    return 'Add null checks or optional chaining';
  }

  if (error.errorMessage.includes('is not a function')) {
    return 'Check method exists before calling';
  }

  if (error.testName.includes('Accessibility')) {
    return 'Fix accessibility attributes';
  }

  return 'Proper error handling';
}

/**
 * Logs a rendering error for the summary
 */
export function logRenderError(error: ErrorInfo): void {
  console.log('[DEBUG] logRenderError called with:', JSON.stringify(error));

  if (!allErrors[error.componentName]) {
    allErrors[error.componentName] = [];
  }

  // Check if this exact error has already been logged for this component
  const isDuplicate = allErrors[error.componentName].some(
    (existingError) =>
      existingError.errorMessage === error.errorMessage &&
      existingError.errorLocation === error.errorLocation,
  );

  // Only add the error if it's not a duplicate
  if (!isDuplicate) {
    allErrors[error.componentName].push(error);

    // Write summary file after adding a new error
    const logDir = ensureLogDirectory();
    const filePath = path.join(logDir, 'react-component-errors.md');
    const summary = generateErrorSummary();
    console.log(
      `[DEBUG] Writing error summary: ${summary.substring(0, 100)}...`,
    );
    fs.writeFileSync(filePath, summary);
    console.log(`Error summary updated at: ${filePath}`);
  } else {
    console.log('[DEBUG] Skipping duplicate error');
  }
}

/**
 * Logs accessibility issues for the summary
 */
export function logAccessibilityIssues(issues: AccessibilityIssue[]): void {
  if (issues.length === 0) return;

  let newIssuesAdded = false;

  // Group issues by component
  issues.forEach((issue) => {
    if (!allAccessibilityIssues[issue.componentName]) {
      allAccessibilityIssues[issue.componentName] = [];
    }

    // Check if this issue already exists
    const isDuplicate = allAccessibilityIssues[issue.componentName].some(
      (existingIssue) =>
        existingIssue.issueType === issue.issueType &&
        existingIssue.element === issue.element,
    );

    // Only add if not a duplicate
    if (!isDuplicate) {
      allAccessibilityIssues[issue.componentName].push(issue);
      newIssuesAdded = true;
    }
  });

  // Only write to file if new issues were added
  if (newIssuesAdded) {
    // Write summary file after logging issues
    const logDir = ensureLogDirectory();
    const filePath = path.join(logDir, 'react-component-errors.md');
    fs.writeFileSync(filePath, generateErrorSummary());
    console.log(`Error summary updated at: ${filePath}`);
  }
}

/**
 * Extracts useful information from an error object
 */
export function extractErrorInfo(
  error: Error,
  componentName: string,
  testName: string,
): ErrorInfo {
  const stack = error.stack || '';
  // Look for Vite-specific error information for import errors
  const viteErrorInfo = (error as any).__vitest_rollup_error__;

  let errorLocation = '';
  let errorType = error.name;

  if (viteErrorInfo) {
    // Use Vite's error location for more accurate information
    if (viteErrorInfo.loc && viteErrorInfo.loc.file) {
      errorLocation = `${viteErrorInfo.loc.file}:${viteErrorInfo.loc.line}:${viteErrorInfo.loc.column}`;

      // Set a more specific error type for import errors
      if (
        error.message.includes('Failed to resolve import') ||
        error.message.includes('Cannot find module')
      ) {
        errorType = 'ImportError';
      }
    }
  } else {
    // Fall back to the regular stack trace parsing
    const locationMatch = stack.match(/at\s+([^\s]+)\s+\((.+?):(\d+):(\d+)\)/);

    if (locationMatch) {
      const [, functionName, filePath, line, column] = locationMatch;
      const filePathParts = filePath.split('/');
      const file = filePathParts[filePathParts.length - 1];
      errorLocation = `${file}:${line}:${column} in ${functionName}`;
    }
  }

  return {
    componentName,
    errorType,
    errorMessage: error.message,
    errorStack: stack,
    errorLocation,
    testName,
  };
}
