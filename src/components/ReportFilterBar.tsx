import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type DatePreset } from "@/utils/reportUtils";

interface FacilityOption {
  id: string;
  name: string;
}

interface ReportFilterBarProps {
  activePreset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (val: string) => void;
  onCustomEndChange: (val: string) => void;
  facilityId: string;
  onFacilityChange: (val: string) => void;
  facilities: FacilityOption[];
  dateRangeLabel: string;
}

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: "this_week", label: "This Week" },
  { value: "last_week", label: "Last Week" },
  { value: "this_pay_period", label: "This Pay Period" },
  { value: "last_pay_period", label: "Last Pay Period" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
];

export const ReportFilterBar = ({
  activePreset,
  onPresetChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  facilityId,
  onFacilityChange,
  facilities,
  dateRangeLabel,
}: ReportFilterBarProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(preset => (
              <Button
                key={preset.value}
                variant={activePreset === preset.value ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => onPresetChange(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Custom Range + Facility Filter + Date Label */}
          <div className="flex flex-wrap items-center gap-3">
            {activePreset === "custom" && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={customStart}
                  onChange={e => onCustomStartChange(e.target.value)}
                  className="h-8 w-36 text-sm"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={e => onCustomEndChange(e.target.value)}
                  className="h-8 w-36 text-sm"
                />
              </div>
            )}

            <Select value={facilityId} onValueChange={onFacilityChange}>
              <SelectTrigger className="h-8 w-auto min-w-[180px] text-sm">
                <SelectValue placeholder="All Facilities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities</SelectItem>
                {facilities.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-sm text-muted-foreground ml-auto">
              {dateRangeLabel}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};