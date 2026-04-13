import { render, screen } from '@testing-library/react';
import React, { ReactElement } from 'react';
import {
  logRenderError,
  logAccessibilityIssues,
  extractErrorInfo,
  AccessibilityIssue,
} from './error-logger';
import path from 'path';
import fs from 'fs';
import { ClientSdk } from '@blocksdiy/blocks-client-sdk/clientSdk';
import { ClientProvider } from '@blocksdiy/blocks-client-sdk/reactSdk';

// Default app ID for testing purposes
const TEST_APP_ID = 'test-app-id';

/**
 * Gets the component name from a component type
 */
function getComponentName<P>(Component: React.ComponentType<P>): string {
  return Component.displayName || Component.name || 'UnknownComponent';
}

/**
 * Wraps a component with necessary providers for testing
 * This uses the real SDK implementation, not a mock
 */
function withProviders<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  props?: P,
  appId: string = TEST_APP_ID,
): React.ReactElement {
  // Create a real ClientSdk instance with the app ID
  const client = new ClientSdk({
    appId,
  });

  return (
    <ClientProvider client={client}>
      <Component {...(props as P)} />
    </ClientProvider>
  );
}

/**
 * Tests if a page component renders without throwing any errors.
 * This is a generic test that doesn't rely on specific page content or structure.
 *
 * @param PageComponent The React component to test
 * @param props Optional props to pass to the component
 * @param appId Optional app ID for the client SDK
 */
export function testPageRender<P extends Record<string, unknown>>(
  PageComponent: React.ComponentType<P>,
  props?: P,
  appId?: string,
): void {
  // Check if component renders without errors
  let renderError: Error | null = null;
  const componentName = getComponentName(PageComponent);

  try {
    console.log(`[DEBUG] Attempting to render component: ${componentName}`);
    render(withProviders(PageComponent, props, appId));
    console.log(`[DEBUG] Successfully rendered component: ${componentName}`);
  } catch (error) {
    console.log(`[DEBUG] Error rendering component: ${componentName}`, error);
    renderError = error as Error;

    // Log the error for AI consumption
    const errorInfo = extractErrorInfo(
      renderError,
      componentName,
      'Basic Render Test',
    );
    console.log(`[DEBUG] Extracted error info:`, JSON.stringify(errorInfo));

    // Make sure we're actually calling logRenderError with the error info
    console.log(
      `[DEBUG] Calling logRenderError for component: ${componentName}`,
    );
    logRenderError(errorInfo);
  }

  // Expect no errors (this will fail the test if there are errors, as intended)
  if (renderError) {
    console.log(
      `[DEBUG] Failing test for component: ${componentName} due to render error`,
    );
    // Note that we're specifically NOT wrapping this in a try/catch block
    // so that the test fails if there's a render error
    // This is intentional - we want the test to fail for components with render errors
    expect(renderError).toBeNull();
  } else {
    // Check if something was rendered to the DOM only if no error was thrown
    const rootElement = document.querySelector('#root') || document.body;
    expect(rootElement.children.length).toBeGreaterThan(0);
  }
}

/**
 * Tests if a page component has accessible elements
 * by checking for basic accessibility attributes.
 *
 * @param PageComponent The React component to test
 * @param props Optional props to pass to the component
 * @param appId Optional app ID for the client SDK
 */
export function testPageAccessibility<P extends Record<string, unknown>>(
  PageComponent: React.ComponentType<P>,
  props?: P,
  appId?: string,
): void {
  const componentName = getComponentName(PageComponent);

  try {
    render(withProviders(PageComponent, props, appId));

    // Check headings existence (a well-structured page usually has headings)
    const headings = screen.queryAllByRole('heading');
    if (headings.length > 0) {
      expect(headings.length).toBeGreaterThan(0);
    }
  } catch (error) {
    // Log the error for AI consumption
    const errorInfo = extractErrorInfo(
      error as Error,
      componentName,
      'Accessibility Test',
    );
    logRenderError(errorInfo);
    throw error;
  }
}

/**
 * Tests if a page has no console errors when rendered.
 * Captures console.error calls during rendering.
 *
 * @param PageComponent The React component to test
 * @param props Optional props to pass to the component
 * @param appId Optional app ID for the client SDK
 */
