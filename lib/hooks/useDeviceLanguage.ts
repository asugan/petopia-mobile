import { useState, useEffect } from "react";
import { Platform } from "react-native";
import * as Localization from "expo-localization";
import { useUserSettingsStore, isLanguageSupported } from "@/stores/userSettingsStore";

type SupportedLanguage = "tr" | "en";

export function useDeviceLanguage() {
  const settings = useUserSettingsStore((state) => state.settings);
  const updateSettings = useUserSettingsStore((state) => state.updateSettings);

  const [deviceLanguage, setDeviceLanguage] = useState<SupportedLanguage>("en");
  const [isDeviceLanguageSupported, setIsDeviceLanguageSupported] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getDeviceLanguage = (): SupportedLanguage => {
      try {
        const deviceLocales = Localization.getLocales();
        let deviceLocale = deviceLocales[0]?.languageCode || "en";

        if (Platform.OS === "ios") {
          const preferredLanguages = Localization.getLocales();
          if (preferredLanguages.length > 0) {
            deviceLocale = preferredLanguages[0].languageCode || deviceLocale;
          }
        }

        const languageCode = deviceLocale.split("-")[0].toLowerCase();

        if (isLanguageSupported(languageCode)) {
          return languageCode as SupportedLanguage;
        }

        return "en";
      } catch {
        return "en";
      }
    };

    const detectedLanguage = getDeviceLanguage();
    const isSupported = isLanguageSupported(detectedLanguage);

    setDeviceLanguage(detectedLanguage);
    setIsDeviceLanguageSupported(isSupported);
    setIsLoading(false);
  }, []);

  const applyDeviceLanguage = async () => {
    if (!isDeviceLanguageSupported || deviceLanguage === settings?.language) {
      return;
    }

    try {
      await updateSettings({ language: deviceLanguage });
    } catch {
    }
  };

  return {
    deviceLanguage,
    isDeviceLanguageSupported,
    currentLanguage: settings?.language || "en",
    isLoading,
    applyDeviceLanguage,
  };
}
