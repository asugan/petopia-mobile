import { View, Text, StyleSheet, Pressable, ScrollView, StatusBar } from 'react-native';
import { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
  const { theme, isDark } = useTheme();
  const { preferredLanguage, preferredCurrency, setOnboardingPreferences } = useOnboardingStore();

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
        heroContainer: {
          minHeight: 300,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 22,
          position: 'relative',
        },
        heroImage: {
          ...StyleSheet.absoluteFillObject,
        },
        brandingContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          width: '100%',
          maxWidth: 520,
        },
        logoCircle: {
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: theme.colors.surface + 'F0',
          borderColor: theme.colors.surface,
          borderWidth: 2,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 12,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        logoMask: {
          width: '100%',
          height: '100%',
          borderRadius: 40,
          overflow: 'hidden',
          backgroundColor: '#d3dff1',
          justifyContent: 'center',
          alignItems: 'center',
        },
        logoImage: {
          width: '100%',
          height: '100%',
          transform: [{ scale: 1.5 }],
        },
        appName: {
          color: theme.colors.onBackground,
          fontSize: 30,
          fontWeight: '800',
          letterSpacing: -0.4,
          marginBottom: 8,
          textAlign: 'center',
          textShadowColor: theme.colors.surface,
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 8,
        },
        indicatorContainer: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 10,
          paddingTop: 14,
          paddingBottom: 4,
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
          paddingTop: 12,
          paddingBottom: 20,
        },
        title: {
          fontSize: 28,
          fontWeight: '700',
          color: theme.colors.onBackground,
          marginBottom: 10,
          textAlign: 'center',
          paddingHorizontal: 8,
        },
        description: {
          fontSize: 16,
          lineHeight: 22,
          color: theme.colors.onSurfaceVariant,
          marginBottom: 18,
          textAlign: 'center',
          paddingHorizontal: 8,
        },
        sectionCard: {
          borderRadius: 16,
          backgroundColor: theme.colors.surface,
          overflow: 'hidden',
          marginBottom: 12,
          borderWidth: 1,
          borderColor: theme.colors.outlineVariant + '55',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        },
        footer: {
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 20,
        },
        button: {
          backgroundColor: theme.colors.primary,
          height: 56,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.24,
          shadowRadius: 12,
          elevation: 5,
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
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <View style={styles.heroContainer}>
        <Image
          source={require('../../assets/images/login.webp')}
          style={styles.heroImage}
          contentFit="cover"
          transition={600}
        />
        <LinearGradient
          colors={[theme.colors.inverseOnSurface + '66', 'transparent', theme.colors.background]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[theme.colors.background + 'F2', theme.colors.background + '99', 'transparent']}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.brandingContainer}>
          <View style={styles.logoCircle}>
            <View style={styles.logoMask}>
              <Image
                source={require('../../assets/images/foreground.png')}
                style={styles.logoImage}
                contentFit="cover"
              />
            </View>
          </View>
          <Text style={styles.appName}>{t('auth.brandName')}</Text>
          <Text style={styles.title}>
            {t('settings.appSettings', 'App settings')}
          </Text>
          <Text style={styles.description}>
            {t(
              'onboarding.language.description',
              'We will use your selections on the next screens. You can change them anytime in Settings.',
            )}
          </Text>
        </View>
      </View>

      <View style={styles.indicatorContainer}>
        <View style={styles.indicatorActive} />
        <View style={styles.indicatorInactive} />
        <View style={styles.indicatorInactive} />
        <View style={styles.indicatorInactive} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
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
