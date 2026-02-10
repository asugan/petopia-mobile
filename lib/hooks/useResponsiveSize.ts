import { useWindowDimensions } from 'react-native';
import { BREAKPOINTS } from '@/constants/ui';

/**
 * Responsive sizing hook for mobile-first design
 *
 * Breakpoints:
 * - Mobile: < 768px (horizontal scroll layout)
 * - Tablet: 768px - 1024px (grid layout)
 * - Desktop: >= 1024px (uses tablet layout)
 *
 * @returns Responsive size values and breakpoint flags
 */
export interface ResponsiveSize {
  // Breakpoint flags
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;

  // Responsive values
  cardPadding: number;
  avatarSize: number;
  iconSize: number;
  gap: number;
  scrollPadding: number;
}

export const useResponsiveSize = (): ResponsiveSize => {
  const { width } = useWindowDimensions();

  // Updated breakpoints for responsive feature
  const isMobile = width < BREAKPOINTS.TABLET_MIN;  // < 768px
  const isTablet = width >= BREAKPOINTS.TABLET_MIN && width <= BREAKPOINTS.TABLET_MAX;  // 768px - 1024px
  const isDesktop = width > BREAKPOINTS.TABLET_MAX;  // > 1024px

  return {
    // Breakpoints
    isMobile,
    isTablet,
    isDesktop,
    width,

    // Responsive values
    cardPadding: isMobile ? 12 : 16,
    avatarSize: isMobile ? 60 : 85,
    iconSize: isMobile ? 40 : 56,
    gap: isMobile ? 8 : 12,
    scrollPadding: 16,
  };
};
