'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/admin';

type GenerateArticleDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories?: Array<{ id: string; name: string; slug: string }>;
};

type CandleType = 'calm' | 'support' | 'memory' | 'gratitude' | 'focus' | '';

const candleTypes = [
  { value: '', label: 'Не указан' },
  { value: 'calm', label: '🕊️ Спокойствие' },
  { value: 'support', label: '🤝 Поддержка' },
  { value: 'memory', label: '🌙 Память' },
  { value: 'gratitude', label: '✨ Благодарность' },
  { value: 'focus', label: '🎯 Фокус' },
];

export default function GenerateArticleDialog({
  open,
  onClose,
  onSuccess,
  categories = [],
}: GenerateArticleDialogProps) {
  const [topic, setTopic] = useState('');
  const [candleType, setCandleType] = useState<CandleType>('');
  const [language, setLanguage] = useState<'ru' | 'en'>('ru');
  const [categoryId, setCategoryId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Блокировка скролла при открытии диалога
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // Обработка Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !loading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, loading, onClose]);

  // Сброс формы при закрытии
  useEffect(() => {
    if (!open) {
      setTopic('');
      setCandleType('');
      setLanguage('ru');
      setCategoryId('');
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim() || topic.trim().length < 10) {
      setError('Тема статьи должна содержать минимум 10 символов');
      return;
    }

    if (topic.length > 200) {
      setError('Тема статьи не должна превышать 200 символов');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Не удалось получить токен авторизации');
      }

      const response = await fetch('/api/admin/articles/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: topic.trim(),
          candleType: candleType || undefined,
          language,
          categoryId: categoryId || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Специальная обработка rate limit ошибок
        if (response.status === 429) {
          throw new Error(
            result.error || 
            'Превышен лимит запросов к Gemini API. Пожалуйста, подождите несколько минут и попробуйте снова. ' +
            'Вы можете проверить лимиты в Google AI Studio.'
          );
        }
        throw new Error(result.error || 'Ошибка при генерации статьи');
      }

      // Успешно создано
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error generating article:', err);
      setError(err.message || 'Произошла ошибка при генерации статьи. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="generate-dialog-title"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-300 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
        {/* Заголовок */}
        <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-700">
          <h2 id="generate-dialog-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            🤖 Сгенерировать SEO-статью
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 disabled:opacity-50"
            aria-label="Закрыть"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Тема статьи */}
          <div className="mb-4">
            <label htmlFor="topic" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Тема статьи <span className="text-red-500">*</span>
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Например: Практика осознанности с символическими свечами"
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 disabled:opacity-50"
              required
              minLength={10}
              maxLength={200}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Минимум 10, максимум 200 символов. Опишите тему статьи подробно.
            </p>
          </div>

          {/* Тип свечи */}
          <div className="mb-4">
            <label htmlFor="candleType" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Тип свечи (опционально)
            </label>
            <select
              id="candleType"
              value={candleType}
              onChange={(e) => setCandleType(e.target.value as CandleType)}
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 disabled:opacity-50"
            >
              {candleTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Если указан, в конце статьи будет добавлен призыв к действию с упоминанием этого типа свечи.
            </p>
          </div>

          {/* Язык */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Язык статьи
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="ru"
                  checked={language === 'ru'}
                  onChange={(e) => setLanguage(e.target.value as 'ru' | 'en')}
                  disabled={loading}
                  className="mr-2"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Русский</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="en"
                  checked={language === 'en'}
                  onChange={(e) => setLanguage(e.target.value as 'ru' | 'en')}
                  disabled={loading}
                  className="mr-2"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">English</span>
              </label>
            </div>
          </div>

          {/* Категория */}
          {categories.length > 0 && (
            <div className="mb-6">
              <label htmlFor="category" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Категория (опционально)
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 disabled:opacity-50"
              >
                <option value="">Не выбрана</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Информация */}
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            <p className="font-medium mb-1">ℹ️ Информация:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Генерация статьи займет 10-30 секунд</li>
              <li>Статья будет создана как черновик</li>
              <li>Вы сможете отредактировать её перед публикацией</li>
              <li>Статья будет оптимизирована для SEO</li>
              <li>При превышении лимита API запрос будет повторен автоматически</li>
            </ul>
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || !topic.trim() || topic.trim().length < 10}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Генерация...
                </span>
              ) : (
                'Сгенерировать статью'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

