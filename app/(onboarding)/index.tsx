import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme';
import { ONBOARDING_ROUTES } from '@/constants/routes';
import { LanguageSettings } from '@/components/LanguageSettings';
import { CurrencySettings } from '@/components/CurrencySettings';
import { useOnboardingStore } from '@/stores/onboardingStore';
import type { SupportedCurrency, SupportedLanguage } from '@/lib/types';
import i18n from '@/lib/i18n';
import { getRecommendedOnboardingPreferences } from '@/lib/utils/onboardingPreferences';

export default function OnboardingLanguageStep() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { preferredLanguage, preferredCurrency, setOnboardingPreferences } =
    useOnboardingStore();

  const recommended = useMemo(() => getRecommendedOnboardingPreferences(), []);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(
    preferredLanguage ?? recommended.language,
  );
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(
    preferredCurrency ?? recommended.currency,
  );

  const handleContinue = () => {
    setOnboardingPreferences({
      language: selectedLanguage,
      currency: selectedCurrency,
    });

    if (i18n.language !== selectedLanguage) {
      void i18n.changeLanguage(selectedLanguage);
    }

    router.push(ONBOARDING_ROUTES.welcome as never);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        indicatorContainer: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 10,
          paddingTop: 12,
          paddingBottom: 8,
        },
        indicatorActive: {
          height: 6,
          width: 24,
          borderRadius: 3,
          backgroundColor: theme.colors.primary,
        },
        indicatorInactive: {
          height: 6,
          width: 24,
          borderRadius: 3,
          backgroundColor: theme.colors.primary + '4D',
        },
        content: {
          paddingHorizontal: 16,
          paddingBottom: 16,
        },
        title: {
          fontSize: 30,
          fontWeight: '700',
          color: theme.colors.onBackground,
          marginBottom: 10,
        },
        description: {
          fontSize: 16,
          lineHeight: 22,
          color: theme.colors.onSurfaceVariant,
          marginBottom: 16,
        },
        sectionCard: {
          borderRadius: theme.roundness / 2,
          backgroundColor: theme.colors.surface,
          overflow: 'hidden',
          marginBottom: 14,
        },
        footer: {
          padding: 16,
          paddingBottom: 24,
        },
        button: {
          backgroundColor: theme.colors.primary,
          height: 56,
          borderRadius: theme.roundness / 2,
          alignItems: 'center',
          justifyContent: 'center',
        },
        buttonText: {
          color: theme.colors.onPrimary,
          fontSize: 16,
          fontWeight: '700',
        },
      }),
    [theme],
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.indicatorContainer}>
        <View style={styles.indicatorActive} />
        <View style={styles.indicatorInactive} />
        <View style={styles.indicatorInactive} />
        <View style={styles.indicatorInactive} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {t('onboarding.language.title')}
        </Text>
        <Text style={styles.description}>
          {t('onboarding.language.description')}
        </Text>

        <View style={styles.sectionCard}>
          <LanguageSettings
            variant="embedded"
            selectedLanguage={selectedLanguage}
            onSelect={setSelectedLanguage}
          />
        </View>

        <View style={styles.sectionCard}>
          <CurrencySettings
            variant="embedded"
            selectedCurrency={selectedCurrency}
            onSelect={setSelectedCurrency}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>{t('onboarding.language.continue')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
