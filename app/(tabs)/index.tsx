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
import { HomeHeader } from "@/components/home/HomeHeader";
import { Text } from "@/components/ui";
import { useHomeData } from "@/lib/hooks/useHomeData";
import { useTheme } from "@/lib/theme";
import { LAYOUT } from "@/constants";

export default function HomeScreen() {
  return <HomeScreenContent />;
}

function HomeScreenContent() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  // Tüm mantık useHomeData hook'unda toplandı
  const { user, layout, data, status, financial } = useHomeData();

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
        <HomeHeader user={user} />

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

              {/* Add Pet Button */}
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/pets")}
                style={[
                  styles.addPetButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
              >
                <View
                  style={[
                    styles.addPetIconContainer,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Ionicons
                    name="add"
                    size={24}
                    color={theme.colors.onSurfaceVariant}
                  />
                </View>
                <Text
                  variant="titleMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {t("pets.addNewPet")}
                </Text>
              </TouchableOpacity>
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
  addPetButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 16,
  },
  addPetIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});
