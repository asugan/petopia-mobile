import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector, Directions } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from '@/lib/theme';
import { useMemo } from 'react';
import { ONBOARDING_ROUTES } from '@/constants/routes';

export default function OnboardingWelcomeStep() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();

  const swipeLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .onEnd(() => {
      scheduleOnRN(router.push, ONBOARDING_ROUTES.step2);
    });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        imageContainer: {
          height: '60%',
          width: '100%',
          position: 'absolute',
          top: 0,
        },
        image: {
          width: '100%',
          height: '100%',
        },
        gradient: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '100%',
        },
        contentContainer: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        textContainer: {
          paddingHorizontal: 24,
          width: '100%',
          alignItems: 'center',
          marginBottom: 20,
        },
        title: {
          fontSize: 32,
          fontWeight: '700',
          color: theme.colors.onBackground,
          textAlign: 'center',
          marginBottom: 12,
          lineHeight: 40,
        },
        description: {
          fontSize: 16,
          color: theme.colors.onSurfaceVariant,
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: 20,
        },
        indicatorContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          marginBottom: 20,
        },
        indicator: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.colors.primary + '33',
        },
        indicatorActive: {
          backgroundColor: theme.colors.primary,
        },
        buttonContainer: {
          paddingHorizontal: 16,
          paddingBottom: 24,
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
          letterSpacing: 0.2,
        },
      }),
    [theme],
  );

  return (
    <GestureDetector gesture={swipeLeft}>
      <View style={styles.container}>
        <StatusBar style="light" />

        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/images/onboarding_1.webp')}
            style={styles.image}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'transparent', theme.colors.background]}
            locations={[0, 0.6, 1]}
            style={styles.gradient}
          />
        </View>

        <SafeAreaView style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{t('onboarding.screen1.title')}</Text>
            <Text style={styles.description}>{t('onboarding.screen1.description')}</Text>

            <View style={styles.indicatorContainer}>
              <View style={styles.indicator} />
              <View style={[styles.indicator, styles.indicatorActive]} />
              <View style={styles.indicator} />
              <View style={styles.indicator} />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable style={styles.button} onPress={() => router.push(ONBOARDING_ROUTES.step2)}>
              <Text style={styles.buttonText}>{t('onboarding.screen1.button')}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </GestureDetector>
  );
}
