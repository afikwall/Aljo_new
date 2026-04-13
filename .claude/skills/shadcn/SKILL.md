---
name: shadcn
description: Guides usage of preinstalled shadcn/ui primitives in this project — searching docs, verifying APIs, and composing app UI from immutable components. Applies when working with shadcn/ui component usage and composition. In this project, mutating CLI operations are forbidden: do not run `init`, `add`, `--overwrite`, or any file-writing shadcn command.
user-invocable: false
---

# shadcn/ui

A framework for building UI with composable primitives. In this project, primitives are preinstalled and immutable.

> **IMPORTANT:** Use CLI for read-only context only (`info`, `search`, `docs`, `view`). Do not run mutating shadcn commands in this project.

## Current Project Context

```json
{
  "project": {
    "framework": "Vite",
    "frameworkName": "vite",
    "frameworkVersion": null,
    "srcDirectory": true,
    "rsc": false,
    "typescript": true,
    "tailwindVersion": "v3",
    "tailwindConfig": "tailwind.config.ts",
    "tailwindCss": "src/index.css",
    "importAlias": "@"
  },
  "config": {
    "style": "default",
    "base": "radix",
    "rsc": false,
    "typescript": true,
    "iconLibrary": "lucide",
    "rtl": false,
    "menuColor": null,
    "menuAccent": null,
    "aliases": {
      "components": "@/components",
      "utils": "@/lib/utils",
      "ui": "@/components/ui",
      "lib": "@/lib",
      "hooks": "@/hooks"
    }
  },
  "components": [
    "accordion",
    "alert-dialog",
    "alert",
    "aspect-ratio",
    "avatar",
    "badge",
    "breadcrumb",
    "button",
    "calendar",
    "card",
    "carousel",
    "chart",
    "checkbox",
    "collapsible",
    "combobox",
    "command",
    "context-menu",
    "dialog",
    "drawer",
    "dropdown-menu",
    "field",
    "form",
    "hover-card",
    "input-otp",
    "input",
    "label",
    "menubar",
    "navigation-menu",
    "pagination",
    "popover",
    "progress",
    "radio-group",
    "resizable",
    "scroll-area",
    "select",
    "separator",
    "sheet",
    "sidebar",
    "skeleton",
    "slider",
    "sonner",
    "switch",
    "table",
    "tabs",
    "textarea",
    "toggle-group",
    "toggle",
    "tooltip"
  ]
}
```

The JSON above contains the project config and installed components. Use `npx shadcn@latest docs <component>` to get documentation and example URLs for component usage.

## Principles

1. **Use existing components first.** Compose UI from preinstalled primitives under `@/components/ui/**`.
2. **Compose, don't reinvent.** Settings page = Tabs + Card + form controls. Dashboard = Sidebar + Card + Chart + Table.
3. **Use built-in variants before custom styles.** `variant="outline"`, `size="sm"`, etc.
4. **Use semantic colors.** `bg-primary`, `text-muted-foreground` — never raw values like `bg-blue-500`.

## Critical Rules

These rules are **always enforced**. Each links to a file with Incorrect/Correct code pairs.

- **Project override (explicit):** Do not modify `src/components/ui/**` in this project.
- **Project override (explicit):** Do not add, regenerate, or update shadcn primitives in this project.
- **Project override (explicit):** Do not edit global theme/CSS files for shadcn setup; consume existing tokens and component theming as provided.
- **Project override (explicit):** This boilerplate uses radix primitives by default. Follow radix usage patterns.
- **Project override (explicit):** For dark/light/system mode controls, use `useThemeMode` from `@blocksdiy/blocks-client-sdk/reactSdk` in app code. Do not introduce `ThemeProvider`/`next-themes` or custom theme provider wiring.

### Styling & Tailwind

- **`className` for layout, not styling.** Never override component colors or typography.
- **No `space-x-*` or `space-y-*`.** Use `flex` with `gap-*`. For vertical stacks, `flex flex-col gap-*`.
- **Use `size-*` when width and height are equal.** `size-10` not `w-10 h-10`.
- **Use `truncate` shorthand.** Not `overflow-hidden text-ellipsis whitespace-nowrap`.
- **No manual `dark:` color overrides.** Use semantic tokens (`bg-background`, `text-muted-foreground`).
- **Use `cn()` for conditional classes.** Don't write manual template literal ternaries.
- **No manual `z-index` on overlay components.** Dialog, Sheet, Popover, etc. handle their own stacking.

### Forms & Inputs → [forms.md](./rules/forms.md)

