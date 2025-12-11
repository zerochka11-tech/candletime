/**
 * Unit тесты для lib/admin.ts
 */

import { checkAdminAccess, getAuthToken } from '@/lib/admin';
import { supabase } from '@/lib/supabaseClient';

// Мокаем supabase
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
    },
  },
}));

// Мокаем переменные окружения
const originalEnv = process.env;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_ADMIN_EMAILS: 'admin@example.com,admin2@example.com',
  };
  jest.clearAllMocks();
});

afterEach(() => {
  process.env = originalEnv;
});

describe('lib/admin', () => {
  describe('checkAdminAccess', () => {
    it('возвращает isAdmin: true для админского email', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'admin@example.com',
          },
        },
        error: null,
      });

      const result = await checkAdminAccess();

      expect(result.isAdmin).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('возвращает isAdmin: false для не-админского email', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'user@example.com',
          },
        },
        error: null,
      });

      const result = await checkAdminAccess();

      expect(result.isAdmin).toBe(false);
      expect(result.user).toBeNull();
      expect(result.error).toBe('Access denied');
    });

    it('возвращает isAdmin: false, если пользователь не авторизован', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: null,
        },
        error: { message: 'Not authenticated' },
      });

      const result = await checkAdminAccess();

      expect(result.isAdmin).toBe(false);
      expect(result.user).toBeNull();
      expect(result.error).toBe('Not authenticated');
    });

    it('обрабатывает ошибки при получении пользователя', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: null,
        },
        error: { message: 'Network error' },
      });

      const result = await checkAdminAccess();

      expect(result.isAdmin).toBe(false);
      expect(result.user).toBeNull();
      expect(result.error).toBe('Not authenticated');
    });

    it('обрабатывает timeout', async () => {
      (supabase.auth.getUser as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          data: { user: { email: 'admin@example.com' } },
          error: null,
        }), 6000))
      );

      const result = await checkAdminAccess();

      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('Timeout');
    }, 10000);

    it('обрабатывает исключения', async () => {
      (supabase.auth.getUser as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const result = await checkAdminAccess();

      expect(result.isAdmin).toBe(false);
      expect(result.user).toBeNull();
      expect(result.error).toBe('Unexpected error');
    });

    it('игнорирует регистр email', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'ADMIN@EXAMPLE.COM',
          },
        },
        error: null,
      });

      const result = await checkAdminAccess();

      expect(result.isAdmin).toBe(true);
    });

    it('обрабатывает пробелы в email', async () => {
      process.env.NEXT_PUBLIC_ADMIN_EMAILS = ' admin@example.com , admin2@example.com ';

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'admin@example.com',
          },
        },
        error: null,
      });

      const result = await checkAdminAccess();

      expect(result.isAdmin).toBe(true);
    });

    it('работает без переменной окружения', async () => {
      delete process.env.NEXT_PUBLIC_ADMIN_EMAILS;

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'admin@example.com',
          },
        },
        error: null,
      });

      const result = await checkAdminAccess();

      expect(result.isAdmin).toBe(false);
    });
  });

  describe('getAuthToken', () => {
    it('возвращает токен доступа для авторизованного пользователя', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: 'test-token-123',
          },
        },
        error: null,
      });

      const token = await getAuthToken();

      expect(token).toBe('test-token-123');
    });

    it('возвращает null, если сессия отсутствует', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: null,
        },
        error: null,
      });

      const token = await getAuthToken();

      expect(token).toBeNull();
    });

    it('возвращает null, если токен отсутствует', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: null,
          },
        },
        error: null,
      });

      const token = await getAuthToken();

      expect(token).toBeNull();
    });
  });
});


