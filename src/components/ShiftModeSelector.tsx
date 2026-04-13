import { useCallback } from "react";
import { CalendarIcon, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShiftModeSelectorProps {
  mode: "single" | "bulk";
  onModeChange: (mode: "single" | "bulk") => void;
}

export const ShiftModeSelector = ({ mode, onModeChange }: ShiftModeSelectorProps) => {
  const handleSingleClick = useCallback(() => {
    onModeChange("single");
  }, [onModeChange]);

  const handleBulkClick = useCallback(() => {
    onModeChange("bulk");
  }, [onModeChange]);

  return (
    <div className="flex rounded-full border p-1 bg-muted/50">
      <button
        type="button"
        onClick={handleSingleClick}
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          mode === "single"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <CalendarIcon className="h-4 w-4" />
        Single Shift
      </button>
      <button
        type="button"
        onClick={handleBulkClick}
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          mode === "bulk"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <CalendarRange className="h-4 w-4" />
        Bulk Post
      </button>
    </div>
  );
};