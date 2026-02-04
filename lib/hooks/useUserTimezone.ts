import { useMemo } from "react";
import { useUserSettingsStore } from "@/stores/userSettingsStore";
import * as Localization from "expo-localization";

/**
 * Hook to get the user's timezone setting
 * @returns User's timezone string (e.g., "Europe/Istanbul", "America/Los_Angeles")
 * @default "UTC" if no timezone is set
 */
export function useUserTimezone(): string {
  const settings = useUserSettingsStore((state) => state.settings);

  const timezone = useMemo(() => {
    if (settings?.timezone) {
      return settings.timezone;
    }

    // Try Expo Localization first as it's more reliable on Native
    try {
      const calendars = Localization.getCalendars();
      if (calendars && calendars.length > 0 && calendars[0].timeZone) {
        return calendars[0].timeZone;
      }
    } catch (error) {
      // Fallback if getCalendars fails
    }

    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch (error) {
      return "UTC";
    }
  }, [settings?.timezone]);

  return timezone;
}
