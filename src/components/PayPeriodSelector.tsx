import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import {
  type DatePreset,
  formatDateRange,
  getCurrentPayPeriod,
  getPayPeriodLabel,
  getPayPeriodNumber,
  type DateRange,
} from "@/utils/reportUtils";
import type { InvoiceFrequency } from "@/components/FrequencyToggle";

interface PayPeriodSelectorProps {
  activePreset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (val: string) => void;
  onCustomEndChange: (val: string) => void;
  dateRange: DateRange;
  frequency?: InvoiceFrequency;
}

const BIWEEKLY_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "this_pay_period", label: "This Pay Period" },
  { value: "last_pay_period", label: "Last Pay Period" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
];

const WEEKLY_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "this_week", label: "This Week" },
  { value: "last_week", label: "Last Week" },
  { value: "custom", label: "Custom Range" },
];

export const PayPeriodSelector = ({
  activePreset,
  onPresetChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  dateRange,
  frequency = "biweekly",
}: PayPeriodSelectorProps) => {
  const presets = frequency === "weekly" ? WEEKLY_PRESETS : BIWEEKLY_PRESETS;

  const dateRangeLabel = useMemo(
    () => formatDateRange(dateRange.start, dateRange.end),
    [dateRange]
  );

  const currentPeriod = useMemo(() => getCurrentPayPeriod(), []);
  const currentPeriodLabel = useMemo(() => getPayPeriodLabel(currentPeriod), [currentPeriod]);
  const currentPeriodNumber = useMemo(() => getPayPeriodNumber(currentPeriod), [currentPeriod]);

  const isCurrentPeriodSelected = activePreset === "this_pay_period" && frequency === "biweekly";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Current Period Label */}
          {isCurrentPeriodSelected && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {currentPeriodLabel}
              </span>
              <Badge className="bg-primary/15 text-primary border-primary/20 text-xs">
                Period #{currentPeriodNumber}
              </Badge>
            </div>
          )}

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => (
              <Button
                key={preset.value}
                variant={activePreset === preset.value ? "default" : "outline"}
                size="sm"
                className="h-9 text-xs"
                onClick={() => onPresetChange(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Custom Range + Date Label */}
          <div className="flex flex-wrap items-center gap-3">
            {activePreset === "custom" && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => onCustomStartChange(e.target.value)}
                  className="h-9 w-36 text-sm"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => onCustomEndChange(e.target.value)}
                  className="h-9 w-36 text-sm"
                />
              </div>
            )}

            {!isCurrentPeriodSelected && (
              <span className="text-sm font-medium text-muted-foreground ml-auto">
                {dateRangeLabel}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};