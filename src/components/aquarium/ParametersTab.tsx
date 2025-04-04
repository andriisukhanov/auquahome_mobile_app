import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Chip,
  Button,
  useTheme,
  Divider,
  List,
  IconButton,
  SegmentedButtons,
} from 'react-native-paper';
import {LineChart} from 'react-native-chart-kit';
import {
  getParameterHistory,
  getLatestParameters,
  WaterParameter,
} from '../../api/waterParameterApi';
import {formatDateToLocal} from '../../utils/dateUtils';
import {useIsFocused} from '@react-navigation/native';

interface ParametersTabProps {
  aquariumId: string;
}

const ParametersTab: React.FC<ParametersTabProps> = ({aquariumId}) => {
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const isFocused = useIsFocused();

  const [latestParameters, setLatestParameters] =
    useState<WaterParameter | null>(null);
  const [historicalData, setHistoricalData] = useState<
    Array<{date: Date; value: number}>
  >([]);
  const [selectedParameter, setSelectedParameter] =
    useState<string>('temperature');
  const [period, setPeriod] = useState<string>('30');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Об'єкт для відображення назв параметрів українською
  const parameterLabels: Record<string, string> = {
    temperature: 'Температура (°C)',
    pH: 'pH',
    ammonia: 'Аміак (NH₃/NH₄⁺, ppm)',
    nitrite: 'Нітрити (NO₂⁻, ppm)',
    nitrate: 'Нітрати (NO₃⁻, ppm)',
    phosphate: 'Фосфати (PO₄³⁻, ppm)',
    kh: 'Карбонатна жорсткість (KH, dKH)',
    gh: 'Загальна жорсткість (GH, dGH)',
    tds: 'Розчинені речовини (TDS, ppm)',
    oxygenLevel: 'Кисень (mg/l)',
    co2Level: 'CO₂ (ppm)',
  };

  // Відповідні одиниці вимірювання для кожного параметра
  const parameterUnits: Record<string, string> = {
    temperature: '°C',
    pH: '',
    ammonia: 'ppm',
    nitrite: 'ppm',
    nitrate: 'ppm',
    phosphate: 'ppm',
    kh: 'dKH',
    gh: 'dGH',
    tds: 'ppm',
    oxygenLevel: 'mg/l',
    co2Level: 'ppm',
  };

  // Об'єкт для нормальних діапазонів значень параметрів
  const parameterRanges: Record<string, {min: number; max: number}> = {
    temperature: {min: 22, max: 28},
    pH: {min: 6.5, max: 7.5},
    ammonia: {min: 0, max: 0.25},
    nitrite: {min: 0, max: 0.1},
    nitrate: {min: 0, max: 20},
    phosphate: {min: 0, max: 1},
    kh: {min: 3, max: 8},
    gh: {min: 4, max: 12},
    tds: {min: 150, max: 350},
    oxygenLevel: {min: 5, max: 10},
    co2Level: {min: 15, max: 30},
  };

  // Завантаження останніх параметрів та історичних даних
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        // Отримання останніх параметрів
        const latest = await getLatestParameters(aquariumId);
        setLatestParameters(latest);

        // Отримання історичних даних для вибраного параметра
        const history = await getParameterHistory(
          aquariumId,
          selectedParameter,
          parseInt(period),
        );
        setHistoricalData(history);
      } catch (err: any) {
        setError(
          'Помилка завантаження параметрів води. Будь ласка, спробуйте пізніше.',
        );
        console.error('Error loading water parameters:', err);
      } finally {
        setLoading(false);
      }
    };

    if (aquariumId && isFocused) {
      loadData();
    }
  }, [aquariumId, selectedParameter, period, isFocused]);

  // Перевірка значення параметра на відповідність нормальному діапазону
  const checkParameterValue = (
    parameter: string,
    value: number | undefined,
  ): 'normal' | 'warning' | 'danger' => {
    if (value === undefined) return 'normal';

    const range = parameterRanges[parameter];
    if (!range) return 'normal';

    if (value < range.min * 0.8 || value > range.max * 1.2) {
      return 'danger';
    } else if (value < range.min || value > range.max) {
      return 'warning';
    }
    return 'normal';
  };

  // Отримання кольору для параметра на основі його значення
  const getParameterColor = (status: 'normal' | 'warning' | 'danger') => {
    switch (status) {
      case 'danger':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      case 'normal':
      default:
        return '#4CAF50';
    }
  };

  // Форматування даних для графіка
  const chartData = {
    labels: historicalData.map(item => {
      const date = new Date(item.date);
      return `${date.getDate()}.${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: historicalData.map(item => item.value),
        color: () => theme.colors.primary,
        strokeWidth: 2,
      },
    ],
  };

  // Конфігурація для графіка
  const chartConfig = {
    backgroundGradientFrom: theme.colors.background,
    backgroundGradientTo: theme.colors.background,
    decimalPlaces: selectedParameter === 'pH' ? 1 : 0,
    color: () => theme.colors.primary,
    labelColor: () => theme.colors.onSurface,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '1',
      stroke: theme.colors.primary,
    },
  };

  // Рендер останніх параметрів води
  const renderLatestParameters = () => {
    if (!latestParameters) {
      return (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text>Немає даних про параметри води</Text>
            <Button
              mode="contained"
              onPress={() => {
                // Навігація на екран додавання параметрів води
              }}
              style={styles.button}>
              Додати параметри
            </Button>
          </Card.Content>
        </Card>
      );
    }

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title>Останні вимірювання</Title>
            <Text>
              {formatDateToLocal(new Date(latestParameters.timestamp))}
            </Text>
          </View>

          <View style={styles.parameterGrid}>
            {Object.keys(parameterLabels).map(param => {
              if (param in latestParameters) {
                const value = latestParameters[
                  param as keyof WaterParameter
                ] as number | undefined;

                if (value !== undefined && value !== null) {
                  const status = checkParameterValue(param, value);
                  const color = getParameterColor(status);

                  return (
                    <TouchableOpacity
                      key={param}
                      style={styles.parameterItem}
                      onPress={() => setSelectedParameter(param)}>
                      <View
                        style={[
                          styles.parameterBox,
                          {
                            borderColor:
                              selectedParameter === param
                                ? theme.colors.primary
                                : theme.colors.surface,
                            backgroundColor:
                              selectedParameter === param
                                ? `${theme.colors.primary}20`
                                : theme.colors.surface,
                          },
                        ]}>
                        <Text style={styles.parameterValue}>
                          {typeof value === 'number'
                            ? value.toFixed(
                                param === 'pH' ||
                                  param === 'ammonia' ||
                                  param === 'nitrite'
                                  ? 1
                                  : 0,
                              )
                            : '-'}
                          {parameterUnits[param]}
                        </Text>
                        <Text
                          style={[
                            styles.parameterName,
                            {color: theme.colors.onSurface},
                          ]}>
                          {parameterLabels[param]}
                        </Text>
                        <View
                          style={[
                            styles.statusIndicator,
                            {backgroundColor: color},
                          ]}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                }
              }
              return null;
            })}
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Рендер графіка
  const renderChart = () => {
    if (historicalData.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text>Немає даних для відображення графіка</Text>
          </Card.Content>
        </Card>
      );
    }

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>
            {parameterLabels[selectedParameter]} за останні {period} днів
          </Title>

          <View style={styles.periodButtons}>
            <SegmentedButtons
              value={period}
              onValueChange={setPeriod}
              buttons={[
                {value: '7', label: '7 днів'},
                {value: '30', label: '30 днів'},
                {value: '90', label: '90 днів'},
              ]}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={chartData}
              width={Math.max(screenWidth - 40, chartData.labels.length * 60)}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </ScrollView>

          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  {backgroundColor: theme.colors.primary},
                ]}
              />
              <Text>{parameterLabels[selectedParameter]}</Text>
            </View>
            {selectedParameter in parameterRanges && (
              <>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendColor,
                      {backgroundColor: getParameterColor('normal')},
                    ]}
                  />
                  <Text>Нормальний діапазон</Text>
                </View>
                <Text style={styles.rangeText}>
                  {parameterRanges[selectedParameter].min} -{' '}
                  {parameterRanges[selectedParameter].max}{' '}
                  {parameterUnits[selectedParameter]}
                </Text>
              </>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading && !latestParameters) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {error ? (
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
          </Card.Content>
        </Card>
      ) : (
        <>
          {renderLatestParameters()}
          {renderChart()}

          <Button
            mode="contained"
            icon="plus"
            onPress={() => {
              // Навігація до екрану додавання вимірювань параметрів води
            }}
            style={styles.addButton}>
            Додати нові вимірювання
          </Button>
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
    padding: 16,
  },
  errorCard: {
    marginBottom: 16,
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    color: '#B71C1C',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  emptyCard: {
    marginBottom: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginTop: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  parameterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  parameterItem: {
    width: '48%',
    marginBottom: 8,
  },
  parameterBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  parameterValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  parameterName: {
    fontSize: 12,
  },
  statusIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderBottomLeftRadius: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  periodButtons: {
    marginVertical: 16,
  },
  chartLegend: {
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  rangeText: {
    marginLeft: 20,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  addButton: {
    marginBottom: 24,
  },
});

export default ParametersTab;
