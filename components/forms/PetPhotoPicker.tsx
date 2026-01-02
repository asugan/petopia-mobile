import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, Surface, Text, Modal, ListItem } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { getPetTypeColor, getPetTypeIcon } from '@/lib/utils/petTypeVisuals';
import { Pet } from '../../lib/types';

interface PetPhotoPickerProps {
  value?: string;
  onChange: (photoUri: string | undefined) => void;
  petType?: Pet['type'];
  disabled?: boolean;
}

export const PetPhotoPicker: React.FC<PetPhotoPickerProps> = ({
  value,
  onChange,
  petType,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (
        cameraPermission.status !== 'granted' ||
        mediaLibraryPermission.status !== 'granted'
      ) {
        Alert.alert(
          t('forms.photoPicker.permissionsRequired'),
          t('forms.photoPicker.permissionsMessage'),
          [
            { text: t('forms.photoPicker.cancel'), style: 'cancel' },
            { text: t('forms.photoPicker.settings'), onPress: () => {/* Settings'e yönlendirme eklenebilir */} },
          ]
        );
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const pickFromGallery = async () => {
    setModalVisible(false);

    if (!(await requestPermissions())) {
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        onChange(photoUri);
      }
    } catch {
      Alert.alert(t('common.error'), t('forms.photoPicker.errorSelectingPhoto'));
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    setModalVisible(false);

    if (!(await requestPermissions())) {
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        onChange(photoUri);
      }
    } catch {
      Alert.alert(t('common.error'), t('forms.photoPicker.errorTakingPhoto'));
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = () => {
    setModalVisible(false);
    onChange(undefined);
  };

  const openPicker = () => {
    if (!disabled) {
      setModalVisible(true);
    }
  };

  const defaultIcon = getPetTypeIcon(petType);
  const defaultColor = getPetTypeColor(petType);

  return (
    <>
      <View style={styles.container} pointerEvents="box-none">
        <TouchableOpacity
          onPress={openPicker}
          style={[styles.photoContainer, disabled && styles.disabled]}
          disabled={disabled}
          activeOpacity={0.8}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          {value ? (
            <>
              <Image source={{ uri: value }} style={styles.photo} />
              {!disabled && (
                <View style={styles.overlay}>
                  <Avatar.Icon size={24} icon="camera" style={styles.cameraIcon} />
                </View>
              )}
            </>
          ) : (
            <Avatar.Icon
              size={100}
              icon={defaultIcon}
              style={[styles.defaultAvatar, { backgroundColor: defaultColor }]}
            />
          )}
          {loading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={openPicker}
            disabled={disabled}
            style={styles.button}
            compact
          >
            {value ? t('forms.photoPicker.changePhoto') : t('forms.photoPicker.addPhoto')}
          </Button>
          {value && !disabled && (
            <Button
              mode="text"
              onPress={() => onChange(undefined)}
              textColor="#FF6B6B"
              compact
            >
              {t('forms.photoPicker.removePhoto')}
            </Button>
          )}
        </View>
      </View>

        <Modal
          visible={modalVisible}
          onDismiss={() => {
            setModalVisible(false);
          }}
          contentContainerStyle={[
            styles.modal,
            {
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }
          ]}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            {t('forms.photoPicker.selectPhoto')}
          </Text>

          <Surface style={styles.modalContent}>
            <ListItem
              title={t('forms.photoPicker.selectFromGallery')}
              description={t('forms.photoPicker.selectFromGalleryDescription')}
              left={<MaterialCommunityIcons name="image" size={24} color={theme.colors.onSurfaceVariant} />}
              onPress={pickFromGallery}
              style={styles.modalItem}
            />

            <ListItem
              title={t('forms.photoPicker.takePhoto')}
              description={t('forms.photoPicker.takePhotoDescription')}
              left={<MaterialCommunityIcons name="camera" size={24} color={theme.colors.onSurfaceVariant} />}
              onPress={takePhoto}
              style={styles.modalItem}
            />

            {value && (
              <ListItem
                title={t('forms.photoPicker.removePhotoTitle')}
                description={t('forms.photoPicker.removePhotoDescription')}
                left={<MaterialCommunityIcons name="delete" size={24} color={theme.colors.onSurfaceVariant} />}
                onPress={removePhoto}
                style={{ ...styles.modalItem, ...styles.dangerItem }}
                titleStyle={{ color: '#FF6B6B' }}
              />
            )}
          </Surface>

          <Button
            mode="text"
            onPress={() => setModalVisible(false)}
            style={styles.cancelButton}
          >
            {t('forms.photoPicker.cancel')}
          </Button>
        </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultAvatar: {
    backgroundColor: '#FFB3D1',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 4,
  },
  cameraIcon: {
    backgroundColor: 'transparent',
  },
  loaderContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  button: {
    minWidth: 120,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  modalContent: {
    borderRadius: 8,
    marginBottom: 16,
  },
  modalItem: {
    paddingVertical: 4,
  },
  dangerItem: {
    backgroundColor: '#FFE5E5',
  },
  cancelButton: {
    width: '100%',
  },
});
