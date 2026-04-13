---
name: charts
description: Building any kind of chart or data visualization in this project — line, bar, area, pie, radar, scatter, and composed charts using Recharts wrapped in the project's themed ChartContainer. Load this skill whenever the task mentions charts, graphs, analytics, dashboards with metrics, or any visual representation of data. Never build charts without this skill.
user-invocable: false
---

# Charts Skill

Use this skill to build data visualization charts using Recharts and the themed ChartContainer component.

## When to Use

- User requests any type of chart (line, bar, area, pie, radar, scatter, etc.)
- User wants data visualization or analytics dashboards
- User needs to display metrics, trends, or comparisons visually

## Critical Requirements

### 1. ALWAYS Use Recharts - NEVER Create Vanilla Charts

- For ANY chart needs (line, area, bar, composed, scatter, pie, radar, radial bar, tree map), you MUST use the `recharts` package
- NEVER attempt to build custom chart implementations from scratch
- **NEVER import `ResponsiveContainer`** from recharts - it's already built into ChartContainer

### 2. Required Imports

```tsx
// Recharts primitives (import what you need)
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

// MANDATORY: Custom themed wrappers from UI library
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
```

### 3. MANDATORY: ChartContainer Wrapper

**YOU MUST wrap ALL charts inside `ChartContainer`** for responsiveness and proper theming. ChartContainer already includes responsive behavior - DO NOT use `ResponsiveContainer` from recharts.

```tsx
<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
  <LineChart data={data}>{/* Chart components */}</LineChart>
</ChartContainer>
```

### 4. Chart Configuration Object

ChartContainer REQUIRES a `config` prop with proper structure. Config defines human-readable labels, icons, and color tokens. Config is intentionally decoupled from data for reusability.

```tsx
const chartConfig = {
  visitors: {
    label: 'Visitors',
    color: 'hsl(var(--chart-1))', // Use theme color variables
  },
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-2))',
  },
};
```

**ALWAYS use theme color tokens**: `--chart-1` through `--chart-5` for consistent theming.

### 5. ChartContainer Sizing Requirements

- **MUST set height**: Use `min-h-[VALUE]` or `h-[VALUE]` on ChartContainer (e.g., `min-h-[200px]`, `h-[350px]`)
- **MUST set width**: Usually `w-full` for responsiveness
- Without explicit height/width, charts will NOT render correctly

```tsx
<ChartContainer config={chartConfig} className="min-h-[250px] w-full">
```

### 6. XAxis Tick Management - PREVENT OVERLAPPING

- **BE CAREFUL with `interval={0}`** on XAxis - it shows ALL ticks. Only use if necessary and when you're sure there aren't many ticks
- **USE `minTickGap`** prop to space ticks appropriately (e.g., `minTickGap={30}`)
- For long labels, use angle rotation:

```tsx
<XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
```

---

## Complete Chart Examples

### Line Chart

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';

function RevenueChart({ data }) {
  const chartConfig = {
    revenue: {
      label: 'Revenue',
      color: 'hsl(var(--chart-1))',
    },
    expenses: {
      label: 'Expenses',
      color: 'hsl(var(--chart-2))',
    },
  };

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" minTickGap={30} />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-revenue)"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="expenses"
          stroke="var(--color-expenses)"
          strokeWidth={2}
        />
      </LineChart>
    </ChartContainer>
  );
}
```

### Bar Chart

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

function SalesChart({ data }) {
  const chartConfig = {
    sales: {
      label: 'Sales',
      color: 'hsl(var(--chart-1))',
    },
  };

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" minTickGap={30} />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
```

### Pie Chart

```tsx
import { PieChart, Pie, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';

function CategoryPieChart({ data }) {
  const chartConfig = {
    category1: { label: 'Category A', color: 'hsl(var(--chart-1))' },
    category2: { label: 'Category B', color: 'hsl(var(--chart-2))' },
    category3: { label: 'Category C', color: 'hsl(var(--chart-3))' },
    category4: { label: 'Category D', color: 'hsl(var(--chart-4))' },
    category5: { label: 'Category E', color: 'hsl(var(--chart-5))' },
  };

  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
```

---

## Common Mistakes to AVOID

- **NEVER** create custom chart implementations - always use Recharts
- **NEVER** use charts without ChartContainer wrapper
- **NEVER** import/use `ResponsiveContainer` from recharts (ChartContainer handles this)
- **NEVER** forget height/width classes on ChartContainer
- **NEVER** use `interval={0}` without verifying it won't cause tick overlap
- **NEVER** hardcode colors - always use theme tokens (`--chart-1` through `--chart-5`)
- **NEVER** forget the `config` prop on ChartContainer
- **NEVER** define `chartConfig` inside JSX — define it outside the return statement

## Theme Color Tokens

Use these CSS variables for chart colors to ensure theme consistency:

| Token                 | Usage                 |
| --------------------- | --------------------- |
| `hsl(var(--chart-1))` | Primary chart color   |
| `hsl(var(--chart-2))` | Secondary chart color |
| `hsl(var(--chart-3))` | Tertiary chart color  |
| `hsl(var(--chart-4))` | Fourth chart color    |
| `hsl(var(--chart-5))` | Fifth chart color     |

For Tailwind classes (outside of Recharts components):

- Backgrounds: `bg-chart-1` through `bg-chart-5`
- Text: `text-chart-1` through `text-chart-5`
- Borders: `border-chart-1` through `border-chart-5`
- Fills: `fill-chart-1` through `fill-chart-5`
