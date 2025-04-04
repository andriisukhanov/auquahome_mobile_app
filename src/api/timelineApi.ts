// api/timelineApi.ts
import apiClient, {offlineSafeRequest} from './client';

// Інтерфейси
export interface TimelineEvent {
  id: string;
  aquariumId: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  status: string;
  media?: {
    id: string;
    url: string;
    type: string;
    caption?: string;
  }[];
  waterParameters?: Record<string, number>;
  parameters?: Record<string, any>;
}

export interface TimelineFilters {
  types?: string[];
  startDate?: string;
  endDate?: string;
  limit?: number;
  skip?: number;
}

export interface TimelineStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  mediaCount: number;
  periodDays: number;
}

// Функція для отримання часової шкали подій
export const getTimeline = async (
  aquariumId: string,
  filters: TimelineFilters = {},
): Promise<TimelineEvent[]> => {
  try {
    let url = `/timeline/aquarium/${aquariumId}?`;

    // Додаємо фільтри до URL
    if (filters.types && filters.types.length > 0) {
      filters.types.forEach(type => {
        url += `&types=${type}`;
      });
    }

    if (filters.startDate) {
      url += `&startDate=${filters.startDate}`;
    }

    if (filters.endDate) {
      url += `&endDate=${filters.endDate}`;
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

// Функція для отримання статистики часової шкали
export const getTimelineStats = async (
  aquariumId: string,
  days: number = 30,
): Promise<TimelineStats> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'GET',
        url: `/timeline/aquarium/${aquariumId}/stats?days=${days}`,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для отримання часової шкали для галереї
export const getMediaTimeline = async (
  aquariumId: string,
  limit: number = 20,
  skip: number = 0,
): Promise<
  {date: string; media: {id: string; url: string; caption?: string}[]}[]
> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'GET',
        url: `/timeline/aquarium/${aquariumId}/gallery?limit=${limit}&skip=${skip}`,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Функція для отримання галереї за датою
export const getMediaByDate = async (
  aquariumId: string,
  date: string,
): Promise<
  {id: string; url: string; caption?: string; timestamp: string}[]
> => {
  try {
    const response = await offlineSafeRequest(
      {
        method: 'GET',
        url: `/timeline/aquarium/${aquariumId}/gallery/date/${date}`,
      },
      true, // Офлайн-безпечний запит
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};
