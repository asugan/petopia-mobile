import React, { useEffect, useState } from "react";
import { SubscriptionCard } from "@/components/subscription";
import { Button, Card, ListItem, Switch, Text } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { notificationService, requestNotificationPermissions } from "@/lib/services/notificationService";
import { useAuthStore } from "@/stores/authStore";
import { SupportedCurrency, useUserSettingsStore } from "@/stores/userSettingsStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LAYOUT } from "@/constants";
import { useOnboardingStore } from "@/stores/onboardingStore";
import CurrencyPicker from "@/components/CurrencyPicker";
import LoadingSpinner from "@/components/LoadingSpinner";
import { LanguageSettings } from "@/components/LanguageSettings";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme, settings, updateSettings, updateBaseCurrency, isLoading: settingsLoading, error } = useUserSettingsStore();
  const { user, signOut } = useAuth();
  const { isLoading: authLoading, setLoading } = useAuthStore();
  const { resetOnboarding } = useOnboardingStore();
  const isDarkMode = settings?.theme === "dark";
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(true);

  useEffect(() => {
    const fetchPermissionStatus = async () => {
      try {
        const enabled = await notificationService.areNotificationsEnabled();
        setNotificationsEnabled(enabled);
      } catch (error) {
        console.error("Notification status check failed:", error);
      } finally {
        setNotificationLoading(false);
      }
    };

    fetchPermissionStatus();
  }, []);

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationLoading(true);
    try {
      if (value) {
        const granted = await requestNotificationPermissions();
        setNotificationsEnabled(granted);
        if (!granted) {
          Alert.alert(
            t("settings.notifications"),
            t("settings.notificationPermissionDenied", "Notifications are blocked at the system level. Please enable them from settings.")
          );
        }
      } else {
        Alert.alert(
          t("settings.notifications"),
          t(
            "settings.notificationDisableInfo",
            "You can disable notifications from your device settings. We'll stop scheduling new reminders from here."
          )
        );
        setNotificationsEnabled(false);
      }
    } catch (error) {
      console.error("Notification toggle failed:", error);
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t("auth.logout"), t("auth.logoutConfirm"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("auth.logout"),
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await signOut();
            router.replace("/(auth)/login");
          } catch (error) {
            console.error("Logout error:", error);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleCurrencySelect = (currency: SupportedCurrency) => {
    if (currency === settings?.baseCurrency) {
      return;
    }
    Alert.alert(
      t("settings.currency"),
      t("settings.currencyWarning"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.confirm"),
          onPress: () => updateBaseCurrency(currency),
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {settingsLoading && (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
          </View>
        )}

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorContainer }]}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onErrorContainer }}>
              {error}
            </Text>
          </View>
        )}

        {/* User Profile */}
        {user && (
          <Card
            style={[
              styles.sectionCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.cardContent}>
              <View style={styles.profileContainer}>
                <View
                  style={[
                    styles.avatarContainer,
                    { backgroundColor: theme.colors.primaryContainer },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account"
                    size={32}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.profileInfo}>
                  <Text
                    variant="titleMedium"
                    style={{ color: theme.colors.onSurface }}
                  >
                    {user.name || t("settings.userPlaceholder")}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {user.email}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        )}

        {/* Subscription Status */}
        <SubscriptionCard />

        {/* Theme Settings */}
        <Card
          style={[
            styles.sectionCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.cardContent}>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              {t("settings.appearance")}
            </Text>
            <ListItem
              title={t("settings.darkMode")}
              description={t("settings.changeTheme")}
              left={
                <MaterialCommunityIcons
                  name="theme-light-dark"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              }
              right={
                <Switch
                  value={isDarkMode}
                  onValueChange={() => updateSettings({ theme: isDarkMode ? 'light' : 'dark' })}
                  color={theme.colors.primary}
                />
              }
            />
          </View>
        </Card>

        {/* App Settings */}
        <Card
          style={[
            styles.sectionCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.cardContent}>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              {t("settings.appSettings")}
            </Text>
            <ListItem
              title={t("settings.notifications")}
              description={t("settings.reminderNotifications")}
              left={
                <MaterialCommunityIcons
                  name="bell"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              }
              right={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationToggle}
                  disabled={notificationLoading}
                  color={theme.colors.primary}
                />
              }
            />
            <LanguageSettings variant="embedded" />

            <View style={styles.currencyPickerContainer}>
              <Text
                variant="titleMedium"
                style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
              >
                {t("settings.currency")}
              </Text>
              <CurrencyPicker
                selectedCurrency={settings?.baseCurrency || 'TRY'}
                onSelect={(currency) => handleCurrencySelect(currency as SupportedCurrency)}
                label={t("settings.defaultCurrency")}
              />
              <Text
                variant="bodySmall"
                style={[styles.currencyWarning, { color: theme.colors.onSurfaceVariant }]}
              >
                {t("settings.currencyWarning")}
              </Text>
            </View>
          </View>
        </Card>

        {/* Data & Privacy */}
        <Card
          style={[
            styles.sectionCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.cardContent}>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              {t("settings.dataPrivacy")}
            </Text>
            <ListItem
              title={t("settings.dataBackup")}
              description={t("settings.dataBackupDescription")}
              left={
                <MaterialCommunityIcons
                  name="cloud-upload"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              }
              right={
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              }
            />
            <ListItem
              title={t("settings.dataCleanup")}
              description={t("settings.dataCleanupDescription")}
              left={
                <MaterialCommunityIcons
                  name="delete"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              }
              right={
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              }
            />
          </View>
        </Card>

        {/* About */}
        <Card
          style={[
            styles.sectionCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.cardContent}>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              {t("settings.about")}
            </Text>
            <ListItem
              title={t("settings.version")}
              description={t("settings.versionNumber")}
              left={
                <MaterialCommunityIcons
                  name="information"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              }
            />
            <ListItem
              title={t("settings.helpSupport")}
              description={t("settings.helpSupportDescription")}
              left={
                <MaterialCommunityIcons
                  name="help-circle"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              }
              right={
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              }
            />
          </View>
        </Card>

        {/* Debug / Development */}
        <Card
          style={[
            styles.sectionCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.cardContent}>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              Development
            </Text>
            <ListItem
              title="Reset Onboarding"
              description="Unlocks the onboarding flow for testing"
              left={
                <MaterialCommunityIcons
                  name="restart"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              }
              onPress={() => {
                Alert.alert(
                  "Reset Onboarding",
                  "Are you sure? Typically this is only for testing.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { 
                      text: "Reset", 
                      style: "destructive", 
                      onPress: () => {
                        resetOnboarding();
                        // Navigate directly to onboarding to avoid race conditions with root redirector
                        router.replace('/(onboarding)');
                      }
                    }
                  ]
                );
              }}
              right={
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              }
            />
          </View>
        </Card>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            mode="outlined"
            textColor={theme.colors.error}
            style={[styles.logoutButton, { borderColor: theme.colors.error }]}
            onPress={handleLogout}
            loading={authLoading}
            disabled={authLoading}
          >
            {t("auth.logout")}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: "600",
  },
  logoutContainer: {
    marginTop: 24,
    marginBottom: LAYOUT.TAB_BAR_HEIGHT,
  },
  logoutButton: {
    borderWidth: 1,
  },
  currencyPickerContainer: {
    marginTop: 16,
  },
  currencyWarning: {
    marginTop: 8,
    lineHeight: 18,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    marginTop: 16,
    borderRadius: 8,
  },
});
