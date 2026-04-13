---
name: roles-and-authentication
description: Authentication flows, login/signup pages, role-based access control, and user-aware UI in this project — using useUser(), useGoogleLogin(), useSendLoginLink(), useChangeUserRole(), and logOut(). Load this skill whenever the task involves login, logout, Google OAuth, magic link email auth, protecting pages, showing different UI per user role, or anything that depends on who the current user is.
user-invocable: false
---

# Roles and Authentication Skill

Use this skill to implement authentication flows, role-based access control, login/signup pages, and user-aware UI patterns.

## When to Use

- User requests login/signup pages
- User wants Google OAuth or email magic link authentication
- User needs role-based UI (different experiences per role)
- User asks about protecting pages for authenticated users
- User needs user menus, logout, or auth-aware layouts
- User wants admin role management features

## Authentication Hooks & Utilities

### Available Imports

```tsx
// Authentication hooks
import {
  useUser,
  useGoogleLogin,
  useSendLoginLink,
  useChangeUserRole,
} from '@blocksdiy/blocks-client-sdk/reactSdk';

// Utilities
import { getPageUrl, logOut } from '@/lib/utils';

// Routing
import { useNavigate, useLocation, Link } from 'react-router';
```

### Hook Reference

| Hook / Utility        | Import From                             | Purpose                                   |
| --------------------- | --------------------------------------- | ----------------------------------------- |
| `useUser()`           | `@blocksdiy/blocks-client-sdk/reactSdk` | Get current user object (read-only)       |
| `useGoogleLogin()`    | `@blocksdiy/blocks-client-sdk/reactSdk` | Get Google OAuth URL                      |
| `useSendLoginLink()`  | `@blocksdiy/blocks-client-sdk/reactSdk` | Send passwordless email login link        |
| `useChangeUserRole()` | `@blocksdiy/blocks-client-sdk/reactSdk` | Change user roles (build-permission only) |
| `logOut()`            | `@/lib/utils`                           | Log out current user                      |

### Type Definitions

```typescript
// useUser() return type
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  isAuthenticated: boolean;
  role?: string; // Only present if roles exist - matches RoleBlock names
  permission: 'build' | 'use'; // 'build' can modify app config
}

// useGoogleLogin() return type
const googleLoginUrl: string; // Google OAuth URL

// useSendLoginLink() return type
interface SendLoginLinkReturn {
  sendLoginLink: ({ email }: { email: string }) => Promise<void>;
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
}

// useChangeUserRole() return type
interface ChangeUserRoleReturn {
  changeUserRoleFunction: ({
    userId,
    role,
  }: {
    userId: string;
    role: string;
  }) => Promise<User>;
  isLoading: boolean;
  isEnabled: boolean; // Whether current user has permission
  error: Error | null;
}
```

---

## CRITICAL RULES

### User Data is IMMUTABLE

- ALL user properties are READ-ONLY from the frontend
- The server controls user data - the app only observes it
- `role` can ONLY be updated via `useChangeUserRole` hook by users with `permission === 'build'`

### ABSOLUTELY FORBIDDEN Patterns

- **NEVER** use `useEntityCreate(UserEntity)` - UserEntity cannot be created
- **NEVER** use `useEntityUpdate(UserEntity)` - UserEntity cannot be updated
- **NEVER** create forms to edit user email, name, or role
- **NEVER** create role switchers, dropdowns, or selects to "change role"
- **NEVER** create "Switch to Manager view" or "Act as Employee" buttons
- **NEVER** create "View as..." toggles or role selection screens
- **NEVER** store role in state or try to modify `user.role`

### CORRECT Authentication Patterns

- **DO** build custom login/signup pages
- **DO** use `useGoogleLogin()` for Google OAuth
- **DO** use `useSendLoginLink()` for email magic links
- **DO** use `logOut()` from `@/lib/utils` for logout
- **DO** use `useNavigate()` with auth URLs for redirects
- **DO** use `Link` component with auth URLs for navigation
- **DO** use `toast.success()` from `sonner` for transient success feedback (e.g. after sending login link). Never build custom colored divs for success/error states — if an inline callout is needed, use `<Alert>` from `@/components/ui/alert`, not raw `bg-green-*` classes.

---

## Complete Login Page Example

```tsx
import {
  useUser,
  useGoogleLogin,
  useSendLoginLink,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Link } from 'react-router';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getPageUrl } from '@/lib/utils';

export default function LoginPage() {
  const user = useUser();
  const navigate = useNavigate();
  const googleLoginUrl = useGoogleLogin();
  const { sendLoginLink, isLoading } = useSendLoginLink();
  const [email, setEmail] = useState('');

  // CRITICAL: Redirect authenticated users to dashboard
  useEffect(() => {
    if (user.isAuthenticated) {
      navigate(getPageUrl(dashboardPageConfig));
    }
  }, [user.isAuthenticated, navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    await sendLoginLink({ email });
    toast.success('Check your email for the login link!');
    setEmail('');
  };

  if (user.isAuthenticated) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Sign in to continue</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link to={googleLoginUrl}>
            <Button variant="outline" className="w-full">
              <img
                className="mr-2 size-4"
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
              />
              Continue with Google
            </Button>
          </Link>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
              Or
            </span>
          </div>

          <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Login Link'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Protected Page Pattern

```tsx
import { useUser } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { useNavigate } from 'react-router';
import { getPageUrl } from '@/lib/utils';
import { useEffect } from 'react';

