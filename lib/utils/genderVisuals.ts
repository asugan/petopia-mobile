import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '@/lib/theme/types';

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

export const getGenderColor = (gender: Gender, themeColors: ThemeColors): string => {
  switch (gender) {
    case 'male':
      return themeColors.genderMale;
    case 'female':
      return themeColors.genderFemale;
    case 'other':
      return themeColors.genderOther;
    default:
      return themeColors.genderOther;
  }
};
