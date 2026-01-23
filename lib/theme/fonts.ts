import { ThemeFonts } from "./types";
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';

export const fonts: ThemeFonts = {
  headlineLarge: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
    fontFamily: "Roboto_700Bold",
  },
  headlineMedium: {
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 36,
    fontFamily: "Roboto_700Bold",
  },
  headlineSmall: {
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 32,
    fontFamily: "Roboto_700Bold",
  },
  titleLarge: {
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 28,
    fontFamily: "Roboto_700Bold",
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
    fontFamily: "Roboto_500Medium",
  },
  titleSmall: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    fontFamily: "Roboto_500Medium",
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
    fontFamily: "Roboto_400Regular",
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    fontFamily: "Roboto_400Regular",
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
    fontFamily: "Roboto_400Regular",
  },
  labelLarge: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    fontFamily: "Roboto_500Medium",
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    fontFamily: "Roboto_500Medium",
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 16,
    fontFamily: "Roboto_500Medium",
  },
};
