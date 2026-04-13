/**
 * Standalone entry for pnpm dev / pnpm preview only.
 * This file is loaded by index.html in the boilerplate repo. It is NOT used by the SaaS
 * app-render (which loads the compiler's index.js UMD bundle from the compiler service).
 * We only run the standalone UI when loaded as the main entry from our index.html.
 */
import { ComponentType, StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router';
import {
  ClientProvider,
  ReactClientSdk,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import './index.css';
import { Login } from './Login';
import { loadFontsFromTheme } from './fonts';

// Must run before any import that uses getApiHost/getHost (e.g. SDK)
const apiHost = (import.meta as any).env?.VITE_BLOCKS_API_HOST as
  | string
  | undefined;
const appIdFromEnv = (import.meta as any).env?.VITE_APP_ID as
  | string
  | undefined;
if (typeof window !== 'undefined') {
  if (apiHost) {
    (window as any).__BLOCKS_API_HOST__ = apiHost;
  }
  if (appIdFromEnv) {
    (window as any).appId = appIdFromEnv;
  }
}

/** Default theme CSS for standalone only. Cloud uses app-render's dynamic theme. */
const STANDALONE_DEFAULT_THEME_CSS = `
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 4%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 4%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 4%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96%;
  --secondary-foreground: 0 0% 9%;
  --muted: 0 0% 96%;
  --muted-foreground: 0 0% 45%;
  --accent: 0 0% 96%;
  --accent-foreground: 0 0% 9%;
  --destructive: 355 100% 45%;
  --destructive-foreground: 0 0% 100%;
  --border: 0 0% 90%;
  --input: 0 0% 90%;
  --ring: 0 0% 63%;
  --chart-1: 214 100% 79%;
  --chart-2: 214 91% 60%;
  --chart-3: 221 91% 60%;
  --chart-4: 226 76% 48%;
  --chart-5: 226 70% 39%;
  --radius: 0.625rem;
  --sidebar: 0 0% 98%;
  --sidebar-foreground: 0 0% 4%;
  --sidebar-primary: 0 0% 9%;
  --sidebar-primary-foreground: 0 0% 98%;
  --sidebar-accent: 0 0% 96%;
  --sidebar-accent-foreground: 0 0% 9%;
  --sidebar-border: 0 0% 90%;
  --sidebar-ring: 0 0% 63%;
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --font-inter: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-inter-tight: 'Inter Tight', ui-sans-serif, system-ui, sans-serif;
  --letter-spacing: 0em;
  --shadow-2xs: 0 1px 0 0 hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 2px 0 hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0 hsl(0 0% 0% / 0.1), 0 1px 2px -1px hsl(0 0% 0% / 0.1);
  --shadow: 0 1px 3px 0 hsl(0 0% 0% / 0.1), 0 1px 2px -1px hsl(0 0% 0% / 0.1);
  --shadow-md: 0 4px 6px -1px hsl(0 0% 0% / 0.1), 0 2px 4px -2px hsl(0 0% 0% / 0.1);
  --shadow-lg: 0 10px 15px -3px hsl(0 0% 0% / 0.1), 0 4px 6px -4px hsl(0 0% 0% / 0.1);
  --shadow-xl: 0 20px 25px -5px hsl(0 0% 0% / 0.1), 0 8px 10px -6px hsl(0 0% 0% / 0.1);
  --shadow-2xl: 0 25px 50px -12px hsl(0 0% 0% / 0.25);
}
:root.dark {
  --background: 0 0% 4%;
  --foreground: 0 0% 98%;
  --card: 0 0% 9%;
  --card-foreground: 0 0% 98%;
  --popover: 0 0% 15%;
  --popover-foreground: 0 0% 98%;
  --primary: 0 0% 90%;
  --primary-foreground: 0 0% 9%;
  --secondary: 0 0% 15%;
  --secondary-foreground: 0 0% 98%;
  --muted: 0 0% 15%;
  --muted-foreground: 0 0% 63%;
  --accent: 0 0% 25%;
  --accent-foreground: 0 0% 98%;
  --destructive: 359 100% 70%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 16%;
  --input: 0 0% 20%;
  --ring: 0 0% 45%;
  --sidebar: 0 0% 9%;
  --sidebar-foreground: 0 0% 98%;
  --sidebar-primary: 217 84% 49%;
  --sidebar-primary-foreground: 0 0% 98%;
  --sidebar-accent: 0 0% 15%;
  --sidebar-accent-foreground: 0 0% 98%;
  --sidebar-border: 0 0% 16%;
  --sidebar-ring: 0 0% 32%;
  --font-inter: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-inter-tight: 'Inter Tight', ui-sans-serif, system-ui, sans-serif;
}
`;

function injectStandaloneDefaultTheme() {
  if (typeof document === 'undefined') return;
  const id = 'standalone-default-theme';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  // Use app theme injected by compiler at git push (same as getAppByDomain); fallback to default
  const css =
    (typeof window !== 'undefined' && (window as any).__APP_THEME_CSS__) ||
    STANDALONE_DEFAULT_THEME_CSS;
  style.textContent =
    typeof css === 'string' ? css.trim() : STANDALONE_DEFAULT_THEME_CSS.trim();
  document.head.appendChild(style);
  // Ensure font-inter / font-inter-tight are always defined (for text component) when compiler theme omits them
  const fontId = 'standalone-font-aliases';
  if (!document.getElementById(fontId)) {
    const fontStyle = document.createElement('style');
    fontStyle.id = fontId;
    fontStyle.textContent = `:root, :root.dark { --font-inter: var(--font-inter, 'Inter', ui-sans-serif, system-ui, sans-serif); --font-inter-tight: var(--font-inter-tight, 'Inter Tight', ui-sans-serif, system-ui, sans-serif); }`;
    document.head.appendChild(fontStyle);
  }
}

// Only run standalone UI when we were loaded by our index.html (not by SaaS app-render).
// SaaS loads the compiler's index.js UMD bundle, not this file.
if (
  typeof window !== 'undefined' &&
  (window as any).__BLOCKS_STANDALONE_ENTRY__
) {
  runApp();
}

function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  if ((window as any).appId) {
    const token = window.localStorage.getItem(`token-${(window as any).appId}`);
    if (token) {
      return token;
    }
  }
  return window.localStorage.getItem('token');
}

async function runApp() {
  injectStandaloneDefaultTheme();
  loadFontsFromTheme();
  const rootEl = document.getElementById('root');
  if (!rootEl) return;

  // Compiler exports layout and pages as { id, name, component } where .component is the React component
  let app: {
    layout: { id: string; name: string; component: ComponentType<any> } | null;
    pages: { id: string; name: string; component: ComponentType<any> }[];
    defaultPageId: string;
  };

  try {
    const index = await import('./index');
    app = (index as any).default ?? (index as any).__standalone;
  } catch {
    rootEl.innerHTML = `
      <div style="padding: 2rem; font-family: system-ui; max-width: 480px;">
        <h2>No app bundle</h2>
        <p>Build the app in Blocks and push to this repo, or run from the Blocks platform.</p>
        <p>For local preview against Blocks backend:</p>
        <pre style="background: #f0f0f0; padding: 0.5rem;">VITE_BLOCKS_API_HOST=https://blocks.localhost
VITE_APP_ID=your-app-id
pnpm dev</pre>
      </div>
    `;
    return;
  }

  if (!app?.pages?.length) {
    rootEl.innerHTML = `
      <div style="padding: 2rem; font-family: system-ui;">
        <h2>No pages</h2>
        <p>This app has no pages yet. Add pages in Blocks and push to this repo.</p>
      </div>
    `;
    return;
  }

  const appId =
    appIdFromEnv ??
    (typeof window !== 'undefined' ? (window as any).appId : undefined);
  if (!appId && apiHost) {
    rootEl.innerHTML = `
      <div style="padding: 2rem; font-family: system-ui; max-width: 480px;">
        <h2>Set VITE_APP_ID</h2>
        <p>To talk to the Blocks backend locally, set:</p>
        <pre style="background: #f0f0f0; padding: 0.5rem;">VITE_BLOCKS_API_HOST=${apiHost}
VITE_APP_ID=your-app-id
pnpm dev</pre>
      </div>
    `;
    return;
  }

  const StandaloneApp = () => {
    const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'system'>(
      () =>
        (typeof window !== 'undefined' &&
          (localStorage.getItem('app-theme-mode') as
            | 'dark'
            | 'light'
            | 'system')) ||
        'system',
    );

    useEffect(() => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      const resolved =
        themeMode === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : themeMode;
      root.classList.add(resolved);
    }, [themeMode]);

    return (
      <ClientProvider
        client={client!}
        themeMode={themeMode}
        setThemeMode={(mode) => {
          if (typeof window !== 'undefined')
            localStorage.setItem('app-theme-mode', mode);
          setThemeMode(mode);
        }}
      >
        <Routes>
          <Route
            path="/"
            element={
              app!.layout?.component ? (
                (() => {
                  const LayoutWrap = app!.layout.component;
                  return (
                    <LayoutWrap>
                      <Outlet />
                    </LayoutWrap>
                  );
                })()
              ) : (
                <Outlet />
              )
            }
          >
            <Route
              index
              element={
                <Navigate
                  to={
                    app!.defaultPageId
                      ? `/${app!.defaultPageId}`
                      : `/${app!.pages[0]!.id}`
                  }
                  replace
                />
              }
            />
            {app!.pages.map((p) => {
              const raw = p.component;
              const Comp =
                raw &&
                typeof raw === 'object' &&
                'component' in raw &&
                typeof (raw as { component: ComponentType<any> }).component ===
                  'function'
                  ? (raw as { component: ComponentType<any> }).component
                  : (raw as ComponentType<any>);
              return (
                <Route
                  key={p.id}
                  path={`/${p.id}`}
                  element={Comp ? <Comp /> : null}
                />
              );
            })}
            {/* Same as SaaS: allow navigation by page name (e.g. /dashboard) not just id */}
            {app!.pages.map((p) => {
              if (p.name === p.id) return null;
              const raw = p.component;
              const Comp =
                raw &&
                typeof raw === 'object' &&
                'component' in raw &&
                typeof (raw as { component: ComponentType<any> }).component ===
                  'function'
                  ? (raw as { component: ComponentType<any> }).component
                  : (raw as ComponentType<any>);
              return (
                <Route
                  key={`name-${p.name}`}
                  path={`/${p.name}`}
                  element={Comp ? <Comp /> : null}
                />
              );
            })}
          </Route>
        </Routes>
      </ClientProvider>
    );
  };

  let client: ReactClientSdk | null = null;

  function AuthenticatedApp() {
    const [token, setTokenState] = useState<string | null>(() => getToken());
    const [clientReady, setClientReady] = useState(false);

    useEffect(() => {
      const t = getToken();
      setTokenState(t);
      if (!t) return;
      const c = new ReactClientSdk({ appId: appId!, token: t });
      client = c;
      c.authenticate().then(() => setClientReady(true));
    }, []);

    if (!token) {
      return <Navigate to="/auth/login" replace />;
    }
    if (!clientReady || !client) {
      return (
        <div
          style={{
            padding: '2rem',
            fontFamily: 'system-ui',
            textAlign: 'center',
          }}
        >
          Loading…
        </div>
      );
    }
    return <StandaloneApp />;
  }

  createRoot(rootEl).render(
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/magic-login" element={<Login />} />
          <Route path="/auth/app-login" element={<Login />} />
          <Route path="*" element={<AuthenticatedApp />} />
        </Routes>
      </BrowserRouter>
    </StrictMode>,
  );
}
