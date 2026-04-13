import type { IFacilityManagerProfilesEntity } from "@/product-types";
import {
  AUTO_SCHEDULE_MODES,
  DEFAULT_FAVORITES_HEAD_START_MINUTES,
  HEAD_START_OPTIONS,
  type AutoScheduleMode,
} from "./autoScheduleUtils";

/**
 * Represents the auto-schedule settings form state for a facility manager.
 */
export interface AutoScheduleSettings {
  autoScheduleEnabled: boolean;
  autoScheduleMode: AutoScheduleMode;
  favoritesHeadStartMinutes: number;
}

/**
 * Default auto-schedule settings when none are configured.
 */
export const DEFAULT_AUTO_SCHEDULE_SETTINGS: AutoScheduleSettings = {
  autoScheduleEnabled: false,
  autoScheduleMode: "favorites_first",
  favoritesHeadStartMinutes: DEFAULT_FAVORITES_HEAD_START_MINUTES,
};

/**
 * Extracts auto-schedule settings from a facility manager profile entity.
 * Falls back to defaults if values are not set.
 */
export const getAutoScheduleSettings = (
  profile: IFacilityManagerProfilesEntity | null | undefined
): AutoScheduleSettings => {
  if (!profile) return DEFAULT_AUTO_SCHEDULE_SETTINGS;

  return {
    autoScheduleEnabled: profile.autoScheduleEnabled ?? false,
    autoScheduleMode: profile.autoScheduleMode ?? "favorites_first",
    favoritesHeadStartMinutes:
      profile.favoritesHeadStartMinutes ?? DEFAULT_FAVORITES_HEAD_START_MINUTES,
  };
};

/**
 * Builds the update payload for saving auto-schedule settings to the
 * FacilityManagerProfiles entity.
 */
export const buildSettingsUpdatePayload = (
  settings: AutoScheduleSettings
): Partial<IFacilityManagerProfilesEntity> => ({
  autoScheduleEnabled: settings.autoScheduleEnabled,
  autoScheduleMode: settings.autoScheduleMode,
  favoritesHeadStartMinutes: settings.favoritesHeadStartMinutes,
});

/**
 * Validates auto-schedule settings before saving.
 */
export const validateAutoScheduleSettings = (
  settings: AutoScheduleSettings
): { valid: boolean; message: string } => {
  if (settings.autoScheduleEnabled) {
    if (!settings.autoScheduleMode) {
      return { valid: false, message: "Please select an auto-schedule mode" };
    }

    const validModes = AUTO_SCHEDULE_MODES.map((m) => m.value);
    if (!validModes.includes(settings.autoScheduleMode)) {
      return { valid: false, message: "Invalid auto-schedule mode selected" };
    }

    if (settings.autoScheduleMode === "favorites_first") {
      if (
        settings.favoritesHeadStartMinutes === undefined ||
        settings.favoritesHeadStartMinutes < 0
      ) {
        return { valid: false, message: "Head start duration must be positive" };
      }

      const validHeadStarts = HEAD_START_OPTIONS.map((o) => o.value);
      if (!validHeadStarts.includes(settings.favoritesHeadStartMinutes as typeof validHeadStarts[number])) {
        return {
          valid: false,
          message: "Please select a valid head start duration",
        };
      }
    }
  }

  return { valid: true, message: "" };
};

/**
 * Returns a human-readable description of the current auto-schedule configuration.
 */
export const describeAutoScheduleConfig = (
  settings: AutoScheduleSettings
): string => {
  if (!settings.autoScheduleEnabled) {
    return "Auto-schedule is disabled. All shifts are open to all eligible staff immediately.";
  }

  const modeInfo = AUTO_SCHEDULE_MODES.find(
    (m) => m.value === settings.autoScheduleMode
  );

  if (!modeInfo) {
    return "Auto-schedule is enabled with unknown configuration.";
  }

  let description = `Auto-schedule is enabled in "${modeInfo.label}" mode.`;

  if (settings.autoScheduleMode === "favorites_first") {
    const headStartOption = HEAD_START_OPTIONS.find(
      (o) => o.value === settings.favoritesHeadStartMinutes
    );
    const headStartLabel =
      headStartOption?.label ?? `${settings.favoritesHeadStartMinutes} minutes`;
    description += ` Favorites get a ${headStartLabel} head start before shifts open to all staff.`;
  } else if (settings.autoScheduleMode === "favorites_only") {
    description +=
      " Only favorite staff are auto-assigned. Remaining slots are open to all eligible staff.";
  }

  return description;
};

/**
 * Checks if settings have changed compared to the stored profile values.
 * Used to enable/disable the save button.
 */
export const hasSettingsChanged = (
  current: AutoScheduleSettings,
  profile: IFacilityManagerProfilesEntity | null | undefined
): boolean => {
  const stored = getAutoScheduleSettings(profile);

  if (current.autoScheduleEnabled !== stored.autoScheduleEnabled) return true;
  if (current.autoScheduleMode !== stored.autoScheduleMode) return true;
  if (current.favoritesHeadStartMinutes !== stored.favoritesHeadStartMinutes)
    return true;

  return false;
};

/**
 * Returns the mode label for display.
 */
export const getAutoScheduleModeLabel = (
  mode: AutoScheduleMode | undefined
): string => {
  if (!mode) return "Not configured";
  const modeInfo = AUTO_SCHEDULE_MODES.find((m) => m.value === mode);
  return modeInfo?.label ?? mode;
};

/**
 * Returns the head start label for display.
 */
export const getHeadStartLabel = (minutes: number | undefined): string => {
  if (minutes === undefined) return "Not set";
  const option = HEAD_START_OPTIONS.find((o) => o.value === minutes);
  return option?.label ?? `${minutes} minutes`;
};

/**
 * Re-export constants for convenience in settings UIs.
 */
export { AUTO_SCHEDULE_MODES, HEAD_START_OPTIONS };