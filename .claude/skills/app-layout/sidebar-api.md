# Shadcn Sidebar API

The shadcn Sidebar is more versatile than its default appearance. It supports multiple visual styles, collapsible modes, and placement — use these to match the design rather than always defaulting to the standard look.

---

## Visual Variants

Pass `variant` to `<Sidebar>`:

| Variant               | Look                                                  | Good for                      |
| --------------------- | ----------------------------------------------------- | ----------------------------- |
| `"sidebar"` (default) | Flush with edge, pushes content                       | Most apps                     |
| `"floating"`          | Elevated card with rounded corners                    | Softer / consumer-facing apps |
| `"inset"`             | Inset within the page, content has a raised-card feel | Dashboard / tool apps         |

```tsx
<Sidebar variant="floating">...</Sidebar>
<Sidebar variant="inset">...</Sidebar>
```

---

## Collapsible Modes

Pass `collapsible` to `<Sidebar>`:

| Mode                    | Behavior                             | Good for                     |
| ----------------------- | ------------------------------------ | ---------------------------- |
| `"offcanvas"` (default) | Slides off-screen when collapsed     | Standard toggle              |
| `"icon"`                | Collapses to a narrow icon-only rail | Power-user tools, dense apps |
| `"none"`                | Never collapses                      | Permanently visible nav      |

```tsx
<Sidebar collapsible="icon">...</Sidebar>   // icon rail when collapsed
<Sidebar collapsible="none">...</Sidebar>   // no toggle, always visible
```

**Icon-rail:** when `collapsible="icon"`, wrap icon + label in `SidebarMenuButton` — the label auto-hides when collapsed:

```tsx
<SidebarMenuButton asChild isActive={isActive}>
  <Link to={item.url}>
    <item.icon />
    <span>{item.title}</span> {/* hides automatically when icon-only */}
  </Link>
</SidebarMenuButton>
```

---

## Placement

```tsx
<Sidebar side="left">...</Sidebar>   // default
<Sidebar side="right">...</Sidebar>
```

---

## Required Structure

```tsx
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

<SidebarProvider>
  <Sidebar>
    <SidebarHeader>
      {/* logo, app name, workspace switcher, etc. */}
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive}>
                <Link to={url}>
                  <Icon />
                  <span>Label</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>{/* user menu, logout, settings link */}</SidebarFooter>
  </Sidebar>

  <SidebarInset>
    {' '}
    {/* this IS the <main> — never wrap in another <main> */}
    <SidebarTrigger />
    {children}
  </SidebarInset>
</SidebarProvider>;
```

---

## SidebarTrigger Placement

`<SidebarTrigger />` can go anywhere — inside a header bar, floating, or omitted when `collapsible="none"`. Put it where it makes visual sense.

```tsx
{
  /* inside a sticky header */
}
<header className="sticky top-0 border-b flex items-center gap-2 px-4 h-14">
  <SidebarTrigger />
  <Breadcrumb>...</Breadcrumb>
</header>;
```

Never use `asChild` on `SidebarTrigger` — it breaks the toggle.

---

## Multiple Groups

```tsx
<SidebarContent>
  <SidebarGroup>
    <SidebarGroupLabel>Main</SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu>{/* main items */}</SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
  <SidebarGroup>
    <SidebarGroupLabel>Admin</SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu>{/* admin-only items */}</SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</SidebarContent>
```

---

## Non-menu Content in Sidebar

Sidebars can contain more than nav lists:

```tsx
<SidebarHeader>
  {/* workspace/project switcher */}
  <Select>...</Select>
</SidebarHeader>

<SidebarContent>
  <SidebarGroup>
    {/* nav items */}
  </SidebarGroup>
  {/* a callout or card directly in SidebarContent */}
  <div className="p-4">
    <Card>...</Card>
  </div>
</SidebarContent>
```

---

## Critical Rules

- **`SidebarInset` is the `<main>` element** — never add another `<main>` inside it or wrap it in one
- **`SidebarProvider` at top level** — no extra div wrappers around it
- **`SidebarContent` needs `SidebarGroup`** for menu lists
- **Active state via `isActive` prop only** — never add `bg-*` or `text-*` to sidebar items for active styling
- **No Tailwind color overrides on sidebar components** — the sidebar themes itself via `--sidebar-*` CSS variables; adding color classes breaks it
- **Allowed customizations**: `--sidebar-width`, `--sidebar-width-icon`, `--sidebar-width-mobile` via `style` prop on `SidebarProvider`
