import '@testing-library/jest-dom';
import * as fs from 'fs';
import * as path from 'path';
import ResizeObserver from 'resize-observer-polyfill';
import { TextEncoder, TextDecoder } from 'util';
import 'whatwg-fetch';

// Use the actual polyfill implementation
global.ResizeObserver = ResizeObserver;
// Fix type mismatch by casting to the DOM interface types
global.TextEncoder = TextEncoder as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Setup window object if it doesn't exist (for Node environment)
// This should be handled by JSDOM in the test environment
if (typeof window === 'undefined') {
  console.warn(
    'Window object not found in test environment. This may cause issues with React rendering.',
  );
}

// Setup requestAnimationFrame for React
if (typeof window !== 'undefined' && !window.requestAnimationFrame) {
  window.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  window.cancelAnimationFrame = (id) => clearTimeout(id);
}

// Suppress React 18 warnings during testing
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
      args[0].includes('Warning: useLayoutEffect does nothing on the server'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Setup a global error handling system to capture all errors
const logDir = path.resolve(process.cwd(), 'dist/logs');
if (!fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
  fs.mkdirSync(path.resolve(process.cwd(), 'dist'));
}
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Capture console output for error analysis
const originalConsoleWarn = console.warn;
let consoleOutput = '';

// Capture console output for later analysis
console.error = (...args) => {
  // Call the original method
  originalConsoleError(...args);
  // Capture the output
  consoleOutput += args.join(' ') + '\n';
  // Write to file immediately
  fs.writeFileSync(path.join(logDir, 'test-output.log'), consoleOutput);
};

console.warn = (...args) => {
  // Call the original method
  originalConsoleWarn(...args);
  // Capture the output
  consoleOutput += args.join(' ') + '\n';
  // Write to file immediately
  fs.writeFileSync(path.join(logDir, 'test-output.log'), consoleOutput);
};
