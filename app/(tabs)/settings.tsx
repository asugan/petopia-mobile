import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SubscriptionCard } from "@/components/subscription";
import { Button, Card, ListItem, Switch, Text } from "@/components/ui";
import { LargeTitle } from "@/components/LargeTitle";
import { DateTimePicker } from "@/components/DateTimePicker";
import { useAuth } from "@/lib/auth";
import { accountService } from "@/lib/services/accountService";
import { notificationService, requestNotificationPermissions } from "@/lib/services/notificationService";
import { useAuthStore } from "@/stores/authStore";
import { useEventReminderStore } from "@/stores/eventReminderStore";
import { SupportedCurrency, useUserSettingsStore } from "@/stores/userSettingsStore";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { showToast } from "@/lib/toast/showToast";
import { SafeAreaView } from "react-native-safe-area-context";
import { LAYOUT } from "@/constants";
import { useOnboardingStore } from "@/stores/onboardingStore";
import CurrencyPicker from "@/components/CurrencyPicker";
import LoadingSpinner from "@/components/LoadingSpinner";
import { LanguageSettings } from "@/components/LanguageSettings";
import { NotificationPermissionCard } from "@/components/NotificationPermissionPrompt";
import { subscriptionStyles } from "@/lib/styles/subscription";

type ModalState = "none" | "contact" | "deleteWarning" | "deleteConfirm";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme, settings, updateSettings, updateBaseCurrency, isLoading: settingsLoading, error } = useUserSettingsStore();
  const { user, signOut } = useAuth();
  const { isLoading: authLoading, setLoading } = useAuthStore();
  const { resetOnboarding } = useOnboardingStore();
  const isDarkMode = settings?.theme === "dark";
  const [notificationPermissionEnabled, setNotificationPermissionEnabled] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(true);
  const quietHoursEnabled = settings?.quietHoursEnabled ?? true;
  const quietHours = useMemo(() => (
    settings?.quietHours ?? {
      startHour: 22,
      startMinute: 0,
      endHour: 8,
      endMinute: 0,
    }
  ), [settings?.quietHours]);
  const notificationsEnabled = settings?.notificationsEnabled ?? true;
  const budgetNotificationsEnabled = settings?.budgetNotificationsEnabled ?? true;
  const notificationsActive = notificationsEnabled && notificationPermissionEnabled;
  const setQuietHoursEnabled = useEventReminderStore((state) => state.setQuietHoursEnabled);
  const setQuietHours = useEventReminderStore((state) => state.setQuietHours);
  const clearAllReminderState = useEventReminderStore((state) => state.clearAllReminderState);
  const [activeModal, setActiveModal] = useState<ModalState>("none");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [permissionRefreshKey, setPermissionRefreshKey] = useState(0);
  const hasSyncedPermission = useRef(false);

  useEffect(() => {
    const fetchPermissionStatus = async () => {
      try {
        const enabled = await notificationService.areNotificationsEnabled();
        setNotificationPermissionEnabled(enabled);
        
        // Sync backend with system permission if they differ
        // Only auto-disable backend if system is disabled (one-time sync)
        if (!hasSyncedPermission.current && !enabled && settings?.notificationsEnabled === true) {
          hasSyncedPermission.current = true;
          await updateSettings({ notificationsEnabled: false });
        }
      } catch {
      } finally {
        setNotificationLoading(false);
      }
    };

    if (settings !== null) {
      fetchPermissionStatus();
    }
  }, [settings, updateSettings]);


  React.useEffect(() => {
    if (error) {
      showToast({
        type: 'error',
        title: t("common.error"),
        message: error,
      });
    }
  }, [error, t]);

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationLoading(true);
    try {
      if (value) {
        // If user wants to enable, check system permissions first
        const granted = await requestNotificationPermissions();
        setNotificationPermissionEnabled(granted);
        setPermissionRefreshKey((prev) => prev + 1);
        
        if (!granted) {
          showToast({
            type: 'warning',
            title: t("settings.notifications"),
            message: t("settings.notificationPermissionDenied"),
          });
          // Ensure backend stays disabled if permission denied
          await updateSettings({ notificationsEnabled: false });
        } else {
          // Permission granted, update backend
          await updateSettings({ notificationsEnabled: true });
        }
      } else {
        // If user wants to disable, update backend and cancel existing
        showToast({
          type: 'info',
          title: t("settings.notifications"),
          message: t("settings.notificationDisableInfo"),
        });
        await notificationService.cancelAllNotifications();
        clearAllReminderState();
        await updateSettings({ notificationsEnabled: false });
      }
    } catch {
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleBudgetNotificationToggle = async (value: boolean) => {
    setNotificationLoading(true);
    try {
      await updateSettings({ budgetNotificationsEnabled: value });
    } catch {
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
          } catch {
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
          onPress: async () => {
            await updateBaseCurrency(currency);
            await queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "expenses" });
            await queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "budget" });
            await queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "health-records" });
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const result = await accountService.deleteAccount(deleteConfirmText);
      if (result.success) {
        showToast({
          type: 'success',
          title: t("settings.accountDeletedTitle"),
          message: t("settings.accountDeletedMessage"),
        });
        setLoading(true);
        try {
          await signOut();
          router.replace("/(auth)/login");
        } catch {
        } finally {
          setLoading(false);
        }
      } else {
        showToast({
          type: 'error',
          title: t("common.error"),
          message: t("settings.accountDeleteError"),
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: t("common.error"),
        message: t("settings.accountDeleteError"),
      });
    } finally {
      setDeletingAccount(false);
      setActiveModal("none");
      setDeleteConfirmText("");
    }
  };

  const createTimeDate = (hour: number, minute: number) => {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date;
  };

  const handleQuietHoursStartChange = (date: Date) => {
    const nextQuietHours = {
      ...quietHours,
      startHour: date.getHours(),
      startMinute: date.getMinutes(),
    };
    setQuietHours(nextQuietHours);
    notificationService.setQuietHours(nextQuietHours);
    void updateSettings({ quietHours: nextQuietHours });
  };

  const handleQuietHoursEndChange = (date: Date) => {
    const nextQuietHours = {
      ...quietHours,
      endHour: date.getHours(),
      endMinute: date.getMinutes(),
    };
    setQuietHours(nextQuietHours);
    notificationService.setQuietHours(nextQuietHours);
    void updateSettings({ quietHours: nextQuietHours });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <LargeTitle title={t("settings.settings")} />
        {settingsLoading && (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
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
                  {user.image ? (
                    <Image source={{ uri: user.image }} style={styles.avatar} />
                  ) : (
                    <Ionicons
                      name="person"
                      size={32}
                      color={theme.colors.primary}
                    />
                  )}
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
        
        {/* Subscription Note */}
        <Text
          variant="bodySmall"
          style={[
            subscriptionStyles.note,
            { color: theme.colors.onSurfaceVariant }
          ]}
        >
          {t('subscription.note')}
        </Text>

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
                  disabled={notificationLoading || !settings}
                  color={theme.colors.primary}
                />
              }
            />
            <ListItem
              title={t("settings.budgetNotifications", "Budget notifications")}
              description={t("settings.budgetNotificationsDescription", "Alerts when you approach your budget limit")}
              left={
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              }
              right={
                <Switch
                  value={budgetNotificationsEnabled}
                  onValueChange={handleBudgetNotificationToggle}
                  disabled={notificationLoading || !settings || !notificationsActive}
                  color={theme.colors.primary}
                />
              }
            />
            <ListItem
              title={t("settings.quietHours")}
              description={t("settings.quietHoursDescription")}
              left={
                <MaterialCommunityIcons
                  name="moon-waning-crescent"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              }
              right={
                <Switch
                  value={quietHoursEnabled}
                  onValueChange={(value) => {
                    setQuietHoursEnabled(value);
                    void updateSettings({ quietHoursEnabled: value });
                  }}
                  disabled={notificationLoading || !notificationsActive}
                  color={theme.colors.primary}
                />
              }
            />
            {quietHoursEnabled && (
              <View style={styles.quietHoursContainer}>
                <DateTimePicker
                  mode="time"
                  label={t("settings.quietHoursStart")}
                  value={createTimeDate(quietHours.startHour, quietHours.startMinute)}
                  onChange={handleQuietHoursStartChange}
                  disabled={notificationLoading || !notificationsActive}
                />
                <DateTimePicker
                  mode="time"
                  label={t("settings.quietHoursEnd")}
                  value={createTimeDate(quietHours.endHour, quietHours.endMinute)}
                  onChange={handleQuietHoursEndChange}
                  disabled={notificationLoading || !notificationsActive}
                />
              </View>
            )}
            <NotificationPermissionCard refreshKey={permissionRefreshKey} />
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
              title={t("settings.deleteAccount")}
              description={t("settings.deleteAccountDescription")}
              left={
                <MaterialCommunityIcons
                  name="account-remove"
                  size={24}
                  color={theme.colors.error}
                />
              }
              onPress={() => setActiveModal("deleteWarning")}
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
              onPress={() => setActiveModal("contact")}
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
        {__DEV__ && (
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
        )}

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

      {/* Contact Modal */}
      {activeModal === "contact" && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                {t("settings.helpSupport")}
              </Text>
              <Pressable onPress={() => { Keyboard.dismiss(); setActiveModal("none"); }}>
                <Ionicons name="close" size={24} color={theme.colors.onSurfaceVariant} />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <View style={[styles.contactIconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                <Ionicons name="mail" size={32} color={theme.colors.primary} />
              </View>
              <Text variant="bodyLarge" style={[styles.contactText, { color: theme.colors.onSurface }]}>
                {t("settings.contactTitle")}
              </Text>
              <Text variant="bodyMedium" style={[styles.contactSubtext, { color: theme.colors.onSurfaceVariant }]}>
                {t("settings.contactSubtitle")}
              </Text>
              <Text variant="titleMedium" style={[styles.contactEmail, { color: theme.colors.primary }]}>
                {t("settings.contactEmail")}
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Delete Account Modal */}
      {activeModal === "deleteWarning" && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={{ color: theme.colors.error }}>
                {t("settings.deleteAccount")}
              </Text>
              <Pressable onPress={() => { Keyboard.dismiss(); setActiveModal("none"); }}>
                <Ionicons name="close" size={24} color={theme.colors.onSurfaceVariant} />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <View style={[styles.deleteIconContainer, { backgroundColor: theme.colors.errorContainer }]}>
                <MaterialCommunityIcons name="alert" size={48} color={theme.colors.error} />
              </View>
              <Text variant="bodyLarge" style={[styles.deleteWarningText, { color: theme.colors.onSurface }]}>
                {t("settings.deleteAccountWarning")}
              </Text>
              <Text variant="bodyMedium" style={[styles.deleteSubtext, { color: theme.colors.onSurfaceVariant }]}>
                {t("settings.deleteAccountWarningDescription")}
              </Text>
              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setActiveModal("none")}
                  style={styles.modalButton}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  mode="contained"
                  onPress={() => setActiveModal("deleteConfirm")}
                  buttonColor={theme.colors.error}
                  style={styles.modalButton}
                >
                  {t("settings.deleteAccount")}
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Delete Account Confirmation Modal */}
      {activeModal === "deleteConfirm" && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={{ color: theme.colors.error }}>
                {t("settings.deleteAccountConfirmTitle", "Confirm Account Deletion")}
              </Text>
              <Pressable onPress={() => { Keyboard.dismiss(); setActiveModal("none"); setDeleteConfirmText(""); }}>
                <Ionicons name="close" size={24} color={theme.colors.onSurfaceVariant} />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <View style={[styles.deleteIconContainer, { backgroundColor: theme.colors.errorContainer }]}>
                <MaterialCommunityIcons name="alert-octagon" size={48} color={theme.colors.error} />
              </View>
              <Text variant="bodyLarge" style={[styles.deleteWarningText, { color: theme.colors.onSurface }]}>
                {t("settings.deleteAccountFinalWarning", "This action is irreversible")}
              </Text>
              <Text variant="bodyMedium" style={[styles.deleteSubtext, { color: theme.colors.onSurfaceVariant }]}>
                {t("settings.deleteAccountTypeConfirm", "Type DELETE to confirm")}
              </Text>
              <View style={styles.confirmInputContainer}>
                <TextInput
                  value={deleteConfirmText}
                  onChangeText={setDeleteConfirmText}
                  placeholder="DELETE"
                  placeholderTextColor="#9E9E9E"
                  style={[
                    styles.confirmInput,
                    {
                      color: theme.colors.onSurface,
                      borderColor: deleteConfirmText === "DELETE" ? theme.colors.primary : theme.colors.outline,
                    },
                  ]}
                  autoFocus
                  autoCapitalize="characters"
                />
              </View>
              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => { setActiveModal("none"); setDeleteConfirmText(""); }}
                  style={styles.modalButton}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  mode="contained"
                  onPress={handleDeleteAccount}
                  loading={deletingAccount}
                  buttonColor={theme.colors.error}
                  disabled={deleteConfirmText !== "DELETE"}
                  style={styles.modalButton}
                >
                  {t("settings.deleteAccount")}
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
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
    overflow: "hidden",
  },
  avatar: {
    width: 56,
    height: 56,
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
  quietHoursContainer: {
    marginBottom: 16,
  },
  currencyWarning: {
    marginTop: 8,
    lineHeight: 18,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalBody: {
    padding: 24,
    alignItems: 'center',
  },
  contactIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  contactSubtext: {
    textAlign: 'center',
    marginBottom: 8,
  },
  contactEmail: {
    textAlign: 'center',
  },
  deleteIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteWarningText: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  deleteSubtext: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
  },
  confirmInputContainer: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  confirmInput: {
    width: 'auto',
    minWidth: 160,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 22,
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 6,
    backgroundColor: 'transparent',
  },
});
