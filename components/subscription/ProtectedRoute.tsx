import { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { SubscriptionModal } from './SubscriptionModal';
import LoadingSpinner from '../LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  featureName?: string;
  requirePro?: boolean;
}

/**
 * ProtectedRoute - HOC that protects routes requiring subscription
 * 
 * Usage:
 * Wrap your screen component with ProtectedRoute:
 * 
 * ```tsx
 * export default function PetsScreen() {
 *   return (
 *     <ProtectedRoute featureName="Pet Management">
 *       <ActualScreenContent />
 *     </ProtectedRoute>
 *   );
 * }
 * ```
 * 
 * Behavior:
 * - Shows loading spinner while subscription status is being fetched
 * - Shows subscription modal if user doesn't have active subscription
 * - Renders children if user has active subscription (trial or paid)
 * - Automatically checks subscription status on every tab focus
 */
export function ProtectedRoute({ children, featureName, requirePro = true }: ProtectedRouteProps) {
  const {
    isProUser,
    isLoading: isSubscriptionLoading,
    refreshSubscriptionStatus,
  } = useSubscription();

  const [showModal, setShowModal] = useState(false);
  const isFocused = useIsFocused();
  const refreshStatusRef = useRef<(() => void) | null>(null);

  refreshStatusRef.current = refreshSubscriptionStatus;

  useFocusEffect(
    useCallback(() => {
      refreshStatusRef.current?.();
      return () => {};
    }, [])
  );

  useEffect(() => {
    if (isProUser) {
      setShowModal(false);
    } else if (isFocused && !isSubscriptionLoading && requirePro && !isProUser) {
      setShowModal(true);
    }
  }, [isProUser, isFocused, isSubscriptionLoading, requirePro]);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Show loading while checking subscription status
  if (isSubscriptionLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </View>
    );
  }

  // Show subscription modal if no active subscription
  if (requirePro && !isProUser) {
    return (
      <>
        <View style={styles.hiddenContent} pointerEvents="none">
          {children}
        </View>
        <SubscriptionModal
          visible={showModal}
          onClose={handleCloseModal}
          featureName={featureName}
        />
      </>
    );
  }

  // User has subscription, render the content
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenContent: {
    opacity: 0,
  },
});
