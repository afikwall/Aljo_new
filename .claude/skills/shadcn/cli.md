# shadcn CLI Reference

Configuration is read from `components.json`.

> **IMPORTANT:** Always run commands using the project's package runner: `npx shadcn@latest`, `pnpm dlx shadcn@latest`, or `bunx --bun shadcn@latest`. Check `packageManager` from project context to choose the right one. Examples below use `npx shadcn@latest` but substitute the correct runner for the project.

> **IMPORTANT:** Only use the flags documented below. Do not invent or guess flags — if a flag isn't listed here, it doesn't exist. The CLI auto-detects the package manager from the project's lockfile; there is no `--package-manager` flag.

> **Project override (explicit):** In this project, run only read-only commands: `info`, `docs`, `search`, `view`. Do not run mutating commands (`init`, `add`, `build`, `--overwrite`, `--reinstall`).

## Contents

- Commands: search, view, docs, info

---

## Commands

### `search` — Search registries

```bash
npx shadcn@latest search <registries...> [options]
```

Fuzzy search across registries. Also aliased as `npx shadcn@latest list`. Without `-q`, lists all items.

| Flag                | Short | Description            | Default |
| ------------------- | ----- | ---------------------- | ------- |
| `--query <query>`   | `-q`  | Search query           | —       |
| `--limit <number>`  | `-l`  | Max items per registry | `100`   |
| `--offset <number>` | `-o`  | Items to skip          | `0`     |
| `--cwd <cwd>`       | `-c`  | Working directory      | current |

### `view` — View item details

```bash
npx shadcn@latest view <items...> [options]
```

Displays item info including file contents. Example: `npx shadcn@latest view @shadcn/button`.

### `docs` — Get component documentation URLs

```bash
npx shadcn@latest docs <components...> [options]
```

Outputs resolved URLs for component documentation, examples, and API references. Accepts one or more component names. Fetch the URLs to get the actual content.

Example output for `npx shadcn@latest docs input button`:

```
base  radix

input
  docs      https://ui.shadcn.com/docs/components/radix/input
  examples  https://raw.githubusercontent.com/.../examples/input-example.tsx

button
  docs      https://ui.shadcn.com/docs/components/radix/button
  examples  https://raw.githubusercontent.com/.../examples/button-example.tsx
```

Some components include an `api` link to the underlying library (e.g. `cmdk` for the command component).

### `info` — Project information

```bash
npx shadcn@latest info [options]
```

Displays project info and `components.json` configuration. Run this first to discover the project's framework, aliases, Tailwind version, and resolved paths.

| Flag          | Short | Description       | Default |
| ------------- | ----- | ----------------- | ------- |
| `--cwd <cwd>` | `-c`  | Working directory | current |

**Project Info fields:**

| Field                | Type      | Meaning                                                            |
| -------------------- | --------- | ------------------------------------------------------------------ |
| `framework`          | `string`  | Detected framework (`next`, `vite`, `react-router`, `start`, etc.) |
| `frameworkVersion`   | `string`  | Framework version (e.g. `15.2.4`)                                  |
| `isSrcDir`           | `boolean` | Whether the project uses a `src/` directory                        |
| `isRSC`              | `boolean` | Whether React Server Components are enabled                        |
| `isTsx`              | `boolean` | Whether the project uses TypeScript                                |
| `tailwindVersion`    | `string`  | `"v3"` or `"v4"`                                                   |
| `tailwindConfigFile` | `string`  | Path to the Tailwind config file                                   |
| `tailwindCssFile`    | `string`  | Path to the global CSS file                                        |
| `aliasPrefix`        | `string`  | Import alias prefix (e.g. `@`, `~`, `@/`)                          |
| `packageManager`     | `string`  | Detected package manager (`npm`, `pnpm`, `yarn`, `bun`)            |

**Components.json fields:**

| Field                | Type      | Meaning                                                                                    |
| -------------------- | --------- | ------------------------------------------------------------------------------------------ |
| `base`               | `string`  | Primitive library (`radix` or `base`) — determines component APIs and available props      |
| `style`              | `string`  | Visual style (e.g. `nova`, `vega`)                                                         |
| `rsc`                | `boolean` | RSC flag from config                                                                       |
| `tsx`                | `boolean` | TypeScript flag                                                                            |
| `tailwind.config`    | `string`  | Tailwind config path                                                                       |
| `tailwind.css`       | `string`  | Global CSS path — this is where custom CSS variables go                                    |
| `iconLibrary`        | `string`  | Icon library — determines icon import package (e.g. `lucide-react`, `@tabler/icons-react`) |
| `aliases.components` | `string`  | Component import alias (e.g. `@/components`)                                               |
| `aliases.utils`      | `string`  | Utils import alias (e.g. `@/lib/utils`)                                                    |
| `aliases.ui`         | `string`  | UI component alias (e.g. `@/components/ui`)                                                |
| `aliases.lib`        | `string`  | Lib alias (e.g. `@/lib`)                                                                   |
| `aliases.hooks`      | `string`  | Hooks alias (e.g. `@/hooks`)                                                               |
| `resolvedPaths`      | `object`  | Absolute file-system paths for each alias                                                  |
| `registries`         | `object`  | Configured custom registries                                                               |

**Links fields:**

The `info` output includes a **Links** section with templated URLs for component docs, source, and examples. For resolved URLs, use `npx shadcn@latest docs <component>` instead.

---