- **Forms use `FieldGroup` + `Field`.** Never use raw `div` with `space-y-*` or `grid gap-*` for form layout.
- **Input + button / search bars** — no `InputGroup` primitive here; use `flex` + `gap-*` or a `relative` wrapper. See [forms.md](./rules/forms.md).
- **Option sets (2–7 choices) use `ToggleGroup`.** Don't loop `Button` with manual active state.
- **`FieldSet` + `FieldLegend` for grouping related checkboxes/radios.** Don't use a `div` with a heading.
- **Field validation uses `data-invalid` + `aria-invalid`.** `data-invalid` on `Field`, `aria-invalid` on the control. For disabled: `data-disabled` on `Field`, `disabled` on the control.

### Component Structure → [composition.md](./rules/composition.md)

- **Items always inside their Group.** `SelectItem` → `SelectGroup`. `DropdownMenuItem` → `DropdownMenuGroup`. `CommandItem` → `CommandGroup`.
- **Use radix `asChild` composition for custom triggers.** Base-only APIs are out of scope for this project. → [base-vs-radix.md](./rules/base-vs-radix.md)
- **Dialog, Sheet, and Drawer always need a Title.** `DialogTitle`, `SheetTitle`, `DrawerTitle` required for accessibility. Use `className="sr-only"` if visually hidden.
- **Use full Card composition.** `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`. Don't dump everything in `CardContent`.
- **Button has no `isPending`/`isLoading`.** Compose with `Loader2` from `lucide-react` (`animate-spin`) + `data-icon` + `disabled`.
- **`TabsTrigger` must be inside `TabsList`.** Never render triggers directly in `Tabs`.
- **`Avatar` always needs `AvatarFallback`.** For when the image fails to load.

### Use Components, Not Custom Markup → [composition.md](./rules/composition.md)

- **Use existing components before custom markup.** Check if a component exists before writing a styled `div`.
- **Callouts use `Alert`.** Don't build custom styled divs.
- **Empty states** — there is no `Empty` primitive; compose with `Card`, `text-muted-foreground`, and optional `Button`. See [composition.md](./rules/composition.md).
- **Toast via `sonner`.** Use `toast()` from `sonner`.
- **Use `Separator`** instead of `<hr>` or `<div className="border-t">`.
- **Use `Skeleton`** for loading placeholders. No custom `animate-pulse` divs.
- **Use `Badge`** instead of custom styled spans.

### Icons → [icons.md](./rules/icons.md)

- **Icons in `Button` use `data-icon`.** `data-icon="inline-start"` or `data-icon="inline-end"` on the icon.
- **No sizing classes on icons inside components.** Components handle icon sizing via CSS. No `size-4` or `w-4 h-4`.
- **Pass icons as objects, not string keys.** `icon={CheckIcon}`, not a string lookup.

### CLI

- **Project override (explicit):** In this project, do not run mutating commands such as `init`, `add`, `--overwrite`, or any command that writes files.
- Allowed commands are read-only: `info`, `search`, `docs`, `view`.

## Key Patterns

These are the most common patterns that differentiate correct shadcn/ui code. For edge cases, see the linked rule files above.

### Available Semantic Tokens

These are the valid semantic Tailwind classes in this project. Use them exclusively — never raw palette values like `bg-blue-500`.

| Token class                                  | Use for                          |
| -------------------------------------------- | -------------------------------- |
| `bg-background` / `text-foreground`          | Page background and default text |
| `bg-card` / `text-card-foreground`           | Card surfaces                    |
| `bg-primary` / `text-primary-foreground`     | Primary buttons and actions      |
| `bg-secondary` / `text-secondary-foreground` | Secondary actions                |
| `bg-muted` / `text-muted-foreground`         | Muted/disabled states            |
| `bg-accent` / `text-accent-foreground`       | Hover and accent states          |
| `text-destructive`                           | Error/destructive text           |
| `border-border`                              | Default borders                  |
| `border-input`                               | Form input borders               |
| `bg-surface` / `text-surface-foreground`     | Secondary surfaces               |

For charts, use `hsl(var(--chart-1))` through `hsl(var(--chart-5))` in inline styles, or `bg-chart-1` through `bg-chart-5` as Tailwind classes.

If a needed semantic color doesn't exist (e.g. "success green"), use a `Badge` variant or component prop instead of reaching for a raw palette class. Ask before introducing new CSS token work.

See [customization.md](./customization.md) for the complete token reference and theming guide.

### Colors — always semantic, never raw palette

