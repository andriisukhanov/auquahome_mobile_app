// api/eventApi.ts
import apiClient, {offlineSafeRequest} from './client';

// Типи подій
export enum EventType {
  WATER_PARAMETERS = 'water.parameters',
  WATER_CHANGE = 'water.change',
  FEEDING = 'feeding',
  EQUIPMENT_MAINTENANCE = 'equipment.maintenance',
  INHABITANT_ADDED = 'inhabitant.added',
  INHABITANT_REMOVED = 'inhabitant.removed',
  PLANT_TRIMMED = 'plant.trimmed',
  OBSERVATION = 'observation',
  ISSUE_DETECTED = 'issue.detected',
  ISSUE_RESOLVED = 'issue.resolved',
  COMPLEX_MAINTENANCE = 'complex.maintenance',
  MEDIA_ADDED = 'media.added',
  CUSTOM = 'custom',
}

// Статуси подій
export enum EventStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Інтерфейси
export interface Event {
  id: string;
  aquariumId: string;
  type: EventType;
  title: string;
  description?: string;
  timestamp: string;
  status: EventStatus;
  isPlanned: boolean;
  plannedFor?: string;
  mediaUrls?: string[];
  parameters?: Record<string, any>;
  linkedEvents?: string[];
  parentEventId?: string;
  correlationId?: string;
  sequence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventDto {
  aquariumId: string;
  type: EventType;
  title: string;
  description?: string;
  timestamp?: string;
  status?: EventStatus;
  isPlanned?: boolean;
  plannedFor?: string;
  mediaUrls?: string[];
  parameters?: Record<string, any>;
  linkedEvents?: string[];
  parentEventId?: string;
  correlationId?: string;
  sequence?: number;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  timestamp?: string;
  status?: EventStatus;
  plannedFor?: string;
  mediaUrls?: string[];
  parameters?: Record<string, any>;
  linkedEvents?: string[];
}

export interface ComplexEventDto {
  parentEvent: CreateEventDto;
  childEvents: CreateEventDto[];
}

export interface EventFilters {
  type?: EventType | EventType[];
  status?: EventStatus | EventStatus[];
  startDate?: string;
  endDate?: string;
  planned?: boolean;
  limit?: number;
  skip?: number;
}

// Функція для отримання всіх подій для акваріуму
export const getEvents = async (
  aquariumId: string,
  filters: EventFilters = {},
): Promise<Event[]> => {
  try {
    let url = `/events/aquarium/${aquariumId}?`;

    // Додаємо фільтри до URL
    if (filters.type) {
      if (Array.isArray(filters.type)) {
        filters.type.forEach(type => {
          url += `&type=${type}`;
        });
      } else {
        url += `&type=${filters.type}`;
      }
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        filters.status.forEach(status => {
          url += `&status=${status}`;
        });
      } else {
        url += `&status=${filters.status}`;
      }
    }

    if (filters.startDate) {
      url += `&startDate=${filters.startDate}`;
    }

    if (filters.endDate) {
      url += `&endDate=${filters.endDate}`;
    }

    if (filters.planned !== undefined) {
      url += `&planned=${filters.planned}`;
    }

    if (filters.limit) {
      url += `&limit=${filters.limit}`;
    }

    if (filters.skip) {
      url += `&skip=${filters.skip}`;
    }

    const response = await offlineSafeRequest(
      {
        method: 'GET',
        url,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для отримання останніх подій для акваріуму
export const getRecentEvents = async (
  aquariumId: string,
  limit: number = 5,
): Promise<Event[]> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'GET',
        url: `/events/aquarium/${aquariumId}?limit=${limit}`,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для отримання події за ID
export const getEventById = async (id: string): Promise<Event> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'GET',
        url: `/events/${id}`,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для створення події
export const createEvent = async (data: CreateEventDto): Promise<Event> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'POST',
        url: '/events',
        data,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для створення комплексної події
export const createComplexEvent = async (
  data: ComplexEventDto,
): Promise<Event[]> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'POST',
        url: '/events/complex',
        data,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для оновлення події
export const updateEvent = async (
  id: string,
  data: UpdateEventDto,
): Promise<Event> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'PUT',
        url: `/events/${id}`,
        data,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для оновлення статусу події
export const updateEventStatus = async (
  id: string,
  status: EventStatus,
): Promise<Event> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'PUT',
        url: `/events/${id}/status`,
        data: {status},
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для видалення події
export const deleteEvent = async (id: string): Promise<{success: boolean}> => {
  try {
    await offlineSafeRequest(
      {
        method: 'DELETE',
        url: `/events/${id}`,
      },
      true, // Офлайн-безпечний запит
    );

    return {success: true};
  } catch (error) {
    throw error;
  }
};

// Функція для отримання комплексної події
export const getComplexEvent = async (
  id: string,
): Promise<{
  parent: Event;
  children: Event[];
}> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'GET',
        url: `/events/${id}/complex`,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для завантаження фото для події
export const uploadEventPhoto = async (
  eventId: string,
  photoUri: string,
  name: string,
  type: string,
): Promise<{url: string}> => {
  try {
    // Створюємо FormData для відправки файлу
    const formData = new FormData();
    formData.append('file', {
      uri: photoUri,
      name,
      type,
    } as any);

    const response = await apiClient.post(
      `/events/${eventId}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};
