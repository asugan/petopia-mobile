import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useMemo } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme';
import { useDeleteHealthRecord, useHealthRecord } from '@/lib/hooks/useHealthRecords';
import { usePet } from '@/lib/hooks/usePets';
import { useEvent } from '@/lib/hooks/useEvents';
import { formatCurrency } from '@/lib/utils/currency';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { showToast } from '@/lib/toast/showToast';
import { HealthRecordForm } from '@/components/forms/HealthRecordForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { TURKCE_LABELS } from '@/constants';
import { FALLBACK_IMAGES } from '@/constants/images';
import MoneyDisplay from '@/components/ui/MoneyDisplay';

const { width } = Dimensions.get('window');
const FOOTER_HEIGHT = 80; // padding(16) + button height(48) + bottom padding(16)

export default function HealthRecordDetailScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editFormKey, setEditFormKey] = useState(0);
  const { settings } = useUserSettingsStore();
  const baseCurrency = settings?.baseCurrency || 'TRY';
  const dateLocale = settings?.language === 'tr' ? 'tr-TR' : 'en-US';

  const deleteMutation = useDeleteHealthRecord();
  const { data: healthRecord, isLoading, refetch } = useHealthRecord(id as string);
  
  const { data: pet } = usePet(healthRecord?.petId || '');
  const {
    data: nextVisitEvent,
    isError: isEventError,
    refetch: refetchNextVisitEvent,
  } = useEvent(healthRecord?.nextVisitEventId, { enabled: !!healthRecord?.nextVisitEventId });

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    heroContainer: {
      height: 380,
      width: '100%',
      overflow: 'hidden',
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      zIndex: 1,
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
      paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10,
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
    navActions: {
      flexDirection: 'row',
      gap: 12,
    },
    heroContent: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      padding: 24,
      paddingBottom: 48,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 10,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: theme.colors.primaryContainer,
      borderWidth: 1,
      borderColor: theme.colors.primaryContainer,
    },
    statusText: {
      color: theme.colors.onPrimaryContainer,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    dateText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      fontWeight: '500',
    },
    titleText: {
      color: theme.colors.onBackground,
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 34,
      marginBottom: 4,
      textShadowColor: theme.colors.background,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    subtitleText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
    },
    mainContent: {
      paddingHorizontal: 20,
      marginTop: -32,
      zIndex: 2,
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      overflow: 'hidden',
      minHeight: 110,
      justifyContent: 'space-between',
    },
    cardIconBg: {
      position: 'absolute',
      top: 0,
      right: 0,
      padding: 12,
      opacity: 0.05,
    },
    petImageContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceVariant,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: theme.colors.primary,
      marginBottom: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    petImage: {
      width: '100%',
      height: '100%',
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardLabel: {
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: theme.colors.onSurfaceVariant,
    },
    cardValue: {
      fontSize: 18,
      fontWeight: '700',
      marginTop: 2,
      color: theme.colors.onSurface,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    cardValueSmall: {
      fontSize: 15,
      fontWeight: '700',
      marginTop: 4,
      color: theme.colors.onSurface,
    },
    cardSubtext: {
      fontSize: 12,
      marginTop: 8,
      color: theme.colors.onSurfaceVariant,
    },
    paidBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 8,
    },
    paidText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.primary,
    },
    paidTextMuted: {
      color: theme.colors.onSurfaceVariant,
    },
    section: {
      gap: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.onBackground,
    },
    contentBox: {
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outlineVariant,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    noteText: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.onSurfaceVariant,
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
    nextVisitGradient: {
      borderRadius: 16,
      padding: 4,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    nextVisitContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    nextVisitLabel: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 4,
    },
    nextVisitDate: {
      color: theme.colors.onSurface,
      fontSize: 18,
      fontWeight: '700',
    },
    nextVisitTime: {
      color: theme.colors.outline,
      fontSize: 14,
    },
    nextVisitRetryText: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: '700',
      textDecorationLine: 'underline',
    },
    alarmButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 5,
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
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
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
    emptyTreatmentText: {
      color: theme.colors.onSurfaceVariant,
      padding: 8,
    },
  }), [theme, insets]);

  const handleEdit = () => {
    setEditFormKey((current) => current + 1);
    setIsEditModalVisible(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalVisible(false);
    refetch();
  };

  const handleEditCancel = () => {
    setIsEditModalVisible(false);
  };

  const handleDelete = () => {
    Alert.alert(
      t('healthRecords.deleteRecord'),
      t('healthRecords.deleteConfirmation'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
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

  React.useEffect(() => {
    if (isEventError) {
      showToast({
        type: 'error',
        title: t('common.error'),
        message: t('events.fetchError'),
      });
    }
  }, [isEventError, t]);

  const handleShare = async () => {
    if (!healthRecord) return;

    const recordCurrency = healthRecord.currency || baseCurrency;
    const recordBaseCurrency = healthRecord.baseCurrency || baseCurrency;
    const hasCost = healthRecord.cost != null;
    const hasAmountBase = healthRecord.amountBase != null;
    const showConverted = hasCost && recordCurrency !== recordBaseCurrency && hasAmountBase;

    const shareContent = `
${healthRecord.title}
${t('pets.type')}: ${TURKCE_LABELS.HEALTH_RECORD_TYPES[healthRecord.type as keyof typeof TURKCE_LABELS.HEALTH_RECORD_TYPES]}
${t('events.date')}: ${new Date(healthRecord.date).toLocaleDateString(dateLocale)}

${healthRecord.veterinarian ? `${t('healthRecords.veterinarian')}: Dr. ${healthRecord.veterinarian}` : ''}
${healthRecord.clinic ? `${t('healthRecords.clinic')}: ${healthRecord.clinic}` : ''}
${hasCost ? `${t('healthRecords.cost')}: ${formatCurrency(healthRecord.cost, recordCurrency)}${showConverted ? ` (≈ ${formatCurrency(healthRecord.amountBase, recordBaseCurrency)})` : ''}` : ''}
${healthRecord.description ? `${t('healthRecords.descriptionField')}: ${healthRecord.description}` : ''}
${healthRecord.notes ? `${t('common.notes')}: ${healthRecord.notes}` : ''}
    `.trim();

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

  const formattedDate = new Date(healthRecord.date).toLocaleDateString(dateLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const nextVisitDate = nextVisitEvent?.startTime ? new Date(nextVisitEvent.startTime) : null;
  const nextVisitFormatted = nextVisitDate ? nextVisitDate.toLocaleDateString(dateLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : t('healthRecords.noNextVisit');
  const nextVisitTime = nextVisitDate ? nextVisitDate.toLocaleTimeString(dateLocale, {
    hour: '2-digit',
    minute: '2-digit'
  }) : '';

  const heroSource = pet?.profilePhoto
    ? { uri: pet.profilePhoto }
    : FALLBACK_IMAGES.petHero;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: FOOTER_HEIGHT + insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.heroContainer}>
          <ImageBackground
            source={heroSource}
            style={styles.heroImage}
            resizeMode="cover"
          >
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
              <TouchableOpacity 
                style={styles.navButton} 
                onPress={() => router.back()}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onBackground} />
              </TouchableOpacity>
              <View style={styles.navActions}>
                <TouchableOpacity style={styles.navButton} onPress={handleShare}>
                  <MaterialCommunityIcons name="share-variant" size={20} color={theme.colors.onBackground} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.heroContent}>
              <View style={styles.statusRow}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{t('common.completed')}</Text>
                </View>
                <Text style={styles.dateText}>{formattedDate}</Text>
              </View>
              <Text style={styles.titleText}>{healthRecord.title}</Text>
              <Text style={styles.subtitleText}>
                {healthRecord.clinic ? `${healthRecord.clinic} • ` : ''}
                {healthRecord.veterinarian ? `Dr. ${healthRecord.veterinarian}` : ''}
              </Text>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.gridContainer}>
            <View style={styles.gridCard}>
              <View style={styles.cardIconBg}>
                <MaterialCommunityIcons name="paw" size={40} color={theme.colors.primary} />
              </View>
              <View style={styles.petImageContainer}>
                <Image 
                  source={pet?.profilePhoto ? { uri: pet.profilePhoto } : FALLBACK_IMAGES.petAvatar} 
                  style={styles.petImage} 
                />
              </View>
              <View>
                <Text style={styles.cardLabel}>{t('pets.pet')}</Text>
                <Text style={styles.cardValue}>{pet?.name || '...'}</Text>
              </View>
            </View>

            <View style={styles.gridCard}>
              <View style={styles.cardIconBg}>
                <MaterialCommunityIcons name="stethoscope" size={40} color={theme.colors.primary} />
              </View>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="medical-bag" size={20} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.cardLabel}>{t('healthRecords.veterinarian')}</Text>
                <Text style={styles.cardValue} numberOfLines={1}>
                  {healthRecord.veterinarian ? `Dr. ${healthRecord.veterinarian}` : '-'}
                </Text>
              </View>
            </View>

            <View style={styles.gridCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardLabel}>{t('healthRecords.clinic')}</Text>
                  <Text style={styles.cardValueSmall}>
                    {healthRecord.clinic || '-'}
                  </Text>
                </View>
                <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.primary} />
              </View>

            </View>

            <View style={styles.gridCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardLabel}>{t('healthRecords.cost')}</Text>
                  <MoneyDisplay
                    amount={healthRecord.cost}
                    currency={healthRecord.currency}
                    baseCurrency={healthRecord.baseCurrency || baseCurrency}
                    amountBase={healthRecord.amountBase}
                  />
                </View>
                <MaterialCommunityIcons name="cash" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.paidBadge}>
                <MaterialCommunityIcons
                  name={healthRecord.cost != null ? 'check-circle' : 'minus-circle'}
                  size={14}
                  color={healthRecord.cost != null ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.paidText,
                    healthRecord.cost == null && styles.paidTextMuted,
                  ]}
                >
                  {healthRecord.cost != null ? t('common.paid') : '-'}
                </Text>
              </View>
            </View>
          </View>

          {healthRecord.notes && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="text-box" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>{t('common.notes')}</Text>
              </View>
              <View style={styles.contentBox}>
                <Text style={styles.noteText}>
                  {healthRecord.notes}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="hospital-box" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>
                {t('healthRecords.treatmentPlan')}
              </Text>
            </View>
            <View style={styles.planContainer}>
              {healthRecord.treatmentPlan && healthRecord.treatmentPlan.length > 0 ? (
                healthRecord.treatmentPlan.map((item, index) => (
                  <View
                    key={
                      item &&
                      typeof item === 'object' &&
                      'id' in item &&
                      (typeof item.id === 'string' || typeof item.id === 'number')
                        ? item.id
                        : index
                    }
                    style={styles.medItem}
                  >
                    <View style={[styles.medIcon, { backgroundColor: theme.colors.secondaryContainer }]}>
                      <MaterialCommunityIcons 
                        name="pill" 
                        size={24} 
                        color={theme.colors.secondary} 
                      />
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
                <Text style={styles.emptyTreatmentText}>
                  {t('healthRecords.noTreatmentPlan')}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>
                {t('healthRecords.nextVisit')}
              </Text>
            </View>
            <LinearGradient
              colors={[theme.colors.surface, theme.colors.background]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextVisitGradient}
            >
               <View style={styles.nextVisitContent}>
                 <View>
                   <Text style={styles.nextVisitLabel}>{t('events.date')}</Text>
                   <Text style={styles.nextVisitDate}>{nextVisitFormatted}</Text>
                   {nextVisitDate && <Text style={styles.nextVisitTime}>{nextVisitTime}</Text>}

                   {isEventError && (
                     <Text style={styles.nextVisitRetryText} onPress={() => void refetchNextVisitEvent()}>
                       {t('common.retry')}
                     </Text>
                   )}
                 </View>
                 <View style={styles.alarmButton}>
                   <MaterialCommunityIcons name="alarm" size={24} color={theme.colors.onPrimary} />
                 </View>
               </View>
            </LinearGradient>
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

      {healthRecord && (
        <HealthRecordForm
          key={editFormKey}
          petId={healthRecord.petId}
          visible={isEditModalVisible}
          onSuccess={handleEditSuccess}
          onCancel={handleEditCancel}
          initialData={healthRecord}
        />
      )}
    </View>
  );
}
