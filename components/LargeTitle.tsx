import React from "react";
import { Pressable, StyleSheet, View, ViewStyle, useWindowDimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { Text } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { useSubscription } from "@/lib/hooks/useSubscription";
import {
  notificationService,
  enableLocalNotifications,
  disableLocalNotifications,
} from "@/lib/services/notificationService";
import { showToast } from "@/lib/toast/showToast";
import { useEventReminderStore } from "@/stores/eventReminderStore";
import { useUserSettingsStore } from "@/stores/userSettingsStore";
import { useNotifications } from "@/lib/hooks/useNotifications";
import NotificationPermissionPrompt from "@/components/NotificationPermissionPrompt";
import { TAB_ROUTES } from "@/constants/routes";

interface LargeTitleProps {
  title: string;
  style?: ViewStyle;
  actions?: React.ReactNode;
}

export const LargeTitle = ({ title, style, actions }: LargeTitleProps) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const hasActions = Boolean(actions);
  const logoCircleSize = width >= 1024 ? 52 : width >= 768 ? 46 : width <= 360 ? 36 : 42;
  const logoMaskSize = logoCircleSize - 4;

  return (
    <View style={[styles.container, hasActions && styles.containerRow, style]}>
      {hasActions ? (
        <View style={styles.logoWrap} accessibilityLabel={title}>
          <View
            style={[
              styles.logoCircle,
              {
                width: logoCircleSize,
                height: logoCircleSize,
                borderRadius: logoCircleSize / 2,
                backgroundColor: theme.colors.surface + "F0",
                borderColor: theme.colors.primary,
              },
            ]}
          >
            <View
              style={[
                styles.logoMask,
                {
                  width: logoMaskSize,
                  height: logoMaskSize,
                  borderRadius: logoMaskSize / 2,
                },
              ]}
            >
              <Image
                source={require("@/assets/images/foreground.png")}
                style={styles.logoImage}
                contentFit="cover"
              />
            </View>
          </View>
        </View>
      ) : (
        <Text
          variant="headlineLarge"
          style={[styles.title, { color: theme.colors.onBackground }]}
        >
          {title}
        </Text>
      )}
      {actions ? <View style={styles.actionsContainer}>{actions}</View> : null}
    </View>
  );
};

export const HeaderActions = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { subscriptionStatus } = useSubscription();
  const { settings, updateSettings, isLoading } = useUserSettingsStore();
  const clearAllReminderState = useEventReminderStore((state) => state.clearAllReminderState);
  const isDarkMode = settings?.theme === "dark";
  const notificationsEnabled = settings?.notificationsEnabled ?? true;
  const [showPermissionModal, setShowPermissionModal] = React.useState(false);

  // Notifications hook
  const { requestPermission, isLoading: isNotificationLoading } = useNotifications();

  const handleToggleTheme = async () => {
    if (!settings || isLoading) return;
    await updateSettings({ theme: isDarkMode ? "light" : "dark" });
  };

  const handleNotificationToggle = async () => {
    if (!settings || isLoading || isNotificationLoading) return;
    try {
      if (notificationsEnabled) {
        showToast({
          type: "info",
          title: t("settings.notifications"),
          message: t("settings.notificationDisableInfo"),
        });
        await notificationService.cancelAllNotifications();
        clearAllReminderState();
        void disableLocalNotifications();
        await updateSettings({ notificationsEnabled: false });
      } else {
        const granted = await requestPermission();
        if (granted) {
          void enableLocalNotifications();
          await updateSettings({ notificationsEnabled: true });
        } else {
          setShowPermissionModal(true);
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[LargeTitle] Notification toggle failed:', error);
      }
    }
  };

  const statusLabel = subscriptionStatus === "pro" ? "Pro" : subscriptionStatus === "trial" ? "Trial" : "Free";
  const statusTheme = subscriptionStatus === "pro"
    ? {
      color: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
      icon: "crown" as const,
    }
    : subscriptionStatus === "trial"
      ? {
        color: theme.colors.tertiary,
        backgroundColor: theme.colors.tertiaryContainer,
        icon: "clock-outline" as const,
      }
      : {
        color: theme.colors.onSurfaceVariant,
        backgroundColor: theme.colors.surfaceVariant,
        icon: "account-outline" as const,
      };

  return (
    <View style={styles.headerActions}>
      <View style={[styles.statusChip, { backgroundColor: statusTheme.backgroundColor, borderColor: statusTheme.color }]}
      >
        <MaterialCommunityIcons
          name={statusTheme.icon}
          size={14}
          color={statusTheme.color}
        />
        <Text variant="labelSmall" style={{ color: statusTheme.color }}>
          {statusLabel}
        </Text>
      </View>
      <Pressable
        onPress={handleNotificationToggle}
        disabled={isNotificationLoading || !settings}
        style={({ pressed }) => [
          styles.iconButton,
          { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant },
          pressed && styles.iconPressed,
        ]}
      >
        <MaterialCommunityIcons
          name={notificationsEnabled ? "bell" : "bell-outline"}
          size={18}
          color={notificationsEnabled ? theme.colors.warning : theme.colors.onSurface}
        />
      </Pressable>
      <Pressable
        onPress={handleToggleTheme}
        style={({ pressed }) => [
          styles.iconButton,
          { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant },
          pressed && styles.iconPressed,
        ]}
      >
        <MaterialCommunityIcons
          name={isDarkMode ? "moon-waning-crescent" : "white-balance-sunny"}
          size={18}
          color={theme.colors.onSurface}
        />
      </Pressable>
      <Pressable
        onPress={() => router.push(TAB_ROUTES.settings)}
        style={({ pressed }) => [
          styles.iconButton,
          { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant },
          pressed && styles.iconPressed,
        ]}
      >
        <MaterialCommunityIcons name="cog" size={18} color={theme.colors.onSurface} />
      </Pressable>

      <NotificationPermissionPrompt
        visible={showPermissionModal}
        onDismiss={() => setShowPermissionModal(false)}
        onPermissionGranted={async () => {
          void enableLocalNotifications();
          await updateSettings({ notificationsEnabled: true });
        }}
        onPermissionDenied={async () => {
          void disableLocalNotifications();
          await updateSettings({ notificationsEnabled: false });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 16,
  },
  containerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  actionsContainer: {
    flexShrink: 0,
  },
  title: {
    fontWeight: "700",
    flexShrink: 1,
  },
  logoWrap: {
    height: 52,
    minWidth: 52,
    justifyContent: "center",
    alignItems: "flex-start",
    flexShrink: 1,
  },
  logoCircle: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 5,
  },
  logoMask: {
    overflow: "hidden",
    backgroundColor: "#d3dff1",
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    transform: [{ scale: 1.45 }],
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  iconPressed: {
    transform: [{ scale: 0.96 }],
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
});
