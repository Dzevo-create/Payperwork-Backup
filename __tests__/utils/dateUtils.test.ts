/**
 * Date Utilities Tests
 * Tests date formatting and manipulation functions
 */

import { describe, it, expect } from '@jest/globals';

// Mock date utility functions
const dateUtils = {
  formatDate: (date: Date, format: string = 'YYYY-MM-DD'): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },

  isToday: (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  },

  isYesterday: (date: Date): boolean => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    );
  },

  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  differenceInDays: (date1: Date, date2: Date): number => {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date1.getTime() - date2.getTime()) / oneDay);
  },

  getRelativeTime: (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return dateUtils.formatDate(date, 'YYYY-MM-DD');
  },

  startOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  endOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  },

  isBetween: (date: Date, start: Date, end: Date): boolean => {
    return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
  },

  getDayName: (date: Date): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()] || '';
  },

  getMonthName: (date: Date): string => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[date.getMonth()] || '';
  },
};

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('should format date with default format', () => {
      const date = new Date('2024-10-18T12:30:45');
      const result = dateUtils.formatDate(date);
      expect(result).toBe('2024-10-18');
    });

    it('should format date with custom format', () => {
      const date = new Date('2024-10-18T12:30:45');
      const result = dateUtils.formatDate(date, 'YYYY-MM-DD HH:mm:ss');
      expect(result).toBe('2024-10-18 12:30:45');
    });

    it('should pad single digit months and days', () => {
      const date = new Date('2024-01-05T09:05:03');
      const result = dateUtils.formatDate(date, 'YYYY-MM-DD HH:mm:ss');
      expect(result).toBe('2024-01-05 09:05:03');
    });

    it('should handle different format patterns', () => {
      const date = new Date('2024-10-18T15:30:00');
      expect(dateUtils.formatDate(date, 'DD/MM/YYYY')).toBe('18/10/2024');
      expect(dateUtils.formatDate(date, 'MM-DD-YYYY')).toBe('10-18-2024');
      expect(dateUtils.formatDate(date, 'HH:mm')).toBe('15:30');
    });
  });

  describe('isToday', () => {
    it('should return true for current date', () => {
      const today = new Date();
      expect(dateUtils.isToday(today)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(dateUtils.isToday(yesterday)).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(dateUtils.isToday(tomorrow)).toBe(false);
    });

    it('should ignore time when checking', () => {
      const earlyMorning = new Date();
      earlyMorning.setHours(0, 0, 0, 0);
      const lateNight = new Date();
      lateNight.setHours(23, 59, 59, 999);

      expect(dateUtils.isToday(earlyMorning)).toBe(true);
      expect(dateUtils.isToday(lateNight)).toBe(true);
    });
  });

  describe('isYesterday', () => {
    it('should return true for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(dateUtils.isYesterday(yesterday)).toBe(true);
    });

    it('should return false for today', () => {
      const today = new Date();
      expect(dateUtils.isYesterday(today)).toBe(false);
    });

    it('should return false for two days ago', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      expect(dateUtils.isYesterday(twoDaysAgo)).toBe(false);
    });
  });

  describe('addDays', () => {
    it('should add days to date', () => {
      const date = new Date('2024-10-18');
      const result = dateUtils.addDays(date, 5);
      expect(result.getDate()).toBe(23);
    });

    it('should subtract days with negative number', () => {
      const date = new Date('2024-10-18');
      const result = dateUtils.addDays(date, -5);
      expect(result.getDate()).toBe(13);
    });

    it('should handle month rollover', () => {
      const date = new Date('2024-10-30');
      const result = dateUtils.addDays(date, 5);
      expect(result.getMonth()).toBe(10); // November (0-indexed)
      expect(result.getDate()).toBe(4);
    });

    it('should not mutate original date', () => {
      const date = new Date('2024-10-18');
      const originalDate = date.getDate();
      dateUtils.addDays(date, 5);
      expect(date.getDate()).toBe(originalDate);
    });
  });

  describe('differenceInDays', () => {
    it('should calculate difference in days', () => {
      const date1 = new Date('2024-10-20');
      const date2 = new Date('2024-10-15');
      const diff = dateUtils.differenceInDays(date1, date2);
      expect(diff).toBe(5);
    });

    it('should return negative for past dates', () => {
      const date1 = new Date('2024-10-15');
      const date2 = new Date('2024-10-20');
      const diff = dateUtils.differenceInDays(date1, date2);
      expect(diff).toBe(-5);
    });

    it('should return zero for same date', () => {
      const date = new Date('2024-10-18');
      const diff = dateUtils.differenceInDays(date, date);
      expect(diff).toBe(0);
    });
  });

  describe('getRelativeTime', () => {
    it('should return "just now" for recent dates', () => {
      const now = new Date();
      const result = dateUtils.getRelativeTime(now);
      expect(result).toBe('just now');
    });

    it('should return minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000);
      const result = dateUtils.getRelativeTime(date);
      expect(result).toBe('5 minutes ago');
    });

    it('should return hours ago', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const result = dateUtils.getRelativeTime(date);
      expect(result).toBe('3 hours ago');
    });

    it('should return days ago', () => {
      const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const result = dateUtils.getRelativeTime(date);
      expect(result).toBe('2 days ago');
    });

    it('should use singular for 1 unit', () => {
      const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
      expect(dateUtils.getRelativeTime(oneMinuteAgo)).toBe('1 minute ago');

      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
      expect(dateUtils.getRelativeTime(oneHourAgo)).toBe('1 hour ago');
    });
  });

  describe('startOfDay', () => {
    it('should set time to 00:00:00.000', () => {
      const date = new Date('2024-10-18T15:30:45.123');
      const result = dateUtils.startOfDay(date);

      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should not mutate original date', () => {
      const date = new Date('2024-10-18T15:30:45');
      const originalHours = date.getHours();
      dateUtils.startOfDay(date);
      expect(date.getHours()).toBe(originalHours);
    });
  });

  describe('endOfDay', () => {
    it('should set time to 23:59:59.999', () => {
      const date = new Date('2024-10-18T10:30:00');
      const result = dateUtils.endOfDay(date);

      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
  });

  describe('isBetween', () => {
    it('should return true for date within range', () => {
      const date = new Date('2024-10-18');
      const start = new Date('2024-10-15');
      const end = new Date('2024-10-20');

      expect(dateUtils.isBetween(date, start, end)).toBe(true);
    });

    it('should return false for date outside range', () => {
      const date = new Date('2024-10-25');
      const start = new Date('2024-10-15');
      const end = new Date('2024-10-20');

      expect(dateUtils.isBetween(date, start, end)).toBe(false);
    });

    it('should include boundary dates', () => {
      const start = new Date('2024-10-15');
      const end = new Date('2024-10-20');

      expect(dateUtils.isBetween(start, start, end)).toBe(true);
      expect(dateUtils.isBetween(end, start, end)).toBe(true);
    });
  });

  describe('getDayName', () => {
    it('should return correct day names', () => {
      expect(dateUtils.getDayName(new Date('2024-10-13'))).toBe('Sunday');
      expect(dateUtils.getDayName(new Date('2024-10-14'))).toBe('Monday');
      expect(dateUtils.getDayName(new Date('2024-10-18'))).toBe('Friday');
    });
  });

  describe('getMonthName', () => {
    it('should return correct month names', () => {
      expect(dateUtils.getMonthName(new Date('2024-01-01'))).toBe('January');
      expect(dateUtils.getMonthName(new Date('2024-06-15'))).toBe('June');
      expect(dateUtils.getMonthName(new Date('2024-12-31'))).toBe('December');
    });
  });
});
