import { cn } from "@/lib/utils";

const LEGEND_ITEMS = [
  {
    label: "Applied (Pending)",
    dotClass: "bg-chart-1",
    isStriped: false,
  },
  {
    label: "Upcoming Shift",
    dotClass: "bg-accent",
    isStriped: false,
  },
  {
    label: "Completed",
    dotClass: "bg-muted-foreground",
    isStriped: false,
  },
  {
    label: "Holiday",
    dotClass: "bg-chart-3",
    isStriped: false,
  },
  {
    label: "Blocked",
    dotClass: "",
    isStriped: true,
  },
];

export const CalendarLegend = () => {
  return (
    <div className="flex flex-wrap gap-4 px-1">
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          {item.isStriped ? (
            <span
              className="h-3 w-3 rounded-sm border border-destructive/30"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(239,68,68,0.3) 2px, rgba(239,68,68,0.3) 4px)",
              }}
            />
          ) : (
            <span
              className={cn("h-2.5 w-2.5 rounded-full shrink-0", item.dotClass)}
            />
          )}
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
};