import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { Button, FAB, Text } from '@/components/ui';
import { HeaderActions, LargeTitle } from '@/components/LargeTitle';
import PetListCard from '@/components/PetListCard';
import { useTheme } from '@/lib/theme';
import { PetCardSkeleton } from '@/components/PetCardSkeleton';
import { PetModal } from '@/components/PetModal';
import { LAYOUT } from '@/constants';
import { Pet } from '@/lib/types';
import { useInfinitePets } from '@/lib/hooks/usePets';
import { showToast } from '@/lib/toast/showToast';
import { usePendingPet } from '@/lib/hooks/usePendingPet';
import { SUBSCRIPTION_ROUTES, FEATURE_ROUTES } from '@/constants/routes';

export default function PetsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { isProUser, isInitialized } = useSubscription();
  const { processPendingPet } = usePendingPet();

  // React Query infinite query for pets
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfinitePets();

  // Flatten all pages for filtering and display
  const allPets = useMemo(
    () => data?.pages?.flat() || [],
    [data?.pages]
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPet, setSelectedPetState] = useState<Pet | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'dog' | 'cat' | 'urgent'>('all');
  const [urgentStatus, setUrgentStatus] = useState<Record<string, { urgent: boolean; loading: boolean }>>({});

  // Login sonrası pending pet kontrolü
  useEffect(() => {
    processPendingPet(allPets.length);
  }, [processPendingPet, allPets.length, isInitialized]);

  useEffect(() => {
    if (error) {
      showToast({
        type: 'error',
        title: t('common.error'),
        message: error.message || t('common.error'),
      });
    }
  }, [error, t]);

  const handleAddPet = async () => {
    if (!isProUser && allPets.length >= 1) {
      router.push(SUBSCRIPTION_ROUTES.main);
      return;
    }
    setSelectedPetState(undefined);
    setModalVisible(true);
  };

  const handleUpgradePress = async () => {
    router.push(SUBSCRIPTION_ROUTES.main);
  };

  const handleModalSuccess = () => {
    // React Query handles cache invalidation automatically
    showToast({
      type: 'success',
      title: t('pets.saveSuccess'),
    });
  };

  const handleViewPet = (pet: Pet) => {
    router.push(FEATURE_ROUTES.petDetail(pet._id));
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleRefresh = async () => {
    await refetch();
  };

  useEffect(() => {
    setUrgentStatus(prev => {
      if (allPets.length === 0) return {};
      const next: Record<string, { urgent: boolean; loading: boolean }> = {};
      allPets.forEach((pet) => {
        if (prev[pet._id]) {
          next[pet._id] = prev[pet._id];
        }
      });
      return next;
    });
  }, [allPets]);

  const handleUrgencyChange = React.useCallback(
    (petId: string, isUrgent: boolean, isLoading: boolean) => {
      setUrgentStatus((prev) => {
        const current = prev[petId];
        if (current && current.urgent === isUrgent && current.loading === isLoading) {
          return prev;
        }
        return { ...prev, [petId]: { urgent: isUrgent, loading: isLoading } };
      });
    },
    []
  );

  const filteredPets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = (pet: Pet) =>
      !query ||
      pet.name.toLowerCase().includes(query) ||
      (pet.breed ? pet.breed.toLowerCase().includes(query) : false);

    return allPets.filter((pet) => {
      if (!matchesQuery(pet)) return false;
      if (activeFilter === 'all' || activeFilter === 'urgent') return true;
      return pet.type === activeFilter;
    });
  }, [activeFilter, allPets, searchQuery]);

  const urgentSummary = useMemo(() => {
    if (activeFilter !== 'urgent') {
      return { isLoading: false, hasUrgent: true };
    }

    if (allPets.length === 0) {
      return { isLoading: false, hasUrgent: false };
    }

    const entries = allPets
      .map((pet) => urgentStatus[pet._id])
      .filter(Boolean) as { urgent: boolean; loading: boolean }[];
    const hasAllReports = entries.length === allPets.length;
    const isLoadingUrgent = !hasAllReports || entries.some((entry) => entry.loading);
    const hasUrgent = entries.some((entry) => entry.urgent);

    return { isLoading: isLoadingUrgent, hasUrgent };
  }, [activeFilter, allPets, urgentStatus]);

  const chipItems = useMemo(() => ([
    { key: 'all' as const, label: t('pets.filters.all') },
    { key: 'dog' as const, label: t('pets.filters.dogs') },
    { key: 'cat' as const, label: t('pets.filters.cats') },
    { key: 'urgent' as const, label: t('pets.filters.urgent'), icon: 'alert-circle' as const },
  ]), [t]);

  const renderLoadingSkeleton = () => {
    return Array.from({ length: 4 }, (_, index) => (
      <View key={`skeleton-${index}`} style={styles.cardWrapper}>
        <PetCardSkeleton />
      </View>
    ));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <LargeTitle title={t('navigation.pets')} actions={<HeaderActions />} />
        <View style={styles.searchWrapper}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <Ionicons name="search" size={18} color={theme.colors.onSurfaceVariant} style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('pets.searchPlaceholder')}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              selectionColor={theme.colors.primary}
              style={[styles.searchInput, { color: theme.colors.onSurface }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {chipItems.map((chip) => {
            const isSelected = activeFilter === chip.key;
            const chipBackground = isSelected ? theme.colors.primary : theme.colors.surface;
            const chipBorder = isSelected ? theme.colors.primary : theme.colors.outlineVariant;
            const chipTextColor = isSelected ? theme.colors.onPrimary : theme.colors.onSurfaceVariant;
            const iconColor = isSelected ? theme.colors.onPrimary : theme.colors.error;

            return (
              <Pressable
                key={chip.key}
                onPress={() => setActiveFilter(chip.key)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: chipBackground,
                    borderColor: chipBorder,
                  },
                  pressed && styles.chipPressed,
                ]}
              >
                <View style={styles.chipContent}>
                  {chip.icon && (
                    <Ionicons
                      name={chip.icon}
                      size={14}
                      color={iconColor}
                      style={styles.chipIcon}
                    />
                  )}
                  <Text variant="labelMedium" style={[styles.chipLabel, { color: chipTextColor }]}>
                    {chip.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.listSection}>
          {isLoading && allPets.length === 0 ? (
            renderLoadingSkeleton()
          ) : allPets.length === 0 ? (
            <View
              style={[
                styles.emptyStateCard,
                { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface },
              ]}
            >
              <View style={[styles.emptyStateIcon, { backgroundColor: theme.colors.primaryContainer }]}
              >
                <Ionicons name="paw" size={24} color={theme.colors.primary} />
              </View>
              <Text variant="titleMedium" style={[styles.emptyStateTitle, { color: theme.colors.onSurface }]}>
                {t('pets.emptyTitle')}
              </Text>
              <Text variant="bodySmall" style={[styles.emptyStateDescription, { color: theme.colors.onSurfaceVariant }]}>
                {t('pets.emptyDescription')}
              </Text>
              <Button mode="contained" onPress={handleAddPet} style={styles.emptyStateCta}>
                {t('pets.emptyCta')}
              </Button>
            </View>
          ) : (
            filteredPets.map((pet) => (
              <PetListCard
                key={pet._id}
                pet={pet}
                petId={pet._id}
                onPress={() => handleViewPet(pet)}
                filterMode={activeFilter === 'urgent' ? 'urgent' : 'all'}
                onUrgencyChange={handleUrgencyChange}
              />
            ))
          )}

          {!isProUser && allPets.length >= 1 && (
            <Pressable
              onPress={handleUpgradePress}
              style={({ pressed }) => [
                styles.upgradeCard,
                { borderColor: theme.colors.primary },
                pressed && styles.chipPressed,
              ]}
            >
              <View style={[styles.upgradeIconWrap, { backgroundColor: theme.colors.primaryContainer }]}
              >
                <Ionicons name="lock-closed" size={18} color={theme.colors.primary} />
              </View>
              <Text variant="labelLarge" style={[styles.upgradeTitle, { color: theme.colors.onSurface }]}
              >
                {t('limits.pets.title')}
              </Text>
              <Text variant="bodySmall" style={[styles.upgradeSubtitle, { color: theme.colors.onSurfaceVariant }]}
              >
                {t('limits.pets.subtitle')}
              </Text>
              <Text variant="labelLarge" style={[styles.upgradeCta, { color: theme.colors.primary }]}
              >
                {t('limits.pets.cta')}
              </Text>
            </Pressable>
          )}

          {activeFilter === 'urgent' && allPets.length > 0 && !hasNextPage && !urgentSummary.isLoading && !urgentSummary.hasUrgent && (
            <View style={styles.emptyUrgent}>
              <Ionicons name="alert-circle-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={[styles.emptyUrgentText, { color: theme.colors.onSurfaceVariant }]}>
                {t('pets.filters.emptyUrgent')}
              </Text>
            </View>
          )}

          {hasNextPage && allPets.length > 0 && (
            <View style={styles.loadMoreContainer}>
              <Button
                mode="outlined"
                onPress={handleLoadMore}
                disabled={isFetchingNextPage}
                style={styles.loadMoreButton}
              >
                {isFetchingNextPage ? t('common.loading') : t('common.loadMore')}
              </Button>
            </View>
          )}

          {isProUser && allPets.length > 0 && (
            <Pressable
              onPress={handleAddPet}
              style={({ pressed }) => [
                styles.addCard,
                { borderColor: theme.colors.outlineVariant },
                pressed && styles.chipPressed,
              ]}
            >
              <View style={[styles.addIconWrap, { backgroundColor: theme.colors.primaryContainer }]}
              >
                <Ionicons name="paw" size={20} color={theme.colors.primary} />
              </View>
              <Text variant="bodySmall" style={[styles.addPrompt, { color: theme.colors.onSurfaceVariant }]}
              >
                {t('pets.addAnotherPrompt')}
              </Text>
              <Text variant="labelLarge" style={[styles.addCta, { color: theme.colors.primary }]}
              >
                {t('pets.addAnotherCta')}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <FAB
        icon="add"
        style={{ ...styles.fab, backgroundColor: theme.colors.primary }}
        onPress={handleAddPet}
      />

      <PetModal
        visible={modalVisible}
        pet={selectedPet}
        onClose={() => setModalVisible(false)}
        onSuccess={handleModalSuccess}
        testID="pet-modal"
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: LAYOUT.TAB_BAR_HEIGHT + 80,
  },
  searchWrapper: {
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  chipsContainer: {
    paddingVertical: 4,
    paddingRight: 16,
  },
  chip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  chipPressed: {
    transform: [{ scale: 0.98 }],
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipIcon: {
    marginRight: 4,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  listSection: {
    marginTop: 12,
  },
  emptyUrgent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyUrgentText: {
    marginLeft: 6,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  addCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPrompt: {
    marginTop: 8,
  },
  addCta: {
    marginTop: 6,
    fontWeight: '700',
  },
  emptyStateCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  emptyStateIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    textAlign: 'center',
  },
  emptyStateDescription: {
    textAlign: 'center',
  },
  emptyStateCta: {
    marginTop: 6,
  },
  upgradeCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    opacity: 0.8,
  },
  upgradeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeTitle: {
    marginTop: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  upgradeSubtitle: {
    marginTop: 4,
    textAlign: 'center',
  },
  upgradeCta: {
    marginTop: 10,
    fontWeight: '700',
  },
  loadMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreButton: {
    minWidth: 200,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
