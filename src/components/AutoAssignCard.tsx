import { Heart, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NotifyFavoritesToggle } from "@/components/NotifyFavoritesToggle";

interface AutoAssignCardProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  facilityProfileId: string;
  notifyFavorites: boolean;
  onNotifyFavoritesChange: (checked: boolean) => void;
}

export const AutoAssignCard = ({
  enabled,
  onEnabledChange,
  facilityProfileId,
  notifyFavorites,
  onNotifyFavoritesChange,
}: AutoAssignCardProps) => {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <Heart className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
          <div className="space-y-0.5">
            <Label
              htmlFor="auto-assign-toggle"
              className="text-sm font-medium cursor-pointer"
            >
              Auto-Assign Favorites
            </Label>
            <p className="text-xs text-muted-foreground">
              Automatically assign favorite staff to this shift
            </p>
          </div>
        </div>
        <Switch
          id="auto-assign-toggle"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>

      {enabled && (
        <>
          <div className="flex items-start gap-2 rounded-md bg-primary/10 p-3">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <p className="text-xs text-foreground/80">
              Favorite staff will be automatically assigned to available slots when
              this shift is posted. If not enough favorites are available, remaining
              slots open to all eligible staff.
            </p>
          </div>

          <NotifyFavoritesToggle
            facilityId={facilityProfileId}
            checked={notifyFavorites}
            onCheckedChange={onNotifyFavoritesChange}
          />
        </>
      )}
    </div>
  );
};