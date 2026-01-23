import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { TAB_ROUTES } from "@/constants/routes";
import { Text } from "@/components/ui";
import { useTheme } from "@/lib/theme";

interface HomeEmptyPetsProps {
  style?: StyleProp<ViewStyle>;
  /** Optional custom image source for the placeholder. Supports both remote ({ uri }) and local (require) sources. */
  placeholderImageSource?: ImageSourcePropType;
}

export const HomeEmptyPets: React.FC<HomeEmptyPetsProps> = ({
  style,
  placeholderImageSource,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  // Use provided source or fall back to local asset
  const imageSource = placeholderImageSource ?? require("@/assets/images/cat_avatar.webp");

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
    router.push(TAB_ROUTES.pets);
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

        {/* Pet Avatar Circle with Image */}
        <View style={styles.petAvatarContainer}>
          <Image
            source={imageSource}
            style={styles.petImage}
          />

          {/* Add Photo Badge */}
          <TouchableOpacity
            style={[
              styles.addBadge,
              {
                backgroundColor: theme.colors.secondary,
                borderColor: theme.colors.onSecondary,
              },
            ]}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color={theme.colors.onSecondary} />
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
          <Ionicons name="add" size={24} color={theme.colors.onSecondary} />
        </View>
        <Text
          variant="labelLarge"
          style={[styles.ctaButtonText, { color: theme.colors.onSecondary }]}
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
  petImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
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
