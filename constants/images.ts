/**
 * Centralized fallback images for the application.
 * Using local assets instead of external URLs for:
 * - Offline availability
 * - Better performance
 * - Reliability (no external dependencies)
 */
export const FALLBACK_IMAGES = {
  /** Default hero image for pet, event, and health detail screens */
  petHero: require('@/assets/images/default-pet-hero.jpg'),
  /** Default avatar for pet profile photos */
  petAvatar: require('@/assets/images/emptypet.png'),
} as const;
