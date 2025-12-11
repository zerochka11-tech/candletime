/**
 * Unit тесты для lib/theme.ts
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useTheme } from '@/lib/theme';

// Мокаем localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Мокаем matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Мокаем document.documentElement
const mockDocumentElement = {
  classList: {
    remove: jest.fn(),
    add: jest.fn(),
  },
};

Object.defineProperty(document, 'documentElement', {
  value: mockDocumentElement,
  writable: true,
});

describe('lib/theme', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    mockDocumentElement.classList.remove.mockClear();
    mockDocumentElement.classList.add.mockClear();
  });

  describe('useTheme', () => {
    it('инициализируется с системной темой, если нет сохраненной', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.mounted).toBe(true);
      });

      expect(result.current.theme).toBe('system');
      expect(result.current.resolvedTheme).toBe('light'); // matchMedia возвращает false
    });

    it('загружает сохраненную тему из localStorage', async () => {
      localStorageMock.setItem('theme', 'dark');

      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.mounted).toBe(true);
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('сохраняет тему в localStorage при изменении', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.mounted).toBe(true);
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(localStorageMock.getItem('theme')).toBe('dark');
      expect(result.current.theme).toBe('dark');
    });

    it('применяет тему к document.documentElement', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.mounted).toBe(true);
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('light', 'dark');
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
    });

    it('использует системную тему, когда theme = system', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.mounted).toBe(true);
      });

      act(() => {
        result.current.setTheme('system');
      });

      expect(result.current.theme).toBe('system');
      // resolvedTheme должен быть системной темой
    });

    it('возвращает mounted: false до инициализации', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.mounted).toBe(false);
    });

    it('обрабатывает невалидные значения в localStorage', async () => {
      localStorageMock.setItem('theme', 'invalid');

      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.mounted).toBe(true);
      });

      // Должна использоваться системная тема
      expect(result.current.theme).toBe('system');
    });

    it('обрабатывает отсутствие localStorage', async () => {
      // Временно удаляем localStorage
      const originalLocalStorage = window.localStorage;
      delete (window as any).localStorage;

      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.mounted).toBe(true);
      }, { timeout: 3000 });

      // Восстанавливаем localStorage
      (window as any).localStorage = originalLocalStorage;

      expect(result.current.theme).toBe('system');
    });
  });
});


