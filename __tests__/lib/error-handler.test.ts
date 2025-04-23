// __tests__/lib/error-handler.test.ts
import { notifyError, formatError, logError } from '@/lib/utils/error-handler';
import type { AppError } from '@/lib/utils/error-handler';
import * as toastModule from 'react-toastify';

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

describe('Error Handler', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  // Restore console mock after all tests
  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Error Formatting', () => {
    it('should format a basic error', () => {
      const error = new Error('Test error');
      const formattedError = formatError(error);
      
      expect(formattedError.message).toContain('Test error');
      expect(formattedError.originalError).toBe(error);
    });

    it('should preserve error code if available', () => {
      const errorWithCode = { code: 'TEST_CODE', message: 'Test message' };
      const formattedError = formatError(errorWithCode);
      
      expect(formattedError.message).toContain('Test message');
      expect(formattedError.code).toBe('TEST_CODE');
    });
  });

  describe('logError', () => {
    it('should log an error to console', () => {
      const error = new Error('Test error');
      
      const result = logError(error, 'test-context');
      
      expect(console.error).toHaveBeenCalled();
      expect(result.message).toContain('Test error');
    });

    it('should return a formatted error object', () => {
      const errorWithCode = { code: 'TEST_CODE', message: 'Error with code' };
      
      const result = logError(errorWithCode);
      
      expect(result.code).toBe('TEST_CODE');
      expect(result.message).toContain('Error with code');
    });
  });

  describe('notifyError', () => {
    it('should show toast notification for an error', () => {
      const error = new Error('Test error');
      
      notifyError(error);
      
      expect(toastModule.toast.error).toHaveBeenCalled();
    });

    it('should handle errors with custom code', () => {
      const errorWithCode = { 
        code: 'CUSTOM_CODE', 
        message: 'Custom error' 
      };
      
      notifyError(errorWithCode);
      
      expect(toastModule.toast.error).toHaveBeenCalled();
    });

    it('should handle Firebase auth errors', () => {
      // Mock Firebase auth error
      const firebaseError = {
        code: 'auth/user-not-found',
        message: 'User not found'
      };
      
      notifyError(firebaseError);
      
      // Check that toast was called
      expect(toastModule.toast.error).toHaveBeenCalled();
    });
  });
});
