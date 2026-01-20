import { Ionicons } from '@expo/vector-icons';
import { ImageSourcePropType } from 'react-native';
import { Pet } from '@/lib/types';
import { PET_TYPE_AVATARS, FALLBACK_IMAGES } from '@/constants/images';

export const getPetTypeIcon = (petType?: Pet['type']): keyof typeof Ionicons.glyphMap => {
  switch (petType) {
    case 'dog':
      return 'paw';
    case 'cat':
      return 'paw';
    case 'bird':
      return 'leaf';
    case 'rabbit':
      return 'paw';
    case 'hamster':
      return 'paw';
    case 'fish':
      return 'fish';
    case 'reptile':
      return 'fish';
    default:
      return 'paw';
  }
};

export const getPetTypeColor = (petType?: Pet['type']): string => {
  switch (petType) {
    case 'dog':
      return '#FFB3D1';
    case 'cat':
      return '#B3FFD9';
    case 'bird':
      return '#C8B3FF';
    case 'rabbit':
      return '#FFDAB3';
    case 'hamster':
      return '#FFF3B3';
    case 'fish':
      return '#87CEEB';
    case 'reptile':
      return '#98FB98';
    default:
      return '#FFB3D1';
  }
};

export const getPetTypeAvatar = (petType?: Pet['type']): ImageSourcePropType => {
  if (petType && petType in PET_TYPE_AVATARS) {
    return PET_TYPE_AVATARS[petType as keyof typeof PET_TYPE_AVATARS];
  }
  return FALLBACK_IMAGES.petAvatar;
};
