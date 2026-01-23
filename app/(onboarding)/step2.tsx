import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector, Directions } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from '@/lib/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useMemo, type ComponentProps } from 'react';
import { ONBOARDING_ROUTES } from '@/constants/routes';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];
type FeatureKey = 'tracking' | 'health' | 'events' | 'finance';
type Feature = { icon: MaterialIconName; key: FeatureKey };

const FEATURES: Feature[] = [
  {
    icon: 'pets',
    key: 'tracking',
  },
  {
    icon: 'healing',
    key: 'health',
  },
  {
    icon: 'event',
    key: 'events',
  },
  {
    icon: 'account-balance-wallet',
    key: 'finance',
  },
];

export default function OnboardingStep2() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { skipOnboarding } = useOnboardingStore();

  const handleNext = () => {
    router.push(ONBOARDING_ROUTES.completed);
  };

  const handleSkip = () => {
    skipOnboarding();
    router.push(ONBOARDING_ROUTES.completed);
  };

  const swipeLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .onEnd(() => {
      scheduleOnRN(router.push, ONBOARDING_ROUTES.completed);
    });

  const swipeRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(() => {
      scheduleOnRN(router.back);
    });

  const gestures = Gesture.Race(swipeLeft, swipeRight);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    backButton: {
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    skipButton: {
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    skipText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      fontWeight: '700',
    },
    indicatorContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 16,
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
    },
    headerTextContainer: {
      paddingVertical: 16,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.colors.onBackground,
      marginBottom: 8,
    },
    description: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
    },
    featureList: {
      gap: 12,
      paddingVertical: 8,
    },
    featureCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness / 2,
      padding: 16,
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
    },
    featureIconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      flex: 1,
    },
    iconCircle: {
      width: 48,
      height: 48,
      borderRadius: theme.roundness / 3,
      backgroundColor: theme.colors.primary + '33',
      justifyContent: 'center',
      alignItems: 'center',
    },
    featureTextContent: {
      flex: 1,
      justifyContent: 'center',
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onBackground,
      marginBottom: 2,
    },
    featureDescription: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    footer: {
      padding: 16,
      paddingBottom: 24,
    },
    button: {
      backgroundColor: theme.colors.primary,
      height: 56, // Slightly taller as per design
      borderRadius: theme.roundness / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
  }), [theme]);

  return (
    <GestureDetector gesture={gestures}>
      <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back-ios-new" size={24} color={theme.colors.onBackground} />
        </Pressable>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>{t('onboarding.screen2.skip')}</Text>
        </Pressable>
      </View>

      {/* Indicators (Designed as bars in this step) */}
      <View style={styles.indicatorContainer}>
        <View style={styles.indicatorInactive} />
        <View style={styles.indicatorActive} />
        <View style={styles.indicatorInactive} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>{t('onboarding.screen2.title')}</Text>
          <Text style={styles.description}>{t('onboarding.screen2.description')}</Text>
        </View>

        <View style={styles.featureList}>
          {FEATURES.map((item, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <View style={styles.iconCircle}>
                  <MaterialIcons name={item.icon} size={28} color={theme.colors.primary} />
                </View>
                <View style={styles.featureTextContent}>
                  <Text style={styles.featureTitle} numberOfLines={1}>
                    {t(`onboarding.screen2.features.${item.key}.title`)}
                  </Text>
                  <Text style={styles.featureDescription} numberOfLines={2}>
                    {t(`onboarding.screen2.features.${item.key}.description`)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <Pressable 
          style={styles.button}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>{t('onboarding.screen2.next')}</Text>
        </Pressable>
      </View>

    </SafeAreaView>
    </GestureDetector>
  );
}

