'use client';

import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Инициализация темы при монтировании
  useEffect(() => {
    setMounted(true);
    
    // Загружаем сохраненную тему из localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    }

    // Определяем системную тему
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    
    setResolvedTheme(savedTheme === 'system' || !savedTheme ? systemTheme : savedTheme);

    // Применяем тему к документу
    applyTheme(savedTheme || 'system', systemTheme);
  }, []);

  // Отслеживание изменений системной темы
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newTheme);
      applyTheme('system', newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Применение темы
  const applyTheme = (selectedTheme: Theme, systemTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    const finalTheme = selectedTheme === 'system' ? systemTheme : selectedTheme;
    
    root.classList.remove('light', 'dark');
    root.classList.add(finalTheme);
    
    setResolvedTheme(finalTheme);
  };

  // Установка темы
  const setThemeWithStorage = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    
    applyTheme(newTheme, systemTheme);
  };

  return {
    theme,
    resolvedTheme,
    setTheme: setThemeWithStorage,
    mounted,
  };
}