function ProtectedPage() {
  const user = useUser();
  const navigate = useNavigate();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!user.isAuthenticated) {
      const loginPageUrl = getPageUrl(loginPageConfig);
      navigate(loginPageUrl);
    }
  }, [user.isAuthenticated, navigate]);

  if (!user.isAuthenticated) {
    return null; // or loading spinner while redirecting
  }

  return <ProtectedContent />;
}
```

---

## Authentication-Aware Layout

For building `src/layout.tsx` with auth-aware branching, load the **app-layout** skill — it has the complete sidebar + auth pattern with all correct imports and structure. The core logic: always render `children`, branch on `user.isAuthenticated` and `user.role`, never redirect from layout.

---

## User Menu with Logout

```tsx
import { useUser } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { Link } from 'react-router';
import { getPageUrl, logOut } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function UserMenu() {
  const user = useUser();

  if (!user.isAuthenticated) {
    const loginPageUrl = getPageUrl(loginPageConfig);
    return (
      <Link to={loginPageUrl}>
        <Button>Sign In</Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">{user.firstName || 'User'}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>{user.email}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logOut()}>Sign Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Role-Based UI

### When to Use Roles

- **0 or 1 roles = Single-role app** - Don't check `user.role` anywhere
- **2+ roles = Multi-role app** - Must check `user.role` for different experiences
- **Most apps have ZERO roles** - all users get the same experience
- **Exception — portals & scoped apps**: If users see content scoped to an entity via a linkage table (e.g., ClientUsers mapping email → clientId), the app inherently has 2 roles: Admin (manages entities + linkages) and end-user. This applies to client portals, tenant dashboards, patient portals, etc.

### Role Implementation Guidelines

- Each role represents a fundamentally different user persona
- Smart sharing is GOOD - reuse components with role-based props/behavior
- Think of it as building role-specific user journeys within a unified app
- Each role should feel tailored while maintaining good code architecture

### Role-Based Page Example

```tsx
import { useUser } from '@blocksdiy/blocks-client-sdk/reactSdk';

function OrdersPage() {
  const user = useUser();

  // Role determines WHAT they see, not WHETHER they can access
  if (user.role === 'Seller') {
    return <SellerOrderManagement />; // Can fulfill orders
  }
  if (user.role === 'Buyer') {
    return <BuyerOrderHistory />; // Can only view their orders
  }
}
```

### Role-Based Component Adaptation

```tsx
function OrderCard({ order }) {
  const user = useUser();

  return (
    <Card>
      <OrderDetails {...order} />
      {user.role === 'Seller' && <FulfillmentActions orderId={order.id} />}
      {user.role === 'Buyer' && <ReorderButton orderId={order.id} />}
    </Card>
  );
}
```

### Role-Based Layout

```tsx
function AppLayout({ children }) {
  const user = useUser();

  if (user.role === 'Manager') {
    return <ManagerLayout>{children}</ManagerLayout>;
  }
  if (user.role === 'Employee') {
    return <EmployeeLayout>{children}</EmployeeLayout>;
  }

  // Default layout
  return <DefaultLayout>{children}</DefaultLayout>;
}
```

### Portal / Scoped App Layout

For apps where users see content scoped to an entity (client portal, tenant dashboard, patient portal). The layout must branch on **role + linkage** — never show a dead-end when a user has no linked entity.

```tsx
// ❌ WRONG: the app owner logs in, has no linked client, sees this forever
if (!client) return <div>Portal Not Configured. Contact admin.</div>;

// ✅ CORRECT: branch on role + linkage
if (!client && user.role === 'Admin')
  return <AdminLayout>{children}</AdminLayout>;
if (!client) return <AccessPendingScreen />;
return <ClientPortalLayout client={client}>{children}</ClientPortalLayout>;
```

---

## Admin Role Management (Rare - Only When Needed)

Only implement when the app specifically requires dynamic role assignment (admin panels, user management).

```tsx
import {
  useEntityGetAll,
  useChangeUserRole,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import { UserEntity } from '@/product-types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function UsersTable() {
  const { data: users } = useEntityGetAll(UserEntity);
  const { changeUserRoleFunction, isEnabled: isChangeUserRoleEnabled } =
    useChangeUserRole();

  return (
    <ul>
      {users?.map((user) => (
        <li key={user.id}>
          {user.name}
          {isChangeUserRoleEnabled ? (
            <Select
              value={user.role}
              onValueChange={(role) =>
                changeUserRoleFunction({ userId: user.id, role })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Employee">Employee</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            user.role
          )}
        </li>
      ))}
    </ul>
  );
}
```

---

## Role Implementation Validation Checklist

Before completing ANY multi-role app, verify:

- Each role has a distinct user journey and appropriate features
- Major pages provide role-specific functionality (not just hidden buttons)
- Navigation reflects what each role needs to accomplish
- Shared components are thoughtfully adapted (via props/logic) per role
- Forms, tables, and lists show role-relevant data and actions
- NO "role switcher" UI exists anywhere (roles are immutable)
- Good balance between code reuse and role differentiation
