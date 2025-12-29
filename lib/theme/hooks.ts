import { useUserSettingsStore } from "@/stores/userSettingsStore";
import { ThemeContextValue } from "./types";
import type { ThemeMode } from "./types";

export const useTheme = (): ThemeContextValue => {
  const { theme, isDark, updateSettings } = useUserSettingsStore();

  const toggleTheme = () => {
    const newTheme: ThemeMode = isDark ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
  };

  const setTheme = (newTheme: ThemeMode) => {
    updateSettings({ theme: newTheme });
  };

  return {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  };
};
