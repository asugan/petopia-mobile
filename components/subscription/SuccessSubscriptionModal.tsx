import { Modal, View, StyleSheet, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, Button, Card } from '@/components/ui';
import { useTheme } from '@/lib/theme';

interface SuccessSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  isTrial?: boolean;
}

/**
 * SuccessSubscriptionModal - Shows a success modal after subscription completion
 * with navigation to homepage option
 */
const MODAL_VERTICAL_MARGIN = 48;

export function SuccessSubscriptionModal({ visible, onClose, isTrial = false }: SuccessSubscriptionModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const title = isTrial ? t('subscription.trialSuccess.title') : t('subscription.success.title');
  const message = isTrial ? t('subscription.trialSuccess.message') : t('subscription.success.message');
  const buttonText = isTrial ? t('subscription.trialSuccess.button') : t('subscription.success.button');

  const handleClose = () => {
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
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.cardContent}>
                  {/* Success Icon */}
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={64}
                    color={theme.colors.primary}
                  />
                </View>

                {/* Title */}
                <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
                  {title}
                </Text>

                {/* Message */}
                <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
                  {message}
                </Text>

                {/* Action Button */}
                <Button
                  mode="contained"
                  onPress={handleClose}
                  style={styles.button}
                >
                  {buttonText}
                </Button>
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
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 179, 209, 0.2)',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 12,
  },
  message: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  button: {
    width: '100%',
  },
});
