import { TranslationFunction } from '@/lib/types';

// Layout Constants
export const LAYOUT = {
  TAB_BAR_HEIGHT: 60,
  FAB_OFFSET: 80, // Height needed for FAB clearance (includes padding)
} as const;

// Bottom Sheet Constants
export const BOTTOM_SHEET = {
  SNAP_POINTS: ['20%', '50%', '90%'] as const,
  DEFAULT_INDEX: 1, // Start at 50%
  HANDLE_HEIGHT: 24,
} as const;

// Pet Types
export const PET_TYPES = {
  DOG: 'dog',
  CAT: 'cat',
  BIRD: 'bird',
  RABBIT: 'rabbit',
  HAMSTER: 'hamster',
  FISH: 'fish',
  REPTILE: 'reptile',
  OTHER: 'other',
} as const;

export const PET_GENDERS = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
} as const;

// Health Record Types
export const HEALTH_RECORD_TYPES = {
  CHECKUP: 'checkup',
  VISIT: 'visit',
  SURGERY: 'surgery',
  DENTAL: 'dental',
  GROOMING: 'grooming',
  OTHER: 'other',
} as const;

// Event Types
export const EVENT_TYPES = {
  FEEDING: 'feeding',
  EXERCISE: 'exercise',
  GROOMING: 'grooming',
  PLAY: 'play',
  TRAINING: 'training',
  VET_VISIT: 'vet_visit',
  WALK: 'walk',
  BATH: 'bath',
  VACCINATION: 'vaccination',
  MEDICATION: 'medication',
  OTHER: 'other',
} as const;

// Days of the week
export const DAYS_OF_WEEK = {
  MONDAY: 'monday',
  TUESDAY: 'tuesday',
  WEDNESDAY: 'wednesday',
  THURSDAY: 'thursday',
  FRIDAY: 'friday',
  SATURDAY: 'saturday',
  SUNDAY: 'sunday',
} as const;

// Food Types
export const FOOD_TYPES = {
  DRY_FOOD: 'dry_food',
  WET_FOOD: 'wet_food',
  RAW_FOOD: 'raw_food',
  HOMEMADE: 'homemade',
  TREATS: 'treats',
  SUPPLEMENTS: 'supplements',
  OTHER: 'other',
} as const;

// Turkish Labels (fallback for development)
export const TURKCE_LABELS = {
  HEALTH_RECORD_TYPES: {
    checkup: 'Kontrol',
    visit: 'Ziyaret',
    surgery: 'Cerrahi',
    dental: 'Diş',
    grooming: 'Bakım',
    other: 'Diğer',
  },
  PET_TYPES: {
    dog: 'Köpek',
    cat: 'Kedi',
    bird: 'Kuş',
    rabbit: 'Tavşan',
    hamster: 'Hamster',
    fish: 'Balık',
    reptile: 'Sürüngen',
    other: 'Diğer',
  },
  GENDER: {
    male: 'Erkek',
    female: 'Dişi',
    other: 'Diğer',
  },
  COLORS: {
    primary: 'Pembe',
    secondary: 'Mint Yeşili',
    tertiary: 'Lavanta',
    accent: 'Şeftali',
    surface: 'Açık Sarı',
  },
};

// Health Record Type Icons
export const HEALTH_RECORD_ICONS = {
  checkup: 'stethoscope',
  visit: 'hospital',
  surgery: 'hospital',
  dental: 'tooth',
  grooming: 'content-cut',
  other: 'medical-bag',
} as const;

// Health Record Colors (Rainbow Pastel Theme)
export const HEALTH_RECORD_COLORS = {
  checkup: '#4ECDC4',   // Mint Green
  visit: '#FF9F1C',     // Warm Orange
  surgery: '#96CEB4',   // Sage Green
  dental: '#FFEAA7',    // Light Yellow
  grooming: '#DDA0DD',  // Plum
  other: '#A8A8A8',     // Gray
} as const;

// Note: Labels for UI are now handled by i18n translation files
// Use translation keys in components instead of these hardcoded labels

// Helper functions to create options with i18n support
// These should be used in components with useTranslation hook
export const createPetTypeOptions = (t: (key: string) => string) =>
  Object.values(PET_TYPES).map(type => ({
    value: type,
    label: t(`petTypes.${type}`),
  }));

export const createGenderOptions = (t: (key: string) => string) =>
  Object.values(PET_GENDERS).map(gender => ({
    value: gender,
    label: t(`gender.${gender}`),
  }));

export const createHealthRecordTypeOptions = (t: (key: string, defaultValue?: string) => string) =>
  Object.values(HEALTH_RECORD_TYPES).map(type => ({
    value: type,
    label: t(type, type),
  }));

export const createEventTypeOptions = (t: TranslationFunction) =>
  Object.values(EVENT_TYPES).map(type => ({
    value: type,
    label: t(type, type),
  }));

export const createDayOptions = (t: (key: string, defaultValue?: string) => string) =>
  Object.values(DAYS_OF_WEEK).map(day => ({
    value: day,
    label: t(`days.${day}`, day),
  }));

export const createFoodTypeOptions = (t: (key: string, defaultValue?: string) => string) =>
  Object.values(FOOD_TYPES).map(type => ({
    value: type,
    label: t(`foodTypes.${type}`, type),
  }));

// Fallback images
export * from './images';
