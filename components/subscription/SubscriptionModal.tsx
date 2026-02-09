import { Modal, View, StyleSheet, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, Button, Card } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { SubscriptionCard } from './SubscriptionCard';
import { SUBSCRIPTION_ROUTES } from '@/constants/routes';
import { useTracking } from '@/lib/posthog';
import { SUBSCRIPTION_EVENTS } from '@/lib/posthog/subscriptionEvents';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  featureName?: string;
}

/**
 * SubscriptionModal - Shows a modal for users without subscription
 * when they try to access premium features
 */
const MODAL_VERTICAL_MARGIN = 48;

export function SubscriptionModal({ visible, onClose, featureName }: SubscriptionModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isLoading, canStartTrial } = useSubscription();
  const { trackEvent } = useTracking();

  useEffect(() => {
    if (!visible) return;

    trackEvent(SUBSCRIPTION_EVENTS.PAYWALL_VIEW, {
      screen: 'subscription_modal',
      source: 'feature_gate_modal',
      trial_eligible: canStartTrial,
    });
  }, [canStartTrial, trackEvent, visible]);

  const handleUpgrade = () => {
    trackEvent(SUBSCRIPTION_EVENTS.PURCHASE_STARTED, {
      screen: 'subscription_modal',
      source: 'feature_gate_modal',
      trigger: 'open_subscription_screen',
    });
    onClose();
    router.push(`${SUBSCRIPTION_ROUTES.main}?source=feature_gate_modal`);
  };

  const handleClose = () => {
    trackEvent(SUBSCRIPTION_EVENTS.PAYWALL_CLOSE, {
      screen: 'subscription_modal',
      source: 'feature_gate_modal',
      reason: 'dismiss',
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <View style={styles.centeredView}>
          <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
            <Card style={[styles.modalCard, { 
              backgroundColor: theme.colors.surface, 
              maxHeight: height - insets.top - insets.bottom - MODAL_VERTICAL_MARGIN
            }]}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.cardContent}>
                  {/* Header */}
                <View style={styles.header}>
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                      name="crown"
                      size={32}
                      color={theme.colors.primary}
                    />
                  </View>
                  <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
                    {t('subscription.modal.title')}
                  </Text>
                </View>

                {/* Description */}
                <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
                  {featureName
                    ? t('subscription.modal.featureDescription', { feature: featureName })
                    : t('subscription.modal.description')}
                </Text>

                {/* Current Subscription Status */}
                <View style={styles.statusContainer}>
                  <SubscriptionCard compact={false} showManageButton={false} />
                </View>

                {!canStartTrial && (
                  <View style={styles.noticeContainer}>
                    <MaterialCommunityIcons
                      name="information-outline"
                      size={16}
                      color={theme.colors.onSurfaceVariant}
                    />
                    <Text
                      variant="bodySmall"
                      style={[styles.noticeText, { color: theme.colors.onSurfaceVariant }]}
                    >
                      {t('subscription.trialAlreadyUsed')}
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    onPress={handleUpgrade}
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.upgradeButton}
                  >
                    {t('subscription.modal.upgradeNow')}
                  </Button>
                  <Button
                    mode="text"
                    onPress={handleClose}
                    disabled={isLoading}
                    style={styles.laterButton}
                    textColor={theme.colors.onSurfaceVariant}
                  >
                    {t('subscription.modal.maybeLater')}
                  </Button>
                </View>

                {/* Features Preview */}
                <View style={styles.featuresPreview}>
                  <Text variant="labelMedium" style={[styles.featuresTitle, { color: theme.colors.onSurfaceVariant }]}>
                    {t('subscription.modal.includes')}
                  </Text>
                  <View style={styles.featuresList}>
                    <View style={styles.featureItem}>
                      <MaterialCommunityIcons name="check" size={16} color={theme.colors.primary} />
                      <Text variant="bodySmall" style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
                        {t('subscription.features.unlimited')}
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <MaterialCommunityIcons name="check" size={16} color={theme.colors.primary} />
                      <Text variant="bodySmall" style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
                        {t('subscription.features.advanced')}
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <MaterialCommunityIcons name="check" size={16} color={theme.colors.primary} />
                      <Text variant="bodySmall" style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
                        {t('subscription.features.export')}
                      </Text>
                    </View>
                  </View>
                  </View>
                </View>
              </ScrollView>
            </Card>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modalCard: {
    width: '100%',
    elevation: 8,
    borderRadius: 16,
  },
  cardContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 179, 209, 0.2)',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  statusContainer: {
    marginBottom: 24,
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  upgradeButton: {
    marginBottom: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  laterButton: {
    alignSelf: 'center',
  },
  featuresPreview: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  featuresTitle: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    flex: 1,
  },
});