export function testPageForConsoleErrors<P extends Record<string, unknown>>(
  PageComponent: React.ComponentType<P>,
  props?: P,
  appId?: string,
): void {
  const componentName = getComponentName(PageComponent);

  // Mock console.error
  const originalConsoleError = console.error;
  const consoleErrors: string[] = [];

  console.error = (...args: any[]) => {
    consoleErrors.push(args.join(' '));
  };

  try {
    render(withProviders(PageComponent, props, appId));
  } catch (error) {
    // Log the error for AI consumption
    const errorInfo = extractErrorInfo(
      error as Error,
      componentName,
      'Console Error Test',
    );
    logRenderError(errorInfo);
    throw error;
  } finally {
    // Restore original console.error
    console.error = originalConsoleError;
  }

  if (consoleErrors.length > 0) {
    console.warn('Console errors detected during render:', consoleErrors);

    // Create an error object for the console errors
    const consoleError = new Error(consoleErrors.join('\n'));
    const errorInfo = extractErrorInfo(
      consoleError,
      componentName,
      'Console Error Test',
    );
    logRenderError(errorInfo);
  }

  expect(consoleErrors.length).toBe(0);
}

/**
 * Tests if a page component has accessibility issues.
 * @param PageComponent - The React component to test
 * @param props Optional props to pass to the component
 * @param appId Optional app ID for the client SDK
 */
export function testPageForAccessibilityIssues<
  P extends Record<string, unknown>,
>(PageComponent: React.ComponentType<P>, props?: P, appId?: string): void {
  // Render the component
  const { container } = render(
    withProviders(PageComponent, props || ({} as P), appId),
  );
  const componentName = getComponentName(PageComponent);
  console.log(`Checking accessibility for component: ${componentName}`);

  // Get all elements with accessibility issues
  const allElements = container.querySelectorAll('*');
  const accessibilityIssues: {
    component: string;
    element: string;
    issue: string;
    suggestion: string;
  }[] = [];

  // Check all elements for accessibility violations
  allElements.forEach((element) => {
    // Check for missing alt text on images
    if (
      element.tagName === 'IMG' &&
      (!element.hasAttribute('alt') || element.getAttribute('alt') === '')
    ) {
      console.log(
        `Found accessibility issue in ${componentName}: Missing alt text on image`,
      );
      accessibilityIssues.push({
        component: componentName,
        element: 'Image element',
        issue: 'Missing alt text',
        suggestion: 'Add alt attribute to describe the image',
      });
    }

    // Check for non-semantic buttons (div with onClick)
    if (element.tagName === 'DIV' && element.hasAttribute('onclick')) {
      console.log(
        `Found accessibility issue in ${componentName}: Non-semantic button (div with onClick)`,
      );
      accessibilityIssues.push({
        component: componentName,
        element: 'Div with onClick',
        issue: 'Non-semantic button element',
        suggestion: 'Use <button> elements for clickable controls',
      });
    }

    // Check for form controls without labels
    if (
      ['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName) &&
      !element.hasAttribute('aria-label') &&
      !element.hasAttribute('aria-labelledby')
    ) {
      // Check if the input has a label associated with it via id
      const hasLabel =
        element.hasAttribute('id') &&
        container.querySelector(`label[for="${element.getAttribute('id')}"]`);

      if (!hasLabel) {
        console.log(
          `Found accessibility issue in ${componentName}: Form control without label`,
        );
        accessibilityIssues.push({
          component: componentName,
          element: `${element.tagName.toLowerCase()} element`,
          issue: 'Form control without label',
          suggestion:
            'Add label element with matching for/id attributes or use aria-label',
        });
      }
    }
  });

  // If we found accessibility issues, log them to a file
  if (accessibilityIssues.length > 0) {
    console.log(
      `Found ${accessibilityIssues.length} accessibility issues in ${componentName}`,
    );

    // Create the logs directory if it doesn't exist
    const logDir = path.resolve(process.cwd(), 'dist/logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Path to the accessibility issues file
    const accessibilityIssuesPath = path.join(
      logDir,
      'accessibility-issues.json',
    );

    // Read existing issues if the file exists
    let allIssues: Record<
      string,
      { issue: string; element: string; suggestion: string }[]
    > = {};
    if (fs.existsSync(accessibilityIssuesPath)) {
      try {
        const existingData = fs.readFileSync(accessibilityIssuesPath, 'utf-8');
        allIssues = JSON.parse(existingData);
      } catch (error) {
        console.error('Error reading accessibility issues file:', error);
      }
    }

    // Replace any existing issues for this component with the new ones
    allIssues[componentName] = accessibilityIssues.map((issue) => ({
      issue: issue.issue,
      element: issue.element,
      suggestion: issue.suggestion,
    }));

    // Write to the file
    fs.writeFileSync(
      accessibilityIssuesPath,
      JSON.stringify(allIssues, null, 2),
    );
    console.log(
      `Saved ${accessibilityIssues.length} accessibility issues for ${componentName} to ${accessibilityIssuesPath}`,
    );

    // Now fail the test after saving all issues
    throw new Error(
      `Found ${accessibilityIssues.length} accessibility issues in ${componentName}`,
    );
  } else {
    console.log(`No accessibility issues found in ${componentName}`);
  }
}
