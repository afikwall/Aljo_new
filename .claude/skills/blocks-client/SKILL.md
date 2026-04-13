---
name: blocks-client
description: All data access and platform interaction in this project — entity CRUD (fetch, create, update, delete), executing backend actions, file uploads, current user info, page navigation, and AI chat. Load this skill any time the task involves reading or writing data, calling actions, handling user state, or navigating between pages. If the task touches data at all, this skill is needed.
user-invocable: false
---

# Blocks Client SDK Skill

Use this skill to interact with the Blocks platform - entity CRUD operations, action execution, file uploads, user management, navigation, and AI chat.

## When to Use

- User wants to fetch/store/update/delete data from entities
- User needs to execute backend actions (including AI actions)
- User needs file upload functionality
- User needs to access current user information
- User needs page navigation
- User needs AI chat interface
- Any interaction with the Blocks platform

## Overview

The **Blocks Client SDK** provides React hooks for interacting with the Blocks platform. Import from `@blocksdiy/blocks-client-sdk/reactSdk`. Entities and actions are imported from `@/product-types`.

A `<ClientProvider>` is already wrapping the app - call hooks directly without manual setup.

---

## Entity System

### Base Entity Type

Every entity instance has these system fields automatically:

```typescript
interface BaseEntityType {
  id: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  createdBy: string; // User ID
  updatedBy: string; // User ID
  updatedByAgentId: string;
}
```

### Typing Entity Instances

ALWAYS use `typeof EntityName['instanceType']` for typing:

```tsx
// CORRECT
useState<typeof ProductEntity['instanceType'] | null>(null)

// WRONG - never create custom interfaces for entities
interface Product { ... }  // DON'T DO THIS
```

### Entity Config Type

```typescript
type EntityConfig<InstanceType extends Record<string, any>> = {
  tableBlockId: string;
  instanceType: InstanceType;
};
```

---

## CRUD Hooks

### useEntityGetAll - Fetch Multiple

```tsx
import { useEntityGetAll } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { TaskEntity } from '@/product-types';

// Basic usage
const { data: tasks, isLoading } = useEntityGetAll(TaskEntity);

// With server-side filters (preferred for large/sensitive data)
const { data: myTasks } = useEntityGetAll(TaskEntity, {
  assignedTo: user.id,
  status: 'pending',
  projectId: projectId,
});

// With query options
const { data: tasks } = useEntityGetAll(
  TaskEntity,
  { projectId },
  {
    enabled: !!projectId, // Only fetch when projectId exists
  },
);

// Returns: { data, isLoading, error, refetch, isError, isFetched, isFetching, isSuccess, status }
```

### useEntityGetOne - Fetch Single

```tsx
import { useEntityGetOne } from '@blocksdiy/blocks-client-sdk/reactSdk';

const { data: product, isLoading } = useEntityGetOne(ProductEntity, {
  id: productId,
});
// Also supports other filters: { email: "user@example.com" }

// With conditional fetching
const { data } = useEntityGetOne(
  ProductEntity,
  { id: productId },
  {
    enabled: !!productId,
  },
);
```

### useEntityCreate - Create One

```tsx
import { useEntityCreate } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { toast } from 'sonner';

const { createFunction, isLoading } = useEntityCreate(TaskEntity);

const handleCreate = async () => {
  const newTask = await createFunction({
    data: { title: 'New Task', status: 'todo', assigneeId: user.id },
  });
  toast.success(`Task "${newTask.title}" created`);
};
```

### useEntityCreateMany - Create Multiple

```tsx
import { useEntityCreateMany } from '@blocksdiy/blocks-client-sdk/reactSdk';

const { createManyFunction, isLoading } = useEntityCreateMany(TaskEntity);

const handleBulkCreate = async () => {
  const tasks = await createManyFunction({
    data: [
      { title: 'Task 1', status: 'todo' },
      { title: 'Task 2', status: 'todo' },
    ],
  });
  toast.success(`Created ${tasks.length} tasks`);
};
```

### useEntityUpdate - Update One

```tsx
import { useEntityUpdate } from '@blocksdiy/blocks-client-sdk/reactSdk';

const { updateFunction, isLoading } = useEntityUpdate(ProductEntity);

const handleUpdate = async () => {
  const updated = await updateFunction({
    id: product.id,
    data: { name: newName, price: newPrice },
  });
  toast.success(`Updated "${updated.name}"`);
};
```

**WARNING**: NEVER use `useEntityUpdate(UserEntity)` - UserEntity is IMMUTABLE.

### useEntityDelete - Delete One

```tsx
import { useEntityDelete } from '@blocksdiy/blocks-client-sdk/reactSdk';

const { deleteFunction, isLoading } = useEntityDelete(TaskEntity);

const handleDelete = async () => {
  await deleteFunction({ id: taskId });
  toast.success('Task deleted');
};
```

