import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
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
import { useHomeData } from "@/lib/hooks/useHomeData";
import { usePendingPet } from "@/lib/hooks/usePendingPet";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { useTheme } from "@/lib/theme";
import { LAYOUT } from "@/constants";
import { showToast } from "@/lib/toast/showToast";
import { FEATURE_ROUTES } from "@/constants/routes";

export default function HomeScreen() {
  return <HomeScreenContent />;
}

function HomeScreenContent() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { isInitialized } = useSubscription();
  const { processPendingPet } = usePendingPet();

  // Tüm mantık useHomeData hook'unda toplandı
  const { layout, data, status, financial } = useHomeData();

  // Login sonrası pending pet kontrolü
  useEffect(() => {
    processPendingPet(data.pets?.length ?? 0);
  }, [processPendingPet, data.pets?.length, isInitialized]);

  // Hook must be called unconditionally before any early returns
  useEffect(() => {
    if (status.error) {
      showToast({
        type: 'error',
        title: t("common.error"),
        message: t("common.loadingError"),
      });
    }
  }, [status.error, t]);

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
        style={styles.scrollView}
        contentContainerStyle={{
          paddingHorizontal: layout.scrollPadding,
          paddingTop: 8,
          paddingBottom: LAYOUT.TAB_BAR_HEIGHT + 16,
        }}
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
                    onPress={() => router.push(FEATURE_ROUTES.petDetail(pet._id))}
                    showActions={false}
                  />
                </View>
              ))}
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

            <View style={styles.section}>
              <UpcomingEventsSection />
            </View>

            <View style={styles.section}>
              <FinancialOverview
                budgetStatus={financial.budgetStatus || undefined}
                recentExpenses={data.recentExpenses}
              />
            </View>

            <View style={styles.section}>
              <HealthOverview healthRecords={data.allHealthRecords || []} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  statsScrollView: { marginBottom: 24 },
  statsContainer: { gap: 12, paddingHorizontal: 0 },
  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 24 },
  section: { marginBottom: 16 },
  sectionTitle: { fontWeight: "600", marginBottom: 16 },
  petList: { gap: 12 },
  petCardWrapper: { width: "100%" },
});
