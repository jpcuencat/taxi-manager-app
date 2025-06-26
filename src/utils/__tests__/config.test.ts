// Mock global __DEV__ variable
(global as any).__DEV__ = true;

import { CONFIG } from '../config';

describe('Config', () => {
  describe('Configuration Constants', () => {
    it('should have API_BASE_URL defined', () => {
      expect(CONFIG.API_BASE_URL).toBeDefined();
      expect(typeof CONFIG.API_BASE_URL).toBe('string');
    });

    it('should have TIMEOUT defined as number', () => {
      expect(CONFIG.TIMEOUT).toBeDefined();
      expect(typeof CONFIG.TIMEOUT).toBe('number');
      expect(CONFIG.TIMEOUT).toBeGreaterThan(0);
    });

    it('should have DEBUG_MODE defined as boolean', () => {
      expect(CONFIG.DEBUG_MODE).toBeDefined();
      expect(typeof CONFIG.DEBUG_MODE).toBe('boolean');
    });
  });

  describe('Storage Keys', () => {
    it('should have all required storage keys', () => {
      expect(CONFIG.STORAGE_KEYS).toBeDefined();
      expect(CONFIG.STORAGE_KEYS.ACCESS_TOKEN).toBeDefined();
      expect(CONFIG.STORAGE_KEYS.REFRESH_TOKEN).toBeDefined();
      expect(CONFIG.STORAGE_KEYS.USER_ROLE).toBeDefined();
      expect(CONFIG.STORAGE_KEYS.USER_ID).toBeDefined();
    });

    it('should have unique storage key values', () => {
      const keys = Object.values(CONFIG.STORAGE_KEYS);
      const uniqueKeys = new Set(keys);
      expect(keys.length).toBe(uniqueKeys.size);
    });

    it('should have string storage key values', () => {
      Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
        expect(typeof key).toBe('string');
        expect(key).not.toBe('');
      });
    });
  });

  describe('Environment Configuration', () => {
    it('should handle development environment', () => {
      // Test that config can handle different environments
      expect(CONFIG).toHaveProperty('API_BASE_URL');
      expect(CONFIG).toHaveProperty('TIMEOUT');
      expect(CONFIG).toHaveProperty('DEBUG_MODE');
      expect(CONFIG).toHaveProperty('STORAGE_KEYS');
    });
  });
});
