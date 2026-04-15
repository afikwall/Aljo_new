import { useEntityGetAll, useEntityGetOne, useEntityUpdate } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { AppSettingsEntity, FacilitiesEntity } from "@/product-types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { GeofenceMapPreview } from "@/components/GeofenceMapPreview";

interface GeofenceSettingsCardProps {
  facility: {
    id: string;
    latitude?: number;
    longitude?: number;
    geofenceRadius?: number;
    geofenceMode?: string;
  };
  facilityProfileId: string;
}

export const GeofenceSettingsCard = ({
  facility,
  facilityProfileId,
}: GeofenceSettingsCardProps) => {
  const { data: liveFacility, refetch: refetchFacility } = useEntityGetOne(
    FacilitiesEntity,
    { id: facilityProfileId },
    { enabled: !!facilityProfileId }
  );
  const { data: appSettingsRaw } = useEntityGetAll(AppSettingsEntity);
  const { updateFunction: updateFacility, isLoading: isUpdating } =
    useEntityUpdate(FacilitiesEntity);

  const geotrackingSetting = appSettingsRaw?.find(
    (s) => s.settingKey === "geotrackingEnabled"
  );
  const geotrackingEnabled = geotrackingSetting?.settingValue ?? true;

  const resolvedFacility = liveFacility ?? facility;
  const mode = resolvedFacility?.geofenceMode || "off";
  const radius = resolvedFacility?.geofenceRadius || 200;
  const lat = resolvedFacility?.latitude;
  const lng = resolvedFacility?.longitude;
  const hasCoords =
    lat != null &&
    lng != null &&
    !(lat === 0 && lng === 0);

  const isEnabled = mode === "flag" || mode === "strict";

  const handleToggle = async (checked: boolean) => {
    try {
      await updateFacility({
        id: facilityProfileId,
        data: {
          geofenceMode: checked ? "flag" : "off",
        },
      });
      await refetchFacility();
      toast.success(
        checked ? "Geofence enabled (flag mode)" : "Geofence disabled"
      );
    } catch {
      toast.error("Failed to update geofence setting");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="text-primary" />
          Geofence Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!geotrackingEnabled && (
          <Alert>
            <AlertTriangle className="text-chart-3" />
            <AlertDescription className="text-chart-3">
              GPS Geotracking is globally disabled by admin. Geofence settings
              have no effect until it is re-enabled.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Geofence Enforcement</p>
            <div className="flex items-center gap-2">
              <Badge
                className={
                  mode === "strict"
                    ? "bg-primary/20 text-primary"
                    : mode === "flag"
                    ? "bg-chart-3/20 text-chart-3"
                    : "bg-muted text-muted-foreground"
                }
              >
                {mode === "strict"
                  ? "Strict"
                  : mode === "flag"
                  ? "Flag"
                  : "Off"}
              </Badge>
              {hasCoords && (
                <span className="text-xs text-muted-foreground">
                  {radius}m radius
                </span>
              )}
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={!geotrackingEnabled || isUpdating}
          />
        </div>

        {hasCoords ? (
          <GeofenceMapPreview
            latitude={lat}
            longitude={lng}
            radiusMeters={radius}
            height="200px"
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No coordinates configured for this facility. Contact your
            administrator to set up geofencing.
          </p>
        )}
      </CardContent>
    </Card>
  );
};