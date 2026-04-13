import { describe, test, expect, afterAll } from 'vitest';
import { 
  testPageRender, 
  testPageAccessibility, 
  testPageForConsoleErrors,
  testPageForAccessibilityIssues
} from './page-render-test';
import * as fs from 'fs';
import * as path from 'path';
import React from 'react';
import { extractErrorInfo, logRenderError } from './error-logger';
import { render } from '@testing-library/react';

// Type for syntax errors found during testing
type SyntaxErrorInfo = {
  file: string;
  message: string;
  location: string;
  errorMessage?: string;
  errorObject?: any;
  filePath?: string;
  timestamp?: string;
};

// Define a type for the page component info
type PageComponentInfo = {
  name: string;
  Component: React.ComponentType<any>;
};

// Define type for file error
type FileImportError = {
  file: string;
  imports: string[];
};

// Analyze each page file to find potential import issues
const importErrors: FileImportError[] = [];
const syntaxErrors: SyntaxErrorInfo[] = [];

// Read syntax errors from the syntax-errors.json file if it exists
const logDir = path.resolve(process.cwd(), 'dist/logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const syntaxErrorsPath = path.join(logDir, 'syntax-errors.json');
if (fs.existsSync(syntaxErrorsPath)) {
  try {
    const syntaxErrorsData = JSON.parse(fs.readFileSync(syntaxErrorsPath, 'utf-8'));
    syntaxErrors.push(...syntaxErrorsData);
  } catch (error) {
    console.error('Error reading syntax errors file:', error);
  }
}

/**
 * Recursively reads a directory to find all matching files
 */
function recursiveReadDir(directoryPath: string, fileFilter: (filename: string) => boolean): string[] {
  let results: string[] = [];
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      const subDirResults = recursiveReadDir(fullPath, fileFilter);
      results = [...results, ...subDirResults];
    } else if (fileFilter(entry.name)) {
      results.push(fullPath);
    }
  }
  
  return results;
}

/**
 * Extract all page files to test
 */
function getPageFiles(): string[] {
  const pagesDir = path.resolve(__dirname, '../pages');
  
  if (!fs.existsSync(pagesDir)) {
    return [];
  }
  
  // Find all .tsx, .jsx, .ts, .js files in the pages directory and its subdirectories
  const fileFilter = (filename: string) => /\.(jsx|tsx|js|ts)$/.test(filename);
  const pageFiles = recursiveReadDir(pagesDir, fileFilter);
  
  return pageFiles.map(file => path.relative(process.cwd(), file));
}

/**
 * Attempt to import a file and catch any errors
 */
async function importFile(file: string): Promise<{ success: boolean, component?: React.ComponentType<any>, error?: any }> {
  try {
    const imported = await import(file);
    return { success: true, component: imported.default || Object.values(imported)[0] };
  } catch (error: any) {
    console.log(`Error importing ${file}: ${formatErrorMessage(error)}`);
    return { success: false, error };
  }
}

/**
 * Format error message in a readable way
 */
function formatErrorMessage(error: any): string {
  if (!error) return 'Unknown error';
  
  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle SWC specific syntax errors
  if (error.__vitest_rollup_error__) {
    return `Syntax Error: ${error.message.split('\n')[0]}`;
  }
  
  // Try to get a string representation
  try {
    // Check if error has a message property
    if (error.message) return error.message;
    
    // Try to stringify the object
    return JSON.stringify(error);
  } catch (e) {
    return 'Complex error object (cannot stringify)';
  }
}

/**
 * This function dynamically imports all page components
 */
