// api/aquariumApi.ts
import apiClient, {offlineSafeRequest} from './client';

// Інтерфейси
export interface Aquarium {
  id: string;
  name: string;
  type: string;
  volume: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  startDate: string;
  isActive: boolean;
  isPublic: boolean;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

export interface CreateAquariumDto {
  name: string;
  type: string;
  volume: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  startDate?: string;
  isActive?: boolean;
  isPublic?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateAquariumDto {
  name?: string;
  type?: string;
  volume?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  isActive?: boolean;
  isPublic?: boolean;
  metadata?: Record<string, any>;
}

// Функція для отримання всіх акваріумів користувача
export const fetchAquariums = async (): Promise<Aquarium[]> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'GET',
        url: '/aquariums',
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для отримання акваріуму за ID
export const getAquariumById = async (id: string): Promise<Aquarium> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'GET',
        url: `/aquariums/${id}`,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для створення нового акваріуму
export const createAquarium = async (
  data: CreateAquariumDto,
): Promise<Aquarium> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'POST',
        url: '/aquariums',
        data,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для оновлення акваріуму
export const updateAquarium = async (
  id: string,
  data: UpdateAquariumDto,
): Promise<Aquarium> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'PUT',
        url: `/aquariums/${id}`,
        data,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для деактивації акваріуму
export const deactivateAquarium = async (
  id: string,
): Promise<{success: boolean}> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'DELETE',
        url: `/aquariums/${id}`,
      },
      true, // Офлайн-безпечний запит
    );

    return {success: true};
  } catch (error) {
    throw error;
  }
};

// Функція для отримання публічних акваріумів
export const getPublicAquariums = async (
  limit: number = 10,
  skip: number = 0,
): Promise<Aquarium[]> => {
  try {
    const response = await apiClient.get(
      `/aquariums/public?limit=${limit}&skip=${skip}`,
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};
