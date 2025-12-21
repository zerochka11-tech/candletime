'use client';

import { useEffect, useState } from 'react';
import { isChristmasThemeEnabled } from '@/lib/christmasTheme';

/**
 * Хук для проверки состояния рождественской темы
 * @returns {boolean | null} - true если включена, false если выключена, null если загружается
 */
export function useChristmasTheme() {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadTheme = async () => {
      try {
        const isEnabled = await isChristmasThemeEnabled();
        if (mounted) {
          setEnabled(isEnabled);
        }
      } catch (error) {
        console.error('[useChristmasTheme] Error loading theme:', error);
        if (mounted) {
          setEnabled(false);
        }
      }
    };

    loadTheme();

    // Обновляем тему каждые 30 секунд (на случай, если админ изменил настройки)
    const interval = setInterval(() => {
      loadTheme();
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return enabled;
}

