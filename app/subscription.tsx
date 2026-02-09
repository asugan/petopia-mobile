import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, Button, Card, IconButton } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { usePublicConfig } from '@/lib/hooks/usePublicConfig';
import { SubscriptionCard } from '@/components/subscription';
import { SuccessSubscriptionModal } from '@/components/subscription/SuccessSubscriptionModal';
import { subscriptionStyles } from '@/lib/styles/subscription';
import { TAB_ROUTES } from '@/constants/routes';
import { useTracking } from '@/lib/posthog';
import { SUBSCRIPTION_EVENTS } from '@/lib/posthog/subscriptionEvents';

/**
 * Subscription screen with RevenueCat paywall
 * Allows users to view plans, subscribe, and manage their subscription
 */
export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const [modalVisible, setModalVisible] = useState(false);
  const [isTrialSuccess, setIsTrialSuccess] = useState(false);
  const source = useMemo(
    () => (typeof params.source === 'string' ? params.source : 'direct'),
    [params.source]
  );
  const { trackEvent } = useTracking();
  const {
    isPaidSubscription,
    isLoading,
    restorePurchases,
    presentPaywall,
    canStartTrial,
  } = useSubscription();
  const { data: publicConfig } = usePublicConfig();
  const legalTermsUrl = publicConfig?.legal.termsUrl ?? null;
  const legalPrivacyUrl = publicConfig?.legal.privacyUrl ?? null;
  const showLegalLinks = Boolean(legalTermsUrl || legalPrivacyUrl);

  useEffect(() => {
    trackEvent(SUBSCRIPTION_EVENTS.PAYWALL_VIEW, {
      screen: 'subscription',
      source,
      trial_eligible: canStartTrial,
    });
  }, [canStartTrial, source, trackEvent]);

  const handleRestore = async () => {
    await restorePurchases({ screen: 'subscription', source });
  };

  const handlePresentPaywall = async () => {
    const success = await presentPaywall(undefined, { screen: 'subscription', source });
    if (success) {
      setModalVisible(true);
    }
  };

  const handleTrialStartSuccess = () => {
    setIsTrialSuccess(true);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setIsTrialSuccess(false);
    router.replace(TAB_ROUTES.home);
  };

  const handleTerms = () => {
    if (!legalTermsUrl) {
      return;
    }

    void Linking.openURL(legalTermsUrl);
  };

  const handlePrivacy = () => {
    if (!legalPrivacyUrl) {
      return;
    }

    void Linking.openURL(legalPrivacyUrl);
  };

  const handleBack = () => {
    trackEvent(SUBSCRIPTION_EVENTS.PAYWALL_CLOSE, {
      screen: 'subscription',
      source,
      reason: 'back_button',
    });
    router.back();
  };

  const trustPoints = [
    t('subscription.trust.cancelAnytime'),
    t('subscription.trust.billedByStore'),
    t('subscription.trust.secureCheckout'),
  ];

  // Pro features list
  const proFeatures = [
    {
      icon: 'paw' as const,
      title: t('subscription.features.unlimited'),
      description: t('subscription.features.unlimitedDesc'),
    },
    {
      icon: 'silverware-fork-knife' as const,
      title: t('subscription.features.feedingSchedules'),
      description: t('subscription.features.feedingSchedulesDesc'),
    },
    {
      icon: 'wallet' as const,
      title: t('subscription.features.budgetTracking'),
      description: t('subscription.features.budgetTrackingDesc'),
    },
    {
      icon: 'export' as const,
      title: t('subscription.features.export'),
      description: t('subscription.features.exportDesc'),
    },
    {
      icon: 'headset' as const,
      title: t('subscription.features.priority'),
      description: t('subscription.features.priorityDesc'),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={handleBack}
          iconColor={theme.colors.onBackground}
        />
        <Text variant="titleLarge" style={{ color: theme.colors.onBackground }}>
          {t('subscription.title')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Status Card */}
        <SubscriptionCard onUpgrade={handlePresentPaywall} onTrialStartSuccess={handleTrialStartSuccess} />

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

        <View style={styles.trustList}>
          {trustPoints.map((point) => (
            <View key={point} style={styles.trustItem}>
              <MaterialCommunityIcons name="check-circle-outline" size={16} color={theme.colors.primary} />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                {point}
              </Text>
            </View>
          ))}
        </View>

        {/* Features List - Show if not paid */}
        {!isPaidSubscription && (
          <Card style={[styles.featuresCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.cardContent}>
              <Text variant="titleMedium" style={[styles.featuresTitle, { color: theme.colors.onSurface }]}>
                {t('subscription.features.title')}
              </Text>
              {proFeatures.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                    <MaterialCommunityIcons
                      name={feature.icon}
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.featureText}>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '500' }}>
                      {feature.title}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                      {feature.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Restore Purchases */}
        <View style={styles.restoreContainer}>
          <Button
            mode="text"
            onPress={handleRestore}
            loading={isLoading}
            disabled={isLoading}
          >
            {t('subscription.restorePurchases')}
          </Button>
        </View>

        {/* Legal Links */}
        {showLegalLinks && (
          <View style={styles.legalContainer}>
            {legalTermsUrl && (
              <Button mode="text" onPress={handleTerms} textColor={theme.colors.onSurfaceVariant}>
                {t('subscription.terms')}
              </Button>
            )}
            {legalTermsUrl && legalPrivacyUrl && (
              <Text style={{ color: theme.colors.onSurfaceVariant }}>•</Text>
            )}
            {legalPrivacyUrl && (
              <Button mode="text" onPress={handlePrivacy} textColor={theme.colors.onSurfaceVariant}>
                {t('subscription.privacy')}
              </Button>
            )}
          </View>
        )}

        {/* Spacer for bottom */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Success Modal */}
      <SuccessSubscriptionModal
        visible={modalVisible}
        onClose={handleModalClose}
        isTrial={isTrialSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  featuresCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  featuresTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    marginLeft: 12,
  },
  restoreContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  legalContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  trustList: {
    marginBottom: 12,
    gap: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
