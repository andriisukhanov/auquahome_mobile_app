import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  useTheme,
  ActivityIndicator,
  Chip,
  Button,
  IconButton,
  Searchbar,
  Menu,
  Divider,
  Avatar,
  Banner,
  Surface,
  FAB,
  Badge,
  Card,
  Title,
  Paragraph,
} from 'react-native-paper';
import {useNavigation, useRoute} from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {getTimeline, EventType, EventStatus} from '../../api/timelineApi';
import {formatDateToLocal, getRelativeTime} from '../../utils/dateUtils';
import EmptyState from '../../components/common/EmptyState';

interface RouteParams {
  aquariumId: string;
}

interface TimelineEvent {
  id: string;
  aquariumId: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  status: string;
  mediaUrls?: string[];
}

const EventListScreen: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Фільтри
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isStartDatePickerVisible, setStartDatePickerVisibility] =
    useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const {aquariumId} = route.params as RouteParams;

  const pageSize = 20;

  // Завантаження даних хронології
  const loadEvents = useCallback(
    async (refresh = false) => {
      try {
        setError('');
        if (refresh) {
          setLoading(true);
          setPage(0);
        } else if (loadingMore) {
          return;
        } else {
          setLoadingMore(true);
        }

        const currentPage = refresh ? 0 : page;

        // Підготовка фільтрів
        const filters: Record<string, any> = {
          limit: pageSize,
          skip: currentPage * pageSize,
        };

        if (typeFilters.length > 0) {
          filters.types = typeFilters;
        }

        if (statusFilters.length > 0) {
          filters.statuses = statusFilters;
        }

        if (startDate) {
          filters.startDate = startDate.toISOString();
        }

        if (endDate) {
          filters.endDate = endDate.toISOString();
        }

        const data = await getTimeline(aquariumId, filters);

        if (data.length < pageSize) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        if (refresh) {
          setEvents(data);
        } else {
          setEvents(prevEvents => [...prevEvents, ...data]);
        }

        if (refresh) {
          setPage(1);
        } else {
          setPage(currentPage + 1);
        }
      } catch (err: any) {
        setError('Помилка завантаження подій. Спробуйте знову пізніше.');
        console.error('Error loading timeline events:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [
      aquariumId,
      page,
      loadingMore,
      typeFilters,
      statusFilters,
      startDate,
      endDate,
    ],
  );

  useEffect(() => {
    loadEvents(true);
  }, [aquariumId, typeFilters, statusFilters, startDate, endDate]);

  // Оновлення списку при свайпі вниз
  const onRefresh = () => {
    setRefreshing(true);
    loadEvents(true);
  };

  // Завантаження нових подій при досягненні кінця списку
  const loadMoreEvents = () => {
    if (hasMore && !loadingMore && !loading) {
      loadEvents();
    }
  };

  // Обробники для вибору дат
  const showStartDatePicker = () => {
    setStartDatePickerVisibility(true);
  };

  const hideStartDatePicker = () => {
    setStartDatePickerVisibility(false);
  };

  const handleStartDateConfirm = (date: Date) => {
    setStartDate(date);
    hideStartDatePicker();
  };

  const showEndDatePicker = () => {
    setEndDatePickerVisibility(true);
  };

  const hideEndDatePicker = () => {
    setEndDatePickerVisibility(false);
  };

  const handleEndDateConfirm = (date: Date) => {
    setEndDate(date);
    hideEndDatePicker();
  };

  // Скидання всіх фільтрів
  const resetFilters = () => {
    setTypeFilters([]);
    setStatusFilters([]);
    setStartDate(null);
    setEndDate(null);
    setSearchQuery('');
  };

  // Перемикання фільтра типу події
  const toggleTypeFilter = (type: string) => {
    if (typeFilters.includes(type)) {
      setTypeFilters(typeFilters.filter(t => t !== type));
    } else {
      setTypeFilters([...typeFilters, type]);
    }
  };

  // Перемикання фільтра статусу події
  const toggleStatusFilter = (status: string) => {
    if (statusFilters.includes(status)) {
      setStatusFilters(statusFilters.filter(s => s !== status));
    } else {
      setStatusFilters([...statusFilters, status]);
    }
  };

  // Пошук за текстом
  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Фільтрація подій за пошуковим запитом
  const getFilteredEvents = () => {
    if (!searchQuery.trim()) return events;

    const query = searchQuery.toLowerCase();
    return events.filter(
      event =>
        event.title.toLowerCase().includes(query) ||
        (event.description && event.description.toLowerCase().includes(query)),
    );
  };

  // Переклад типу події
  const getEventTypeText = (type: string) => {
    const types: Record<string, string> = {
      'water.parameters': 'Параметри води',
      'water.change': 'Заміна води',
      feeding: 'Годування',
      'equipment.maintenance': 'Обслуговування обладнання',
      'inhabitant.added': 'Додано мешканця',
      'inhabitant.removed': 'Видалено мешканця',
      'plant.trimmed': 'Обрізка рослин',
      observation: 'Спостереження',
      'issue.detected': 'Виявлено проблему',
      'issue.resolved': 'Проблему вирішено',
      'complex.maintenance': 'Комплексне обслуговування',
      'media.added': 'Додано фото/відео',
      custom: 'Інша подія',
    };
    return types[type] || type;
  };

  // Переклад статусу події
  const getEventStatusText = (status: string) => {
    const statuses: Record<string, string> = {
      scheduled: 'Заплановано',
      in_progress: 'В процесі',
      completed: 'Завершено',
      cancelled: 'Скасовано',
    };
    return statuses[status] || status;
  };

  // Отримання кольору статусу події
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: '#2196F3',
      in_progress: '#FF9800',
      completed: '#4CAF50',
      cancelled: '#F44336',
    };
    return colors[status] || theme.colors.primary;
  };

  // Отримання ікони для типу події
  const getEventTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'water.parameters': 'test-tube',
      'water.change': 'water',
      feeding: 'food',
      'equipment.maintenance': 'tools',
      'inhabitant.added': 'fish',
      'inhabitant.removed': 'location-exit',
      'plant.trimmed': 'content-cut',
      observation: 'eye',
      'issue.detected': 'alert-circle',
      'issue.resolved': 'check-circle',
      'complex.maintenance': 'wrench',
      'media.added': 'image',
      custom: 'format-list-bulleted',
    };
    return icons[type] || 'calendar';
  };

  // Рендер події
  const renderEventItem = ({item}: {item: TimelineEvent}) => {
    return (
      <Card
        style={styles.eventCard}
        onPress={() =>
          navigation.navigate('EventDetails', {id: item.id, aquariumId})
        }>
        <Card.Content>
          <View style={styles.eventHeader}>
            <View style={styles.eventTitleContainer}>
              <Title numberOfLines={1} style={styles.eventTitle}>
                {item.title}
              </Title>
              {item.mediaUrls && item.mediaUrls.length > 0 && (
                <Badge size={16} style={styles.mediaBadge}>
                  {item.mediaUrls.length}
                </Badge>
              )}
            </View>
            <Chip
              mode="outlined"
              style={{borderColor: getStatusColor(item.status)}}
              textStyle={{color: getStatusColor(item.status)}}>
              {getEventStatusText(item.status)}
            </Chip>
          </View>

          <View style={styles.eventTypeContainer}>
            <Avatar.Icon
              size={36}
              icon={getEventTypeIcon(item.type)}
              style={{backgroundColor: `${theme.colors.primary}20`}}
              color={theme.colors.primary}
            />
            <Text style={styles.eventType}>{getEventTypeText(item.type)}</Text>
          </View>

          {item.description && (
            <Paragraph numberOfLines={2} style={styles.eventDescription}>
              {item.description}
            </Paragraph>
          )}

          <Text style={styles.eventTime}>
            {formatDateToLocal(new Date(item.timestamp))}
            {' • '}
            {getRelativeTime(new Date(item.timestamp))}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  // Рендер порожнього стану
  const renderEmptyComponent = () => {
    if (loading) return null;

    const hasFilters =
      typeFilters.length > 0 ||
      statusFilters.length > 0 ||
      startDate !== null ||
      endDate !== null ||
      searchQuery.trim() !== '';

    return (
      <EmptyState
        icon="calendar-blank"
        title={hasFilters ? 'Немає подій з вказаними фільтрами' : 'Немає подій'}
        description={
          hasFilters
            ? 'Спробуйте змінити параметри фільтрації'
            : 'Додайте першу подію для вашого акваріума'
        }
        buttonText={hasFilters ? 'Скинути фільтри' : 'Додати подію'}
        onButtonPress={
          hasFilters
            ? resetFilters
            : () => navigation.navigate('EventForm', {aquariumId})
        }
      />
    );
  };

  // Футер списку
  const renderFooter = () => {
    if (!hasMore) return null;

    return loadingMore ? (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    ) : null;
  };

  // Рендер активних фільтрів
  const renderActiveFilters = () => {
    if (
      typeFilters.length === 0 &&
      statusFilters.length === 0 &&
      startDate === null &&
      endDate === null
    )
      return null;

    return (
      <View style={styles.activeFiltersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeFilters}>
          {typeFilters.map(type => (
            <Chip
              key={type}
              icon={getEventTypeIcon(type)}
              onClose={() => toggleTypeFilter(type)}
              style={styles.filterChip}>
              {getEventTypeText(type)}
            </Chip>
          ))}

          {statusFilters.map(status => (
            <Chip
              key={status}
              onClose={() => toggleStatusFilter(status)}
              style={[
                styles.filterChip,
                {borderColor: getStatusColor(status)},
              ]}>
              {getEventStatusText(status)}
            </Chip>
          ))}

          {startDate && (
            <Chip
              icon="calendar-start"
              onClose={() => setStartDate(null)}
              style={styles.filterChip}>
              Від: {formatDateToLocal(startDate)}
            </Chip>
          )}

          {endDate && (
            <Chip
              icon="calendar-end"
              onClose={() => setEndDate(null)}
              style={styles.filterChip}>
              До: {formatDateToLocal(endDate)}
            </Chip>
          )}

          <Chip
            icon="filter-off"
            onPress={resetFilters}
            style={styles.resetChip}>
            Скинути
          </Chip>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Панель пошуку */}
      <Surface style={styles.searchContainer} elevation={2}>
        <View style={styles.searchRow}>
          <Searchbar
            placeholder="Пошук подій"
            onChangeText={onChangeSearch}
            value={searchQuery}
            style={styles.searchbar}
          />

          <IconButton
            icon={showFilters ? 'filter-off' : 'filter'}
            size={24}
            onPress={() => setShowFilters(!showFilters)}
          />
        </View>

        {showFilters && (
          <View style={styles.filtersContainer}>
            <Text style={styles.filterLabel}>Фільтри за типом:</Text>
            <View style={styles.typeFilters}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Chip
                  icon="test-tube"
                  selected={typeFilters.includes(EventType.WATER_PARAMETERS)}
                  onPress={() => toggleTypeFilter(EventType.WATER_PARAMETERS)}
                  style={styles.typeChip}>
                  Параметри води
                </Chip>
                <Chip
                  icon="water"
                  selected={typeFilters.includes(EventType.WATER_CHANGE)}
                  onPress={() => toggleTypeFilter(EventType.WATER_CHANGE)}
                  style={styles.typeChip}>
                  Заміна води
                </Chip>
                <Chip
                  icon="food"
                  selected={typeFilters.includes(EventType.FEEDING)}
                  onPress={() => toggleTypeFilter(EventType.FEEDING)}
                  style={styles.typeChip}>
                  Годування
                </Chip>
                <Chip
                  icon="tools"
                  selected={typeFilters.includes(
                    EventType.EQUIPMENT_MAINTENANCE,
                  )}
                  onPress={() =>
                    toggleTypeFilter(EventType.EQUIPMENT_MAINTENANCE)
                  }
                  style={styles.typeChip}>
                  Обслуговування
                </Chip>
                <Chip
                  icon="wrench"
                  selected={typeFilters.includes(EventType.COMPLEX_MAINTENANCE)}
                  onPress={() =>
                    toggleTypeFilter(EventType.COMPLEX_MAINTENANCE)
                  }
                  style={styles.typeChip}>
                  Комплексне
                </Chip>
              </ScrollView>
            </View>

            <Text style={styles.filterLabel}>Фільтри за статусом:</Text>
            <View style={styles.statusFilters}>
              <Chip
                selected={statusFilters.includes(EventStatus.SCHEDULED)}
                onPress={() => toggleStatusFilter(EventStatus.SCHEDULED)}
                style={styles.statusChip}>
                Заплановано
              </Chip>
              <Chip
                selected={statusFilters.includes(EventStatus.IN_PROGRESS)}
                onPress={() => toggleStatusFilter(EventStatus.IN_PROGRESS)}
                style={styles.statusChip}>
                В процесі
              </Chip>
              <Chip
                selected={statusFilters.includes(EventStatus.COMPLETED)}
                onPress={() => toggleStatusFilter(EventStatus.COMPLETED)}
                style={styles.statusChip}>
                Завершено
              </Chip>
              <Chip
                selected={statusFilters.includes(EventStatus.CANCELLED)}
                onPress={() => toggleStatusFilter(EventStatus.CANCELLED)}
                style={styles.statusChip}>
                Скасовано
              </Chip>
            </View>

            <Text style={styles.filterLabel}>Період:</Text>
            <View style={styles.dateFilters}>
              <Button
                mode="outlined"
                icon="calendar-start"
                onPress={showStartDatePicker}
                style={styles.dateButton}>
                {startDate ? formatDateToLocal(startDate) : 'Початок'}
              </Button>
              <Button
                mode="outlined"
                icon="calendar-end"
                onPress={showEndDatePicker}
                style={styles.dateButton}>
                {endDate ? formatDateToLocal(endDate) : 'Кінець'}
              </Button>
            </View>

            <Button mode="contained" onPress={resetFilters}>
              Скинути всі фільтри
            </Button>
          </View>
        )}

        {/* Активні фільтри */}
        {renderActiveFilters()}
      </Surface>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            mode="contained"
            onPress={() => loadEvents(true)}
            style={styles.retryButton}>
            Спробувати знову
          </Button>
        </View>
      ) : (
        <FlatList
          data={getFilteredEvents()}
          renderItem={renderEventItem}
          keyExtractor={item => item.id}
          contentContainerStyle={
            getFilteredEvents().length === 0 ? styles.emptyList : styles.list
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={renderEmptyComponent}
          ListFooterComponent={renderFooter}
          onEndReached={loadMoreEvents}
          onEndReachedThreshold={0.1}
        />
      )}

      {/* Кнопка для додавання нової події */}
      <FAB
        style={[styles.fab, {backgroundColor: theme.colors.primary}]}
        icon="plus"
        onPress={() => navigation.navigate('EventForm', {aquariumId})}
        label="Нова подія"
      />

      {/* Модальні вікна для вибору дати */}
      <DateTimePickerModal
        isVisible={isStartDatePickerVisible}
        mode="date"
        onConfirm={handleStartDateConfirm}
        onCancel={hideStartDatePicker}
      />

      <DateTimePickerModal
        isVisible={isEndDatePickerVisible}
        mode="date"
        onConfirm={handleEndDateConfirm}
        onCancel={hideEndDatePicker}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 8,
    backgroundColor: '#fff',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchbar: {
    flex: 1,
    marginRight: 8,
  },
  filtersContainer: {
    padding: 8,
  },
  filterLabel: {
    marginVertical: 8,
    fontWeight: 'bold',
  },
  typeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  typeChip: {
    margin: 4,
  },
  statusFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  statusChip: {
    margin: 4,
  },
  dateFilters: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dateButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  activeFiltersContainer: {
    marginTop: 8,
  },
  activeFilters: {
    paddingHorizontal: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  resetChip: {
    marginRight: 8,
    backgroundColor: '#FFEBEE',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'tomato',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 12,
  },
  list: {
    padding: 12,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  eventCard: {
    marginBottom: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  eventTitle: {
    fontSize: 16,
    lineHeight: 20,
  },
  mediaBadge: {
    backgroundColor: '#03A9F4',
    marginLeft: 8,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventType: {
    marginLeft: 8,
    color: '#666',
  },
  eventDescription: {
    marginBottom: 8,
    fontSize: 14,
  },
  eventTime: {
    fontSize: 12,
    color: '#666',
  },
  footerLoader: {
    padding: 16,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default EventListScreen;
