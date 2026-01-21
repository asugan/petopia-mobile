import React from 'react';
import { View, StyleSheet, Linking, Platform } from 'react-native';
import { Text, Button, Card, Portal, Dialog } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useNotifications } from '@/lib/hooks/useNotifications';

interface NotificationPermissionPromptProps {
  visible: boolean;
  onDismiss: () => void;
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

export default function NotificationPermissionPrompt({
  visible,
  onDismiss,
  onPermissionGranted,
  onPermissionDenied,
}: NotificationPermissionPromptProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { requestPermission, isLoading, permissions } = useNotifications();

  // Check if permission is permanently denied
  const isPermanentlyDenied = React.useMemo(() => {
    if (!permissions) return false;

    if (Platform.OS === 'ios') {
      const iosStatus = permissions.ios?.status;
      return iosStatus === Notifications.IosAuthorizationStatus.DENIED;
    }

    if (Platform.OS === 'android') {
      // Android: if status is DENIED, user must go to settings
      return permissions.status === Notifications.PermissionStatus.DENIED;
    }

    return false;
  }, [permissions]);

  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
    onPermissionDenied?.();
    onDismiss();
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();

    if (granted) {
      onPermissionGranted?.();
      onDismiss();
    } else {
      onPermissionDenied?.();
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Content>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={isPermanentlyDenied ? 'bell-off' : 'bell-ring'}
              size={64}
              color={theme.colors.primary}
            />
          </View>

          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
            {isPermanentlyDenied ? t('notifications.permissionDeniedTitle') : t('notifications.enableTitle')}
          </Text>

          <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
            {isPermanentlyDenied
              ? t('notifications.permissionDeniedDescription')
              : t('notifications.enableDescription')}
          </Text>

          {!isPermanentlyDenied && (
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={24}
                  color={theme.colors.primary}
                  style={styles.benefitIcon}
                />
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  {t('notifications.benefit1')}
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <MaterialCommunityIcons
                  name="medical-bag"
                  size={24}
                  color={theme.colors.secondary}
                  style={styles.benefitIcon}
                />
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  {t('notifications.benefit2')}
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <MaterialCommunityIcons
                  name="food-apple"
                  size={24}
                  color={theme.colors.tertiary}
                  style={styles.benefitIcon}
                />
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  {t('notifications.benefit3')}
                </Text>
              </View>
            </View>
          )}
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onDismiss}>
            {t('common.cancel')}
          </Button>
          {isPermanentlyDenied ? (
            <Button
              mode="contained"
              onPress={handleOpenSettings}
              disabled={isLoading}
            >
              {t('notifications.openSettings')}
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleRequestPermission}
              disabled={isLoading}
            >
              {t('notifications.enable')}
            </Button>
          )}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

/**
 * Inline notification permission card (for settings page)
 */
interface NotificationPermissionCardProps {
  refreshKey?: number;
}

export function NotificationPermissionCard({ refreshKey }: NotificationPermissionCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { permissions, permissionStatus, requestPermission, isLoading: hookLoading, checkPermissionStatus } = useNotifications();

  // Re-check permissions when refreshKey changes
  React.useEffect(() => {
    if (refreshKey !== undefined) {
      checkPermissionStatus();
    }
  }, [refreshKey, checkPermissionStatus]);

  const iosStatus = permissions?.ios?.status;
  const isEnabled =
    permissions?.granted ||
    permissionStatus === Notifications.PermissionStatus.GRANTED ||
    iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL;

  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  if (permissions === null || hookLoading) {
    return null;
  }

  if (isEnabled) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.primaryContainer }]}>
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons
              name="check-circle"
              size={32}
              color={theme.colors.primary}
            />
            <View style={styles.cardText}>
              <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                {t('notifications.enabled')}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>
                {t('notifications.enabledDescription')}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  }

  if (permissionStatus === Notifications.PermissionStatus.DENIED && !isEnabled) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.errorContainer }]}>
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons
              name="bell-off"
              size={32}
              color={theme.colors.error}
            />
            <View style={styles.cardText}>
              <Text variant="titleMedium" style={{ color: theme.colors.onErrorContainer }}>
                {t('notifications.disabled')}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer }}>
                {t('notifications.disabledDescription')}
              </Text>
            </View>
          </View>
          <Button
            mode="outlined"
            onPress={handleOpenSettings}
            style={styles.settingsButton}
            textColor={theme.colors.error}
          >
            {t('notifications.openSettings')}
          </Button>
        </View>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.secondaryContainer }]}>
      <View style={styles.cardContainer}>
        <View style={styles.cardHeaderRow}>
          <MaterialCommunityIcons
            name="bell-ring"
            size={32}
            color={theme.colors.secondary}
          />
          <View style={styles.cardText}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSecondaryContainer }}>
              {t('notifications.enableTitle')}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer }}>
              {t('notifications.enablePrompt')}
            </Text>
          </View>
        </View>
        <Button
          mode="contained"
          onPress={requestPermission}
          disabled={hookLoading}
          style={styles.settingsButton}
        >
          {t('notifications.enable')}
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  benefitsList: {
    gap: 16,
    paddingBottom: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    marginRight: 12,
  },
  card: {
    marginVertical: 8,
    elevation: 2,
  },
  cardContainer: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    marginLeft: 16,
  },
  settingsButton: {
    marginTop: 12,
  },
});
