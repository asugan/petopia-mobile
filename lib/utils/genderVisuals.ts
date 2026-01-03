import { Ionicons } from '@expo/vector-icons';

export type Gender = 'male' | 'female' | 'other';

export const getGenderIcon = (gender: Gender): keyof typeof Ionicons.glyphMap => {
  switch (gender) {
    case 'male':
      return 'male';
    case 'female':
      return 'female';
    case 'other':
      return 'person';
    default:
      return 'person';
  }
};

export const getGenderColor = (gender?: Gender): string => {
  switch (gender) {
    case 'male':
      return '#90CAF9'; // Light Blue
    case 'female':
      return '#F48FB1'; // Pink
    case 'other':
      return '#A5D6A7'; // Light Green
    default:
      return '#E0E0E0'; // Gray
  }
};