```tsx
// ❌ Raw palette colors — NEVER
<div className="bg-blue-500 text-white">
<p className="text-gray-600">
<span className="text-emerald-600">+20.1%</span>
<span className="text-red-600">Error</span>

// ✅ Semantic tokens — ALWAYS
<div className="bg-primary text-primary-foreground">
<p className="text-muted-foreground">
<Badge variant="secondary">+20.1%</Badge>
<span className="text-destructive">Error</span>
```

### className — layout only, never colors or typography overrides

```tsx
// ❌ WRONG — overriding component colors via className
<Card className="bg-blue-100 text-blue-900 font-bold">
<Button className="bg-green-500 hover:bg-green-600 text-white">
<Badge className="bg-yellow-200 text-yellow-800">

// ✅ CORRECT — className only for layout/sizing
<Card className="max-w-md mx-auto mt-4">
<Button variant="outline">         {/* use built-in variants */}
<Badge variant="secondary">        {/* use built-in variants */}
```

### No dark: manual overrides — semantic tokens handle it

```tsx
// ❌ WRONG — manual dark mode
<div className="bg-white dark:bg-gray-950 text-black dark:text-white">

// ✅ CORRECT — semantic tokens adapt automatically
<div className="bg-background text-foreground">
```

### Conditional classes — cn(), not template literals

```tsx
// ❌ WRONG
<div className={`flex items-center ${isActive ? "bg-primary text-primary-foreground" : "bg-muted"}`}>

// ✅ CORRECT
import { cn } from "@/lib/utils"
<div className={cn("flex items-center", isActive ? "bg-primary text-primary-foreground" : "bg-muted")}>
```

### Spacing — gap-_, not space-x-_/space-y-\*

```tsx
<div className="flex flex-col gap-4">  // ✅ correct
<div className="space-y-4">           // ❌ wrong
```

### Equal dimensions — size-_, not w-_ h-\*

```tsx
<Avatar className="size-10">   // ✅ correct
<Avatar className="w-10 h-10"> // ❌ wrong
```

### Built-in variants first — never recreate what variants already do

```tsx
// ❌ WRONG — manually recreating the outline variant
<Button className="border border-input bg-transparent hover:bg-accent">
  Click me
</Button>

// ✅ CORRECT — use the variant
<Button variant="outline">Click me</Button>
```

### Form layout — FieldGroup + Field, not div + Label

```tsx
// ✅ correct
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="email">Email</FieldLabel>
    <Input id="email" />
  </Field>
</FieldGroup>
```

### Validation state — data-invalid on Field, aria-invalid on control

```tsx
<Field data-invalid>
  <FieldLabel>Email</FieldLabel>
  <Input aria-invalid />
  <FieldDescription>Invalid email.</FieldDescription>
</Field>
```

### Icons in Button — data-icon attribute, no sizing classes

```tsx
// ✅ correct
<Button>
  <SearchIcon data-icon="inline-start" />
  Search
</Button>

// ❌ wrong
<Button>
  <SearchIcon className="mr-2 size-4" />
  Search
</Button>
```

## Component Selection

| Need                       | Use                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Button/action              | `Button` with appropriate variant                                                                           |
| Form inputs                | `Input`, `Select`, `Combobox`, `Switch`, `Checkbox`, `RadioGroup`, `Textarea`, `InputOTP`, `Slider`         |
| Toggle between 2–5 options | `ToggleGroup` + `ToggleGroupItem`                                                                           |
| Data display               | `Table`, `Card`, `Badge`, `Avatar`                                                                          |
| Navigation                 | `Sidebar`, `NavigationMenu`, `Breadcrumb`, `Tabs`, `Pagination`                                             |
| Overlays                   | `Dialog` (modal), `Sheet` (side panel), `Drawer` (bottom sheet), `AlertDialog` (confirmation)               |
| Feedback                   | `sonner` (toast), `Alert`, `Progress`, `Skeleton`; button loading → `Loader2` + `animate-spin` + `disabled` |
| Command palette            | `Command` inside `Dialog`                                                                                   |
| Charts                     | `Chart` (wraps Recharts)                                                                                    |
| Layout                     | `Card`, `Separator`, `Resizable`, `ScrollArea`, `Accordion`, `Collapsible`                                  |
| Empty states               | `Card` + muted copy + optional `Button` (no dedicated empty primitive)                                      |
| Menus                      | `DropdownMenu`, `ContextMenu`, `Menubar`                                                                    |
| Tooltips/info              | `Tooltip`, `HoverCard`, `Popover`                                                                           |

