'use client';

import { useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/admin';
import { showToast } from '@/components/admin/Toast';

type Setting = {
  id: string;
  key: string;
  value: any;
  description: string | null;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        showToast('Ошибка авторизации', 'error');
        return;
      }

      const response = await fetch('/api/admin/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setSettings(result.settings || []);
      } else {
        showToast(`Ошибка загрузки настроек: ${result.error}`, 'error');
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      showToast(`Ошибка: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      setSaving(key);
      const token = await getAuthToken();
      if (!token) {
        showToast('Ошибка авторизации', 'error');
        return;
      }

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ key, value }),
      });

      const result = await response.json();

      if (result.success) {
        // Обновляем локальное состояние
        setSettings((prev) =>
          prev.map((s) => (s.key === key ? { ...s, value: result.setting.value } : s))
        );
        showToast('Настройка успешно обновлена', 'success');
      } else {
        showToast(`Ошибка: ${result.error}`, 'error');
      }
    } catch (error: any) {
      console.error('Error updating setting:', error);
      showToast(`Ошибка: ${error.message}`, 'error');
    } finally {
      setSaving(null);
    }
  };

  const handleToggleChristmasTheme = async (enabled: boolean) => {
    await updateSetting('christmas_theme_enabled', enabled);
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-800">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-600 border-r-transparent dark:border-slate-400 dark:border-r-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Загрузка настроек...</p>
        </div>
      </div>
    );
  }

  const christmasThemeSetting = settings.find((s) => s.key === 'christmas_theme_enabled');
  const christmasThemeEnabled =
    christmasThemeSetting?.value === true ||
    christmasThemeSetting?.value === 'true' ||
    christmasThemeSetting?.value === '"true"';

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Настройки сайта
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Управление настройками и функциями сайта
        </p>
      </div>

      {/* Рождественская тема */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🎄</span>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Рождественская тема
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Включить или выключить рождественские декорации, снежинки и новогодний блок на главной странице.
              Когда тема включена, пользователи увидят:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1 mb-4">
              <li>Анимацию падающих снежинок</li>
              <li>Рождественские декоративные элементы</li>
              <li>Специальный блок о 2025 годе с возможностью загадать желание на 2026 год</li>
              <li>Новогодние цвета и узоры</li>
            </ul>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleToggleChristmasTheme(!christmasThemeEnabled)}
                disabled={saving === 'christmas_theme_enabled'}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                  christmasThemeEnabled
                    ? 'bg-red-600 dark:bg-red-500'
                    : 'bg-slate-300 dark:bg-slate-600'
                } ${saving === 'christmas_theme_enabled' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    christmasThemeEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {christmasThemeEnabled ? 'Включена' : 'Выключена'}
              </span>
              {saving === 'christmas_theme_enabled' && (
                <span className="text-xs text-slate-500 dark:text-slate-400">Сохранение...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Информация */}
      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          ℹ️ Информация
        </h3>
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <li>
            • Изменения применяются сразу после сохранения
          </li>
          <li>
            • Пользователи увидят обновления в течение 30 секунд (автообновление)
          </li>
          <li>
            • Рождественская тема не влияет на функциональность сайта, только на внешний вид
          </li>
          <li>
            • Все существующие свечи и данные остаются без изменений
          </li>
        </ul>
      </div>
    </div>
  );
}

