import { View, StyleSheet, ScrollView, Linking, Pressable, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Text, Button, Card, IconButton } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { PUBLIC_CONFIG } from '@/lib/config/publicConfig';
import { SuccessSubscriptionModal } from '@/components/subscription/SuccessSubscriptionModal';
import { subscriptionStyles } from '@/lib/styles/subscription';
import { TAB_ROUTES } from '@/constants/routes';
import { useTracking } from '@/lib/posthog';
import { SUBSCRIPTION_EVENTS } from '@/lib/posthog/subscriptionEvents';

type PlanCycle = 'lifetime' | 'yearly' | 'monthly' | 'weekly' | 'custom';

const inferPlanCycle = (pkg: PurchasesPackage): PlanCycle => {
  switch (pkg.packageType) {
    case Purchases.PACKAGE_TYPE.LIFETIME:
      return 'lifetime';
    case Purchases.PACKAGE_TYPE.ANNUAL:
      return 'yearly';
    case Purchases.PACKAGE_TYPE.MONTHLY:
      return 'monthly';
    case Purchases.PACKAGE_TYPE.WEEKLY:
      return 'weekly';
    default:
      break;
  }

  const normalizedIdentifier = `${pkg.identifier}_${pkg.product.identifier}`.toLowerCase();

  if (normalizedIdentifier.includes('lifetime') || normalizedIdentifier.includes('one_time')) {
    return 'lifetime';
  }

  if (normalizedIdentifier.includes('year') || normalizedIdentifier.includes('annual')) {
    return 'yearly';
  }

  if (normalizedIdentifier.includes('month')) {
    return 'monthly';
  }

  if (normalizedIdentifier.includes('week')) {
    return 'weekly';
  }

  return 'custom';
};

const planPriority: Record<PlanCycle, number> = {
  lifetime: 0,
  yearly: 1,
  monthly: 2,
  weekly: 3,
  custom: 4,
};

const toPackageKey = (pkg: PurchasesPackage) => `${pkg.identifier}:${pkg.product.identifier}`;

/**
 * Subscription screen with custom paywall UI using RevenueCat offerings.
 */
