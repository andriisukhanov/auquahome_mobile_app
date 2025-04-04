// api/inhabitantApi.ts
import apiClient, {offlineSafeRequest} from './client';

// Типи мешканців
export enum InhabitantType {
  FISH = 'fish',
  INVERTEBRATE = 'invertebrate',
  PLANT = 'plant',
}

// Інтерфейси
export interface Inhabitant {
  id: string;
  aquariumId: string;
  userId: string;
  type: InhabitantType;
  species: string;
  quantity: number;
  addedAt: string;
  removedAt?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface CreateInhabitantDto {
  aquariumId: string;
  type: InhabitantType;
  species: string;
  quantity: number;
  addedAt?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateInhabitantDto {
  aquariumId?: string;
  type?: InhabitantType;
  species?: string;
  quantity?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface DeactivateInhabitantDto {
  reason?: string;
}

// Функція для отримання всіх мешканців для акваріума
export const getInhabitants = async (
  aquariumId: string,
): Promise<Inhabitant[]> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'GET',
        url: `/inhabitants/aquarium/${aquariumId}`,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для отримання мешканця за ID
export const getInhabitantById = async (id: string): Promise<Inhabitant> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'GET',
        url: `/inhabitants/${id}`,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для створення нового мешканця
export const createInhabitant = async (
  data: CreateInhabitantDto,
): Promise<Inhabitant> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'POST',
        url: '/inhabitants',
        data,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для оновлення мешканця
export const updateInhabitant = async (
  id: string,
  data: UpdateInhabitantDto,
): Promise<Inhabitant> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'PUT',
        url: `/inhabitants/${id}`,
        data,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для деактивації мешканця
export const deactivateInhabitant = async (
  id: string,
  reason?: string,
): Promise<Inhabitant> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'DELETE',
        url: `/inhabitants/${id}`,
        data: {reason},
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для переміщення мешканця в інший акваріум
export const moveInhabitant = async (
  id: string,
  targetAquariumId: string,
  quantity?: number,
): Promise<Inhabitant> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'POST',
        url: `/inhabitants/${id}/move`,
        data: {
          targetAquariumId,
          quantity,
        },
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для позначення загибелі мешканця
export const markInhabitantDeath = async (
  id: string,
  quantity: number,
  reason?: string,
): Promise<Inhabitant> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'POST',
        url: `/inhabitants/${id}/death`,
        data: {
          quantity,
          reason,
        },
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для позначення розмноження мешканця
export const breedInhabitant = async (
  id: string,
  newQuantity: number,
  notes?: string,
): Promise<Inhabitant> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'POST',
        url: `/inhabitants/${id}/breed`,
        data: {
          newQuantity,
          notes,
        },
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};
