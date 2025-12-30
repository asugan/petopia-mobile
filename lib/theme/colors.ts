import { ThemeColors, GradientColors } from "./types";

// Vibrant Candy Color Palette (Light Mode)
export const lightColors: ThemeColors = {
  // Ana Renkler (Candy Colors)
  primary: "#FF6B9D",        // 🍭 Bright Pink (şeker pembe)
  secondary: "#00E5A0",      // 🍃 Vibrant Mint (canlı nane)
  tertiary: "#A855F7",       // 💜 Electric Lavender (elektrik mor)
  accent: "#FFB347",         // 🍊 Orange Candy (portakal şeker)

  // Durum Renkleri
  success: "#10B981",        // ✅ Bright Green
  warning: "#F59E0B",        // ⚠️ Golden Yellow
  error: "#EF4444",          // ❌ Bright Red
  info: "#3B82F6",           // ℹ️ Bright Blue

  // Yüzeyler
  background: "#FFFFFF",     // Beyaz
  surface: "#FAFAFA",        // Çok hafif gri
  surfaceVariant: "#F5F5F5", // Hafif gri
  surfaceDisabled: "#E5E7EB", // Disabled state

  // Container colors
  primaryContainer: "#FFE5EC",
  secondaryContainer: "#CCFFF0",
  tertiaryContainer: "#F3E8FF",
  errorContainer: "#FEE2E2",
  infoContainer: "#DBEAFE",
  warningContainer: "#FFEDD5",
  successContainer: "#D1FAE5",

  genderMale: "#3B82F6",
  genderMaleContainer: "#DBEAFE",
  genderFemale: "#EC4899",
  genderFemaleContainer: "#FCE7F3",

  overlay: "rgba(0,0,0,0.3)",
  overlayLight: "rgba(255,255,255,0.1)",
  scrim: "rgba(0,0,0,0.12)",

  // Outline colors
  outline: "#9CA3AF",               // Gray outline
  outlineVariant: "#D1D5DB",        // Lighter outline

  // Inverse colors
  inversePrimary: "#FF4A8B",        // Inverse primary
  inverseSurface: "#1F2937",        // Dark surface for inverse
  inverseOnSurface: "#F9FAFB",      // Light text on inverse surface

  // Metin Renkleri
  onPrimary: "#FFFFFF",
  onSecondary: "#FFFFFF",
  onTertiary: "#FFFFFF",
  onAccent: "#FFFFFF",
  onBackground: "#1F2937",   // Koyu gri (siyah yerine)
  onSurface: "#374151",      // Orta koyu gri
  onSurfaceVariant: "#6B7280", // Orta gri
  onError: "#FFFFFF",
  onSuccess: "#FFFFFF",
  onWarning: "#FFFFFF",
  onPrimaryContainer: "#831843",    // Dark text on light pink
  onSecondaryContainer: "#004D40",  // Dark text on light mint
  onTertiaryContainer: "#4C1D95",   // Dark text on light purple
  onErrorContainer: "#991B1B",      // Dark text on light red

  // Event type colors (Pastel shades for light mode)
  eventFeeding: "#FFB3D1",          // Pastel pink
  eventExercise: "#B3FFD9",         // Pastel mint
  eventGrooming: "#C8B3FF",         // Pastel lavender
  eventPlay: "#FFDAB3",             // Pastel peach
  eventTraining: "#FFF3B3",         // Pastel yellow
  eventVetVisit: "#FF9999",         // Pastel red
  eventWalk: "#B3E5FF",             // Pastel sky blue
  eventBath: "#E5B3FF",             // Pastel purple
  eventVaccination: "#FFC2D1",      // Soft rose
  eventMedication: "#B3D9FF",       // Soft blue
  eventOther: "#CCCCCC",            // Neutral gray
};

