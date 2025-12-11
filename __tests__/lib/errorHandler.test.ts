/**
 * Unit тесты для lib/errorHandler.ts
 */

import {
  logError,
  handleSupabaseError,
  createErrorMessage,
} from '@/lib/errorHandler';

// Мокаем console.error для проверки вызовов
const originalConsoleError = console.error;
const mockConsoleError = jest.fn();

beforeEach(() => {
  console.error = mockConsoleError;
  mockConsoleError.mockClear();
  // Сбрасываем NODE_ENV
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('lib/errorHandler', () => {
  describe('logError', () => {
    it('логирует Error объект с полной информацией в development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.ts:1:1';

      logError(error, { component: 'TestComponent', action: 'testAction' });

      expect(mockConsoleError).toHaveBeenCalledWith(
        '🚨 Error:',
        expect.objectContaining({
          message: 'Test error',
          stack: expect.any(String),
          context: { component: 'TestComponent', action: 'testAction' },
          timestamp: expect.any(String),
          environment: 'development',
        })
      );
    });

    it('логирует только важную информацию в production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');

      logError(error, { component: 'TestComponent', action: 'testAction' });

      expect(mockConsoleError).toHaveBeenCalledWith('Error:', {
        message: 'Test error',
        component: 'TestComponent',
        action: 'testAction',
      });
    });

    it('обрабатывает не-Error объекты', () => {
      process.env.NODE_ENV = 'development';
      const error = 'String error';

      logError(error, { component: 'TestComponent' });

      expect(mockConsoleError).toHaveBeenCalledWith(
        '🚨 Error:',
        expect.objectContaining({
          message: 'String error',
          context: { component: 'TestComponent' },
        })
      );
    });

    it('работает без контекста', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');

      logError(error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        '🚨 Error:',
        expect.objectContaining({
          message: 'Test error',
          context: {},
        })
      );
    });
  });

  describe('handleSupabaseError', () => {
    it('возвращает понятное сообщение для сетевых ошибок', () => {
      const error = new Error('network error');
      const message = handleSupabaseError(error, { component: 'TestComponent' });

      expect(message).toBe('Ошибка сети. Проверьте подключение к интернету.');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('возвращает понятное сообщение для ошибок авторизации', () => {
      const error = new Error('auth error');
      const message = handleSupabaseError(error, { component: 'TestComponent' });

      expect(message).toBe('Ошибка авторизации. Пожалуйста, войдите снова.');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('возвращает понятное сообщение для ошибок прав доступа', () => {
      const error = new Error('permission denied');
      const message = handleSupabaseError(error, { component: 'TestComponent' });

      expect(message).toBe('Недостаточно прав для выполнения этого действия.');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('возвращает понятное сообщение для RLS ошибок', () => {
      const error = new Error('RLS policy violation');
      const message = handleSupabaseError(error, { component: 'TestComponent' });

      expect(message).toBe('Недостаточно прав для выполнения этого действия.');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('возвращает общее сообщение для других ошибок', () => {
      const error = new Error('Unknown error');
      const message = handleSupabaseError(error, { component: 'TestComponent' });

      expect(message).toBe('Произошла ошибка. Пожалуйста, попробуйте позже.');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('обрабатывает не-Error объекты', () => {
      const error = 'String error';
      const message = handleSupabaseError(error, { component: 'TestComponent' });

      expect(message).toBe('Произошла ошибка. Пожалуйста, попробуйте позже.');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('работает без контекста', () => {
      const error = new Error('Test error');
      const message = handleSupabaseError(error);

      expect(message).toBe('Произошла ошибка. Пожалуйста, попробуйте позже.');
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('createErrorMessage', () => {
    it('возвращает сообщение из Error объекта', () => {
      const error = new Error('Test error message');
      const message = createErrorMessage(error);

      expect(message).toBe('Test error message');
    });

    it('возвращает дефолтное сообщение для не-Error объектов', () => {
      const error = 'String error';
      const message = createErrorMessage(error);

      expect(message).toBe('Произошла неизвестная ошибка');
    });

    it('обрабатывает null', () => {
      const message = createErrorMessage(null);

      expect(message).toBe('Произошла неизвестная ошибка');
    });

    it('обрабатывает undefined', () => {
      const message = createErrorMessage(undefined);

      expect(message).toBe('Произошла неизвестная ошибка');
    });

    it('обрабатывает объекты без message', () => {
      const error = { code: 500 };
      const message = createErrorMessage(error);

      expect(message).toBe('Произошла неизвестная ошибка');
    });
  });
});


