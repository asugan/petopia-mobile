import { useEffect, useRef, ReactNode } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { useSplashAnimation } from '@/hooks/useSplashAnimation';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';

export function AnimatedSplashScreen({
  children,
}: {
  children: ReactNode;
}) {
  const { isVisible, hideSplash } = useSplashAnimation();
  const [fontsLoaded, fontError] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const shouldAnimate = isVisible && (fontsLoaded || fontError);
  const canShowApp = !isVisible || (fontsLoaded && !fontError);

  useEffect(() => {
    if (!shouldAnimate) {
      return;
    }

    animationRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: 1500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });

    animationRef.current.start(({ finished }) => {
      if (finished) {
        SplashScreen.hideAsync();
        hideSplash();
      }
    });

    return () => {
      animationRef.current?.stop();
      animationRef.current = null;
    };
  }, [shouldAnimate, hideSplash, progress]);

  // If app is ready and splash is hidden, render children directly
  if (canShowApp && !isVisible) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {/* Loading bar */}
      <View style={styles.loadingBarContainer}>
        <Animated.View
          style={[
            styles.loadingBarFill,
            {
              transform: [
                {
                  scaleX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
              // Workaround for Android overflow issue with scaleX
              ...Platform.select({
                android: {
                  transformOrigin: 'left',
                },
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#D3DFF1',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 80,
  },
  loadingBarContainer: {
    width: 180,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
});
