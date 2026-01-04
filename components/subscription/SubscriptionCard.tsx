import { Alert, View, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Text, Button, ProgressBar } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { REVENUECAT_CONFIG } from '@/lib/revenuecat/config';

interface SubscriptionCardProps {
  showManageButton?: boolean;
  compact?: boolean;
  onUpgrade?: () => void | Promise<void>;
}

/**
 * SubscriptionCard displays the current subscription status
 * Used in Settings screen and other places where subscription info is needed
 */
export function SubscriptionCard({ showManageButton = true, compact = false, onUpgrade }: SubscriptionCardProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const {
    subscriptionStatus,
    isProUser,
    isTrialActive,
    isPaidSubscription,
    isSubscribed,
    isCancelled,
    daysRemaining,
    expirationDate,
    willRenew,
    isLoading,
    presentCustomerCenter,
  } = useSubscription();

  // Format expiration date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Get status badge color and text
  const getStatusConfig = () => {
    switch (subscriptionStatus) {
      case 'pro':
        return {
          color: theme.colors.primary,
          backgroundColor: theme.colors.primaryContainer,
          text: t('subscription.pro'),
          icon: 'crown' as const,
        };
      case 'trial':
        return {
          color: theme.colors.tertiary,
          backgroundColor: theme.colors.tertiaryContainer,
          text: t('subscription.trial'),
          icon: 'clock-outline' as const,
        };
      default:
        return {
          color: theme.colors.onSurfaceVariant,
          backgroundColor: theme.colors.surfaceVariant,
          text: t('subscription.free'),
          icon: 'account-outline' as const,
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Calculate trial progress (0 to 1)
  const trialProgress = isTrialActive
    ? (REVENUECAT_CONFIG.TRIAL_DURATION_DAYS - daysRemaining) / REVENUECAT_CONFIG.TRIAL_DURATION_DAYS
    : 0;

  const handleUpgrade = async () => {
    if (onUpgrade) {
      await onUpgrade();
    } else {
      router.push('/subscription');
    }
  };

  const handleManage = async () => {
    await presentCustomerCenter();
  };

  const handleCancel = () => {
    Alert.alert(
      t('subscription.cancelSubscriptionTitle'),
      t('subscription.cancelSubscriptionMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('subscription.cancelSubscriptionAction'),
          style: 'destructive',
          onPress: handleManage,
        },
      ]
    );
  };

  const handleNavigateToSubscription = async () => {
    if (onUpgrade) {
      await onUpgrade();
    } else {
      router.push('/subscription');
    }
  };

  if (compact) {
    return (
      <Pressable onPress={isProUser ? handleManage : handleNavigateToSubscription}>
        <View style={[styles.compactContainer, { backgroundColor: statusConfig.backgroundColor }]}>
          <MaterialCommunityIcons
            name={statusConfig.icon}
            size={20}
            color={statusConfig.color}
          />
          <Text variant="labelMedium" style={{ color: statusConfig.color, marginLeft: 8 }}>
            {statusConfig.text}
          </Text>
          {isTrialActive && (
            <Text variant="labelSmall" style={{ color: statusConfig.color, marginLeft: 4 }}>
              ({t('subscription.trialDaysRemaining', { days: daysRemaining })})
            </Text>
          )}
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={statusConfig.color}
            style={{ marginLeft: 'auto' }}
          />
        </View>
      </Pressable>
    );
  }

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons
              name={statusConfig.icon}
              size={24}
              color={statusConfig.color}
            />
            <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
              {t('subscription.title')}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusConfig.backgroundColor }]}>
            <Text variant="labelMedium" style={{ color: statusConfig.color }}>
              {statusConfig.text}
            </Text>
          </View>
        </View>

        {/* Status Info */}
        <View style={styles.statusContainer}>
          {/* Paid Subscription Status */}
          {isPaidSubscription && (
            <>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('subscription.currentPlan')}: <Text style={{ fontWeight: '600' }}>{t('subscription.pro')}</Text>
              </Text>
              {expirationDate && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                  {willRenew
                    ? t('subscription.autoRenews', { date: formatDate(expirationDate) })
                    : t('subscription.cancelled', { date: formatDate(expirationDate) })}
                </Text>
              )}
            </>
          )}

          {/* Trial Status */}
          {isTrialActive && (
            <>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('subscription.trialActive')}
              </Text>
              <View style={styles.trialProgress}>
                <ProgressBar
                  progress={trialProgress}
                  color={theme.colors.tertiary}
                  style={styles.progressBar}
                />
                <Text variant="bodySmall" style={{ color: theme.colors.tertiary, marginTop: 4 }}>
                  {t('subscription.trialDaysRemaining', { days: daysRemaining })}
                </Text>
              </View>
            </>
          )}

          {/* Free User Status */}
          {!isProUser && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('subscription.upgradePrompt')}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        {showManageButton && (
          <View style={styles.actions}>
            {isPaidSubscription ? (
              <>
                <Button
                  mode="outlined"
                  onPress={handleManage}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.actionButton}
                >
                  {t('subscription.manageSubscription')}
                </Button>
                {isSubscribed && !isCancelled && (
                  <Button
                    mode="outlined"
                    onPress={handleCancel}
                    loading={isLoading}
                    disabled={isLoading}
                    textColor={theme.colors.error}
                    style={[
                      styles.actionButton,
                      styles.cancelButton,
                      { borderColor: theme.colors.error },
                    ]}
                  >
                    {t('subscription.cancelSubscription')}
                  </Button>
                )}
              </>
            ) : (
              <Button
                mode="contained"
                onPress={handleUpgrade}
                loading={isLoading}
                disabled={isLoading}
                style={styles.actionButton}
              >
                {t('subscription.upgrade')}
              </Button>
            )}
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusContainer: {
    marginBottom: 16,
  },
  trialProgress: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  actions: {
    marginTop: 8,
  },
  actionButton: {
    width: '100%',
  },
  cancelButton: {
    marginTop: 12,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
});
