import { useMemo } from "react";
import { useUserSettingsStore } from "@/stores/userSettingsStore";
import { resolveEffectiveTimezone } from "@/lib/utils/timezone";

/**
 * Hook to get the user's timezone setting
 * @returns User's timezone string (e.g., "Europe/Istanbul", "America/Los_Angeles")
 * @default "UTC" if no timezone is set
 */
export function useUserTimezone(): string {
  const settings = useUserSettingsStore((state) => state.settings);

  const timezone = useMemo(() => {
    return resolveEffectiveTimezone(settings?.timezone);
  }, [settings?.timezone]);

  return timezone;
}
