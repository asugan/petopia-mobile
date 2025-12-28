import { Card, Chip, IconButton, ListItem, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import { HealthRecordForm } from '@/components/forms/HealthRecordForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import { HEALTH_RECORD_COLORS, HEALTH_RECORD_ICONS, TURKCE_LABELS } from '@/constants';
import { useDeleteHealthRecord, useHealthRecord } from '@/lib/hooks/useHealthRecords';

export default function HealthRecordDetailScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editFormKey, setEditFormKey] = useState(0);

  const deleteMutation = useDeleteHealthRecord();
  const { data: healthRecord, isLoading, refetch } = useHealthRecord(id as string);


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
      Alert.alert(t('common.error'), error instanceof Error ? error.message : t('healthRecords.deleteError'));
    }
  };

  const handleShare = async () => {
    if (!healthRecord) return;

    const shareContent = `
${healthRecord.title}
${t('pets.type')}: ${TURKCE_LABELS.HEALTH_RECORD_TYPES[healthRecord.type as keyof typeof TURKCE_LABELS.HEALTH_RECORD_TYPES]}
${t('events.date')}: ${new Date(healthRecord.date).toLocaleDateString('tr-TR')}
${healthRecord.veterinarian ? `${t('healthRecords.veterinarian')}: Dr. ${healthRecord.veterinarian}` : ''}
${healthRecord.clinic ? `${t('healthRecords.clinic')}: ${healthRecord.clinic}` : ''}
${healthRecord.cost ? `${t('healthRecords.cost')}: ₺${healthRecord.cost.toLocaleString('tr-TR')}` : ''}
${healthRecord.description ? `${t('healthRecords.descriptionField')}: ${healthRecord.description}` : ''}
${healthRecord.notes ? `${t('common.notes')}: ${healthRecord.notes}` : ''}
    `.trim();

    try {
      await Share.share({
        message: shareContent,
        title: t('healthRecords.title'),
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (!healthRecord) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          title={t('healthRecords.notFound')}
          description={t('healthRecords.notFoundDescription')}
          icon="alert-circle"
          buttonText={t('common.goBack')}
          onButtonPress={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const typeColor = HEALTH_RECORD_COLORS[healthRecord.type as keyof typeof HEALTH_RECORD_COLORS] || '#A8A8A8';
  const typeIcon = HEALTH_RECORD_ICONS[healthRecord.type as keyof typeof HEALTH_RECORD_ICONS] || 'medical-bag';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Actions */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}>
        <IconButton
          icon="arrow-left"
          onPress={() => router.back()}
        />
        <View style={styles.headerActions}>
          <IconButton
            icon="share-variant"
            onPress={handleShare}
          />
          <IconButton
            icon="pencil"
            onPress={handleEdit}
          />
          <IconButton
            icon="delete"
            onPress={handleDelete}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Card */}
        <Card style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.titleRow}>
              <View style={[styles.typeIndicator, { backgroundColor: typeColor }]} />
              <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, flex: 1 }}>
                {healthRecord.title}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Chip
                icon={typeIcon}
                textStyle={{ fontSize: 12 }}
                compact
              >
                {TURKCE_LABELS.HEALTH_RECORD_TYPES[healthRecord.type as keyof typeof TURKCE_LABELS.HEALTH_RECORD_TYPES]}
              </Chip>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {new Date(healthRecord.date).toLocaleDateString('tr-TR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {healthRecord.description && (
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, marginTop: 16, lineHeight: 24 }}>
                {healthRecord.description}
              </Text>
            )}
          </View>
        </Card>

        {/* Veteriner & Clinic */}
        {(healthRecord.veterinarian || healthRecord.clinic) && (
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
                {t('healthRecords.veterinarianInfo')}
              </Text>

              {healthRecord.veterinarian && (
                <ListItem
                  title={healthRecord.veterinarian}
                  description={t('healthRecords.veterinarian')}
                  left={<MaterialCommunityIcons name="doctor" size={24} color={theme.colors.onSurfaceVariant} />}
                />
              )}

              {healthRecord.clinic && (
                <ListItem
                  title={healthRecord.clinic}
                  description={t('healthRecords.clinic')}
                  left={<MaterialCommunityIcons name="hospital-building" size={24} color={theme.colors.onSurfaceVariant} />}
                />
              )}
            </View>
          </Card>
        )}

        {/* Cost */}
        {healthRecord.cost && (
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <ListItem
                title={`₺${healthRecord.cost.toLocaleString('tr-TR')}`}
                description={t('healthRecords.cost')}
                left={<MaterialCommunityIcons name="currency-try" size={24} color={theme.colors.onSurfaceVariant} />}
              />
            </View>
          </Card>
        )}

        {/* Notes */}
        {healthRecord.notes && (
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
                {t('common.notes')}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, lineHeight: 20 }}>
                {healthRecord.notes}
              </Text>
            </View>
          </Card>
        )}

        {/* Metadata */}
        <Card style={styles.card}>
          <View style={styles.cardContent}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              {t('common.created')}: {new Date(healthRecord.createdAt).toLocaleString('tr-TR')}
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* Edit Modal */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerActions: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
