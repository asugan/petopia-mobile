import { Alert, View, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Text, Button } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { SUBSCRIPTION_ROUTES } from '@/constants/routes';
import { useUserTimezone } from '@/lib/hooks/useUserTimezone';
import { formatInTimeZone } from '@/lib/utils/date';

interface SubscriptionCardProps {
  showManageButton?: boolean;
  compact?: boolean;
  onUpgrade?: () => void | Promise<void>;
  title?: string;
}

/**
 * SubscriptionCard displays the current subscription status
 * Used in Settings screen and other places where subscription info is needed
 */
export function SubscriptionCard({ showManageButton = true, compact = false, onUpgrade, title }: SubscriptionCardProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const timezone = useUserTimezone();
  const router = useRouter();
  const {
    subscriptionStatus,
    isProUser,
    isPaidSubscription,
    isSubscribed,
    isCancelled,
    expirationDate,
    willRenew,
    isLoading,
    presentCustomerCenter,
  } = useSubscription();

  // Format expiration date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    try {
      return formatInTimeZone(
        dateString,
        timezone,
        i18n.language === 'tr' ? 'd MMMM yyyy' : 'MMMM d, yyyy'
      );
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

  const handleUpgrade = async () => {
    try {
      if (onUpgrade) {
        await onUpgrade();
      } else {
        router.push(`${SUBSCRIPTION_ROUTES.main}?source=subscription_card_upgrade`);
      }
    } catch (error) {
      console.error('Upgrade error:', error);
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
    try {
      if (onUpgrade) {
        await onUpgrade();
      } else {
        router.push(`${SUBSCRIPTION_ROUTES.main}?source=subscription_card`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
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
              {title ?? t('subscription.title')}
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
