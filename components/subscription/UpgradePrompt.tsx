import { View, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, Button, Card } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { SUBSCRIPTION_ROUTES } from '@/constants/routes';
import { useTracking } from '@/lib/posthog';
import { SUBSCRIPTION_EVENTS } from '@/lib/posthog/subscriptionEvents';

interface UpgradePromptProps {
  /**
   * Variant of the prompt
   * - 'banner': Full-width banner with dismiss
   * - 'card': Card-style prompt
   * - 'inline': Minimal inline prompt
   */
  variant?: 'banner' | 'card' | 'inline';

  /**
   * Whether the prompt can be dismissed
   */
  dismissible?: boolean;

  /**
   * Callback when prompt is dismissed
   */
  onDismiss?: () => void;

  /**
   * Custom message to display
   */
  message?: string;

  /**
   * Feature name to highlight (e.g., "unlimited pets")
   */
  feature?: string;
}

/**
 * UpgradePrompt displays a contextual prompt to upgrade to Pro
 * Can be placed throughout the app to encourage upgrades
 */
export function UpgradePrompt({
  variant = 'card',
  dismissible = false,
  onDismiss,
  message,
  feature,
}: UpgradePromptProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const { trackEvent } = useTracking();
  const {
    isProUser,
    isTrialActive,
    daysRemaining,
    isLoading,
  } = useSubscription();

  // Don't show if user already has Pro access (unless in trial)
  if (isProUser && !isTrialActive) {
    return null;
  }

  const handleUpgrade = async () => {
    trackEvent(SUBSCRIPTION_EVENTS.PURCHASE_STARTED, {
      screen: 'upgrade_prompt',
      source: `upgrade_prompt_${variant}`,
      trigger: 'open_subscription_screen',
    });
    router.push(`${SUBSCRIPTION_ROUTES.main}?source=upgrade_prompt_${variant}`);
  };

  const displayMessage = message ?? (
    isTrialActive
      ? t('subscription.trialPrompt', { days: daysRemaining })
      : t('subscription.upgradePrompt')
  );

  // Inline variant - minimal text with link
  if (variant === 'inline') {
    return (
      <Pressable onPress={handleUpgrade} style={styles.inlineContainer}>
        <MaterialCommunityIcons
          name="crown"
          size={16}
          color={theme.colors.primary}
        />
        <Text
          variant="labelMedium"
          style={{ color: theme.colors.primary, marginLeft: 4 }}
        >
          {feature ? t('subscription.unlockFeature', { feature }) : t('subscription.upgrade')}
        </Text>
      </Pressable>
    );
  }

  // Banner variant - full-width horizontal banner
  if (variant === 'banner') {
    return (
      <View style={[styles.banner, { backgroundColor: theme.colors.primaryContainer }]}>
        <View style={styles.bannerContent}>
          <MaterialCommunityIcons
            name="crown"
            size={20}
            color={theme.colors.primary}
          />
          <View style={styles.bannerTextContainer}>
            <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer }}>
              {displayMessage}
            </Text>
            {isTrialActive && (
              <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.8 }}>
                {t('subscription.trialDaysRemaining', { days: daysRemaining })}
              </Text>
            )}
          </View>
          <Button
            mode="contained"
            onPress={handleUpgrade}
            loading={isLoading}
            disabled={isLoading}
            compact
            style={styles.bannerButton}
          >
            {t('subscription.upgrade')}
          </Button>
        </View>
        {dismissible && onDismiss && (
          <Pressable onPress={onDismiss} style={styles.dismissButton}>
            <MaterialCommunityIcons
              name="close"
              size={20}
              color={theme.colors.onPrimaryContainer}
            />
          </Pressable>
        )}
      </View>
    );
  }

  // Card variant - default
  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.cardContent}>
        {dismissible && onDismiss && (
          <Pressable onPress={onDismiss} style={styles.cardDismiss}>
            <MaterialCommunityIcons
              name="close"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </Pressable>
        )}

        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons
              name="crown"
              size={28}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.cardTextContainer}>
            <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
              {t('subscription.paywall.title')}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
              {displayMessage}
            </Text>
          </View>
        </View>

        {/* Feature highlights */}
        {feature && (
          <View style={styles.featureContainer}>
            <MaterialCommunityIcons
              name="check-circle"
              size={16}
              color={theme.colors.primary}
            />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
              {feature}
            </Text>
          </View>
        )}

        <Button
          mode="contained"
          onPress={handleUpgrade}
          loading={isLoading}
          disabled={isLoading}
          style={styles.cardButton}
        >
          {isTrialActive
            ? t('subscription.upgradeBeforeTrialEnds')
            : t('subscription.upgrade')}
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  // Inline styles
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },

  // Banner styles
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerButton: {
    marginLeft: 8,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },

  // Card styles
  card: {
    marginVertical: 8,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  cardDismiss: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  featureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  cardButton: {
    marginTop: 4,
  },
});
