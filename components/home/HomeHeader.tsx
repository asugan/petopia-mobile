import React, { useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

import { Text } from "@/components/ui";
import { User } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

interface HomeHeaderProps {
  user: User | null;
}

export const HomeHeader = ({
  user,
}: HomeHeaderProps) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const handleSettingsPress = useCallback(() => {
    router.push("/(tabs)/settings");
  }, [router]);

  return (
    <View style={styles.welcomeContent}>
      <TouchableOpacity
        style={styles.avatarContainer}
      >
        {user?.image ? (
          <Image source={{ uri: user.image }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color={theme.colors.primary} />
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.textContainer}>
        <Text
          variant="bodyMedium"
          style={[styles.greeting, { color: theme.colors.onSurfaceVariant }]}
        >
          {t("home.greeting")},
        </Text>
        <Text
          variant="headlineSmall"
          style={[styles.username, { color: theme.colors.onBackground }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {user?.name || t("settings.userPlaceholder")}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={handleSettingsPress}
        accessibilityLabel={t("settings.title")}
      >
        <Ionicons
          name="settings-outline"
          size={24}
          color={theme.colors.onBackground}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  welcomeContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  avatar: { width: 48, height: 48 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  greeting: {
    fontWeight: "500",
    marginBottom: 2,
  },
  username: {
    fontWeight: "bold",
  },
  settingsButton: {
    padding: 4,
  },
});
