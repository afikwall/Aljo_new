import { useState, useMemo, useCallback, useEffect } from "react";
import { useEntityUpdate } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { FacilityManagerProfilesEntity } from "@/product-types";
import type { IFacilityManagerProfilesEntity } from "@/product-types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, Loader2, Heart, Clock, Save } from "lucide-react";
import {
  getAutoScheduleSettings,
  buildSettingsUpdatePayload,
  validateAutoScheduleSettings,
  hasSettingsChanged,
  describeAutoScheduleConfig,
  AUTO_SCHEDULE_MODES,
  HEAD_START_OPTIONS,
  type AutoScheduleSettings,
} from "@/utils/autoScheduleSettingsUtils";
import type { AutoScheduleMode } from "@/utils/autoScheduleUtils";

interface AutoScheduleSettingsCardProps {
  managerProfile: IFacilityManagerProfilesEntity & { id: string };
  onSettingsSaved?: () => void;
}

export const AutoScheduleSettingsCard = ({
  managerProfile,
  onSettingsSaved,
}: AutoScheduleSettingsCardProps) => {
  const { updateFunction, isLoading: isSaving } = useEntityUpdate(
    FacilityManagerProfilesEntity
  );

  const [settings, setSettings] = useState<AutoScheduleSettings>(
    getAutoScheduleSettings(managerProfile)
  );

  // Re-sync when profile changes
  useEffect(() => {
    setSettings(getAutoScheduleSettings(managerProfile));
  }, [managerProfile]);

  const isDirty = useMemo(
    () => hasSettingsChanged(settings, managerProfile),
    [settings, managerProfile]
  );

  const validation = useMemo(
    () => validateAutoScheduleSettings(settings),
    [settings]
  );

  const description = useMemo(
    () => describeAutoScheduleConfig(settings),
    [settings]
  );

  const handleToggle = useCallback((checked: boolean) => {
    setSettings((prev) => ({ ...prev, autoScheduleEnabled: checked }));
  }, []);

  const handleModeChange = useCallback((value: string) => {
    setSettings((prev) => ({
      ...prev,
      autoScheduleMode: value as AutoScheduleMode,
    }));
  }, []);

  const handleHeadStartChange = useCallback((value: string) => {
    setSettings((prev) => ({
      ...prev,
      favoritesHeadStartMinutes: parseInt(value, 10),
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    try {
      const payload = buildSettingsUpdatePayload(settings);
      await updateFunction({ id: managerProfile.id, data: payload });
      toast.success("Auto-schedule settings saved");
      onSettingsSaved?.();
    } catch {
      toast.error("Failed to save settings. Please try again.");
    }
  }, [validation, settings, updateFunction, managerProfile.id, onSettingsSaved]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Auto-Schedule Settings</CardTitle>
              <CardDescription>
                Configure how shifts are automatically assigned to favorites
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={settings.autoScheduleEnabled ? "default" : "secondary"}
            className="shrink-0"
          >
            {settings.autoScheduleEnabled ? "Active" : "Off"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Toggle */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <Heart className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <div className="space-y-0.5">
              <Label
                htmlFor="auto-schedule-toggle"
                className="text-sm font-medium cursor-pointer"
              >
                Enable Auto-Schedule
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically assign favorite staff when shifts are posted
              </p>
            </div>
          </div>
          <Switch
            id="auto-schedule-toggle"
            checked={settings.autoScheduleEnabled}
            onCheckedChange={handleToggle}
          />
        </div>

        {settings.autoScheduleEnabled && (
          <>
            <Separator />

            {/* Mode */}
            <div className="space-y-2">
              <Label>Assignment Mode</Label>
              <Select
                value={settings.autoScheduleMode}
                onValueChange={handleModeChange}
              >
                <SelectTrigger className="h-11 text-base">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {AUTO_SCHEDULE_MODES.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Show description for selected mode */}
              {AUTO_SCHEDULE_MODES.map((mode) =>
                mode.value === settings.autoScheduleMode ? (
                  <p key={mode.value} className="text-xs text-muted-foreground">
                    {mode.description}
                  </p>
                ) : null
              )}
            </div>

            {/* Head Start (only for favorites_first) */}
            {settings.autoScheduleMode === "favorites_first" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label>Favorites Head Start</Label>
                </div>
                <Select
                  value={String(settings.favoritesHeadStartMinutes)}
                  onValueChange={handleHeadStartChange}
                >
                  <SelectTrigger className="h-11 text-base">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {HEAD_START_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How long favorites get exclusive access before the shift opens to
                  all staff
                </p>
              </div>
            )}

            <Separator />

            {/* Description */}
            <p className="text-sm text-muted-foreground italic">{description}</p>
          </>
        )}

        {/* Save Button */}
        {isDirty && (
          <Button
            onClick={handleSave}
            disabled={isSaving || !validation.valid}
            className="w-full h-11"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};