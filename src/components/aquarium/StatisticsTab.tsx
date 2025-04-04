import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Avatar,
  Paragraph,
  Button,
  Divider,
  useTheme,
  ActivityIndicator,
  List,
  ProgressBar,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {PieChart} from 'react-native-chart-kit';
import {getAquariumById} from '../../api/aquariumApi';
import {getInhabitants, InhabitantType} from '../../api/inhabitantApi';
import {getRecentEvents} from '../../api/eventApi';
import {getTimelineStats} from '../../api/timelineApi';
import {formatDateToLocal, getRelativeTime} from '../../utils/dateUtils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface StatisticsTabProps {
  aquariumId: string;
}

const StatisticsTab: React.FC<StatisticsTabProps> = ({aquariumId}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [aquarium, setAquarium] = useState<any>(null);
  const [inhabitants, setInhabitants] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const theme = useTheme();
  const navigation = useNavigation();
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadData();
  }, [aquariumId]);

  const loadData = async () => {
    try {
      setError('');
      setLoading(true);

      // Паралельне завантаження даних
      const [aquariumData, inhabitantsData, eventsData, statsData] =
        await Promise.all([
          getAquariumById(aquariumId),
          getInhabitants(aquariumId),
          getRecentEvents(aquariumId, 3),
          getTimelineStats(aquariumId),
        ]);

      setAquarium(aquariumData);
      setInhabitants(inhabitantsData);
      setRecentEvents(eventsData);
      setStats(statsData);
    } catch (err: any) {
      setError('Помилка завантаження даних. Спробуйте знову пізніше.');
      console.error('Error loading statistics data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Переклад типу акваріума
  const getAquariumTypeText = (type: string) => {
    const types: Record<string, string> = {
      freshwater: 'Прісноводний',
      marine: 'Морський',
      brackish: 'Солонуватий',
      planted: 'Рослинний',
    };
    return types[type] || type;
  };

  // Отримання даних для кругової діаграми мешканців
  const getInhabitantChartData = () => {
    if (!inhabitants || inhabitants.length === 0) {
      return [
        {
          name: 'Немає мешканців',
          population: 1,
          color: '#CCCCCC',
          legendFontColor: '#7F7F7F',
          legendFontSize: 12,
        },
      ];
    }

    const fishCount = inhabitants
      .filter(i => i.type === InhabitantType.FISH && i.isActive)
      .reduce((sum, i) => sum + i.quantity, 0);

    const invertebrateCount = inhabitants
      .filter(i => i.type === InhabitantType.INVERTEBRATE && i.isActive)
      .reduce((sum, i) => sum + i.quantity, 0);

    const plantCount = inhabitants
      .filter(i => i.type === InhabitantType.PLANT && i.isActive)
      .reduce((sum, i) => sum + i.quantity, 0);

    const data = [];

    if (fishCount > 0) {
      data.push({
        name: 'Риби',
        population: fishCount,
        color: '#03A9F4',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      });
    }

    if (invertebrateCount > 0) {
      data.push({
        name: 'Безхребетні',
        population: invertebrateCount,
        color: '#FF9800',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      });
    }

    if (plantCount > 0) {
      data.push({
        name: 'Рослини',
        population: plantCount,
        color: '#4CAF50',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      });
    }

    return data.length > 0
      ? data
      : [
          {
            name: 'Немає активних мешканців',
            population: 1,
            color: '#CCCCCC',
            legendFontColor: '#7F7F7F',
            legendFontSize: 12,
          },
        ];
  };

  // Рендер карточки з інформацією про акваріум
  const renderAquariumInfo = () => {
    if (!aquarium) return null;

    const ageInDays = Math.floor(
      (new Date().getTime() - new Date(aquarium.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Загальна інформація</Title>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="fish-bowl" size={24} color={theme.colors.primary} />
              <Paragraph>Тип</Paragraph>
              <Text style={styles.infoValue}>
                {getAquariumTypeText(aquarium.type)}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Icon name="cup-water" size={24} color={theme.colors.primary} />
              <Paragraph>Об'єм</Paragraph>
              <Text style={styles.infoValue}>{aquarium.volume} л</Text>
            </View>

            <View style={styles.infoItem}>
              <Icon name="calendar" size={24} color={theme.colors.primary} />
              <Paragraph>Вік</Paragraph>
              <Text style={styles.infoValue}>{ageInDays} днів</Text>
            </View>
          </View>

          {aquarium.dimensions && (
            <View style={styles.dimensionsContainer}>
              <Paragraph>Розміри:</Paragraph>
              <Text style={styles.dimensionsText}>
                {aquarium.dimensions.length} × {aquarium.dimensions.width} ×{' '}
                {aquarium.dimensions.height} см
              </Text>
            </View>
          )}

          <Divider style={styles.divider} />

          <Paragraph>
            Запущено: {formatDateToLocal(new Date(aquarium.startDate))}
          </Paragraph>
        </Card.Content>
      </Card>
    );
  };

  // Рендер карточки з мешканцями
  const renderInhabitantsInfo = () => {
    const totalFish = inhabitants
      .filter(i => i.type === InhabitantType.FISH && i.isActive)
      .reduce((sum, i) => sum + i.quantity, 0);

    const totalInvertebrates = inhabitants
      .filter(i => i.type === InhabitantType.INVERTEBRATE && i.isActive)
      .reduce((sum, i) => sum + i.quantity, 0);

    const totalPlants = inhabitants
      .filter(i => i.type === InhabitantType.PLANT && i.isActive)
      .reduce((sum, i) => sum + i.quantity, 0);

    const totalInhabitants = totalFish + totalInvertebrates + totalPlants;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title>Мешканці</Title>
            <Text>{totalInhabitants} особин</Text>
          </View>

          {totalInhabitants > 0 ? (
            <>
              <View style={styles.chartContainer}>
                <PieChart
                  data={getInhabitantChartData()}
                  width={screenWidth - 64}
                  height={180}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>

              <List.Section>
                {totalFish > 0 && (
                  <List.Item
                    title="Риби"
                    description={`${totalFish} особин`}
                    left={props => (
                      <List.Icon {...props} icon="fish" color="#03A9F4" />
                    )}
                  />
                )}

                {totalInvertebrates > 0 && (
                  <List.Item
                    title="Безхребетні"
                    description={`${totalInvertebrates} особин`}
                    left={props => (
                      <List.Icon {...props} icon="shrimp" color="#FF9800" />
                    )}
                  />
                )}

                {totalPlants > 0 && (
                  <List.Item
                    title="Рослини"
                    description={`${totalPlants} одиниць`}
                    left={props => (
                      <List.Icon {...props} icon="flower" color="#4CAF50" />
                    )}
                  />
                )}
              </List.Section>

              <Button
                mode="outlined"
                onPress={() =>
                  navigation.navigate('InhabitantList', {
                    aquariumId: aquariumId,
                  })
                }>
                Усі мешканці
              </Button>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Немає активних мешканців</Text>
              <Button
                mode="contained"
                icon="plus"
                onPress={() =>
                  navigation.navigate('AddInhabitant', {aquariumId: aquariumId})
                }
                style={styles.addButton}>
                Додати мешканця
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  // Рендер карточки з подіями
  const renderEventsInfo = () => {
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
        custom: 'Інше',
      };
      return types[type] || type;
    };

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title>Останні події</Title>
            {stats && (
              <Text>
                {stats.totalEvents} подій за {stats.periodDays} днів
              </Text>
            )}
          </View>

          {recentEvents.length > 0 ? (
            <>
              {recentEvents.map(event => (
                <List.Item
                  key={event.id}
                  title={event.title}
                  description={`${getEventTypeText(
                    event.type,
                  )} • ${getRelativeTime(new Date(event.timestamp))}`}
                  left={props => {
                    let icon = 'calendar';

                    switch (event.type) {
                      case 'water.parameters':
                        icon = 'test-tube';
                        break;
                      case 'water.change':
                        icon = 'water';
                        break;
                      case 'feeding':
                        icon = 'food';
                        break;
                      case 'equipment.maintenance':
                        icon = 'tools';
                        break;
                      case 'inhabitant.added':
                        icon = 'fish';
                        break;
                      case 'inhabitant.removed':
                        icon = 'location-exit';
                        break;
                      case 'complex.maintenance':
                        icon = 'wrench';
                        break;
                    }

                    return (
                      <Avatar.Icon
                        {...props}
                        size={40}
                        icon={icon}
                        style={{backgroundColor: `${theme.colors.primary}40`}}
                        color={theme.colors.primary}
                      />
                    );
                  }}
                  onPress={() =>
                    navigation.navigate('EventDetails', {
                      id: event.id,
                      aquariumId: aquariumId,
                    })
                  }
                  style={styles.eventItem}
                />
              ))}

              <Button
                mode="outlined"
                onPress={() =>
                  navigation.navigate('EventList', {aquariumId: aquariumId})
                }>
                Усі події
              </Button>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Немає подій</Text>
              <Button
                mode="contained"
                icon="plus"
                onPress={() =>
                  navigation.navigate('EventForm', {aquariumId: aquariumId})
                }
                style={styles.addButton}>
                Додати подію
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  // Рендер карточки з загальною статистикою
  const renderStatistics = () => {
    if (!stats) return null;

    // Підрахунок кількості подій за типами для прогрес-бару
    const totalEvents = stats.totalEvents || 0;
    const waterChangeCount = stats.eventsByType?.['water.change'] || 0;
    const feedingCount = stats.eventsByType?.['feeding'] || 0;
    const parametersCount = stats.eventsByType?.['water.parameters'] || 0;
    const maintenanceCount = stats.eventsByType?.['equipment.maintenance'] || 0;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Статистика за {stats.periodDays} днів</Title>

          <View style={styles.statsRow}>
            <View style={styles.statsItem}>
              <Icon
                name="calendar-check"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.statsValue}>{totalEvents}</Text>
              <Paragraph>Подій</Paragraph>
            </View>

            <View style={styles.statsItem}>
              <Icon name="water" size={24} color={theme.colors.primary} />
              <Text style={styles.statsValue}>{waterChangeCount}</Text>
              <Paragraph>Підмін води</Paragraph>
            </View>

            <View style={styles.statsItem}>
              <Icon name="test-tube" size={24} color={theme.colors.primary} />
              <Text style={styles.statsValue}>{parametersCount}</Text>
              <Paragraph>Вимірювань</Paragraph>
            </View>
          </View>

          {/* Прогрес-бар розподілу подій */}
          {totalEvents > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressLegend}>
                <Text style={styles.progressLabel}>Розподіл подій</Text>
              </View>

              <View style={styles.progressBarContainer}>
                <ProgressBar
                  progress={waterChangeCount / totalEvents}
                  color="#03A9F4"
                  style={[
                    styles.progressPart,
                    {flex: waterChangeCount / totalEvents},
                  ]}
                />
                <ProgressBar
                  progress={feedingCount / totalEvents}
                  color="#4CAF50"
                  style={[
                    styles.progressPart,
                    {flex: feedingCount / totalEvents},
                  ]}
                />
                <ProgressBar
                  progress={parametersCount / totalEvents}
                  color="#FF9800"
                  style={[
                    styles.progressPart,
                    {flex: parametersCount / totalEvents},
                  ]}
                />
                <ProgressBar
                  progress={maintenanceCount / totalEvents}
                  color="#9C27B0"
                  style={[
                    styles.progressPart,
                    {flex: maintenanceCount / totalEvents},
                  ]}
                />
                <ProgressBar
                  progress={
                    (totalEvents -
                      waterChangeCount -
                      feedingCount -
                      parametersCount -
                      maintenanceCount) /
                    totalEvents
                  }
                  color="#757575"
                  style={[
                    styles.progressPart,
                    {
                      flex:
                        (totalEvents -
                          waterChangeCount -
                          feedingCount -
                          parametersCount -
                          maintenanceCount) /
                        totalEvents,
                    },
                  ]}
                />
              </View>

              <View style={styles.progressLegend}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.colorDot, {backgroundColor: '#03A9F4'}]}
                  />
                  <Text>Підміна води</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.colorDot, {backgroundColor: '#4CAF50'}]}
                  />
                  <Text>Годування</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.colorDot, {backgroundColor: '#FF9800'}]}
                  />
                  <Text>Параметри</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.colorDot, {backgroundColor: '#9C27B0'}]}
                  />
                  <Text>Обслуговування</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.colorDot, {backgroundColor: '#757575'}]}
                  />
                  <Text>Інше</Text>
                </View>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
        />
      }>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            mode="contained"
            onPress={loadData}
            style={styles.retryButton}>
            Спробувати знову
          </Button>
        </View>
      ) : (
        <>
          {renderAquariumInfo()}
          {renderStatistics()}
          {renderInhabitantsInfo()}
          {renderEventsInfo()}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  dimensionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dimensionsText: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    marginBottom: 12,
    color: '#757575',
  },
  addButton: {
    marginTop: 8,
  },
  eventItem: {
    paddingLeft: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  statsItem: {
    alignItems: 'center',
    flex: 1,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  progressLabel: {
    marginBottom: 4,
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressPart: {
    borderRadius: 0,
    height: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
});

export default StatisticsTab;
