import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, Button, Card } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useDowngradeStatus, useExecuteDowngrade } from '@/lib/hooks/useDowngrade';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { TAB_ROUTES, SUBSCRIPTION_ROUTES } from '@/constants/routes';

export default function DowngradeScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { data: downgradeStatus, isLoading: isLoadingStatus } = useDowngradeStatus();
  const { mutateAsync: executeDowngrade, isPending: isDowngrading } = useExecuteDowngrade();

  const pets = downgradeStatus?.pets ?? [];

  const handlePetSelect = (petId: string) => {
    setSelectedPetId(petId);
  };

  const handleKeepPet = () => {
    if (!selectedPetId) return;
    setShowConfirmModal(true);
  };

  const handleConfirmDowngrade = async () => {
    if (!selectedPetId) return;

    try {
      await executeDowngrade(selectedPetId);
      setShowConfirmModal(false);
      router.replace(TAB_ROUTES.home);
    } catch {
      // Error handled by mutation
    }
  };

  const handleUpgrade = () => {
    router.push(SUBSCRIPTION_ROUTES.main);
  };

  if (isLoadingStatus) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={48}
            color={theme.colors.error}
          />
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
            {t('downgrade.title')}
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            {t('downgrade.subtitle', { limit: downgradeStatus?.freemiumLimit ?? 1 })}
          </Text>
        </View>

        <Card style={[styles.petsCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.cardContent}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t('downgrade.selectPet')}
            </Text>
            
            {pets.map((pet) => (
              <Pressable
                key={pet._id}
                style={[
                  styles.petItem,
                  {
                    backgroundColor: selectedPetId === pet._id
                      ? theme.colors.primaryContainer
                      : theme.colors.surfaceVariant,
                    borderColor: selectedPetId === pet._id
                      ? theme.colors.primary
                      : 'transparent',
                  },
                ]}
                onPress={() => handlePetSelect(pet._id)}
              >
                {pet.profilePhoto ? (
                  <Image source={{ uri: pet.profilePhoto }} style={styles.petImage} />
                ) : (
                  <View style={[styles.petImagePlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <MaterialCommunityIcons
                      name="paw"
                      size={24}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </View>
                )}
                <View style={styles.petInfo}>
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                    {pet.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {pet.type}{pet.breed ? ` - ${pet.breed}` : ''}
                  </Text>
                </View>
                {selectedPetId === pet._id && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color={theme.colors.primary}
                  />
                )}
              </Pressable>
            ))}
          </View>
        </Card>

        <View style={styles.warningBox}>
          <MaterialCommunityIcons
            name="information-outline"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodySmall" style={[styles.warningText, { color: theme.colors.onSurfaceVariant }]}>
            {t('downgrade.warning')}
          </Text>
        </View>

        <View style={styles.buttonsContainer}>
          <Button
            mode="contained"
            onPress={handleKeepPet}
            disabled={!selectedPetId || isDowngrading}
            loading={isDowngrading}
            style={styles.button}
          >
            {t('downgrade.keepButton')}
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleUpgrade}
            disabled={isDowngrading}
            style={styles.button}
          >
            {t('downgrade.upgradeButton')}
          </Button>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmationModal
        visible={showConfirmModal}
        title={t('downgrade.confirmTitle')}
        message={t('downgrade.confirmMessage')}
        confirmText={t('downgrade.confirmDelete')}
        cancelText={t('downgrade.cancel')}
        onConfirm={handleConfirmDowngrade}
        onCancel={() => setShowConfirmModal(false)}
        destructive
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  petsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  petItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
  },
  petImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  petImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petInfo: {
    flex: 1,
    marginLeft: 12,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
  },
  buttonsContainer: {
    gap: 12,
  },
  button: {
    borderRadius: 8,
  },
});
