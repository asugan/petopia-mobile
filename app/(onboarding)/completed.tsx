import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector, Directions } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from '@/lib/theme';
import { useMemo, useState } from 'react';
import { PetModal } from '@/components/PetModal';
import { useOnboardingCompletion } from '@/lib/hooks/useOnboardingCompletion';

export default function OnboardingCompleted() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const { completeOnboarding, skipPetAndComplete } = useOnboardingCompletion();

  const handleAddPet = () => {
    setModalVisible(true);
  };

  const handleSkipPet = () => {
    skipPetAndComplete();
  };

  const handlePetFormSuccess = () => {
    // Pet is already saved to pending store, just complete onboarding
    completeOnboarding();
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
    trialNotice: {
      backgroundColor: theme.colors.primary + '15',
      borderWidth: 1,
      borderColor: theme.colors.primary + '30',
      borderRadius: theme.roundness,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
      width: '100%',
      maxWidth: 480,
    },
    trialNoticeText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
    addPetButton: {
      backgroundColor: theme.colors.primary,
      height: 56,
      borderRadius: theme.roundness / 2,
      width: '100%',
      maxWidth: 480,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addPetButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    skipButton: {
      marginTop: 12,
    },
    skipButtonText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
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
          <View style={styles.trialNotice}>
            <Text style={styles.trialNoticeText}>{t('onboarding.screen3.trialNotice')}</Text>
          </View>

          <Pressable
            style={styles.addPetButton}
            onPress={handleAddPet}
          >
            <Text style={styles.addPetButtonText}>
              {t('onboarding.screen3.addPet')}
            </Text>
          </Pressable>

          <Pressable
            style={styles.skipButton}
            onPress={handleSkipPet}
          >
            <Text style={styles.skipButtonText}>
              {t('onboarding.screen3.skipPet')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <PetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={handlePetFormSuccess}
        isOnboarding={true}
      />
      </View>
    </GestureDetector>
  );
}
