import { GraduationCap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OrientationToggleCardProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export const OrientationToggleCard = ({
  enabled,
  onEnabledChange,
  notes,
  onNotesChange,
}: OrientationToggleCardProps) => {
  return (
    <div className="rounded-lg border border-chart-3/20 bg-chart-3/5 p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <GraduationCap className="h-4 w-4 mt-0.5 shrink-0 text-chart-3" />
          <div className="space-y-0.5">
            <Label
              htmlFor="requires-orientation-toggle"
              className="text-sm font-medium cursor-pointer"
            >
              Requires Orientation
            </Label>
            <p className="text-xs text-muted-foreground">
              Only staff with a completed orientation at this facility can apply
            </p>
          </div>
        </div>
        <Switch
          id="requires-orientation-toggle"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>

      {enabled && (
        <div className="space-y-2">
          <Label htmlFor="orientation-notes" className="text-sm">
            Orientation Notes (Optional)
          </Label>
          <Textarea
            id="orientation-notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="e.g. Must complete floor orientation with charge nurse before first shift"
            className="min-h-[80px] h-11 text-base"
          />
        </div>
      )}
    </div>
  );
};