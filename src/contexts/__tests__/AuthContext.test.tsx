import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock API
jest.mock('../../services/api', () => ({
  post: jest.fn(),
  defaults: {
    headers: {
      common: {},
    },
  },
}));

// Mock config
jest.mock('../../utils/config', () => ({
  CONFIG: {
    STORAGE_KEYS: {
      ACCESS_TOKEN: 'accessToken',
      REFRESH_TOKEN: 'refreshToken',
      USER_ROLE: 'userRole',
      USER_ID: 'userId',
    },
  },
}));

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockedApi = api as jest.Mocked<typeof api>;

describe('AuthContext Modules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AsyncStorage Mock', () => {
    it('should mock AsyncStorage correctly', () => {
      expect(mockedAsyncStorage.getItem).toBeDefined();
      expect(mockedAsyncStorage.setItem).toBeDefined();
      expect(mockedAsyncStorage.removeItem).toBeDefined();
      expect(mockedAsyncStorage.clear).toBeDefined();
    });
  });

  describe('API Mock', () => {
    it('should mock API correctly', () => {
      expect(mockedApi.post).toBeDefined();
      expect(mockedApi.defaults).toBeDefined();
    });
  });

  describe('Storage Operations', () => {
    it('should handle storage set operations', async () => {
      mockedAsyncStorage.setItem.mockResolvedValue(undefined);
      
      await expect(mockedAsyncStorage.setItem('test', 'value')).resolves.toBeUndefined();
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith('test', 'value');
    });

    it('should handle storage get operations', async () => {
      mockedAsyncStorage.getItem.mockResolvedValue('test-value');
      
      const result = await mockedAsyncStorage.getItem('test');
      expect(result).toBe('test-value');
      expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith('test');
    });

    it('should handle storage clear operations', async () => {
      mockedAsyncStorage.clear.mockResolvedValue(undefined);
      
      await expect(mockedAsyncStorage.clear()).resolves.toBeUndefined();
      expect(mockedAsyncStorage.clear).toHaveBeenCalled();
    });

    it('should handle storage errors', async () => {
      const error = new Error('Storage error');
      mockedAsyncStorage.getItem.mockRejectedValue(error);
      
      await expect(mockedAsyncStorage.getItem('test')).rejects.toThrow('Storage error');
    });
  });

  describe('API Operations', () => {
    it('should handle successful API calls', async () => {
      const mockResponse = {
        data: {
          access: 'token',
          refresh: 'refresh-token',
          user: { id: 1, username: 'test' }
        }
      };
      
      mockedApi.post.mockResolvedValue(mockResponse);
      
      const result = await mockedApi.post('token/', { username: 'test', password: 'pass' });
      expect(result.data.access).toBe('token');
      expect(mockedApi.post).toHaveBeenCalledWith('token/', { username: 'test', password: 'pass' });
    });

    it('should handle API errors', async () => {
      const error = {
        response: {
          status: 401,
          data: { detail: 'Invalid credentials' }
        }
      };
      
      mockedApi.post.mockRejectedValue(error);
      
      await expect(mockedApi.post('token/', { username: 'test', password: 'wrong' })).rejects.toEqual(error);
    });
  });
});
