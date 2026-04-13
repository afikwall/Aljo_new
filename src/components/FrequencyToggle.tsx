import { useCallback } from "react";
import { cn } from "@/lib/utils";

export type InvoiceFrequency = "weekly" | "biweekly";

interface FrequencyToggleProps {
  frequency: InvoiceFrequency;
  onFrequencyChange: (frequency: InvoiceFrequency) => void;
}

export const FrequencyToggle = ({
  frequency,
  onFrequencyChange,
}: FrequencyToggleProps) => {
  const handleWeekly = useCallback(() => {
    onFrequencyChange("weekly");
  }, [onFrequencyChange]);

  const handleBiWeekly = useCallback(() => {
    onFrequencyChange("biweekly");
  }, [onFrequencyChange]);

  return (
    <div className="flex w-full md:w-auto">
      <button
        type="button"
        onClick={handleWeekly}
        className={cn(
          "flex-1 md:flex-none px-4 py-2.5 text-sm font-medium rounded-l-lg border transition-colors min-h-[44px]",
          frequency === "weekly"
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background text-muted-foreground border-input hover:text-foreground hover:bg-muted/50"
        )}
      >
        Weekly (Mon–Sun)
      </button>
      <button
        type="button"
        onClick={handleBiWeekly}
        className={cn(
          "flex-1 md:flex-none px-4 py-2.5 text-sm font-medium rounded-r-lg border border-l-0 transition-colors min-h-[44px]",
          frequency === "biweekly"
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background text-muted-foreground border-input hover:text-foreground hover:bg-muted/50"
        )}
      >
        Bi-Weekly (Pay Period)
      </button>
    </div>
  );
};