# Forms & Inputs

## Contents

- Choosing between FieldGroup and Form (react-hook-form)
- Forms use FieldGroup + Field
- Input with adjacent button or inline icon (no InputGroup primitive)
- Option sets (2–7 choices) use ToggleGroup
- FieldSet + FieldLegend for grouping related fields
- Field validation and disabled states

---

## Choosing between FieldGroup and Form (react-hook-form)

There are two form layout systems. Use the right one based on whether you need validation:

| Scenario                                                     | System to use                                                                     |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Simple form (no Zod validation, no error messages per field) | `FieldGroup` + `Field` + `FieldLabel`                                             |
| Validated form with Zod schema + per-field error messages    | `Form` + `FormField` + `FormItem` + `FormLabel` + `FormMessage` (react-hook-form) |

**Never mix the two systems in the same form.**

The `FieldGroup`/`Field` system is for straightforward inputs. The `Form`/`FormField` system is for forms where you need `useForm()`, `zodResolver`, and inline validation errors.

---

## `<Form>` wrapper is required for shadcn form components

If you use **any** component from `@/components/ui/form` (`FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`), the entire form **must** be wrapped in `<Form>` — the component that takes the `useForm()` result. Without it, the context is missing and the app will throw errors at runtime.

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

const form = useForm({ resolver: zodResolver(schema) });

// ✅ CORRECT — Form wraps everything
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>

// ❌ WRONG — FormField used without Form wrapper → runtime crash
<form>
  <FormField ... />
</form>
```

---

## Forms use FieldGroup + Field

Always use `FieldGroup` + `Field` — never raw `div` with `space-y-*`:

```tsx
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="email">Email</FieldLabel>
    <Input id="email" type="email" />
  </Field>
  <Field>
    <FieldLabel htmlFor="password">Password</FieldLabel>
    <Input id="password" type="password" />
  </Field>
</FieldGroup>
```

Use `Field orientation="horizontal"` for settings pages. Use `FieldLabel className="sr-only"` for visually hidden labels.

**Choosing form controls:**

- Simple text input → `Input`
- Dropdown with predefined options → `Select`
- Searchable dropdown → `Combobox`
- Boolean toggle → `Switch` (for settings) or `Checkbox` (for forms)
- Single choice from few options → `RadioGroup`
- Toggle between 2–5 options → `ToggleGroup` + `ToggleGroupItem`
- OTP/verification code → `InputOTP`
- Multi-line text → `Textarea`

---

## Input with adjacent button or inline icon (no InputGroup primitive)

This project does not include shadcn’s `InputGroup` / `InputGroupAddon` primitives. Compose search bars and inputs-with-actions using layout only (`className` for structure, not color/typography overrides).

**Side-by-side input and button:**

```tsx
<div className="flex flex-row items-center gap-2">
  <Input placeholder="Search..." className="min-w-0 flex-1" />
  <Button type="button" size="icon">
    <SearchIcon data-icon="inline-start" />
  </Button>
</div>
```

**Input with trailing control (relative wrapper + padding):**

```tsx
<div className="relative">
  <Input placeholder="Search..." className="pr-10" />
  <Button
    type="button"
    className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
    size="icon"
  >
    <SearchIcon data-icon="inline-start" />
  </Button>
</div>
```

---

## Option sets (2–7 choices) use ToggleGroup

Don't manually loop `Button` components with active state.

**Incorrect:**

```tsx
const [selected, setSelected] = useState("daily")

<div className="flex gap-2">
  {["daily", "weekly", "monthly"].map((option) => (
    <Button
      key={option}
      variant={selected === option ? "default" : "outline"}
      onClick={() => setSelected(option)}
    >
      {option}
    </Button>
  ))}
</div>
```

**Correct:**

```tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

<ToggleGroup className="gap-2">
  <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
  <ToggleGroupItem value="weekly">Weekly</ToggleGroupItem>
  <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
</ToggleGroup>;
```

Combine with `Field` for labelled toggle groups:

```tsx
<Field orientation="horizontal">
  <FieldTitle id="theme-label">Theme</FieldTitle>
  <ToggleGroup aria-labelledby="theme-label" className="gap-2">
    <ToggleGroupItem value="light">Light</ToggleGroupItem>
    <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
    <ToggleGroupItem value="system">System</ToggleGroupItem>
  </ToggleGroup>
</Field>
```

> **Note:** This project uses radix defaults. Use radix `ToggleGroup` patterns from [base-vs-radix.md](./base-vs-radix.md).

---

## FieldSet + FieldLegend for grouping related fields

Use `FieldSet` + `FieldLegend` for related checkboxes, radios, or switches — not `div` with a heading:

```tsx
<FieldSet>
  <FieldLegend variant="label">Preferences</FieldLegend>
  <FieldDescription>Select all that apply.</FieldDescription>
  <FieldGroup className="gap-3">
    <Field orientation="horizontal">
      <Checkbox id="dark" />
      <FieldLabel htmlFor="dark" className="font-normal">
        Dark mode
      </FieldLabel>
    </Field>
  </FieldGroup>
</FieldSet>
```

---

## Field validation and disabled states

Both attributes are needed — `data-invalid`/`data-disabled` styles the field (label, description), while `aria-invalid`/`disabled` styles the control.

```tsx
// Invalid.
<Field data-invalid>
  <FieldLabel htmlFor="email">Email</FieldLabel>
  <Input id="email" aria-invalid />
  <FieldDescription>Invalid email address.</FieldDescription>
</Field>

// Disabled.
<Field data-disabled>
  <FieldLabel htmlFor="email">Email</FieldLabel>
  <Input id="email" disabled />
</Field>
```

Works for all controls: `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroupItem`, `Switch`, `Slider`, `InputOTP`.
