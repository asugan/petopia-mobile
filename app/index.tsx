import { Redirect } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { ONBOARDING_ROUTES, TAB_ROUTES } from "@/constants/routes";


export default function Index() {
  const { theme } = useTheme();
  const { hasSeenOnboarding, hasHydrated } = useOnboardingStore();

  if (!hasHydrated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Show onboarding if not completed
  if (!hasSeenOnboarding) {
    return <Redirect href={ONBOARDING_ROUTES.step1} />;
  }

  return <Redirect href={TAB_ROUTES.home} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
