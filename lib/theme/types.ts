export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  // Primary colors
  primary: string;
  secondary: string;
  tertiary: string;
  accent: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Surface colors
  background: string;
  surface: string;
  surfaceVariant: string;
  surfaceDisabled: string;

  // Container colors
  primaryContainer: string;
  secondaryContainer: string;
  tertiaryContainer: string;
  errorContainer: string;
  infoContainer: string;
  warningContainer: string;
  successContainer: string;

  genderMale: string;
  genderMaleContainer: string;
  genderFemale: string;
  genderFemaleContainer: string;
  genderOther: string;
  genderOtherContainer: string;

  overlay: string;
  overlayLight: string;
  scrim: string;

  // Outline colors
  outline: string;
  outlineVariant: string;

  // Inverse colors
  inversePrimary: string;
  inverseSurface: string;
  inverseOnSurface: string;

  // Text colors
  onPrimary: string;
  onSecondary: string;
  onTertiary: string;
  onAccent: string;
  onBackground: string;
  onSurface: string;
  onSurfaceVariant: string;
  onError: string;
  onSuccess: string;
  onWarning: string;
  onPrimaryContainer: string;
  onSecondaryContainer: string;
  onTertiaryContainer: string;
  onErrorContainer: string;

  // Event type colors
  eventFeeding: string;
  eventExercise: string;
  eventGrooming: string;
  eventPlay: string;
  eventTraining: string;
  eventVetVisit: string;
  eventWalk: string;
  eventBath: string;
  eventVaccination: string;
  eventMedication: string;
  eventOther: string;
}

export interface FontVariant {
  fontSize: number;
  fontWeight: "400" | "500" | "600" | "700" | "800" | "900";
  lineHeight?: number;
}

export interface ThemeFonts {
  headlineLarge: FontVariant;
  headlineMedium: FontVariant;
  headlineSmall: FontVariant;
  titleLarge: FontVariant;
  titleMedium: FontVariant;
  titleSmall: FontVariant;
  bodyLarge: FontVariant;
  bodyMedium: FontVariant;
  bodySmall: FontVariant;
  labelLarge: FontVariant;
  labelMedium: FontVariant;
  labelSmall: FontVariant;
}

export interface GradientColors {
  primary: readonly [string, string];
  secondary: readonly [string, string];
  tertiary: readonly [string, string];
  accent: readonly [string, string];
}

export interface Theme {
  mode: ThemeMode;
  dark: boolean;
  colors: ThemeColors;
  fonts: ThemeFonts;
  gradients: GradientColors;
  roundness: number;
}

export interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}
