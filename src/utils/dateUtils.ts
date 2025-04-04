// utils/dateUtils.ts
import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  isThisYear,
} from 'date-fns';
import {uk} from 'date-fns/locale';

// Форматування дати в локальний формат
export const formatDateToLocal = (date: Date): string => {
  if (isToday(date)) {
    return `Сьогодні, ${format(date, 'HH:mm', {locale: uk})}`;
  } else if (isYesterday(date)) {
    return `Вчора, ${format(date, 'HH:mm', {locale: uk})}`;
  } else if (isThisWeek(date)) {
    return format(date, 'EEEE, HH:mm', {locale: uk});
  } else if (isThisYear(date)) {
    return format(date, 'd MMMM, HH:mm', {locale: uk});
  } else {
    return format(date, 'd MMMM yyyy, HH:mm', {locale: uk});
  }
};

// Отримати короткий формат дати
export const getShortDate = (date: Date): string => {
  return format(date, 'dd.MM.yyyy', {locale: uk});
};

// Отримати повний формат дати і часу
export const getFullDateTime = (date: Date): string => {
  return format(date, 'PPpp', {locale: uk});
};

// Форматування дати для графіків
export const formatDateForChart = (date: Date): string => {
  return format(date, 'dd.MM', {locale: uk});
};

// Форматування лише часу
export const formatTimeOnly = (date: Date): string => {
  return format(date, 'HH:mm', {locale: uk});
};

// Отримати назву дня тижня
export const getDayOfWeek = (date: Date): string => {
  return format(date, 'EEEE', {locale: uk});
};

// Отримати назву місяця
export const getMonthName = (date: Date): string => {
  return format(date, 'LLLL', {locale: uk});
};

// Перевірити, чи дата в минулому
export const isPastDate = (date: Date): boolean => {
  return date < new Date();
};

// Перевірити, чи дата в майбутньому
export const isFutureDate = (date: Date): boolean => {
  return date > new Date();
};

// Отримати відносний час (наприклад, "5 хвилин тому")
export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'щойно';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${pluralize(
      minutes,
      'хвилина',
      'хвилини',
      'хвилин',
    )} тому`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${pluralize(hours, 'година', 'години', 'годин')} тому`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${pluralize(days, 'день', 'дні', 'днів')} тому`;
  } else {
    return getShortDate(date);
  }
};

// Допоміжна функція для правильного відмінювання слів
function pluralize(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  if (count % 10 === 1 && count % 100 !== 11) {
    return one;
  } else if (
    [2, 3, 4].includes(count % 10) &&
    ![12, 13, 14].includes(count % 100)
  ) {
    return few;
  } else {
    return many;
  }
}
