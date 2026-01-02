import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { EncodingType, documentDirectory } from 'expo-file-system/build/legacy';
import type { FileInfo } from '../types';

export interface PhotoProcessResult {
  uri: string;
  base64?: string;
  size: number;
  width: number;
  height: number;
}

export interface PhotoOptions {
  maxSize?: number; // KB cinsinden maksimum dosya boyutu
  width?: number; // Genişlik
  height?: number; // Yükseklik
  quality?: number; // Kalite (0.0 - 1.0)
  format?: ImageManipulator.SaveFormat; // JPEG veya PNG
}

/**
 * Fotoğrafı işler (resize, compress, format convert)
 */
export const processPhoto = async (
  uri: string,
  options: PhotoOptions = {}
): Promise<PhotoProcessResult> => {
  const {
    maxSize = 500, // 500KB default max size
    width = 400,
    height = 400,
    quality = 0.7,
    format = ImageManipulator.SaveFormat.JPEG,
  } = options;

  try {
    // Başlangıç boyut bilgisini al
    const fileInfo = await FileSystem.getInfoAsync(uri) as FileInfo;
    const initialSize = fileInfo.size || 0;

    // Fotoğrafı manipüle et (resize ve compress)
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width, height } }],
      {
        compress: quality,
        format,
        base64: false,
      }
    );

    // İşlenmiş fotoğrafın boyut bilgisini al
    const processedFileInfo = await FileSystem.getInfoAsync(manipulatedImage.uri) as FileInfo;
    const finalSize = processedFileInfo.size || 0;

    // Eğer hala çok büyükse kaliteyi daha da düşür
    let finalUri = manipulatedImage.uri;
    let finalQuality = quality;

    if (finalSize > maxSize * 1024) {
      // Iteratively reduce quality until size is acceptable
      let attempts = 0;
      const maxAttempts = 5;

      while (finalSize > maxSize * 1024 && attempts < maxAttempts) {
        attempts++;
        finalQuality = Math.max(0.1, finalQuality - 0.1);

        const reManipulated = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width, height } }],
          {
            compress: finalQuality,
            format,
            base64: false,
          }
        );

        const reManipulatedInfo = await FileSystem.getInfoAsync(reManipulated.uri) as FileInfo;
        if (reManipulatedInfo.size && reManipulatedInfo.size <= maxSize * 1024) {
          finalUri = reManipulated.uri;
          break;
        }
      }
    }

    return {
      uri: finalUri,
      size: finalSize,
      width,
      height,
    };
  } catch (error) {
    throw new Error('Fotoğraf işlenemedi');
  }
};

/**
 * Fotoğrafı base64'e çevirir
 */
export const photoToBase64 = async (uri: string): Promise<string> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    throw new Error('Fotoğraf base64\'e çevrilemedi');
  }
};

/**
 * Base64'den temporary URI oluşturur
 */
export const base64ToUri = (base64: string): string => {
  return `data:image/jpeg;base64,${base64}`;
};

/**
 * Pet için özel fotoğraf işleme fonksiyonu
 */
export const processPetPhoto = async (uri: string): Promise<string> => {
  try {
    const processed = await processPhoto(uri, {
      width: 400,
      height: 400,
      quality: 0.7,
      maxSize: 300, // 300KB max
      format: ImageManipulator.SaveFormat.JPEG,
    });

    return processed.uri;
  } catch (error) {
    throw error;
  }
};

/**
 * Fotoğrafı local storage'a kaydeder
 */
export const savePhotoToLocalStorage = async (
  uri: string,
  petId: string,
  filename?: string
): Promise<string> => {
  try {
    // Pet photos için directory oluştur
    const petPhotosDir = `${documentDirectory}pets/${petId}/`;

    // Directory'nin var olup olmadığını kontrol et
    const dirInfo = await FileSystem.getInfoAsync(petPhotosDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(petPhotosDir, { intermediates: true });
    }

    // Dosya adı oluştur
    const fileExtension = uri.split('.').pop() || 'jpg';
    const fileName = filename || `profile_${Date.now()}.${fileExtension}`;
    const filePath = `${petPhotosDir}${fileName}`;

    // Fotoğrafı kopyala
    await FileSystem.copyAsync({
      from: uri,
      to: filePath,
    });

    return filePath;
  } catch (error) {
    throw new Error('Fotoğraf kaydedilemedi');
  }
};

/**
 * Local storage'dan fotoğrafı siler
 */
export const deletePhotoFromLocalStorage = async (uri: string): Promise<void> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(uri);
    }
  } catch (error) {
    throw new Error('Fotoğraf silinemedi');
  }
};

/**
 * Pet için fotoğraf storage path'i oluşturur
 */
export const getPetPhotoPath = (petId: string, filename: string): string => {
  return `${documentDirectory}pets/${petId}/${filename}`;
};

/**
 * Fotoğrafın geçerli olup olmadığını kontrol eder
 */
export const validatePhotoUri = async (uri: string): Promise<boolean> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return fileInfo.exists && !!(fileInfo.size && fileInfo.size > 0);
  } catch (error) {
    return false;
  }
};

/**
 * Kamera izinlerini kontrol eder
 */
export const checkCameraPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    return false;
  }
};

/**
 * Medya kütüphanesi izinlerini kontrol eder
 */
export const checkMediaLibraryPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    return false;
  }
};

/**
 * Tüm fotoğraf izinlerini talep eder
 */
export const requestPhotoPermissions = async (): Promise<boolean> => {
  try {
    const [cameraPermission, mediaLibraryPermission] = await Promise.all([
      ImagePicker.requestCameraPermissionsAsync(),
      ImagePicker.requestMediaLibraryPermissionsAsync(),
    ]);

    return (
      cameraPermission.status === 'granted' &&
      mediaLibraryPermission.status === 'granted'
    );
  } catch (error) {
    return false;
  }
};

/**
 * Fotoğraf optimize edilmiş mi kontrol eder
 */
export const isPhotoOptimized = async (
  uri: string,
  maxSizeKB: number = 300
): Promise<boolean> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri) as FileInfo;
    const sizeKB = (fileInfo.size || 0) / 1024;
    return sizeKB <= maxSizeKB;
  } catch (error) {
    return false;
  }
};