import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, Searchbar, Chip, Button } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import { format, startOfDay, endOfDay, isToday, isTomorrow, isYesterday, addDays } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { Event } from '../lib/types';
import { createEventTypeOptions } from '../constants';
import { EventCard } from './EventCard';

interface EventListProps {
  events: Event[];
  loading?: boolean;
  onRefresh?: () => void;
  onEventPress?: (event: Event) => void;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  showPetInfo?: boolean;
  showActions?: boolean;
  compact?: boolean;
  searchEnabled?: boolean;
  filterEnabled?: boolean;
  emptyMessage?: string;
  testID?: string;
}

type FilterType = 'all' | 'today' | 'tomorrow' | 'week' | 'upcoming' | 'completed' | 'past';

export function EventList({
  events,
  loading = false,
  onRefresh,
  onEventPress,
  onEventEdit,
  onEventDelete,
  showPetInfo = true,
  showActions = true,
  compact = false,
  searchEnabled = true,
  filterEnabled = true,
  emptyMessage,
  testID,
}: EventListProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const locale = i18n.language === 'tr' ? tr : enUS;

  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);

  // Event type options for filtering
  const eventTypeOptions = useMemo(() => createEventTypeOptions(t), [t]);

  // Filter events based on search and filters
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query) ||
        event.notes?.toLowerCase().includes(query)
      );
    }

    // Date filter
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const tomorrowStart = startOfDay(addDays(now, 1));
    const tomorrowEnd = endOfDay(addDays(now, 1));
    const weekEnd = endOfDay(addDays(now, 7));

    switch (selectedFilter) {
      case 'today':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.startTime);
          return eventDate >= todayStart && eventDate <= todayEnd;
        });
        break;
      case 'tomorrow':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.startTime);
          return eventDate >= tomorrowStart && eventDate <= tomorrowEnd;
        });
        break;
      case 'week':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.startTime);
          return eventDate >= todayStart && eventDate <= weekEnd;
        });
        break;
      case 'upcoming':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.startTime);
          return eventDate >= todayStart && event.status === 'upcoming';
        });
        break;
      case 'completed':
        filtered = filtered.filter(event =>
          event.status === 'completed' || event.status === 'missed' || event.status === 'cancelled'
        );
        break;
      case 'past':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.startTime);
          return eventDate < todayStart;
        });
        break;
      // 'all' doesn't filter by date
    }

    // Event type filter
    if (selectedEventType) {
      filtered = filtered.filter(event => event.type === selectedEventType);
    }

    // Sort by start time (earliest first for upcoming, latest first for past/completed)
    filtered.sort((a, b) => {
      const dateA = new Date(a.startTime);
      const dateB = new Date(b.startTime);
      return selectedFilter === 'past' || selectedFilter === 'completed'
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });

    return filtered;
  }, [events, searchQuery, selectedFilter, selectedEventType]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: { [date: string]: Event[] } = {};

    filteredEvents.forEach(event => {
      const eventDate = new Date(event.startTime);
      const dateKey = format(eventDate, 'yyyy-MM-dd');

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });

    return groups;
  }, [filteredEvents]);

  // Format date for section headers
  const formatSectionDate = useCallback((dateString: string) => {
    const date = new Date(dateString);

    if (isToday(date)) {
      return t('eventList.today');
    } else if (isTomorrow(date)) {
      return t('eventList.tomorrow');
    } else if (isYesterday(date)) {
      return t('eventList.yesterday');
    } else {
      return format(date, 'dd MMMM yyyy', { locale });
    }
  }, [locale, t]);

  // Filter options
  const filterOptions: { type: FilterType; label: string }[] = [
    { type: 'all', label: t('eventList.filters.all') },
    { type: 'today', label: t('eventList.filters.today') },
    { type: 'tomorrow', label: t('eventList.filters.tomorrow') },
    { type: 'week', label: t('eventList.filters.thisWeek') },
    { type: 'upcoming', label: t('eventList.filters.upcoming') },
    { type: 'completed', label: t('eventList.filters.completed') },
    { type: 'past', label: t('eventList.filters.past') },
  ];

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedFilter('all');
    setSelectedEventType(null);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = searchQuery.trim() || selectedFilter !== 'all' || selectedEventType;

  // Render event item
  const renderEvent = useCallback(({ item }: { item: Event }) => (
    <EventCard
      event={item}
      onPress={onEventPress}
      onEdit={onEventEdit}
      onDelete={onEventDelete}
      showPetInfo={showPetInfo}
      showActions={showActions}
      compact={compact}
      testID={`event-${item._id}`}
    />
  ), [onEventPress, onEventEdit, onEventDelete, showPetInfo, showActions, compact]);

  // Render section header
  const renderSectionHeader = useCallback(({ section: { title } }: { section: { title: string } }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
      <Text
        variant="labelLarge"
        style={[styles.sectionHeaderText, { color: theme.colors.onSurface }]}
      >
        {formatSectionDate(title)}
      </Text>
      <Text
        variant="labelSmall"
        style={[styles.sectionCountText, { color: theme.colors.onSurfaceVariant }]}
      >
        {groupedEvents[title].length} {t('eventList.events')}
      </Text>
    </View>
  ), [theme.colors, groupedEvents, t, formatSectionDate]);

  // Empty state
  if (!loading && filteredEvents.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.background }]} testID={testID}>
        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
          {emptyMessage || t('eventList.noEvents')}
        </Text>
        {hasActiveFilters && (
          <Button
            mode="outlined"
            onPress={clearFilters}
            style={styles.clearFiltersButton}
          >
            {t('eventList.clearFilters')}
          </Button>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} testID={testID}>
      {/* Search Bar */}
      {searchEnabled && (
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder={t('eventList.searchPlaceholder')}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
          />
        </View>
      )}

      {/* Filter Options */}
      {filterEnabled && (
        <View style={styles.filterContainer}>
          {/* Date Filters */}
          <View style={styles.filterRow}>
            <Text
              variant="labelMedium"
              style={[styles.filterLabel, { color: theme.colors.onSurface }]}
            >
              {t('eventList.dateFilter')}
            </Text>
            <View style={styles.chipContainer}>
              {filterOptions.map((option) => (
                <Chip
                  key={option.type}
                  selected={selectedFilter === option.type}
                  onPress={() => setSelectedFilter(option.type)}
                  style={styles.chip}
                  textStyle={styles.chipText}
                  compact
                >
                  {option.label}
                </Chip>
              ))}
            </View>
          </View>

          {/* Event Type Filters */}
          <View style={styles.filterRow}>
            <Text
              variant="labelMedium"
              style={[styles.filterLabel, { color: theme.colors.onSurface }]}
            >
              {t('eventList.typeFilter')}
            </Text>
            <View style={styles.chipContainer}>
              <Chip
                selected={!selectedEventType}
                onPress={() => setSelectedEventType(null)}
                style={styles.chip}
                textStyle={styles.chipText}
                compact
              >
                {t('eventList.allTypes')}
              </Chip>
              {eventTypeOptions.map((option) => (
                <Chip
                  key={option.value}
                  selected={selectedEventType === option.value}
                  onPress={() => setSelectedEventType(option.value)}
                  style={styles.chip}
                  textStyle={styles.chipText}
                  compact
                >
                  {option.label}
                </Chip>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <View style={styles.clearFiltersContainer}>
          <Button
            mode="outlined"
            onPress={clearFilters}
            compact
            style={styles.clearFiltersButton}
          >
            {t('eventList.clearFilters')}
          </Button>
        </View>
      )}

      {/* Events List */}
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => {
          const showSectionHeader = index === 0 ||
            format(new Date(item.startTime), 'yyyy-MM-dd') !==
            format(new Date(filteredEvents[index - 1].startTime), 'yyyy-MM-dd');

          return (
            <View>
              {showSectionHeader && renderSectionHeader({
                section: { title: format(new Date(item.startTime), 'yyyy-MM-dd') }
              })}
              {renderEvent({ item })}
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={loading}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          ) : undefined
        }
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
              />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchbar: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  searchInput: {
    fontSize: 16,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    marginBottom: 8,
    fontWeight: '500',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    height: 32,
  },
  chipText: {
    fontSize: 12,
  },
  clearFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  clearFiltersButton: {
    alignSelf: 'center',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionHeaderText: {
    fontWeight: '600',
  },
  sectionCountText: {
    fontSize: 12,
  },
  sectionSeparator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 4,
  },
  itemSeparator: {
    height: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
});

export default EventList;