import { useState, useEffect as useReactEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useAuthStore } from '@/stores/authStore';
import { Text, Button, Card } from '@/components/ui';

export default function LoginScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { signIn, isAuthenticated } = useAuth();
  const { isLoading, setLoading, setError, authError, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [waitForAuth, setWaitForAuth] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Navigate when session is established after OAuth
  // Also handle timeout if session doesn't establish within reasonable time
  useReactEffect(() => {
    if (waitForAuth && isAuthenticated) {
      setWaitForAuth(false);
      setLoading(false);
      router.replace('/(tabs)');

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    // Start timeout if waiting for auth and not yet authenticated
    if (waitForAuth && !isAuthenticated && !timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        setWaitForAuth(false);
        setLoading(false);
        setError(t('auth.socialLoginError'));
        timeoutRef.current = null;
      }, 3000);
    }

    // Cleanup timeout if we're no longer waiting
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

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t('auth.fillAllFields'));
      return;
    }

    clearError();
    setLoading(true);

    try {
      const result = await signIn.email(email.trim(), password);

      if (result?.error) {
        setError(result.error.message || t('auth.loginError'));
      } else {
        router.replace('/(tabs)');
      }
    } catch {
      setError(t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    clearError();
    setLoading(true);

    try {
      const result = await signIn.google('/');
      if (result?.error) {
        setError(result.error.message || t('auth.socialLoginError'));
        setLoading(false);
        return;
      }

      // Don't redirect immediately - wait for session to be established (fix OAuth timing race condition)
      // useEffect will handle navigation when isAuthenticated becomes true
      setWaitForAuth(true);
    } catch {
      setError(t('auth.socialLoginError'));
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    clearError();
    setLoading(true);

    try {
      const result = await signIn.apple('/');
      if (result?.error) {
        setError(result.error.message || t('auth.socialLoginError'));
        setLoading(false);
        return;
      }

      // Don't redirect immediately - wait for session to be established (fix OAuth timing race condition)
      // useEffect will handle navigation when isAuthenticated becomes true
      setWaitForAuth(true);
    } catch {
      setError(t('auth.socialLoginError'));
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo and Title */}
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons
                name="paw"
                size={48}
                color={theme.colors.primary}
              />
            </View>
            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
              {t('auth.appName')}
            </Text>
            <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              {t('auth.loginSubtitle')}
            </Text>
          </View>

          {/* Error Message */}
          {authError && (
            <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorContainer }]}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={theme.colors.error} />
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{authError}</Text>
            </View>
          )}

          {/* Login Form */}
          <Card style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.formContent}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
                  {t('auth.email')}
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <TextInput
                    style={[styles.textInput, { color: theme.colors.onSurface }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
                  {t('auth.password')}
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <TextInput
                    style={[styles.textInput, { color: theme.colors.onSurface }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t('auth.passwordPlaceholder')}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Login Button */}
              <Button
                mode="contained"
                onPress={handleEmailLogin}
                loading={isLoading}
                disabled={isLoading}
                style={styles.loginButton}
              >
                {t('auth.login')}
              </Button>
            </View>
          </Card>

          {/* Social Login Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
            <Text style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}>
              {t('auth.orContinueWith')}
            </Text>
            <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialButtonsContainer}>
            <Button
              mode="outlined"
              onPress={handleGoogleLogin}
              disabled={isLoading}
              style={styles.socialButton}
              icon="google"
            >
              Google
            </Button>

            {Platform.OS === 'ios' && (
              <Button
                mode="outlined"
                onPress={handleAppleLogin}
                disabled={isLoading}
                style={styles.socialButton}
                icon="apple"
              >
                Apple
              </Button>
            )}
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              {t('auth.noAccount')}{' '}
            </Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable>
                <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                  {t('auth.signUp')}
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  formCard: {
    marginBottom: 24,
  },
  formContent: {
    padding: 20,
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  loginButton: {
    marginTop: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
