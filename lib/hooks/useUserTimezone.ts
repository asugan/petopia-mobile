import { useMemo } from "react";
import { useUserSettingsStore } from "@/stores/userSettingsStore";

/**
 * Hook to get the user's timezone setting
 * @returns User's timezone string (e.g., "Europe/Istanbul", "America/Los_Angeles")
 * @default "UTC" if no timezone is set
 */
export function useUserTimezone(): string {
  const settings = useUserSettingsStore((state) => state.settings);

  const timezone = useMemo(() => {
    return (
      settings?.timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      "UTC"
    );
  }, [settings?.timezone]);

  return timezone;
}
