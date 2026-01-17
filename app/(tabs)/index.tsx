import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import EmptyState from "@/components/EmptyState";
import HealthOverview from "@/components/HealthOverview";
import LoadingSpinner from "@/components/LoadingSpinner";
import PetCard from "@/components/PetCard";
import { UpcomingEventsSection } from "@/components/UpcomingEventsSection";
import { NextFeedingWidget } from "@/components/feeding/NextFeedingWidget";
import { FinancialOverview } from "@/components/home/FinancialOverview";
import { HomeEmptyPets } from "@/components/home/HomeEmptyPets";
import { HeaderActions, LargeTitle } from "@/components/LargeTitle";
import { Text } from "@/components/ui";
import { useHomeData } from "@/lib/hooks/useHomeData";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { useTheme } from "@/lib/theme";
import { LAYOUT } from "@/constants";

export default function HomeScreen() {
  return <HomeScreenContent />;
}

function HomeScreenContent() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { isProUser, presentPaywall } = useSubscription();

  // Tüm mantık useHomeData hook'unda toplandı
  const { layout, data, status, financial } = useHomeData();

  const handleUpgradePress = async () => {
    await presentPaywall();
  };

  if (status.isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (status.error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <EmptyState
          icon="alert-circle"
          title={t("common.error")}
          description={t("common.loadingError")}
          actionLabel={t("common.retry")}
          onAction={() => status.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={[styles.scrollView, { padding: layout.scrollPadding }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LargeTitle title={t("navigation.home")} actions={<HeaderActions />} />

        {/* My Pets Section */}
        <View style={styles.section}>
          {data.pets && data.pets.length > 0 ? (
            <View style={styles.petList}>
              {data.pets.map((pet) => (
                <View key={pet._id} style={styles.petCardWrapper}>
                  <PetCard
                    pet={pet}
                    petId={pet._id}
                    onPress={() => router.push(`/pet/${pet._id}`)}
                    showActions={false}
                  />
                </View>
              ))}

              {!isProUser && data.pets.length >= 1 && (
                <TouchableOpacity
                  onPress={handleUpgradePress}
                  style={[
                    styles.upgradeCard,
                    {
                      borderColor: theme.colors.primary,
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                  activeOpacity={0.85}
                >
                  <View style={[styles.upgradeIconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Ionicons name="lock-closed" size={20} color={theme.colors.primary} />
                  </View>
                  <Text variant="titleMedium" style={[styles.upgradeTitle, { color: theme.colors.onSurface }]}
                  >
                    {t("limits.pets.title")}
                  </Text>
                  <Text variant="bodySmall" style={[styles.upgradeSubtitle, { color: theme.colors.onSurfaceVariant }]}
                  >
                    {t("limits.pets.subtitle")}
                  </Text>
                  <Text variant="labelLarge" style={[styles.upgradeCta, { color: theme.colors.primary }]}
                  >
                    {t("limits.pets.cta")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <HomeEmptyPets />
          )}
        </View>

        {/* Only show these sections when there are pets */}
        {data.pets && data.pets.length > 0 && (
          <>
            <View style={styles.section}>
              <NextFeedingWidget />
            </View>

            <UpcomingEventsSection />

            <FinancialOverview
              budgetStatus={financial.budgetStatus || undefined}
              recentExpenses={data.recentExpenses}
            />

            <HealthOverview healthRecords={data.allHealthRecords || []} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: LAYOUT.TAB_BAR_HEIGHT },
  statsScrollView: { marginBottom: 24 },
  statsContainer: { gap: 12, paddingHorizontal: 0 },
  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontWeight: "600", marginBottom: 16 },
  petList: { gap: 12 },
  petCardWrapper: { width: "100%" },
  upgradeCard: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 6,
    opacity: 0.85,
  },
  upgradeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeTitle: {
    fontWeight: "700",
    textAlign: "center",
  },
  upgradeSubtitle: {
    textAlign: "center",
  },
  upgradeCta: {
    fontWeight: "700",
  },
});