export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackageKey, setSelectedPackageKey] = useState<string | null>(null);
  const source = useMemo(
    () => (typeof params.source === 'string' ? params.source : 'direct'),
    [params.source]
  );
  const { trackEvent } = useTracking();
  const {
    isPaidSubscription,
    isLoading,
    isVerifyingStatus,
    restorePurchases,
    purchasePackage,
    getOfferings,
  } = useSubscription();
  const legalTermsUrl = PUBLIC_CONFIG.legal.termsUrl ?? null;
  const legalPrivacyUrl = PUBLIC_CONFIG.legal.privacyUrl ?? null;
  const showLegalLinks = Boolean(legalTermsUrl || legalPrivacyUrl);
  const isIOS = Platform.OS === 'ios';

  useEffect(() => {
    trackEvent(SUBSCRIPTION_EVENTS.PAYWALL_VIEW, {
      screen: 'subscription',
      source,
      has_active_subscription: isPaidSubscription,
    });
  }, [isPaidSubscription, source, trackEvent]);

  useEffect(() => {
    let mounted = true;

    const loadPlans = async () => {
      setIsLoadingPlans(true);

      try {
        const offerings = await getOfferings();
        if (!mounted) return;

        const availablePackages = offerings?.current?.availablePackages ?? [];
        const sortedPackages = [...availablePackages].sort((a, b) => {
          const cyclePriority = planPriority[inferPlanCycle(a)] - planPriority[inferPlanCycle(b)];
          if (cyclePriority !== 0) return cyclePriority;
          return a.product.price - b.product.price;
        });

        setPackages(sortedPackages);
        setSelectedPackageKey((currentKey) => {
          if (currentKey && sortedPackages.some((pkg) => toPackageKey(pkg) === currentKey)) {
            return currentKey;
          }

          return sortedPackages[0] ? toPackageKey(sortedPackages[0]) : null;
        });
      } finally {
        if (mounted) {
          setIsLoadingPlans(false);
        }
      }
    };

    void loadPlans();

    return () => {
      mounted = false;
    };
  }, [getOfferings]);

  const runRestore = async () => {
    const restored = await restorePurchases({ screen: 'subscription', source });
    if (restored) {
      setModalVisible(true);
    }
  };

  const handleRestore = () => {
    const storeName = isIOS ? 'App Store' : 'Google Play';

    Alert.alert(
      t('subscription.restoreConfirmTitle', 'Restore purchases?'),
      t(
        'subscription.restoreConfirmMessage',
        `We will check your ${storeName} purchases and restore active Pro access on this account.`
      ),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('subscription.restoreConfirmAction', t('subscription.restorePurchases')),
          onPress: () => {
            void runRestore();
          },
        },
      ]
    );
  };

  const selectedPackage = useMemo(
    () => packages.find((pkg) => toPackageKey(pkg) === selectedPackageKey) ?? null,
    [packages, selectedPackageKey]
  );

  const handlePurchase = async () => {
    if (!selectedPackage) {
      return;
    }

    const success = await purchasePackage(selectedPackage, { screen: 'subscription', source });
    if (success) {
      setModalVisible(true);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
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

  const subscriptionNote = isIOS
    ? t('subscription.noteIos', t('subscription.note'))
    : t('subscription.noteAndroid', t('subscription.note'));

  const trustPoints = isIOS
    ? [
        t('subscription.trust.cancelAnytimeIos', t('subscription.trust.cancelAnytime')),
        t('subscription.trust.billedByStoreIos', t('subscription.trust.billedByStore')),
        t('subscription.trust.secureCheckoutIos', t('subscription.trust.secureCheckout')),
      ]
    : [
        t('subscription.trust.cancelAnytimeAndroid', t('subscription.trust.cancelAnytime')),
        t('subscription.trust.billedByStoreAndroid', t('subscription.trust.billedByStore')),
        t('subscription.trust.secureCheckoutAndroid', t('subscription.trust.secureCheckout')),
      ];

  // Pro features list
  const proFeatures = [
    {
      icon: 'paw' as const,
      title: t('subscription.features.unlimited'),
      description: t('subscription.features.unlimitedDesc'),
    },
    {
      icon: 'export' as const,
      title: t('subscription.features.export'),
      description: t('subscription.features.exportDesc'),
    },
    {
      icon: 'chart-line' as const,
      title: t('subscription.features.budgetTracking'),
      description: t('subscription.features.budgetTrackingDesc'),
    },
    {
      icon: 'repeat' as const,
      title: t('subscription.features.recurrence', 'Recurring Care Automations'),
      description: t(
        'subscription.features.recurrenceDesc',
        'Set once, repeat automatically with advanced recurring routines'
      ),
    },
    {
      icon: 'bell-ring-outline' as const,
      title: t('subscription.features.smartReminders', 'Smart Reminder Presets'),
      description: t(
        'subscription.features.smartRemindersDesc',
        'Use richer reminder cadences so important care tasks are never missed'
      ),
    },
    {
      icon: 'alert-circle-outline' as const,
      title: t('subscription.features.urgentMode', 'Urgent Care Focus'),
      description: t(
        'subscription.features.urgentModeDesc',
        'See urgent health tasks instantly and prioritize what matters most'
      ),
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
        <LinearGradient
          colors={[
            theme.colors.primaryContainer,
            theme.colors.surface,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View
            style={[
              styles.heroIcon,
              {
                backgroundColor: theme.colors.surface + 'F0',
                borderColor: theme.colors.surface,
              },
            ]}
          >
            <View style={styles.heroLogoMask}>
              <Image
                source={require('../assets/images/foreground.png')}
                style={styles.heroLogoImage}
                contentFit="cover"
              />
            </View>
          </View>
          <Text variant="headlineSmall" style={[styles.heroTitle, { color: theme.colors.onSurface }]}>
            {t('subscription.paywall.title')}
          </Text>
          <Text variant="bodyMedium" style={[styles.heroSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            {t('subscription.paywall.subtitle')}
          </Text>
        </LinearGradient>

        {/* Features List */}
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

        {!isPaidSubscription && (
          <Card style={[styles.planCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.cardContent}>
              <Text variant="titleMedium" style={[styles.featuresTitle, { color: theme.colors.onSurface }]}>
                {t('subscription.modal.upgradeNow')}
              </Text>

              {isLoadingPlans ? (
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('subscription.loadingPlans', 'Loading plans...')}
                </Text>
              ) : packages.length === 0 ? (
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('subscription.paywallError')}
                </Text>
              ) : (
                <View style={styles.planList}>
                  {packages.map((pkg, index) => {
                    const packageKey = toPackageKey(pkg);
                    const isSelected = packageKey === selectedPackageKey;
                    const cycle = inferPlanCycle(pkg);
                    const planTitle =
                      cycle === 'lifetime'
                        ? t('subscription.planLifetime', 'Lifetime')
                        : cycle === 'yearly'
                          ? t('subscription.planYearly', 'Yearly')
                          : cycle === 'monthly'
                            ? t('subscription.planMonthly', 'Monthly')
                            : cycle === 'weekly'
                              ? t('subscription.planWeekly', 'Weekly')
                              : pkg.product.title;
                    const planDescription =
                      cycle === 'lifetime'
                        ? t('subscription.oneTimePayment', 'One-time payment')
                        : cycle === 'yearly'
                          ? t('subscription.planYearlyDescription', 'Billed yearly')
                          : cycle === 'monthly'
                            ? t('subscription.planMonthlyDescription', 'Billed monthly')
                            : cycle === 'weekly'
                              ? t('subscription.planWeeklyDescription', 'Billed weekly')
                              : t('subscription.planFlexibleDescription', 'Flexible billing period');
                    const showBestValue = index === 0;

                    return (
                      <Pressable
                        key={packageKey}
                        onPress={() => setSelectedPackageKey(packageKey)}
                        style={[
                          styles.planOption,
                          {
                            borderColor: isSelected ? theme.colors.primary : theme.colors.outline,
                            backgroundColor: isSelected
                              ? theme.colors.primaryContainer
                              : theme.colors.surface,
                          },
                        ]}
                      >
                        <View style={styles.planOptionTopRow}>
                          <View style={styles.planTextWrap}>
                            <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
                              {planTitle}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                              {planDescription}
                            </Text>
                          </View>

                          {showBestValue && (
                            <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                              <Text variant="labelSmall" style={{ color: theme.colors.onPrimary }}>
                                {t('subscription.bestValue', 'Best value')}
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                          {pkg.product.priceString}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <Button
                mode="contained"
                onPress={handlePurchase}
                loading={isLoading || isVerifyingStatus}
                disabled={isLoading || isVerifyingStatus || isLoadingPlans || !selectedPackage}
                style={styles.actionButton}
              >
                {selectedPackage
                  ? `${t('subscription.upgrade')} · ${selectedPackage.product.priceString}`
                  : t('subscription.upgrade')}
              </Button>
            </View>
          </Card>
        )}

        {!isPaidSubscription && (
          <>
            <Text
              variant="bodySmall"
              style={[
                subscriptionStyles.note,
                { color: theme.colors.onSurfaceVariant }
              ]}
            >
              {subscriptionNote}
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
          </>
        )}

        {/* Restore Purchases */}
        <View style={styles.restoreContainer}>
          {isVerifyingStatus && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('subscription.verifyingPurchase', 'Purchase received. Verifying your subscription...')}
            </Text>
          )}
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
  heroCard: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  heroLogoMask: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#d3dff1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroLogoImage: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.5 }],
  },
  heroTitle: {
    textAlign: 'center',
    fontWeight: '700',
  },
  heroSubtitle: {
    textAlign: 'center',
    marginTop: 6,
  },
  featuresCard: {
    marginBottom: 16,
    elevation: 2,
  },
  planCard: {
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
  planList: {
    gap: 10,
    marginBottom: 14,
  },
  planOption: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  planOptionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  planTextWrap: {
    flex: 1,
    gap: 2,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionButton: {
    width: '100%',
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