## Key Fields

The injected project context contains these key fields:

- **`aliases`** → use the actual alias prefix for imports (e.g. `@/`, `~/`), never hardcode.
- **`base`** → primitive library (`radix` or `base`). Affects component APIs and available props.
- **`iconLibrary`** → determines icon imports. Use `lucide-react` for `lucide`, `@tabler/icons-react` for `tabler`, etc. Never assume `lucide-react`.
- **`resolvedPaths`** → exact file-system destinations for components, utils, hooks, etc.
- **`framework`** → routing and file conventions (e.g. Next.js App Router vs Vite SPA).

See [cli.md — `info` command](./cli.md) for the full field reference.

## Component Docs, Examples, and Usage

Run `npx shadcn@latest docs <component>` to get the URLs for a component's documentation, examples, and API reference. Fetch these URLs to get the actual content.

```bash
npx shadcn@latest docs button dialog select
```

**When using a component, run `npx shadcn@latest docs` and fetch the URLs first.** This ensures correct API usage patterns rather than guessing.

## Workflow

> **Project override (explicit):** For this project, only read-only CLI steps are executable. Any step that mutates shadcn/component files is reference-only and must be skipped.

1. **Get project context** — already injected above. Run `npx shadcn@latest info` again if you need to refresh.
2. **Check installed components first** — use the `components` list from project context or `resolvedPaths.ui`. Import only what already exists.
3. **Find components** — `npx shadcn@latest search`.
4. **Get docs and examples** — run `npx shadcn@latest docs <component>` to get URLs, then fetch them. Use `npx shadcn@latest view` for read-only registry inspection when needed.
5. **Implement in app code only** — compose with existing primitives in `src/pages`, `src/components`, `src/hooks`, `src/utils`, and `src/layout.tsx`.

## Pre-submit Quality Gate

Before finalizing any UI change in app code, run a quick raw-color audit and fix all hits unless the user explicitly asked for raw palette classes.

```bash
rg -n 'class(Name)?\\s*=\\s*\\{?\\s*[`"\\x27][^`"\\x27]*(bg|text|border|ring|from|to|via|stroke|fill)-[a-z]+-[0-9]{2,3}[^`"\\x27]*[`"\\x27]' src/pages src/components src/layout.tsx
rg -n 'class(Name)?\\s*=\\s*\\{?\\s*[`"\\x27][^`"\\x27]*(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|rgb\\(|rgba\\(|hsl\\(|hsla\\(|oklch\\()[^`"\\x27]*[`"\\x27]' src/pages src/components src/layout.tsx
```

- If either command returns matches: replace with semantic tokens, variants, or existing component APIs; then rerun audit.
- This gate is required on every UI task in this project unless an explicit user override applies.
- Use judgment to avoid false positives in non-color utility classes.

### Explicit Override Protocol (Rare Cases)

Raw palette classes are allowed only when the user explicitly asks for them. When that happens:

1. State that an explicit user override is being applied.
2. Keep raw classes scoped to only the requested UI area.
3. Avoid introducing raw colors into shared wrappers/layout defaults when a semantic token is available.

## Quick Reference

```bash
# Read-only commands (allowed in this project):
npx shadcn@latest info --json
npx shadcn@latest search @shadcn -q "sidebar"
npx shadcn@latest docs button dialog select
npx shadcn@latest view @shadcn/button

# Search registries.
npx shadcn@latest search @shadcn -q "sidebar"
npx shadcn@latest search @tailark -q "stats"

# Get component docs and example URLs.
npx shadcn@latest docs button dialog select

# View registry item details (for items not yet installed).
npx shadcn@latest view @shadcn/button
```

Mutating commands (`init`, `add`, update/overwrite flows) are intentionally excluded for this project.

## Detailed References

- [rules/forms.md](./rules/forms.md) — FieldGroup, Field, input/button layout, ToggleGroup, FieldSet, validation states
- [rules/composition.md](./rules/composition.md) — Groups, overlays, Card, Tabs, Avatar, Alert, empty-state composition, Toast, Separator, Skeleton, Badge, Button loading
- [rules/icons.md](./rules/icons.md) — data-icon, icon sizing, passing icons as objects
- [rules/base-vs-radix.md](./rules/base-vs-radix.md) — Project radix usage patterns
- [cli.md](./cli.md) — Commands, flags, presets, templates
- [customization.md](./customization.md) — Theming, CSS variables, and extending components (app-level composition only; no primitive mutation)