// Neon/Glow Color Palette (Dark Mode)
export const darkColors: ThemeColors = {
  // Ana Renkler (Neon/Glow Effect)
  primary: "#00ADB5",        // 🌊 Cyan/Teal (tasarıma uygun)
  secondary: "#00D696",      // 💚 Bright Mint (parlak nane)
  tertiary: "#C084FC",       // 💜 Neon Lavender (parlak mor)
  accent: "#FF7F50",         // 🟠 Coral Orange (tasarıma uygun)

  // Durum Renkleri (Daha parlak)
  success: "#34D399",        // ✅ Neon Green
  warning: "#FBBF24",        // ⚠️ Bright Gold
  error: "#F87171",          // ❌ Bright Red
  info: "#60A5FA",           // ℹ️ Bright Blue

  // Yüzeyler (Saf siyah değil!)
  background: "#1A202C",     // Dark gray-blue (tasarıma uygun)
  surface: "#2D3748",        // Darker gray (tasarıma uygun)
  surfaceVariant: "#374151", // Medium gray
  surfaceDisabled: "#4B5563", // Disabled state

  // Container colors
  primaryContainer: "#831843",
  secondaryContainer: "#004D40",
  tertiaryContainer: "#4C1D95",
  errorContainer: "#991B1B",
  infoContainer: "#1E3A5F",
  warningContainer: "#78350F",
  successContainer: "#064E3B",

  genderMale: "#60A5FA",
  genderMaleContainer: "#1E3A5F",
  genderFemale: "#F472B6",
  genderFemaleContainer: "#831843",

  overlay: "rgba(0,0,0,0.5)",
  overlayLight: "rgba(255,255,255,0.1)",
  scrim: "rgba(0,0,0,0.32)",

  // Outline colors
  outline: "#6B7280",               // Gray outline
  outlineVariant: "#4B5563",        // Darker outline

  // Inverse colors
  inversePrimary: "#FFB3D9",        // Light pink for inverse
  inverseSurface: "#F9FAFB",        // Light surface for inverse
  inverseOnSurface: "#1F2937",      // Dark text on inverse

  // Metin Renkleri (Daha parlak)
  onPrimary: "#FFFFFF",
  onSecondary: "#000000",
  onTertiary: "#000000",
  onAccent: "#000000",
  onBackground: "#E2E8F0",   // Text Light (tasarıma uygun)
  onSurface: "#E2E8F0",      // Text Light (tasarıma uygun)
  onSurfaceVariant: "#A0AEC0", // Text Muted (tasarıma uygun)
  onError: "#FFFFFF",
  onSuccess: "#000000",
  onWarning: "#000000",
  onPrimaryContainer: "#FFE5EC",    // Light text on dark pink
  onSecondaryContainer: "#CCFFF0",  // Light text on dark mint
  onTertiaryContainer: "#F3E8FF",   // Light text on dark purple
  onErrorContainer: "#FEE2E2",      // Light text on dark red

  // Event type colors (Using theme colors for dark mode)
  eventFeeding: "#00ADB5",          // primary (Cyan/Teal)
  eventExercise: "#00D696",         // secondary (Bright Mint)
  eventGrooming: "#C084FC",         // tertiary (Neon Lavender)
  eventPlay: "#FF7F50",             // accent (Coral Orange)
  eventTraining: "#60A5FA",         // info (Bright Blue)
  eventVetVisit: "#F87171",         // error (Bright Red)
  eventWalk: "#3B82F6",             // info variant (Bright Blue)
  eventBath: "#D8B4FE",             // tertiary variant (Light Purple)
  eventVaccination: "#FB7185",      // bright rose
  eventMedication: "#38BDF8",       // bright blue
  eventOther: "#6B7280",            // outline (Gray)
};

// Gradient tanımları (light mode için)
export const lightGradients: GradientColors = {
  primary: ["#FF6B9D", "#FF8FAB"],      // Pink gradient
  secondary: ["#00E5A0", "#00F5AE"],    // Mint gradient
  tertiary: ["#A855F7", "#C084FC"],     // Purple gradient
  accent: ["#FFB347", "#FFC870"],       // Orange gradient
};

// Dark mode gradients (daha parlak)
export const darkGradients: GradientColors = {
  primary: ["#00ADB5", "#00C9D1"],  // Cyan/Teal gradient
  secondary: ["#00D696", "#00E5A0"],
  tertiary: ["#C084FC", "#D8B4FE"],
  accent: ["#FF7F50", "#FF9A70"],   // Coral Orange gradient
};
