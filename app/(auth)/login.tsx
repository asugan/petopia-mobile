import { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useAuthStore } from '@/stores/authStore';
import { Text, ActivityIndicator } from '@/components/ui';

const { height } = Dimensions.get('window');

const COLORS = {
  backgroundDark: '#102210',
  surfaceDark: '#1A2E1A',
  primary: '#13ec13',
  facebookBlue: '#1877F2',
};

export default function LoginScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, isAuthenticated } = useAuth();
  const { isLoading, setLoading, setError, authError, clearError } = useAuthStore();

  const [waitForAuth, setWaitForAuth] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (waitForAuth && isAuthenticated) {
      setWaitForAuth(false);
      setLoading(false);
      router.replace('/(tabs)');

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    if (waitForAuth && !isAuthenticated && !timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        setWaitForAuth(false);
        setLoading(false);
        setError(t('auth.socialLoginError'));
        timeoutRef.current = null;
      }, 5000);
    }

    if (!waitForAuth && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [waitForAuth, isAuthenticated, router, t, setLoading, setError]);

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    clearError();
    setLoading(true);

    try {
      let result;
      if (provider === 'google') {
        result = await signIn.google('/');
      } else if (provider === 'apple') {
        result = await signIn.apple('/');
      } else if (provider === 'facebook') {
        result = await signIn.facebook('/');
      }

      if (result?.error) {
        setError(result.error.message || t('auth.socialLoginError'));
        setLoading(false);
        return;
      }

      setWaitForAuth(true);
    } catch {
      setError(t('auth.socialLoginError'));
      setLoading(false);
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      setError(t('auth.linkOpenError'));
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwHdb5UEA6-PQNnAd2eyZMDNAoT_sMeZpRKOmjJuAlaz6Woq6uODS4NqrSrcT9WIMBUKvnJzoFhxRyknk028l_0-K-Flmjo2kihkclCJ25VjwfDYddS1pFDgwFZn1GzzLEpLfTCcMEkBXojYXaIutolLikF2T6CcxZXeVFNqdUHRfWwaNp7M7Ht3Syw-XQxlOZI4ZG1BGDr7cpT1bDlu3AAFqiAJ8RJr73mET0UiJZEb8Rd2IFrWFv9mBEqK2jkbZkbNgvIIk35v5G" }}
          style={styles.heroImage}
          contentFit="cover"
          transition={1000}
        />
        
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'transparent', COLORS.backgroundDark]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[COLORS.backgroundDark, 'rgba(16,34,16,0.6)', 'transparent']}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={[StyleSheet.absoluteFill, { opacity: 0.9 }]}
        />

        <View style={styles.brandingContainer}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="paw" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>{t('auth.brandName')}</Text>
          <Text style={styles.appSubtitle}>
            {t('auth.smartCareSubtitle')}
          </Text>
        </View>
      </View>

      <View style={[styles.actionsContainer, { paddingBottom: 40 + insets.bottom }]}>
        {authError && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={theme.colors.error} />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{authError}</Text>
          </View>
        )}

        <View style={styles.buttonsContainer}>
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin('apple')}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="apple" size={24} color="white" />
              </View>
              <Text style={styles.socialButtonText}>{t('auth.continueWithApple')}</Text>
              {isLoading && <ActivityIndicator size="small" color="white" style={styles.loader} />}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialLogin('google')}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <View style={styles.iconContainer}>
               <MaterialCommunityIcons name="google" size={24} color="white" />
            </View>
            <Text style={styles.socialButtonText}>{t('auth.continueWithGoogle')}</Text>
            {isLoading && <ActivityIndicator size="small" color="white" style={styles.loader} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialLogin('facebook')}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="facebook" size={24} color={COLORS.facebookBlue} />
            </View>
            <Text style={styles.socialButtonText}>{t('auth.continueWithFacebook')}</Text>
            {isLoading && <ActivityIndicator size="small" color="white" style={styles.loader} />}
          </TouchableOpacity>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            {t('auth.agreementPrefix')}
            <Text 
              style={styles.linkText} 
              onPress={() => openLink('https://petopia.app/terms')}
            >
              {t('auth.termsOfUse')}
            </Text>
            {t('auth.agreementMiddle')}
            <Text 
              style={styles.linkText} 
              onPress={() => openLink('https://petopia.app/privacy')}
            >
              {t('auth.privacyPolicy')}
            </Text>
            {t('auth.agreementSuffix')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'space-between',
  },
  heroContainer: {
    height: height * 0.6,
    width: '100%',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  brandingContainer: {
    alignItems: 'center',
    zIndex: 10,
    marginTop: 48,
    paddingHorizontal: 24,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(26, 46, 26, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(19, 236, 19, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  appName: {
    color: 'white',
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    paddingVertical: 2,
  },
  appSubtitle: {
    color: '#D1D5DB',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 28,
  },
  actionsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-end',
    paddingBottom: 40,
    marginTop: -40,
    zIndex: 20,
  },
  buttonsContainer: {
    gap: 16,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceDark,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    position: 'relative',
  },
  iconContainer: {
    position: 'absolute',
    left: 24,
    width: 24,
    alignItems: 'center',
  },
  socialButtonText: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginLeft: 24,
  },
  loader: {
    position: 'absolute',
    right: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  footerContainer: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: COLORS.primary,
    textDecorationLine: 'none',
  },
});
