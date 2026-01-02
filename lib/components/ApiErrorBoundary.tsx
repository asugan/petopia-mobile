import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ApiErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.resetError);
      }

      return <ApiErrorFallback error={this.state.error!} reset={this.resetError} />;
    }

    return this.props.children;
  }
}

function ApiErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const isNetworkError = error.message.includes('Ağ bağlantısı') ||
                        error.message.includes('network') ||
                        error.message.includes(' Network request failed');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.errorCard, { backgroundColor: theme.colors.errorContainer }]}>
        <Text style={[styles.errorTitle, { color: theme.colors.onErrorContainer }]}>
          ❌ {t('errors.title')}
        </Text>
        <Text style={[styles.errorMessage, { color: theme.colors.onErrorContainer }]}>
          {isNetworkError ? t('errors.networkError') : t('errors.generalError')}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
          onPress={reset}
        >
          <Text style={[styles.retryButtonText, { color: theme.colors.onPrimary }]}>
            {t('common.retry')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function ApiErrorBoundary(props: Props) {
  return <ApiErrorBoundaryClass {...props} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  errorCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
