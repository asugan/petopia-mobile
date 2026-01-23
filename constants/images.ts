/**
 * Centralized fallback images for the application.
 * Using local assets instead of external URLs for:
 * - Offline availability
 * - Better performance
 * - Reliability (no external dependencies)
 */
export const FALLBACK_IMAGES = {
  /** Default hero image for pet, event, and health detail screens */
  petHero: require('@/assets/images/cat_avatar.webp'),
  /** Default avatar for pet profile photos */
  petAvatar: require('@/assets/images/cat_avatar.webp'),
} as const;

/**
 * Pet type specific avatar images.
 * Used as fallback when pet has no profile photo.
 */
export const PET_TYPE_AVATARS = {
  cat: require('@/assets/images/cat_avatar.webp'),
  dog: require('@/assets/images/dog_avatar.webp'),
  bird: require('@/assets/images/bird_avatar.webp'),
  rabbit: require('@/assets/images/rabbit_avatar.webp'),
  hamster: require('@/assets/images/hamster_avatar.webp'),
  fish: require('@/assets/images/fish_avatar.webp'),
  reptile: require('@/assets/images/reptile_avatar.webp'),
  other: require('@/assets/images/other_avatar.webp'),
} as const;
