import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Chip,
  IconButton,
  Button,
  Divider,
  List,
  Avatar,
  Badge,
  FAB,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {getInhabitants, Inhabitant} from '../../api/inhabitantApi';
import {formatDateToLocal} from '../../utils/dateUtils';
import EmptyState from '../common/EmptyState';

interface InhabitantsTabProps {
  aquariumId: string;
}

const InhabitantsTab: React.FC<InhabitantsTabProps> = ({aquariumId}) => {
  const [inhabitants, setInhabitants] = useState<Inhabitant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const theme = useTheme();
  const navigation = useNavigation();

  // Завантаження мешканців
  useEffect(() => {
    loadInhabitants();
  }, [aquariumId]);

  const loadInhabitants = async () => {
    try {
      setError('');
      const data = await getInhabitants(aquariumId);
      setInhabitants(data);
    } catch (err: any) {
      setError('Помилка завантаження мешканців. Спробуйте знову пізніше.');
      console.error('Error fetching inhabitants:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Оновлення списку при свайпі вниз
  const onRefresh = () => {
    setRefreshing(true);
    loadInhabitants();
  };

  // Переклад типу мешканця
  const getInhabitantTypeText = (type: string) => {
    const types: Record<string, string> = {
      fish: 'Риба',
      invertebrate: 'Безхребетні',
      plant: 'Рослина',
    };
    return types[type] || type;
  };

  // Фільтрація мешканців за типом
  const getFilteredInhabitants = () => {
    if (!activeFilter) return inhabitants;
    return inhabitants.filter(item => item.type === activeFilter);
  };

  // Отримання ікони для типу мешканця
  const getInhabitantIcon = (type: string) => {
    const icons: Record<string, string> = {
      fish: 'fish',
      invertebrate: 'shrimp',
      plant: 'flower',
    };
    return icons[type] || 'help-circle';
  };

  // Компонент для відображення фільтрів
  const renderFilters = () => {
    const filterOptions = [
      {key: 'fish', label: 'Риби'},
      {key: 'invertebrate', label: 'Безхребетні'},
      {key: 'plant', label: 'Рослини'},
    ];

    return (
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            mode={activeFilter === null ? 'flat' : 'outlined'}
            selected={activeFilter === null}
            onPress={() => setActiveFilter(null)}
            style={styles.filterChip}>
            Всі ({inhabitants.length})
          </Chip>

          {filterOptions.map(option => {
            const count = inhabitants.filter(
              item => item.type === option.key,
            ).length;

            return (
              <Chip
                key={option.key}
                mode={activeFilter === option.key ? 'flat' : 'outlined'}
                selected={activeFilter === option.key}
                onPress={() => setActiveFilter(option.key)}
                style={styles.filterChip}
                icon={getInhabitantIcon(option.key)}>
                {option.label} ({count})
              </Chip>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Компонент для відображення картки мешканця
  const renderInhabitantItem = ({item}: {item: Inhabitant}) => (
    <Card
      style={styles.card}
      onPress={() =>
        navigation.navigate('InhabitantDetails', {
          id: item.id,
          aquariumId: aquariumId,
        })
      }>
      <Card.Content style={styles.cardContent}>
        <View style={styles.inhabitantAvatarContainer}>
          <Avatar.Icon
            size={50}
            icon={getInhabitantIcon(item.type)}
            style={{
              backgroundColor:
                item.type === 'fish'
                  ? '#03A9F4'
                  : item.type === 'invertebrate'
                  ? '#FF9800'
                  : '#4CAF50',
            }}
          />
          {!item.isActive && (
            <Badge
              style={styles.statusBadge}
              size={14}
              theme={{colors: {error: theme.colors.error}}}
            />
          )}
        </View>

        <View style={styles.inhabitantInfo}>
          <View style={styles.inhabitantHeader}>
            <Title style={styles.title}>{item.species}</Title>
            <Chip
              mode="outlined"
              style={styles.typeChip}
              textStyle={styles.typeChipText}>
              {getInhabitantTypeText(item.type)}
            </Chip>
          </View>

          <View style={styles.detailsRow}>
            <Text>
              Кількість: <Text style={styles.detailText}>{item.quantity}</Text>
            </Text>

            <Text>
              Додано:{' '}
              <Text style={styles.detailText}>
                {formatDateToLocal(new Date(item.addedAt))}
              </Text>
            </Text>
          </View>

          {!item.isActive && (
            <View style={styles.inactiveContainer}>
              <Text style={styles.inactiveText}>Неактивний</Text>
              {item.removedAt && (
                <Text style={styles.removedText}>
                  Видалено: {formatDateToLocal(new Date(item.removedAt))}
                </Text>
              )}
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  // Компонент для відображення порожнього стану
  const renderEmptyComponent = () => {
    if (loading) return null;

    return (
      <EmptyState
        icon={activeFilter || 'fish'}
        title={
          activeFilter
            ? `Немає ${
                activeFilter === 'fish'
                  ? 'риб'
                  : activeFilter === 'invertebrate'
                  ? 'безхребетних'
                  : 'рослин'
              }`
            : 'Немає мешканців'
        }
        description={
          activeFilter
            ? `Додайте ${
                activeFilter === 'fish'
                  ? 'рибу'
                  : activeFilter === 'invertebrate'
                  ? 'безхребетних'
                  : 'рослину'
              } до свого акваріума`
            : 'Почніть з додавання мешканців до вашого акваріума'
        }
        buttonText={`Додати ${
          activeFilter === 'fish'
            ? 'рибу'
            : activeFilter === 'invertebrate'
            ? 'безхребетних'
            : activeFilter === 'plant'
            ? 'рослину'
            : 'мешканця'
        }`}
        onButtonPress={() =>
          navigation.navigate('AddInhabitant', {
            aquariumId: aquariumId,
            initialType: activeFilter,
          })
        }
      />
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
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            mode="contained"
            onPress={loadInhabitants}
            style={styles.retryButton}>
            Спробувати знову
          </Button>
        </View>
      ) : (
        <>
          {renderFilters()}

          <FlatList
            data={getFilteredInhabitants()}
            renderItem={renderInhabitantItem}
            keyExtractor={item => item.id}
            contentContainerStyle={
              getFilteredInhabitants().length === 0
                ? styles.emptyList
                : styles.list
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
              />
            }
            ListEmptyComponent={renderEmptyComponent}
          />

          <FAB
            style={[styles.fab, {backgroundColor: theme.colors.primary}]}
            icon="plus"
            onPress={() =>
              navigation.navigate('AddInhabitant', {
                aquariumId: aquariumId,
                initialType: activeFilter,
              })
            }
            label={`Додати ${
              activeFilter === 'fish'
                ? 'рибу'
                : activeFilter === 'invertebrate'
                ? 'безхребетних'
                : activeFilter === 'plant'
                ? 'рослину'
                : 'мешканця'
            }`}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  list: {
    padding: 12,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  filtersContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterChip: {
    marginRight: 8,
    marginVertical: 4,
  },
  card: {
    marginBottom: 10,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inhabitantAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  statusBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: 'tomato',
  },
  inhabitantInfo: {
    flex: 1,
  },
  inhabitantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    flex: 1,
    marginRight: 8,
  },
  typeChip: {
    height: 24,
  },
  typeChipText: {
    fontSize: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  detailText: {
    fontWeight: 'bold',
  },
  inactiveContainer: {
    marginTop: 8,
    padding: 4,
    backgroundColor: '#FFEBEE',
    borderRadius: 4,
  },
  inactiveText: {
    color: 'tomato',
    fontWeight: 'bold',
  },
  removedText: {
    fontSize: 12,
    color: '#B71C1C',
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default InhabitantsTab;
