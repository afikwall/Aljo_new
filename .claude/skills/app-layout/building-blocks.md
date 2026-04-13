# Layout Building Blocks

Composable patterns for common layout use cases. Pick what you need and integrate them into your design.

---

## Imports you'll likely need

```tsx
import { useUser, useThemeMode } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { getPageUrl, logOut } from '@/lib/utils';
import { useLocation, Link } from 'react-router';
```

---

## Auth-Aware Layout Branching

The layout itself is the right place to branch on auth state — show navigation only to logged-in users, show a minimal shell or sign-in prompt otherwise. Always render `children`.

```tsx
export default function Layout({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const location = useLocation();
  const loginUrl = getPageUrl(loginPageConfig);

  // Login page always gets minimal wrapper
  if (location.pathname === loginUrl) {
    return <>{children}</>;
  }

  // Unauthenticated: minimal shell with sign-in prompt
  if (!user.isAuthenticated) {
    return (
      <>
        <header className="border-b p-4 flex justify-end">
          <Link to={loginUrl}>
            <Button>Sign In</Button>
          </Link>
        </header>
        <main>{children}</main>
      </>
    );
  }

  // Authenticated: full layout
  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}
```

Key rules:

- Always render `children` — including in the unauthenticated branch (login page must render)
- Never redirect from layout — let individual pages handle auth redirects
- Default unknown auth states to a safe fallback, not null

---

## Role-Based Layout Variants

When roles exist, each role can get a different shell — different nav items, different structure, different brand color even.

```tsx
export default function Layout({ children }: { children: React.ReactNode }) {
  const user = useUser();

  if (!user.isAuthenticated) return <PublicShell>{children}</PublicShell>;

  if (user.role === 'Admin') return <AdminShell>{children}</AdminShell>;
  if (user.role === 'Manager') return <ManagerShell>{children}</ManagerShell>;
  if (user.role === 'Employee')
    return <EmployeeShell>{children}</EmployeeShell>;

  return <DefaultShell>{children}</DefaultShell>;
}
```

Design tip: role-specific shells can share a common layout component but differ in nav items, available actions, or visual treatment — you don't need entirely different markup per role.

---

## Portal / Scoped App Pattern

For apps where users see content scoped to a linked entity (client portal, tenant dashboard, patient portal). Branch on role + linkage — never dead-end users who have no linked entity.

```tsx
// ❌ WRONG: the app owner logs in, has no linked entity, sees this forever
if (!client) return <div>Not configured. Contact admin.</div>;

// ✅ CORRECT: admin gets their own layout; regular user sees pending state
if (!client && user.role === 'Admin')
  return <AdminShell>{children}</AdminShell>;
if (!client) return <AccessPendingScreen />;
return <ClientPortalShell client={client}>{children}</ClientPortalShell>;
```

---

## User Menu

A dropdown in the header, sidebar footer, or anywhere that shows identity and offers logout. Style it to fit your specific layout design.

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

function UserMenu() {
  const user = useUser();

  if (!user.isAuthenticated) return null;

  const initials =
    [user.firstName?.[0], user.lastName?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase() || '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <Avatar className="size-7">
            {user.profileImageUrl && (
              <AvatarImage src={user.profileImageUrl} alt={user.name} />
            )}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{user.firstName || user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span>{user.name}</span>
          <span className="font-normal text-muted-foreground text-xs">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logOut()}>
          <LogOut data-icon="inline-start" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Adapt the trigger to fit the design — it could be an avatar button, a name + chevron, an icon-only button, or a full sidebar footer row.

---

## Theme Mode Switcher

```tsx
import { useThemeMode } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { Sun, Moon, Monitor } from 'lucide-react';

function ThemeSwitcher() {
  const { themeMode, setThemeMode } = useThemeMode();

  // Option A: Dropdown (fits headers and menus)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          {themeMode === 'dark' ? (
            <Moon />
          ) : themeMode === 'light' ? (
            <Sun />
          ) : (
            <Monitor />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setThemeMode('light')}>
          <Sun data-icon="inline-start" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setThemeMode('dark')}>
          <Moon data-icon="inline-start" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setThemeMode('system')}>
          <Monitor data-icon="inline-start" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Option B: ToggleGroup (fits settings panels or prominent controls)
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

function ThemeToggle() {
  const { themeMode, setThemeMode } = useThemeMode();
  return (
    <ToggleGroup
      type="single"
      value={themeMode}
      onValueChange={(v) => v && setThemeMode(v as 'light' | 'dark' | 'system')}
    >
      <ToggleGroupItem value="light">
        <Sun />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark">
        <Moon />
      </ToggleGroupItem>
      <ToggleGroupItem value="system">
        <Monitor />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
```

Rules:

- Use `useThemeMode` from `@blocksdiy/blocks-client-sdk/reactSdk` — never implement custom theme toggling or add ThemeProvider/next-themes
- Semantic tokens (`bg-background`, `text-foreground`, etc.) adapt automatically — no `dark:` manual overrides needed

---

## Avatar

Standalone avatar for headers, nav, profile sections, etc. Always include `AvatarFallback` for when the image is missing.

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function UserAvatar({ user }: { user: ReturnType<typeof useUser> }) {
  const initials =
    [user.firstName?.[0], user.lastName?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase() || '?';

  return (
    <Avatar>
      {user.profileImageUrl && (
        <AvatarImage src={user.profileImageUrl} alt={user.name} />
      )}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
```

---

## RTL Support

For Hebrew, Arabic, or other RTL languages, apply `direction: 'rtl'` as a style on the top-level layout provider. This is a functional requirement, not a theme class.

```tsx
<SidebarProvider style={{ direction: 'rtl' } as React.CSSProperties}>
  <Sidebar side="right">...</Sidebar>
  <SidebarInset>...</SidebarInset>
</SidebarProvider>
```

For non-sidebar layouts:

```tsx
<div style={{ direction: 'rtl' } as React.CSSProperties}>{children}</div>
```