> **Note:** `isLoading` from `useEntityDelete` is a single shared boolean — it's `true` while any delete is in-flight, not per-row. For per-row loading state in a list, track the deleting ID with local state:
>
> ```tsx
> const [deletingId, setDeletingId] = useState<string | null>(null);
> const handleDelete = async (id: string) => {
>   setDeletingId(id);
>   try {
>     await deleteFunction({ id });
>   } finally {
>     setDeletingId(null);
>   }
> };
> ```

> **Auto-refetch:** All CRUD hooks (`useEntityCreate`, `useEntityUpdate`, `useEntityDelete`) automatically invalidate and refetch `useEntityGetAll` for the same entity. No manual `refetch()` needed after mutations.

### useEntityDeleteMany - Delete Multiple

```tsx
import { useEntityDeleteMany } from '@blocksdiy/blocks-client-sdk/reactSdk';

const { deleteManyFunction, isLoading } = useEntityDeleteMany(TaskEntity);

const handleBulkDelete = async () => {
  await deleteManyFunction({ ids: selectedIds });
  toast.success(`Deleted ${selectedIds.length} items`);
};
```

---

## User Extension Entity Pattern

UserEntity is IMMUTABLE. For additional user fields, use extension entities with `email` column.

```tsx
const user = useUser();

// Step 1: Get user extension using EMAIL
const { data: profiles } = useEntityGetAll(UserProfileEntity, {
  email: user.email, // Use email for lookup
});
const profile = profiles?.[0];

// Step 2: Use extension entity ID for other entities
const { data: tasks } = useEntityGetAll(
  TaskEntity,
  {
    assignedProfileId: profile?.id, // Use profile ID, not email!
  },
  { enabled: !!profile?.id },
);

// Save: create if doesn't exist, update if does
const { createFunction } = useEntityCreate(UserProfileEntity);
const { updateFunction } = useEntityUpdate(UserProfileEntity);

const handleSave = async (formData) => {
  if (profile) {
    await updateFunction({ id: profile.id, data: formData });
  } else {
    await createFunction({
      data: { ...formData, email: user.email }, // MUST include email when creating
    });
  }
};
```

**Key rule**: Only user extension entities use `email`. Everything else uses the extension entity's `id`.

---

## Action Execution

### useExecuteAction

For backend operations, AI calls, and server-side logic:

```tsx
import { useExecuteAction } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { ProcessPaymentAction } from '@/product-types';

const {
  executeFunction,
  result,
  streamResult,
  isLoading,
  isDone,
  error,
  clear,
} = useExecuteAction(ProcessPaymentAction);

const handleSubmit = async () => {
  const response = await executeFunction({
    amount: 29.99,
    paymentMethod: 'credit_card',
    currency: 'USD',
  });
  if (response.success) {
    toast.success('Payment processed!');
  }
};
```

### Action Config Type

```typescript
type ActionConfig<InputType, OutputType> = {
  tableBlockId: string;
  inputInstanceType: InputType;
  outputInstanceType: OutputType;
};
```

### Return Values

- `result` - Final complete output after action finishes
- `streamResult` - Incrementally updated result during streaming (real-time)
- `isLoading` - Whether the action is executing
- `isDone` - Whether the action has completed
- `error` - Any error that occurred
- `clear()` - Reset result and streamResult

**NOTE**: Actions perform server requests. Avoid executing actions in `onChange` handlers that fire frequently.

### AI Action Example (Structured Output)

```tsx
import {
  AgentCallAction,
  IAgentCallActionInputStructuredOutputJsonSchemaObject,
} from '@/product-types';
import { useExecuteAction } from '@blocksdiy/blocks-client-sdk/reactSdk';

const schema: IAgentCallActionInputStructuredOutputJsonSchemaObject = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'tags'],
};

const { executeFunction, result, isLoading } =
  useExecuteAction(AgentCallAction);

await executeFunction({
  prompt: 'Analyze this product description...',
  modelName: 'gpt-4o-mini',
  tools: { webSearch: false, linkedIn: false },
  structuredOutputJsonSchema: schema,
});
```

---

## File Upload

```tsx
import { useFileUpload } from '@blocksdiy/blocks-client-sdk/reactSdk';

const { uploadFunction, isLoading, uploadPercentage } = useFileUpload();

const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (file) {
    const url = await uploadFunction(file);
    // url is a string - the uploaded file's URL
  }
};
```

---

## User & Authentication