async function importAllPages(): Promise<Record<string, React.ComponentType<any>>> {
  const pages: Record<string, React.ComponentType<any>> = {};
  
  try {
    const pageFiles = getPageFiles();
    console.log(`Found ${pageFiles.length} potential page component files`);
    
    for (const file of pageFiles) {
      // Replace file system path with import path
      const importPath = file.replace(/^src\//, '../');
      console.log(`Attempting to import ${importPath}...`);
      
      const result = await importFile(importPath);
      
      if (result.success && result.component) {
        console.log(`Successfully imported ${importPath}, checking for component exports...`);
        pages[path.basename(file, path.extname(file))] = result.component;
      }
    }
    
    console.log(`Successfully imported ${Object.keys(pages).length} of ${pageFiles.length} page components.`);
    return pages;
  } catch (error) {
    console.error('Error importing pages:', error);
    return {};
  }
}

// The app ID to use for testing
const TEST_APP_ID = 'test-app-id';

// Test all page components
describe.skip('Page Components', () => {
  // Get the pages directory path
  const pagesDir = path.resolve(process.cwd(), 'src/pages');
  
  // Skip tests if pages directory doesn't exist
  if (!fs.existsSync(pagesDir)) {
    it('skipped - pages directory not found', () => {
      console.warn(`Pages directory not found at ${pagesDir}`);
    });
    return;
  }

  // Test if pages render correctly
  test.skip('Pages should render without errors', async () => {
    // Get all files in the pages directory
    const pageFiles = fs.readdirSync(pagesDir)
      .filter(file => file.endsWith('.tsx') || file.endsWith('.jsx'))
      .map(file => path.join(pagesDir, file));
    
    // Skip if no page files found
    if (pageFiles.length === 0) {
      console.log('No page files found');
      return;
    }
    
    console.log(`Found ${pageFiles.length} page files`);
    let hasFailures = false;
    
    // Test each page file
    for (const file of pageFiles) {
      try {
        // Attempt to dynamically require the component
        // This is in a try/catch to handle syntax errors
        try {
          const pageModule = require(file);
          if (!pageModule || (!pageModule.default && typeof pageModule !== 'function')) {
            console.log(`No valid component export found in file`);
            continue;
          }
          
          const PageComponent = pageModule.default || pageModule;
          
          // Test if the component renders
          testPageRender(PageComponent, {}, TEST_APP_ID);
          console.log(`Page renders without errors`);
        } catch (error) {
          console.error(`Error rendering page: ${error}`);
          hasFailures = true;
          
          // Log the error for reporting
          if (error instanceof Error) {
            const errorInfo = extractErrorInfo(
              error,
              'PageComponent',
              'Render Test'
            );
            logRenderError(errorInfo);
          }
        }
      } catch (error) {
        console.error(`Error loading page file: ${error}`);
        hasFailures = true;
      }
    }
    
    expect(hasFailures).toBe(false);
  });

  test.skip('All pages have accessible elements', async () => {
    const pageComponents = await importAllPages();
    
    // Fail test if no pages are found
    if (Object.keys(pageComponents).length === 0) {
      console.error('No page components found or imported successfully.');
      expect(Object.keys(pageComponents).length).toBeGreaterThan(0);
      return;
    }
    
    let hasFailures = false;
    
    // Test each page component for accessibility
    for (const [name, Component] of Object.entries(pageComponents)) {
      try {
        testPageAccessibility(Component);
        console.log(`✅ Page '${name}' has accessible elements`);
      } catch (error) {
        console.error(`❌ Page '${name}' accessibility test failed:`, error);
        hasFailures = true;
      }
    }
    
    // Fail the test if any component failed
    expect(hasFailures).toBe(false);
  });
  
  test.skip('All pages render without console errors', async () => {
    const pageComponents = await importAllPages();
    
    // Fail test if no pages are found
    if (Object.keys(pageComponents).length === 0) {
      console.error('No page components found or imported successfully.');
      expect(Object.keys(pageComponents).length).toBeGreaterThan(0);
      return;
    }
    
    let hasFailures = false;
    
    // Test each page component for console errors
    for (const [name, Component] of Object.entries(pageComponents)) {
      try {
        testPageForConsoleErrors(Component);
        console.log(`✅ Page '${name}' renders without console errors`);
      } catch (error) {
        console.error(`❌ Page '${name}' has console errors during render:`, error);
        hasFailures = true;
      }
    }
    
    // Fail the test if any component had console errors
    expect(hasFailures).toBe(false);
  });
  
  test.skip('All pages have proper accessibility attributes', async () => {
    const pageComponents = await importAllPages();
    
    // Fail test if no pages are found
    if (Object.keys(pageComponents).length === 0) {
      console.error('No page components found or imported successfully.');
      expect(Object.keys(pageComponents).length).toBeGreaterThan(0);
      return;
    }
    
    let hasFailures = false;
    
    // Test each page component for accessibility issues
    for (const [name, Component] of Object.entries(pageComponents)) {
      try {
        testPageForAccessibilityIssues(Component);
        console.log(`✅ Page '${name}' has proper accessibility attributes`);
      } catch (error) {
        console.error(`❌ Page '${name}' has accessibility issues:`, error);
        hasFailures = true;
      }
    }
    
    // Fail the test if any component had accessibility issues
    expect(hasFailures).toBe(false);
  });

  // Add a test specifically for syntax errors
  test.skip('All page files are free of syntax errors', async () => {
    // Use the getPageFiles function to get all page files
    const pagesDir = path.resolve(__dirname, '../pages');
    console.log(`Checking for syntax errors in directory: ${pagesDir}`);
    
    // Get all page files
    const pageFiles = getPageFiles();
    
    console.log(`Found ${pageFiles.length} page files to check for syntax errors`);
    
    const syntaxErrors: SyntaxErrorInfo[] = [];
    
    for (const file of pageFiles) {
      const result = await checkFileSyntax(file);
      if (!result.success && result.error) {
        syntaxErrors.push(result.error);
      }
    }
    
    // If there are syntax errors, log them to a file
    if (syntaxErrors.length > 0) {
      const logDir = path.resolve(process.cwd(), 'dist/logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const syntaxErrorsPath = path.join(logDir, 'syntax-errors.json');
      fs.writeFileSync(syntaxErrorsPath, JSON.stringify(syntaxErrors, null, 2));
      
      console.log(`Found ${syntaxErrors.length} files with syntax errors`);
      throw new Error(`${syntaxErrors.length} files have syntax errors. See dist/logs/syntax-errors.json for details.`);
    } else {
      console.log('No syntax errors detected in any page files');
    }
  });

  // Add a special test for runtime errors that should be manually detected
  test.skip('All pages with runtime errors are captured', async () => {
    // Get all files in the pages directory using our new function
    const pageFiles = getPageFiles();
    
    console.log(`Testing ${pageFiles.length} files for runtime errors`);
    const runtimeErrors: Record<string, {message: string, location: string}[]> = {};

    // Create the logs directory 
    const logDir = path.resolve(process.cwd(), 'dist/logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    for (const file of pageFiles) {
      // Replace file system path with import path
      const importPath = file.replace(/^src\//, '../');
      const componentName = path.basename(file, path.extname(file));
      
      console.log(`Testing ${componentName} for runtime errors`);
      
      try {
        // Import the component
        const imported = await import(importPath);
        
        if (imported.default && typeof imported.default === 'function') {
          const PageComponent = imported.default;
          console.log(`Attempting to render ${componentName}`);
          
          try {
            // Try to render the component
            render(<PageComponent />);
            console.log(`Successfully rendered ${componentName}`);
          } catch (error) {
            console.log(`Runtime error detected in ${componentName}: ${error}`);
            
            // Record the error
            if (!runtimeErrors[componentName]) {
              runtimeErrors[componentName] = [];
            }
            
            runtimeErrors[componentName].push({
              message: error instanceof Error ? error.message : String(error),
              location: error instanceof Error && error.stack ? error.stack.split('\n')[1] || 'Unknown' : 'Unknown'
            });
          }
        }
      } catch (error) {
        // If we can't import the component, it might have syntax errors
        // These should be caught by the syntax error test
        console.log(`Could not import ${componentName} - possible syntax error`);
      }
    }
    
    // Write runtime errors to a JSON file
    if (Object.keys(runtimeErrors).length > 0) {
      const runtimeErrorsPath = path.join(logDir, 'runtime-errors.json');
      fs.writeFileSync(runtimeErrorsPath, JSON.stringify(runtimeErrors, null, 2));
      console.log(`Recorded ${Object.keys(runtimeErrors).length} components with runtime errors`);
    } else {
      console.log('No runtime errors detected in any components');
    }
  });
});

// Add a log summary after all tests complete
afterAll(() => {
  // Create the logs directory if it doesn't exist
  const logDir = path.resolve(process.cwd(), 'dist/logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Initialize error collections
  let syntaxErrors: SyntaxErrorInfo[] = [];
  let runtimeErrors: Record<string, {message: string, location: string}[]> = {};
  let accessibilityIssues: Record<string, {issue: string, element: string, suggestion: string}[]> = {};
  
  // 1. Collect syntax errors
  const syntaxErrorsPath = path.join(logDir, 'syntax-errors.json');
  if (fs.existsSync(syntaxErrorsPath)) {
    try {
      // Read the existing syntax errors
      const syntaxErrorsData = fs.readFileSync(syntaxErrorsPath, 'utf-8');
      syntaxErrors = JSON.parse(syntaxErrorsData);
      console.log(`Loaded ${syntaxErrors.length} syntax errors from ${syntaxErrorsPath}`);
    } catch (error) {
      console.error('Error reading syntax errors:', error);
    }
  }
  
  // 2. Collect runtime errors
  const runtimeErrorsPath = path.join(logDir, 'runtime-errors.json');
  if (fs.existsSync(runtimeErrorsPath)) {
    try {
      // Read the runtime errors from JSON file
      const runtimeErrorsData = fs.readFileSync(runtimeErrorsPath, 'utf-8');
      runtimeErrors = JSON.parse(runtimeErrorsData);
      console.log(`Loaded runtime errors for ${Object.keys(runtimeErrors).length} components`);
    } catch (error) {
      console.error('Error reading runtime errors:', error);
    }
  }
  
  // 3. Collect accessibility issues from the dedicated file
  const accessibilityIssuesPath = path.join(logDir, 'accessibility-issues.json');
  if (fs.existsSync(accessibilityIssuesPath)) {
    try {
      // Read the accessibility issues from the JSON file
      const accessibilityData = fs.readFileSync(accessibilityIssuesPath, 'utf-8');
      accessibilityIssues = JSON.parse(accessibilityData);
      console.log(`Loaded accessibility issues for ${Object.keys(accessibilityIssues).length} components`);
    } catch (error) {
      console.error('Error reading accessibility issues:', error);
    }
  } else {
    // If accessibilityIssuesPath doesn't exist, try to extract from react-component-errors.md as fallback
    const reactErrorsPath = path.join(logDir, 'react-component-errors.md');
    if (fs.existsSync(reactErrorsPath)) {
      try {
        // Parse the react-component-errors.md file to extract accessibility issues
        const reactErrorsData = fs.readFileSync(reactErrorsPath, 'utf-8');
        
        // Extract component names and issues using regex
        const accessibilityPattern = /## Accessibility Issues\s+### ([^\n]+)([\s\S]*?)(?=###|$)/g;
        let match;
        
        while ((match = accessibilityPattern.exec(reactErrorsData)) !== null) {
          const componentName = match[1].trim();
          const componentIssues = match[2];
          
          // Extract individual issues
          const issuePattern = /#### ([^\n]+)[\s\S]*?Element\*\*: ([^\n]+)[\s\S]*?How to fix[\s\S]*?- ([^\n]+)/g;
          let issueMatch;
          const issues: {issue: string, element: string, suggestion: string}[] = [];
          
          while ((issueMatch = issuePattern.exec(componentIssues)) !== null) {
            issues.push({
              issue: issueMatch[1].trim(),
              element: issueMatch[2].trim(),
              suggestion: issueMatch[3].trim()
            });
          }
          
          if (issues.length > 0) {
            accessibilityIssues[componentName] = issues;
          }
        }
        
        console.log(`Loaded accessibility issues from MD file for ${Object.keys(accessibilityIssues).length} components`);
      } catch (error) {
        console.error('Error extracting accessibility issues from MD file:', error);
      }
    }
  }
  
  // Deduplicate the syntax errors to avoid duplicates in the report
  const uniqueSyntaxErrors = syntaxErrors.reduce((unique: SyntaxErrorInfo[], error) => {
    // Check if we already have an error with the same file and location
    const isDuplicate = unique.some(
      existingError => 
        existingError.file === error.file && 
        existingError.location === error.location
    );
    
    if (!isDuplicate) {
      unique.push(error);
    }
    
    return unique;
  }, []);
  
  // Generate the comprehensive error report
  const reportPath = path.join(logDir, 'component-errors-detailed-for-ai-fix.md');
  
  // Create the report content
  let reportContent = '# Component Error Report (Send this to AI for fixes)\n\n';
  const testDate = new Date().toISOString();
  reportContent += `*Generated on: ${testDate}*\n\n`;
  
  // Add executive summary
  reportContent += '## Executive Summary\n\n';
  const totalSyntaxErrors = uniqueSyntaxErrors.length;
  const totalRuntimeErrors = Object.values(runtimeErrors).reduce((sum, errors) => sum + errors.length, 0);
  const totalAccessibilityIssues = Object.values(accessibilityIssues).reduce((sum, issues) => sum + issues.length, 0);
  const totalErrors = totalSyntaxErrors + totalRuntimeErrors + totalAccessibilityIssues;
  
  reportContent += `- **Total Issues Found**: ${totalErrors}\n`;
  reportContent += `- **Syntax Errors**: ${totalSyntaxErrors}\n`;
  reportContent += `- **Runtime Errors**: ${totalRuntimeErrors}\n`;
  reportContent += `- **Accessibility Issues**: ${totalAccessibilityIssues}\n\n`;
  
  const componentSet = new Set([
    ...uniqueSyntaxErrors.map(error => error.file.replace(/\.(tsx|jsx|ts|js)$/, '')),
    ...Object.keys(runtimeErrors),
    ...Object.keys(accessibilityIssues)
  ]);
  
  reportContent += `- **Total Components With Issues**: ${componentSet.size}\n\n`;
  
  // If we have issues, add detailed sections
  if (totalErrors > 0) {
    // Add syntax errors section
    if (uniqueSyntaxErrors.length > 0) {
      reportContent += '## Syntax Errors\n\n';
      reportContent += '*These errors prevent the component from being compiled*\n\n';
      
      uniqueSyntaxErrors.forEach((error, index) => {
        reportContent += `### ${index + 1}. Error in ${error.file}\n\n`;
        reportContent += `**Message**: ${error.message}\n\n`;
        reportContent += `**Location**: ${error.location}\n\n`;
        
        // Add advice on how to fix syntax errors
        reportContent += '**How to fix:**\n\n';
        reportContent += '1. Check for missing brackets, parentheses, or semicolons\n';
        reportContent += '2. Ensure all JSX elements are properly closed\n';
        reportContent += '3. Check for incorrect indentation or formatting\n\n';
        
        // Add separator between errors
        if (index < uniqueSyntaxErrors.length - 1) {
          reportContent += '---\n\n';
        }
      });
    }
    
    // Add runtime errors section
    if (Object.keys(runtimeErrors).length > 0) {
      if (uniqueSyntaxErrors.length > 0) {
        reportContent += '\n\n';
      }
      
      reportContent += '## Runtime Errors\n\n';
      reportContent += '*These errors occur when trying to render the component*\n\n';
      
      Object.entries(runtimeErrors).forEach(([component, errors], compIndex) => {
        reportContent += `### Component: ${component}\n\n`;
        
        errors.forEach((error, index) => {
          reportContent += `#### Error ${index + 1}\n\n`;
          reportContent += `**Message**: ${error.message}\n\n`;
          reportContent += `**Location**: ${error.location}\n\n`;
          
          // Add advice on how to fix runtime errors
          reportContent += '**How to fix:**\n\n';
          reportContent += '1. Add error handling with try/catch blocks\n';
          reportContent += '2. Check for null or undefined values before accessing properties\n';
          reportContent += '3. Consider adding conditional rendering based on state\n\n';
          
          // Add separator between errors
          if (index < errors.length - 1) {
            reportContent += '---\n\n';
          }
        });
        
        // Add separator between components
        if (compIndex < Object.keys(runtimeErrors).length - 1) {
          reportContent += '\n\n---\n\n';
        }
      });
    }
    
    // Add accessibility issues section
    if (Object.keys(accessibilityIssues).length > 0) {
      if (uniqueSyntaxErrors.length > 0 || Object.keys(runtimeErrors).length > 0) {
        reportContent += '\n\n';
      }
      
      reportContent += '## Accessibility Issues\n\n';
      reportContent += '*These issues affect users with disabilities*\n\n';
      
      Object.entries(accessibilityIssues).forEach(([component, issues], compIndex) => {
        reportContent += `### Component: ${component}\n\n`;
        
        // Group issues by type
        const issuesByType: Record<string, {element: string, suggestion: string}[]> = {};
        issues.forEach(issue => {
          if (!issuesByType[issue.issue]) {
            issuesByType[issue.issue] = [];
          }
          issuesByType[issue.issue].push({
            element: issue.element,
            suggestion: issue.suggestion
          });
        });
        
        // Format issues by type
        Object.entries(issuesByType).forEach(([issueType, typeIssues], typeIndex) => {
          reportContent += `#### ${issueType}\n\n`;
          reportContent += '**Affected Elements:**\n\n';
          
          typeIssues.forEach(issue => {
            reportContent += `- ${issue.element}\n`;
          });
          
          reportContent += '\n**How to fix:**\n\n';
          reportContent += `- ${typeIssues[0].suggestion}\n\n`;
          
          // Add separator between issue types
          if (typeIndex < Object.keys(issuesByType).length - 1) {
            reportContent += '---\n\n';
          }
        });
        
        // Add separator between components
        if (compIndex < Object.keys(accessibilityIssues).length - 1) {
          reportContent += '\n\n---\n\n';
        }
      });
    }
    
    // Add best practices section
    reportContent += '\n\n## Common Fixes and Best Practices\n\n';
    
    // Syntax error fixes
    if (uniqueSyntaxErrors.length > 0) {
      reportContent += '### Preventing Syntax Errors\n\n';
      reportContent += '```typescript\n';
      reportContent += '// Use proper editor with syntax highlighting\n';
      reportContent += '// Always balance brackets and parentheses\n';
      reportContent += '// Use linting tools (ESLint, etc.)\n\n';
      reportContent += '// JSX elements must be closed properly\n';
      reportContent += '<div>\n';
      reportContent += '  <p>Content</p>\n';
      reportContent += '</div>\n\n';
      reportContent += '// Arrow functions must have parameters properly formatted\n';
      reportContent += 'const correctFunction = (param) => { /* code */ };\n';
      reportContent += '```\n\n';
    }
    
    // Runtime error fixes
    if (Object.keys(runtimeErrors).length > 0) {
      reportContent += '### Preventing Runtime Errors\n\n';
      reportContent += '```typescript\n';
      reportContent += '// Use optional chaining to prevent null/undefined errors\n';
      reportContent += 'const name = user?.profile?.name || "Default Name";\n\n';
      reportContent += '// Conditional rendering to ensure components have data\n';
      reportContent += 'function MyComponent({ data }) {\n';
      reportContent += '  if (!data) return <div>Loading...</div>;\n';
      reportContent += '  return <div>{data.title}</div>;\n';
      reportContent += '}\n\n';
      reportContent += '// Error boundaries can catch errors in children components\n';
      reportContent += 'class ErrorBoundary extends React.Component {\n';
      reportContent += '  // Implementation...\n';
      reportContent += '}\n';
      reportContent += '```\n\n';
    }
    
    // Accessibility fixes
    if (Object.keys(accessibilityIssues).length > 0) {
      reportContent += '### Accessibility Best Practices\n\n';
      reportContent += '```jsx\n';
      reportContent += '// Always add alt text to images\n';
      reportContent += '<img src="image.jpg" alt="Description of the image" />\n\n';
      reportContent += '// Use semantic HTML elements\n';
      reportContent += '<nav>Navigation</nav>\n';
      reportContent += '<main>Main content</main>\n';
      reportContent += '<button>Click me</button> <!-- instead of <div onClick={...}> -->\n\n';
      reportContent += '// Label form elements properly\n';
      reportContent += '<label htmlFor="name">Name:</label>\n';
      reportContent += '<input id="name" type="text" />\n';
      reportContent += '```\n\n';
    }
  } else {
    // No errors found
    reportContent += '## No Issues Found\n\n';
    reportContent += 'All components are working correctly and follow best practices.\n\n';
  }
  
  // Add generation information
  reportContent += '\n---\n\n';
  reportContent += `*Report generated by the component testing system on ${testDate}*\n`;
  
  // Write the single comprehensive report file
  fs.writeFileSync(reportPath, reportContent);
  console.log(`Comprehensive component error report written to: ${reportPath}`);
  
  // Also write the simple summary file for backward compatibility
  const simpleSummaryPath = path.join(logDir, 'component-errors-summary.md');
  let simpleSummary = '# Component Error Summary\n\n';
  simpleSummary += '## Overview\n\n';
  simpleSummary += `- **Total Files with Syntax Errors**: ${uniqueSyntaxErrors.length}\n`;
  simpleSummary += `- **Total Runtime Error Components**: ${Object.keys(runtimeErrors).length}\n`;
  simpleSummary += `- **Total Accessibility Issue Components**: ${Object.keys(accessibilityIssues).length}\n`;
  simpleSummary += `- **Total Issues**: ${totalErrors}\n\n`;
  
  if (totalErrors === 0) {
    simpleSummary += 'No errors detected in page components.\n';
  } else {
    simpleSummary += `**For AI code fixing:** Use the detailed report at: component-errors-detailed-for-ai-fix.md\n`;
  }
  
  fs.writeFileSync(simpleSummaryPath, simpleSummary);
  console.log(`Simple summary written to: ${simpleSummaryPath}`);
});

/**
 * Check a file for syntax errors by attempting to import it
 */
async function checkFileSyntax(filePath: string): Promise<{ success: boolean; error?: any }> {
  const importPath = filePath.replace(/^src\//, '../');
  console.log(`Checking file for syntax errors: ${path.basename(filePath)}`);
  
  try {
    await import(importPath);
    console.log(`Successfully imported ${path.basename(filePath)} with no syntax errors`);
    return { success: true };
  } catch (error: any) {
    const errorMessage = formatErrorMessage(error);
    console.log(`Syntax error in ${path.basename(filePath)}: ${errorMessage}`);
    
    // Store the error information
    const syntaxErrorInfo: SyntaxErrorInfo = {
      file: filePath,
      message: errorMessage,
      location: `${path.basename(filePath)}`
    };
    
    return { success: false, error: syntaxErrorInfo };
  }
}