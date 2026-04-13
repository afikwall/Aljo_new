# Radix Usage (Project Default)

This boilerplate uses **radix-style primitives**.
Treat radix behavior as canonical for this project.

## Project Rule

- Use radix composition patterns (`asChild`) where relevant.
- Do not use base-only APIs such as `render`, `nativeButton`, or base-only shape differences.

## Core Patterns

### Trigger Composition

```tsx
<DialogTrigger asChild>
  <Button>Open</Button>
</DialogTrigger>
```

### ToggleGroup

```tsx
<ToggleGroup type="single" defaultValue="daily">
  <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
</ToggleGroup>
```

### Slider

```tsx
<Slider defaultValue={[50]} max={100} step={1} />
```

### Accordion

```tsx
<Accordion type="single" collapsible defaultValue="item-1">
  <AccordionItem value="item-1">...</AccordionItem>
</Accordion>
```
