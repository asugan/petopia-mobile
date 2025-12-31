import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Path, Ellipse } from "react-native-svg";

import { Text } from "@/components/ui";
import { useTheme } from "@/lib/theme";

interface HomeEmptyPetsProps {
  style?: StyleProp<ViewStyle>;
}

export const HomeEmptyPets: React.FC<HomeEmptyPetsProps> = ({ style }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  // Ripple effect colors - subtle concentric circles behind pet
  const renderRipple = (index: number, size: number) => (
    <View
      key={`ripple-${index}`}
      style={[
        styles.ripple,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: theme.colors.secondary + Math.floor(255 * (0.3 - index * 0.08)).toString(16).padStart(2, "0"),
        },
      ]}
    />
  );

  const handlePress = () => {
    router.push("/(tabs)/pets");
  };

  return (
    <View style={[styles.container, style]}>
      {/* Pet Illustration with Ripple Effect */}
      <View style={styles.illustrationContainer}>
        {/* Ripple circles */}
        {renderRipple(0, 220)}
        {renderRipple(1, 180)}
        {renderRipple(2, 140)}
        {renderRipple(3, 100)}

        {/* Pet Avatar Circle with Dog Illustration */}
        <View style={styles.petAvatarContainer}>
          {/* Dog SVG Illustration */}
          <Svg width={120} height={120} viewBox="0 0 120 120">
            {/* Background circle */}
            <Circle cx={60} cy={60} r={55} fill="#FFE4C4" />
            {/* Left ear */}
            <Ellipse cx={35} cy={35} rx={18} ry={22} fill="#8B4513" />
            {/* Right ear */}
            <Ellipse cx={85} cy={35} rx={18} ry={22} fill="#8B4513" />
            {/* Head */}
            <Circle cx={60} cy={55} r={35} fill="#D2691E" />
            {/* Left eye */}
            <Circle cx={45} cy={48} r={5} fill="#000000" />
            <Circle cx={46} cy={46} r={2} fill="#FFFFFF" />
            {/* Right eye */}
            <Circle cx={75} cy={48} r={5} fill="#000000" />
            <Circle cx={76} cy={46} r={2} fill="#FFFFFF" />
            {/* Nose */}
            <Ellipse cx={60} cy={62} rx={8} ry={6} fill="#000000" />
            {/* Mouth */}
            <Path
              d="M 52 70 Q 60 78 68 70"
              stroke="#000000"
              strokeWidth={2}
              fill="transparent"
            />
            {/* Tongue */}
            <Path
              d="M 56 75 Q 60 82 64 75"
              fill="#FF6B6B"
            />
            {/* Left cheek */}
            <Circle cx={32} cy={58} r={6} fill="#FFB6C1" opacity={0.6} />
            {/* Right cheek */}
            <Circle cx={88} cy={58} r={6} fill="#FFB6C1" opacity={0.6} />
            {/* White markings on face */}
            <Path
              d="M 45 75 Q 60 85 75 75 Q 75 65 60 65 Q 45 65 45 75"
              fill="#FFF8DC"
            />
          </Svg>

          {/* Add Photo Badge */}
          <TouchableOpacity
            style={[
              styles.addBadge,
              { backgroundColor: theme.colors.secondary },
            ]}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text
          variant="headlineSmall"
          style={[styles.title, { color: theme.colors.onBackground }]}
        >
          {t("home.emptyPetsTitle")}
        </Text>

        <Text
          variant="bodyMedium"
          style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
        >
          {t("home.emptyPetsDescription")}
        </Text>
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        style={[styles.ctaButton, { backgroundColor: theme.colors.secondary }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.buttonIconContainer}>
          <Ionicons name="add" size={24} color="#000000" />
        </View>
        <Text
          variant="labelLarge"
          style={[styles.ctaButtonText, { color: "#000000" }]}
        >
          {t("home.emptyPetsCta")}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  illustrationContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    position: "relative",
    height: 220,
  },
  ripple: {
    position: "absolute",
    borderWidth: 2,
    opacity: 0.3,
  },
  petAvatarContainer: {
    position: "relative",
    zIndex: 1,
  },
  addBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#121212",
  },
  content: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 12,
  },
  description: {
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    gap: 8,
  },
  buttonIconContainer: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonText: {
    fontWeight: "600",
    textTransform: "none",
  },
});
