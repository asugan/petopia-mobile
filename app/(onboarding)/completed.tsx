import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector, Directions } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth/useAuth';
import { useEffect, useMemo } from 'react';

export default function OnboardingCompleted() {
  const router = useRouter();
  const { setHasSeenOnboarding } = useOnboardingStore();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setHasSeenOnboarding(true);
  }, [setHasSeenOnboarding]);

  const handleComplete = async () => {
    // Mark onboarding as seen
    setHasSeenOnboarding(true);

    // Navigate based on authentication state
    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  };

  const swipeRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(() => {
      scheduleOnRN(router.back);
    });

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    safeArea: {
      flex: 1,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    heroContainer: {
      marginBottom: 32,
    },
    outerCircle: {
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: theme.colors.primary + '33',
      justifyContent: 'center',
      alignItems: 'center',
    },
    innerCircle: {
      width: 128,
      height: 128,
      borderRadius: 64,
      backgroundColor: theme.colors.primary + '4D',
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.colors.onBackground,
      textAlign: 'center',
      marginBottom: 12,
    },
    description: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 24,
      maxWidth: 300,
    },
    footer: {
      padding: 16,
      paddingBottom: 32,
      width: '100%',
      alignItems: 'center',
    },
    button: {
      backgroundColor: theme.colors.primary,
      height: 48,
      borderRadius: theme.roundness / 2,
      width: '100%',
      maxWidth: 480,
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
    <GestureDetector gesture={swipeRight}>
      <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          
          {/* Hero Icon */}
          <View style={styles.heroContainer}>
            <View style={styles.outerCircle}>
              <View style={styles.innerCircle}>
                <MaterialIcons name="pets" size={64} color={theme.colors.primary} />
              </View>
            </View>
          </View>

          {/* Text Content */}
          <Text style={styles.title}>{t('onboarding.screen3.title')}</Text>
          <Text style={styles.description}>
            {t('onboarding.screen3.description')}
          </Text>

        </View>

        {/* Footer Button */}
        <View style={styles.footer}>
          <Pressable 
            style={styles.button}
            onPress={handleComplete}
          >
            <Text style={styles.buttonText}>{t('onboarding.screen3.button')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
      </View>
    </GestureDetector>
  );
}
