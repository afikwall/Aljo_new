import { useMemo } from "react";
import { useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { FacilityFavoritesEntity } from "@/product-types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Info } from "lucide-react";

interface NotifyFavoritesToggleProps {
  facilityId: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const NotifyFavoritesToggle = ({
  facilityId,
  checked,
  onCheckedChange,
}: NotifyFavoritesToggleProps) => {
  const { data: favorites } = useEntityGetAll(
    FacilityFavoritesEntity,
    { facilityId },
    { enabled: !!facilityId }
  );

  const favoritesCount = useMemo(() => {
    return favorites?.length || 0;
  }, [favorites]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <Heart className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          <div className="space-y-0.5">
            <Label
              htmlFor="notify-favorites"
              className="text-sm font-medium cursor-pointer"
            >
              Notify Favorites First
            </Label>
            <p className="text-xs text-muted-foreground">
              Favorite staff get a 2-hour head start before the shift is visible
              to everyone
            </p>
          </div>
        </div>
        <Switch
          id="notify-favorites"
          checked={checked}
          onCheckedChange={onCheckedChange}
        />
      </div>

      {checked && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {favoritesCount > 0 ? (
              <>
                <strong>{favoritesCount}</strong> favorite staff member
                {favoritesCount !== 1 ? "s" : ""} will be notified first. The
                shift becomes available to all staff after 2 hours.
              </>
            ) : (
              <>
                You don&apos;t have any favorite staff yet. Add favorites from
                your dashboard to use this feature.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};