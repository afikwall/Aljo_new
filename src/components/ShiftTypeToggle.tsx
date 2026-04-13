import { useCallback } from "react";
import { Globe, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type ShiftType = "open" | "assign";

interface ShiftTypeToggleProps {
  value: ShiftType;
  onChange: (value: ShiftType) => void;
}

export const ShiftTypeToggle = ({ value, onChange }: ShiftTypeToggleProps) => {
  const handleSelectOpen = useCallback(() => {
    onChange("open");
  }, [onChange]);

  const handleSelectAssign = useCallback(() => {
    onChange("assign");
  }, [onChange]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Shift Type</p>
      <div className="grid grid-cols-2 gap-3">
        {/* Open Shift Option */}
        <button
          type="button"
          onClick={handleSelectOpen}
          className={cn(
            "flex items-start gap-3 rounded-lg border p-4 text-left transition-all cursor-pointer",
            value === "open"
              ? "border-primary bg-primary/5"
              : "border-border bg-background hover:bg-muted/30"
          )}
        >
          <Globe
            className={cn(
              "h-5 w-5 mt-0.5 shrink-0",
              value === "open" ? "text-primary" : "text-muted-foreground"
            )}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Open Shift</p>
            <p className="text-xs text-muted-foreground">
              Visible to all eligible staff in the marketplace
            </p>
          </div>
        </button>

        {/* Assign to Staff Option */}
        <button
          type="button"
          onClick={handleSelectAssign}
          className={cn(
            "flex items-start gap-3 rounded-lg border p-4 text-left transition-all cursor-pointer",
            value === "assign"
              ? "border-primary bg-primary/5"
              : "border-border bg-background hover:bg-muted/30"
          )}
        >
          <UserCheck
            className={cn(
              "h-5 w-5 mt-0.5 shrink-0",
              value === "assign" ? "text-primary" : "text-muted-foreground"
            )}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Assign to Staff</p>
            <p className="text-xs text-muted-foreground">
              Privately assigned to a specific staff member
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};