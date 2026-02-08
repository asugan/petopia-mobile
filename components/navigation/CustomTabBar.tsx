import { memo, useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme';

type TabBarItemProps = {
  focused: boolean;
  label: string;
  icon: ReactNode;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
  isDark: boolean;
  activeColor: string;
  inactiveColor: string;
  activeBackgroundColor: string;
  isTablet: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const getDisplayLabel = (label: string, isTablet: boolean) => {
  const normalized = label.trim();

  if (normalized.includes(' ')) {
    return normalized.split(/\s+/)[0];
  }

  const maxLength = isTablet ? 12 : 9;

  if (normalized.length > maxLength) {
    return `${normalized.slice(0, maxLength - 1)}…`;
  }

  return normalized;
};

const TabBarItem = memo(function TabBarItem({
  focused,
  label,
  icon,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
  isDark,
  activeColor,
  inactiveColor,
  activeBackgroundColor,
  isTablet,
}: TabBarItemProps) {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, {
      damping: 20,
      stiffness: 230,
      mass: 0.7,
    });
  }, [focused, progress]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: withTiming(progress.value, { duration: 180, easing: Easing.out(Easing.quad) }),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.92, 1]) }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(progress.value, [0, 1], [1, 1.1]) },
      { translateY: interpolate(progress.value, [0, 1], [0, -4]) },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(progress.value, { duration: 140 }),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [6, 0]) }],
  }));

  const compactLabel = getDisplayLabel(label, isTablet);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.itemPressable}
    >
      <Animated.View
        style={[styles.activePillLayer, pillStyle]}
      >
        <View
          style={[
            styles.activePill,
            isTablet && styles.activePillTablet,
            {
              backgroundColor: activeBackgroundColor,
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.55)',
            },
          ]}
        >
          <LinearGradient
            colors={isDark ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'] : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pillGradient}
          />
        </View>
      </Animated.View>

      <View style={styles.itemContent}>
        <Animated.View style={[styles.iconSlot, iconStyle]}>{icon}</Animated.View>
        <Animated.View style={[styles.labelWrap, labelStyle]}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              styles.label,
              {
                color: focused ? activeColor : inactiveColor,
                maxWidth: isTablet ? 64 : 54,
              },
            ]}
          >
            {compactLabel}
          </Text>
        </Animated.View>
      </View>
    </AnimatedPressable>
  );
});

export const CustomTabBar = memo(function CustomTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const bottomInset = Math.max(insets.bottom, 8);
  const isTablet = width >= 768;

  const containerStyle = [
    styles.container,
    {
      backgroundColor: isDark ? 'rgba(36,36,36,0.94)' : 'rgba(255,255,255,0.96)',
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.08)',
      shadowColor: isDark ? '#000000' : '#111827',
    },
    isTablet && styles.containerTablet,
  ];

  return (
    <View style={[styles.outer, { paddingBottom: bottomInset }]}> 
      <View style={containerStyle}>
        <LinearGradient
          colors={isDark ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.shine}
        />

        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const options = descriptor.options;
          const hidden = (options as { href?: string | null }).href === null || route.name === 'settings';

          if (hidden) {
            return null;
          }

          const focused = state.index === index;
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : typeof options.title === 'string'
                ? options.title
                : route.name;

          const iconColor = focused ? theme.colors.primary : theme.colors.onSurfaceVariant;
          const icon = options.tabBarIcon?.({
            focused,
            color: iconColor,
            size: isTablet ? 28 : 24,
          });

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              Haptics.selectionAsync().catch(() => undefined);
              navigation.navigate(route.name as never);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <TabBarItem
              key={route.key}
              focused={focused}
              label={label}
              icon={icon}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              isDark={isDark}
              activeColor={theme.colors.primary}
              inactiveColor={theme.colors.onSurfaceVariant}
              activeBackgroundColor={isDark ? 'rgba(246,107,74,0.24)' : theme.colors.primaryContainer}
              isTablet={isTablet}
            />
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    height: 70,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
    overflow: 'hidden',
  },
  containerTablet: {
    maxWidth: 760,
    height: 78,
    borderRadius: 26,
  },
  shine: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  itemPressable: {
    flex: 1,
    alignSelf: 'stretch',
    marginHorizontal: 2,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePillLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    width: 54,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
  },
  activePillTablet: {
    width: 64,
    height: 60,
    borderRadius: 18,
  },
  pillGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  itemContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlot: {
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: {
    position: 'absolute',
    bottom: 11,
    left: 2,
    right: 2,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
});
