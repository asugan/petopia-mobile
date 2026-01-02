import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Text, Button } from '@/components/ui';
import { useTheme } from '@/lib/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorBoundaryDisplay
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorBoundaryDisplayProps {
  error?: Error;
  onRetry: () => void;
}

const ErrorBoundaryDisplay: React.FC<ErrorBoundaryDisplayProps> = ({ error, onRetry }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={[styles.errorCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.content}>
          <Text
            variant="headlineMedium"
            style={[styles.title, { color: theme.colors.error }]}
          >
            {t('errors.title')}
          </Text>

          <Text
            variant="bodyMedium"
            style={[styles.message, { color: theme.colors.onSurface }]}
          >
            {error?.message || t('errors.unexpectedError')}
          </Text>

          {__DEV__ && error?.stack && (
            <View style={styles.debugContainer}>
              <Text
                variant="bodySmall"
                style={[styles.debugText, { color: theme.colors.onSurfaceVariant }]}
              >
                {error.stack}
              </Text>
            </View>
          )}

          <Button
            mode="contained"
            buttonColor={theme.colors.primary}
            onPress={onRetry}
            style={styles.retryButton}
          >
            {t('errors.retry')}
          </Button>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    width: '100%',
    maxWidth: 400,
    elevation: 4,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  debugContainer: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  debugText: {
    fontFamily: 'monospace',
    fontSize: 10,
  },
  retryButton: {
    minWidth: 120,
  },
});

export default ErrorBoundary;
