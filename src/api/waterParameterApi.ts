// api/waterParameterApi.ts
import apiClient, {offlineSafeRequest} from './client';

// Інтерфейси
export interface WaterParameter {
  id?: string;
  aquariumId: string;
  userId?: string;
  timestamp: string;
  temperature?: number;
  pH?: number;
  ammonia?: number;
  nitrite?: number;
  nitrate?: number;
  phosphate?: number;
  kh?: number;
  gh?: number;
  tds?: number;
  oxygenLevel?: number;
  co2Level?: number;
  additionalParameters?: Record<string, number>;
  notes?: string;
  eventId?: string;
}

export interface CreateWaterParameterDto {
  aquariumId: string;
  timestamp?: string;
  temperature?: number;
  pH?: number;
  ammonia?: number;
  nitrite?: number;
  nitrate?: number;
  phosphate?: number;
  kh?: number;
  gh?: number;
  tds?: number;
  oxygenLevel?: number;
  co2Level?: number;
  additionalParameters?: Record<string, number>;
  notes?: string;
}

export interface UpdateWaterParameterDto {
  temperature?: number;
  pH?: number;
  ammonia?: number;
  nitrite?: number;
  nitrate?: number;
  phosphate?: number;
  kh?: number;
  gh?: number;
  tds?: number;
  oxygenLevel?: number;
  co2Level?: number;
  additionalParameters?: Record<string, number>;
  notes?: string;
}

// Функція для отримання останніх параметрів води для акваріума
export const getLatestParameters = async (
  aquariumId: string,
): Promise<WaterParameter> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'GET',
        url: `/water-parameters/aquarium/${aquariumId}/latest`,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для отримання історії параметра води
export const getParameterHistory = async (
  aquariumId: string,
  parameter: string,
  days: number = 30,
): Promise<Array<{date: Date; value: number}>> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'GET',
        url: `/water-parameters/aquarium/${aquariumId}/history/${parameter}?days=${days}`,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для отримання всіх параметрів води для акваріума
export const getWaterParameters = async (
  aquariumId: string,
  limit: number = 10,
): Promise<WaterParameter[]> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'GET',
        url: `/water-parameters/aquarium/${aquariumId}?limit=${limit}`,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для створення нового запису параметрів води
export const createWaterParameter = async (
  data: CreateWaterParameterDto,
): Promise<WaterParameter> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'POST',
        url: '/water-parameters',
        data,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для оновлення параметрів води
export const updateWaterParameter = async (
  id: string,
  data: UpdateWaterParameterDto,
): Promise<WaterParameter> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'PUT',
        url: `/water-parameters/${id}`,
        data,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для видалення запису параметрів води
export const deleteWaterParameter = async (
  id: string,
): Promise<{success: boolean}> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'DELETE',
        url: `/water-parameters/${id}`,
      },
      true, // Офлайн-безпечний запит
    );

    return {success: true};
  } catch (error) {
    throw error;
  }
};
