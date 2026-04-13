---
name: app-layout
description: Creating or modifying src/layout.tsx — the app-level wrapper that wraps every page. Load this skill when adding navigation (sidebar, top nav, header, footer), implementing auth-aware layout behavior, or building any kind of persistent shell around the app's pages. Use it proactively whenever the task involves layout, navigation structure, or persistent UI outside of individual pages.
user-invocable: false
---

# App Layout

`src/layout.tsx` is the persistent shell that wraps every page. It receives page content via `children` and the platform injects it automatically — pages never import or reference it.

## Design First

Before writing a line of code, think about what layout this specific app deserves. The layout is the first thing users see and sets the tone for everything. A project management tool feels different from a customer portal, which feels different from a simple utility. Let the app's purpose, audience, and navigation complexity drive the design decision.

Ask:

- How many distinct sections does this app have? (many → sidebar; few → top nav; one → minimal)
- What's the app's personality? (tool-like / consumer / professional / creative)
- Where do users spend most of their time — navigating between pages, or staying in one place?
- Does the layout need to adapt per user role or auth state?

Then **design a layout that feels right for this specific app** — not a generic placeholder. The navigation, spacing, branding area, and user controls should all feel intentional.

## Layout Shape Options

These are starting points, not templates. Combine and adapt freely.

| Shape                  | When it fits                                                     |
| ---------------------- | ---------------------------------------------------------------- |
| **Sidebar**            | Multi-section apps, dashboards, tools with deep navigation       |
| **Top nav**            | Marketing sites, portals, simpler apps with few top-level routes |
| **Split / dual-panel** | Detail+list views, editors, messaging                            |
| **Minimal**            | Single-purpose utilities, auth-only wrappers, landing pages      |
| **Hybrid**             | Sidebar + top header bar, icon rail + content panel, etc.        |

## The One Hard Rule

**If the layout includes a sidebar → use shadcn Sidebar components.** Never build a custom sidebar with raw divs.

The shadcn Sidebar has several visual modes — floating, inset, icon-only, collapsible. Use whichever fits the design. See [sidebar-api.md](./sidebar-api.md) for the full API and visual variants.

## Technical Contracts

These are non-negotiable regardless of design:

1. Always render `children` on every code path — never conditionally skip it
2. Never import layout into page files — the platform injects it
3. Use `getPageUrl(pageConfig)` for all navigation URLs — never hardcode paths or `#`
4. Use `isActive` prop for active link highlighting — never add `bg-*` classes manually
5. Never redirect from layout — let individual pages handle auth redirects
6. No placeholder buttons — every interactive element must do something real

## Composable Building Blocks

Read [building-blocks.md](./building-blocks.md) for ready-to-use patterns that can be placed anywhere in your layout design:

- User menu with avatar, name, email, and logout
- Theme mode switcher (light / dark / system)
- Auth-aware layout branching (show nav only when logged in)
- Role-based layout variants (different shells per user role)
- Avatar with initials fallback
- RTL support

These are ingredients — place them wherever they make sense in your specific design.

## Implementation Steps

1. Read the current `src/layout.tsx` — preserve existing behavior unless the prompt says to change it
2. Decide on the layout shape based on the app's purpose and navigation needs
3. Sketch the structure in your head: what goes in the header? sidebar? footer? what's persistent vs per-page?
4. Read [building-blocks.md](./building-blocks.md) for the use-case patterns you need (auth branching, user menu, theme switcher, roles, RTL)
5. If using a sidebar, read [sidebar-api.md](./sidebar-api.md) for the full API, visual variants, and critical rules
6. Build it — make it feel designed, not generated
