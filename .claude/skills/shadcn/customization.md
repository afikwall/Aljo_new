# Customization & Theming

Components reference semantic CSS variable tokens. In this project, treat token definitions as provided and focus on correct token usage in app code.

> **Project override (explicit):**
>
> - Do not run mutating shadcn CLI commands (`init`, `add`, `--overwrite`).
> - Do not edit `src/components/ui/**`.
> - Treat the boilerplate theming setup as given; focus on token-aware usage in app code.
> - Do not add `ThemeProvider`/`next-themes` or custom provider wrappers for theme mode in generated app code.
> - For dark/light/system switching UI, use `useThemeMode` from `@blocksdiy/blocks-client-sdk/reactSdk`.

## Contents

- How it works (CSS variables → Tailwind utilities → components)
- Color variables and OKLCH format
- Dark mode setup
- Using existing semantic tokens in app code
- **Styling priority** (when to use className vs style prop vs custom colors)
- CSS animations
- Border radius
- Customizing app UI (variants, className, wrappers)
- Read-only CLI usage

---

## How It Works

1. CSS variables defined in `:root` (light) and `.dark` (dark mode).
2. Tailwind maps them to utilities: `bg-primary`, `text-muted-foreground`, etc.
3. Components use these utilities — changing a variable changes all components that reference it.

---

## Color Variables

Every color follows the `name` / `name-foreground` convention. The base variable is for backgrounds, `-foreground` is for text/icons on that background.

| Variable                                     | Purpose                          |
| -------------------------------------------- | -------------------------------- |
| `--background` / `--foreground`              | Page background and default text |
| `--card` / `--card-foreground`               | Card surfaces                    |
| `--primary` / `--primary-foreground`         | Primary buttons and actions      |
| `--secondary` / `--secondary-foreground`     | Secondary actions                |
| `--muted` / `--muted-foreground`             | Muted/disabled states            |
| `--accent` / `--accent-foreground`           | Hover and accent states          |
| `--destructive` / `--destructive-foreground` | Error and destructive actions    |
| `--border`                                   | Default border color             |
| `--input`                                    | Form input borders               |
| `--ring`                                     | Focus ring color                 |
| `--chart-1` through `--chart-5`              | Chart/data visualization         |
| `--sidebar-*`                                | Sidebar-specific colors          |
| `--surface` / `--surface-foreground`         | Secondary surface                |

Colors use OKLCH: `--primary: oklch(0.205 0 0)` where values are lightness (0–1), chroma (0 = gray), and hue (0–360).

---

## Dark Mode

For app-level theme switching in this project, use `useThemeMode` from `@blocksdiy/blocks-client-sdk/reactSdk` and semantic tokens.

Do not implement custom theme persistence, root class toggling logic, or provider-level theme wiring in generated app code.

```tsx
import { useThemeMode } from '@blocksdiy/blocks-client-sdk/reactSdk';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

function ThemeSwitcher() {
  const { themeMode, setThemeMode } = useThemeMode();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">{themeMode}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setThemeMode('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setThemeMode('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setThemeMode('system')}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Using Existing Semantic Tokens in App Code

Use semantic classes in custom wrappers and plain HTML blocks:

```tsx
<section className="bg-background text-foreground">
  <p className="text-muted-foreground">Subtitle</p>
  <div className="border border-border bg-card text-card-foreground">...</div>
</section>
```

For shadcn primitives, prefer variants/props first and only add layout-focused `className` when needed.

---

## Styling Priority

Apply colors in this order — hardcoded values break dark mode and bypass theming:

**1. Tailwind semantic utilities / shadcn variants** — always try this first:

```tsx
<p className="text-muted-foreground" />
<div className="bg-card border border-border rounded-lg" />
<Button variant="outline" />
```

**2. Tailwind v3 opacity modifiers and gradients** — covers most tinted surfaces:

```tsx
<div className="bg-primary/10 border border-primary/20" />
<div className="bg-gradient-to-r from-primary to-accent" />
<div className="bg-gradient-to-br from-primary/20 to-transparent" />
```

**3. `style` prop with token references** — last resort for effects Tailwind can't express (radial gradients, complex shadows). Always use `hsl(var(--token))`, never raw hex:

```tsx
<div
  style={{
    background:
      'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.15), transparent 70%)',
    boxShadow: '0 8px 30px hsl(var(--primary) / 0.25)',
  }}
/>
// hsl(var(--primary))        → full opacity
// hsl(var(--primary) / 0.1) → 10% opacity
```

**❌ Hardcoded colors** (`#ff5733`, `rgba(...)`, `bg-orange-500`) — never, unless the user explicitly asks for a specific color.

---

## CSS Animations

Don't inject keyframes via a `<style>` tag in JSX. Use `animate-pulse`, `animate-bounce`, `animate-spin`, or `animate-ping` instead. If those don't fit, simplify the design — `tailwind.config.*` is immutable.

---

## Border Radius

`--radius` controls border radius globally. Components derive values from it (`rounded-lg` = `var(--radius)`, `rounded-md` = `calc(var(--radius) - 2px)`).

---

## Customizing App UI

Prefer these approaches in order:

### 1. Built-in variants

```tsx
<Button variant="outline" size="sm">
  Click
</Button>
```

### 2. Tailwind classes via `className`

```tsx
<Card className="max-w-md mx-auto">...</Card>
```

### 3. Wrapper components

Compose shadcn/ui primitives into higher-level components:

```tsx
export function ConfirmDialog({ title, description, onConfirm, children }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

## Read-only CLI Usage

Use CLI only for read-only context:

```bash
npx shadcn@latest info --json
npx shadcn@latest docs button dialog select
npx shadcn@latest search @shadcn -q "sidebar"
npx shadcn@latest view @shadcn/button
```
