import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Button, Text, Card } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useNextFeedingWithDetails } from '@/lib/hooks/useFeedingSchedules';
import { formatTimeForDisplay } from '@/lib/schemas/feedingScheduleSchema';
import { Ionicons } from '@expo/vector-icons';

export function NextFeedingWidget() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  // Use combined hook for all feeding details
  const {
    schedule: nextSchedule,
    pet,
    nextFeedingTime,
    isLoading,
  } = useNextFeedingWithDetails(i18n.language);

  const handlePress = () => {
    router.push('/(tabs)/care');
  };

  // Loading state
  if (isLoading) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: '#4B5563' }]}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '33' }]}>
            <Ionicons name="restaurant" size={28} color={theme.colors.primary} />
          </View>
          <View style={styles.textContainer}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('feedingSchedule.nextFeeding')}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('common.loading')}
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  // No feeding schedules
  if (!nextSchedule || !nextFeedingTime) {
    return (
      <Card
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
        ]}
      >
        <View style={styles.emptyContent}>
          <View style={[styles.emptyIconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
            <Ionicons name="restaurant" size={26} color={theme.colors.primary} />
          </View>
          <Text variant="titleMedium" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
            {t('home.nextFeedingEmptyTitle')}
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.emptyDescription, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('home.nextFeedingEmptyDescription')}
          </Text>
          <Button
            mode="contained"
            onPress={handlePress}
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
            style={styles.emptyCta}
          >
            {t('home.nextFeedingEmptyCta')}
          </Button>
        </View>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: '#4B5563' }]}>
      <Pressable onPress={handlePress} style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '33' }]}>
          <Ionicons name="restaurant" size={28} color={theme.colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '500' }}>
            {t('feedingSchedule.nextFeeding')}
          </Text>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
            {formatTimeForDisplay(nextSchedule.time)} - {pet?.name}
          </Text>
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  emptyCta: {
    alignSelf: 'center',
  },
});

export default NextFeedingWidget;