```tsx
import {
  useUser,
  useGoogleLogin,
  useSendLoginLink,
  useChangeUserRole,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import { logOut } from '@/lib/utils';

// Get current user
const user = useUser();
// user.id, user.email, user.firstName, user.lastName, user.name
// user.isAuthenticated, user.role, user.permission ('build' | 'use')
// user.profileImageUrl  ← optional, use with AvatarImage (falls back to initials)

// Google OAuth
const googleLoginUrl = useGoogleLogin(); // Returns URL string

// Email magic link
const { sendLoginLink, isLoading } = useSendLoginLink();
await sendLoginLink({ email: 'user@example.com' });

// Logout
logOut(); // Clears token and redirects

// Role management (only 'build' permission users)
const { changeUserRoleFunction, isEnabled } = useChangeUserRole();
await changeUserRoleFunction({ userId: 'user-123', role: 'Manager' });
```

See the **roles-and-authentication** skill for detailed auth patterns.

---

## Theme Mode

```tsx
import { useThemeMode } from '@blocksdiy/blocks-client-sdk/reactSdk';

const { themeMode, setThemeMode } = useThemeMode();
// themeMode: "dark" | "light" | "system"
setThemeMode('dark');
```

---

## Navigation

```tsx
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router';
import { getPageUrl } from '@/lib/utils';

// Link component
<Link to={getPageUrl(dashboardPageConfig)}>Dashboard</Link>;

// With query params
const url = getPageUrl(productPageConfig, { id: '123' });
// Result: "/base-path/pages/product?id=123"

// Programmatic navigation
const navigate = useNavigate();
navigate(getPageUrl(thanksPageConfig));

// Read query params
const [searchParams] = useSearchParams();
const productId = searchParams.get('id');

// Current location
const location = useLocation();
const isLoginPage = location.pathname === getPageUrl(loginPageConfig);
```

**NEVER** use `window.location` or HTML `<a>` tags for internal navigation.

---

## AI Agent Chat

```tsx
import { useAgentChat } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { AgentChatSimple } from '@/components/ui/agent-chat';
import { CustomerSupportChatAgent } from '@/product-types';

function ChatPage() {
  const agentChat = useAgentChat(CustomerSupportChatAgent);

  return (
    <div className="h-screen overflow-hidden">
      <AgentChatSimple
        agentChat={agentChat}
        variant="bubble" // 'bubble' | 'minimal'
        size="lg" // 'sm' | 'md' | 'lg' (text size, not container)
        chatId="support-chat" // Unique ID for separate conversation threads
        chatContext={{ orderId: '123' }} // Context sent with every message
        chatContextFiles={[{ url, fileType, fileName }]} // Files sent as context
      />
    </div>
  );
}
```

**CRITICAL**: Chat container MUST have `overflow-hidden` AND defined height.

**Built-in voice mode**: The chat footer includes a mic button that switches to real-time voice conversation with a live waveform. Voice transcripts appear as chat messages. No extra configuration needed — voice is automatically available when the chat agent has a voice configuration.

---

## Data Filtering Best Practices

| Scenario                      | Approach                                      |
| ----------------------------- | --------------------------------------------- |
| User-specific data            | Server-side filter: `{ assignedTo: user.id }` |
| Large datasets                | Server-side filter                            |
| Security-sensitive data       | Server-side filter                            |
| Small public datasets         | Client-side filter OK                         |
| Instant search UX             | Client-side filter OK                         |
| Complex multi-faceted filters | Client-side filter OK                         |

---

## Quick Reference: All Hooks

| Hook                  | Import               | Purpose                  |
| --------------------- | -------------------- | ------------------------ |
| `useEntityGetAll`     | `reactSdk`           | Fetch multiple entities  |
| `useEntityGetOne`     | `reactSdk`           | Fetch single entity      |
| `useEntityCreate`     | `reactSdk`           | Create one entity        |
| `useEntityCreateMany` | `reactSdk`           | Create multiple entities |
| `useEntityUpdate`     | `reactSdk`           | Update one entity        |
| `useEntityDelete`     | `reactSdk`           | Delete one entity        |
| `useEntityDeleteMany` | `reactSdk`           | Delete multiple entities |
| `useExecuteAction`    | `reactSdk`           | Execute backend action   |
| `useFileUpload`       | `reactSdk`           | Upload files             |
| `useUser`             | `reactSdk`           | Get current user         |
| `useGoogleLogin`      | `reactSdk`           | Google OAuth URL         |
| `useSendLoginLink`    | `reactSdk`           | Send email login link    |
| `useChangeUserRole`   | `reactSdk`           | Change user roles        |
| `useThemeMode`        | `reactSdk`           | Dark/light/system mode   |
| `useAgentChat`        | `reactSdk`           | AI chat instance         |
| `getPageUrl`          | `@/lib/utils`        | Generate page URLs       |
| `logOut`              | `@/lib/utils`        | Log out user             |
| `cn`                  | `@/lib/utils`        | Merge class names        |
| `useIsMobile`         | `@/hooks/use-mobile` | Mobile detection         |
