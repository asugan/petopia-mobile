import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  ImageBackground,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme';
import { useDeleteHealthRecord, useHealthRecord } from '@/lib/hooks/useHealthRecords';
import { usePet } from '@/lib/hooks/usePets';
import { showToast } from '@/lib/toast/showToast';
import { HealthRecordForm } from '@/components/forms/HealthRecordForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { TURKCE_LABELS } from '@/constants';
import { FALLBACK_IMAGES, PET_TYPE_AVATARS } from '@/constants/images';
import { useUserTimezone } from '@/lib/hooks/useUserTimezone';
import { formatInTimeZone } from '@/lib/utils/date';

const { width } = Dimensions.get('window');
const FOOTER_HEIGHT = 80;

export default function HealthRecordDetailScreen() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editFormKey, setEditFormKey] = useState(0);
  const userTimezone = useUserTimezone();
  const dateFormat = i18n.language === 'tr' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';

  const deleteMutation = useDeleteHealthRecord();
  const { data: healthRecord, isLoading, refetch } = useHealthRecord(id as string);
  const { data: pet } = usePet(healthRecord?.petId || '');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        heroContainer: {
          height: 340,
          width: '100%',
          overflow: 'hidden',
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          backgroundColor: theme.colors.surfaceVariant,
        },
        heroImage: {
          width: '100%',
          height: '100%',
        },
        topNav: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 52,
          zIndex: 10,
        },
        navButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(0,0,0,0.2)',
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
        },
        heroContent: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          padding: 24,
          paddingBottom: 44,
        },
        statusBadge: {
          alignSelf: 'flex-start',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: theme.colors.primaryContainer,
          marginBottom: 8,
        },
        statusText: {
          color: theme.colors.onPrimaryContainer,
          fontSize: 12,
          fontWeight: '700',
          textTransform: 'uppercase',
        },
        titleText: {
          color: theme.colors.onBackground,
          fontSize: 28,
          fontWeight: '700',
        },
        subtitleText: {
          color: theme.colors.onSurfaceVariant,
          marginTop: 4,
        },
        mainContent: {
          paddingHorizontal: 20,
          marginTop: -24,
          gap: 24,
        },
        gridContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
        },
        gridCard: {
          width: (width - 52) / 2,
          padding: 16,
          borderRadius: 16,
          borderWidth: 1,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
          minHeight: 100,
          justifyContent: 'space-between',
        },
        cardLabel: {
          fontSize: 12,
          fontWeight: '500',
          textTransform: 'uppercase',
          color: theme.colors.onSurfaceVariant,
        },
        cardValue: {
          fontSize: 17,
          fontWeight: '700',
          marginTop: 4,
          color: theme.colors.onSurface,
        },
        petImageContainer: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.colors.surfaceVariant,
          overflow: 'hidden',
          marginBottom: 12,
        },
        petImage: {
          width: '100%',
          height: '100%',
        },
        sectionTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: theme.colors.onBackground,
        },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        planContainer: {
          gap: 12,
        },
        medItem: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          borderRadius: 16,
          borderWidth: 1,
          gap: 16,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
        medIcon: {
          width: 48,
          height: 48,
          borderRadius: 24,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.secondaryContainer,
        },
        medContent: {
          flex: 1,
        },
        medName: {
          fontSize: 16,
          fontWeight: '700',
          color: theme.colors.onSurface,
        },
        medInstruction: {
          fontSize: 12,
          marginTop: 2,
          color: theme.colors.onSurfaceVariant,
        },
        medDosage: {
          fontSize: 16,
          fontWeight: '700',
          color: theme.colors.primary,
        },
        emptyTreatmentText: {
          color: theme.colors.onSurfaceVariant,
          padding: 8,
        },
        bottomBar: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          padding: 16,
          paddingBottom: insets.bottom + 16,
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.outlineVariant,
        },
        bottomBarInner: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          maxWidth: 500,
          alignSelf: 'center',
          width: '100%',
        },
        editButton: {
          flex: 1,
          height: 48,
          borderRadius: 12,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          backgroundColor: theme.colors.primary,
        },
        editButtonText: {
          color: theme.colors.onPrimary,
          fontSize: 16,
          fontWeight: '700',
        },
        iconButton: {
          width: 48,
          height: 48,
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
        },
      }),
    [theme, insets]
  );

  const handleEdit = () => {
    setEditFormKey((current) => current + 1);
    setIsEditModalVisible(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalVisible(false);
    refetch();
  };

  const handleDelete = () => {
    Alert.alert(t('healthRecords.deleteRecord'), t('healthRecords.deleteConfirmation'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: confirmDelete },
    ]);
  };

  const confirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id as string);
      router.back();
    } catch (error) {
      showToast({
        type: 'error',
        title: t('common.error'),
        message: error instanceof Error ? error.message : t('healthRecords.deleteError'),
      });
    }
  };

  const handleShare = async () => {
    if (!healthRecord) return;

    const shareContent = [
      healthRecord.title,
      `${t('pets.type')}: ${TURKCE_LABELS.HEALTH_RECORD_TYPES[healthRecord.type as keyof typeof TURKCE_LABELS.HEALTH_RECORD_TYPES]}`,
      `${t('events.date')}: ${formatInTimeZone(healthRecord.date, userTimezone, dateFormat)}`,
    ].join('\n');

    try {
      await Share.share({
        message: shareContent,
        title: t('healthRecords.title'),
      });
    } catch {
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LoadingSpinner />
      </View>
    );
  }

  if (!healthRecord) {
    return (
      <View style={styles.container}>
        <EmptyState
          title={t('healthRecords.notFound')}
          description={t('healthRecords.notFoundDescription')}
          icon="alert-circle"
          buttonText={t('common.goBack')}
          onButtonPress={() => router.back()}
        />
      </View>
    );
  }

  const heroSource = pet?.profilePhoto
    ? { uri: pet.profilePhoto }
    : pet?.type
      ? (PET_TYPE_AVATARS[pet.type.toLowerCase() as keyof typeof PET_TYPE_AVATARS] ?? FALLBACK_IMAGES.petHero)
      : FALLBACK_IMAGES.petHero;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: FOOTER_HEIGHT + insets.bottom + 24 }}>
        <View style={styles.heroContainer}>
          <ImageBackground source={heroSource} style={styles.heroImage} resizeMode="cover">
            <LinearGradient
              colors={[theme.colors.background, 'transparent']}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0.4 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.topNav}>
              <TouchableOpacity style={styles.navButton} onPress={() => router.back()}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onBackground} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButton} onPress={handleShare}>
                <MaterialCommunityIcons name="share-variant" size={20} color={theme.colors.onBackground} />
              </TouchableOpacity>
            </View>

            <View style={styles.heroContent}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{t('common.completed')}</Text>
              </View>
              <Text style={styles.titleText}>{healthRecord.title}</Text>
              <Text style={styles.subtitleText}>
                {formatInTimeZone(healthRecord.date, userTimezone, dateFormat)} • {t(`healthRecordTypes.${healthRecord.type}`, healthRecord.type)}
              </Text>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.gridContainer}>
            <View style={styles.gridCard}>
              <View style={styles.petImageContainer}>
                <Image
                  source={pet?.profilePhoto
                    ? { uri: pet.profilePhoto }
                    : pet?.type
                      ? (PET_TYPE_AVATARS[pet.type.toLowerCase() as keyof typeof PET_TYPE_AVATARS] ?? FALLBACK_IMAGES.petAvatar)
                      : FALLBACK_IMAGES.petAvatar}
                  style={styles.petImage}
                />
              </View>
              <View>
                <Text style={styles.cardLabel}>{t('pets.pet')}</Text>
                <Text style={styles.cardValue}>{pet?.name || '-'}</Text>
              </View>
            </View>

            <View style={styles.gridCard}>
              <View>
                <Text style={styles.cardLabel}>{t('health.recordType')}</Text>
                <Text style={styles.cardValue}>{t(`healthRecordTypes.${healthRecord.type}`, healthRecord.type)}</Text>
              </View>
              <MaterialCommunityIcons name="medical-bag" size={20} color={theme.colors.primary} />
            </View>

            <View style={styles.gridCard}>
              <View>
                <Text style={styles.cardLabel}>{t('events.date')}</Text>
                <Text style={styles.cardValue}>{formatInTimeZone(healthRecord.date, userTimezone, dateFormat)}</Text>
              </View>
              <MaterialCommunityIcons name="calendar-blank" size={20} color={theme.colors.primary} />
            </View>
          </View>

          <View style={{ gap: 12 }}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="hospital-box" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>{t('healthRecords.treatmentPlan')}</Text>
            </View>
            <View style={styles.planContainer}>
              {healthRecord.treatmentPlan && healthRecord.treatmentPlan.length > 0 ? (
                healthRecord.treatmentPlan.map((item, index) => (
                  <View key={index} style={styles.medItem}>
                    <View style={styles.medIcon}>
                      <MaterialCommunityIcons name="pill" size={24} color={theme.colors.secondary} />
                    </View>
                    <View style={styles.medContent}>
                      <Text style={styles.medName}>{item.name}</Text>
                      <Text style={styles.medInstruction}>
                        {item.frequency} {item.notes ? `• ${item.notes}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.medDosage}>{item.dosage}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyTreatmentText}>{t('healthRecords.noTreatmentPlan')}</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
            accessibilityLabel={t('common.edit')}
            accessibilityHint={t('healthRecords.editRecordHint')}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="file-document-edit" size={20} color={theme.colors.onPrimary} />
            <Text style={styles.editButtonText}>{t('common.edit')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceVariant }]}
            onPress={handleShare}
            accessibilityLabel={t('healthRecords.shareRecord')}
            accessibilityHint={t('healthRecords.shareRecordHint')}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="share-variant" size={22} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, { borderColor: theme.colors.errorContainer, backgroundColor: 'transparent' }]}
            onPress={handleDelete}
            accessibilityLabel={t('healthRecords.deleteRecord')}
            accessibilityHint={t('healthRecords.deleteConfirmation')}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="delete" size={22} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <HealthRecordForm
        key={editFormKey}
        petId={healthRecord.petId}
        visible={isEditModalVisible}
        onSuccess={handleEditSuccess}
        onCancel={() => setIsEditModalVisible(false)}
        initialData={healthRecord}
      />
    </View>
  );
}
