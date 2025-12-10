'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/admin';
import PromptTemplateSelector from './PromptTemplateSelector';
import type { PromptTemplate } from '@/lib/promptTemplates';
import { showToast } from './Toast';

type GenerateArticleDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories?: Array<{ id: string; name: string; slug: string }>;
  onManageTemplates?: () => void;
};

type CandleType = 'calm' | 'support' | 'memory' | 'gratitude' | 'focus' | '';
type GenerationMode = 'simple' | 'template';

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
  onManageTemplates,
}: GenerateArticleDialogProps) {
  // Режим генерации
  const [mode, setMode] = useState<GenerationMode>('template');
  
  // Простой режим
  const [topic, setTopic] = useState('');
  const [candleType, setCandleType] = useState<CandleType>('');
  const [language, setLanguage] = useState<'ru' | 'en'>('ru');
  const [categoryId, setCategoryId] = useState<string>('');
  
  // Режим шаблона
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Общие
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
      setMode('template');
      setTopic('');
      setCandleType('');
      setLanguage('ru');
      setCategoryId('');
      setSelectedTemplateId(null);
      setSelectedTemplate(null);
      setShowPreview(false);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  // Загрузка выбранного шаблона
  useEffect(() => {
    if (mode === 'template' && selectedTemplateId) {
      loadTemplate(selectedTemplateId);
    }
  }, [mode, selectedTemplateId]);

  const loadTemplate = async (templateId: string) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('No auth token available');
        return;
      }

      const response = await fetch(`/api/admin/prompt-templates/${templateId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSelectedTemplate(result.template);
        }
      }
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация в зависимости от режима
    if (mode === 'simple') {
      if (!topic.trim() || topic.trim().length < 10) {
        setError('Тема статьи должна содержать минимум 10 символов');
        return;
      }

      if (topic.length > 200) {
        setError('Тема статьи не должна превышать 200 символов');
        return;
      }
    } else {
      // Режим шаблона
      if (!selectedTemplateId) {
        setError('Выберите промпт-шаблон');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Не удалось получить токен авторизации');
      }

      // Подготовка тела запроса
      const requestBody: any = {
        useTemplate: mode === 'template',
        categoryId: categoryId || undefined,
      };

      if (mode === 'simple') {
        requestBody.topic = topic.trim();
        requestBody.candleType = candleType || undefined;
        requestBody.language = language;
      } else {
        // Режим шаблона - передаем только ID шаблона, промпт используется как есть
        requestBody.templateId = selectedTemplateId;
      }

      const response = await fetch('/api/admin/articles/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
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
      if (result.success && result.article && result.article.id) {
        // Показываем уведомление
        showToast('Статья успешно сгенерирована!', 'success');
        // Вызываем callback для обновления списка
        onSuccess();
        // Закрываем диалог
        onClose();
        // Редиректим на страницу редактирования статьи
        window.location.href = `/admin/articles/${result.article.id}`;
      } else {
        throw new Error('Не удалось получить ID созданной статьи');
      }
    } catch (err: any) {
      console.error('Error generating article:', err);
      setError(err.message || 'Произошла ошибка при генерации статьи. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };


  const handleEditTemplate = (templateId: string) => {
    if (onManageTemplates) {
      onClose();
      onManageTemplates();
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
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl border border-slate-300 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800 flex flex-col overflow-hidden">
        {/* Заголовок с градиентом */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 id="generate-dialog-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Сгенерировать SEO-статью
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Создайте оптимизированную статью с помощью AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-400 transition-all hover:bg-white/80 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 disabled:opacity-50 hover:scale-105"
            aria-label="Закрыть"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Содержимое с прокруткой */}
        <div className="flex-1 overflow-y-auto p-5">
          <form onSubmit={handleSubmit} id="generate-article-form">
          {/* Выбор режима генерации - табы */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
              Выберите режим генерации
            </label>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setMode('template')}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  mode === 'template'
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                </svg>
                Шаблон
              </button>
              <button
                type="button"
                onClick={() => setMode('simple')}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  mode === 'simple'
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Простой
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {mode === 'template' 
                ? 'Используйте готовый промпт-шаблон для генерации статьи'
                : 'Быстрая генерация с настройкой параметров вручную'}
            </p>
          </div>

          {/* Режим шаблона: Выбор шаблона */}
          {mode === 'template' && (
            <div className="mb-5 rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-800">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                    </svg>
                  </div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Промпт-шаблон <span className="text-red-500">*</span>
                  </label>
                </div>
                {onManageTemplates && (
                  <button
                    type="button"
                    onClick={onManageTemplates}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Управление
                  </button>
                )}
              </div>
              <PromptTemplateSelector
                value={selectedTemplateId}
                onChange={setSelectedTemplateId}
                onEdit={handleEditTemplate}
                disabled={loading}
                autoSelectDefault={true}
              />
            </div>
          )}

          {/* Режим шаблона: Предпросмотр промпта */}
          {mode === 'template' && selectedTemplate && (
            <div className="mb-5 rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 p-4 dark:border-blue-800 dark:from-blue-900/10 dark:to-indigo-900/10">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Предпросмотр промпт-шаблона
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                >
                  {showPreview ? (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Скрыть
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Показать
                    </>
                  )}
                </button>
              </div>
              {showPreview && (
                <div className="rounded-lg border border-slate-300 bg-white p-3 text-sm font-mono text-slate-700 shadow-inner dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {selectedTemplate.prompt}
                </div>
              )}
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-100/50 p-3 dark:bg-blue-900/20">
                <svg className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  Шаблон содержит всю необходимую информацию для генерации SEO-статьи. Выберите шаблон и нажмите "Сгенерировать статью". Промпт будет отправлен в Gemini как есть, без дополнительных параметров.
                </p>
              </div>
            </div>
          )}

          {/* Простой режим: Тема статьи */}
          {mode === 'simple' && (
            <>
              <div className="mb-5 rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-800">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                    <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <label htmlFor="topic" className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Тема статьи <span className="text-red-500">*</span>
                  </label>
                </div>
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Например: Практика осознанности с символическими свечами"
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 disabled:opacity-50"
                  required
                  minLength={10}
                  maxLength={200}
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Опишите тему статьи подробно
                  </p>
                  <span className={`text-xs font-medium ${
                    topic.length < 10 
                      ? 'text-amber-600 dark:text-amber-400' 
                      : topic.length > 200 
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {topic.length}/200
                  </span>
                </div>
              </div>

              {/* Тип свечи и Язык в одной строке */}
              <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-800">
                  <label htmlFor="candleType" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Тип свечи
                    <span className="ml-1 text-xs font-normal text-slate-500 dark:text-slate-400">(опционально)</span>
                  </label>
                  <select
                    id="candleType"
                    value={candleType}
                    onChange={(e) => setCandleType(e.target.value as CandleType)}
                    disabled={loading}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 disabled:opacity-50"
                  >
                    {candleTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-800">
                  <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Язык статьи
                  </label>
                  <div className="flex gap-2">
                    <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white p-2 transition-all hover:border-blue-500 hover:bg-blue-50 dark:border-slate-600 dark:bg-slate-700 dark:hover:border-blue-400 dark:hover:bg-blue-900/20">
                      <input
                        type="radio"
                        value="ru"
                        checked={language === 'ru'}
                        onChange={(e) => setLanguage(e.target.value as 'ru' | 'en')}
                        disabled={loading}
                        className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">🇷🇺 Русский</span>
                    </label>
                    <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white p-2 transition-all hover:border-blue-500 hover:bg-blue-50 dark:border-slate-600 dark:bg-slate-700 dark:hover:border-blue-400 dark:hover:bg-blue-900/20">
                      <input
                        type="radio"
                        value="en"
                        checked={language === 'en'}
                        onChange={(e) => setLanguage(e.target.value as 'ru' | 'en')}
                        disabled={loading}
                        className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">🇬🇧 English</span>
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Категория (только для простого режима) */}
          {mode === 'simple' && categories.length > 0 && (
            <div className="mb-5 rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-800">
              <label htmlFor="category" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                Категория
                <span className="ml-1 text-xs font-normal text-slate-500 dark:text-slate-400">(опционально)</span>
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 disabled:opacity-50"
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
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <svg className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 dark:text-red-300 mb-1">Ошибка</p>
                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Информация */}
          <div className="mb-5 rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:border-blue-800 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Что нужно знать:</p>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                  <li className="flex items-start gap-2">
                    <svg className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Генерация статьи займет 10-30 секунд</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Статья будет создана как черновик для редактирования</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Автоматическая оптимизация для SEO</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>При превышении лимита запрос повторится автоматически</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          </form>
        </div>

        {/* Кнопки - фиксированы внизу */}
        <div className="flex justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            form="generate-article-form"
            disabled={
              loading ||
              (mode === 'simple' && (!topic.trim() || topic.trim().length < 10)) ||
              (mode === 'template' && !selectedTemplateId)
            }
            className="group relative rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
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
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Сгенерировать статью
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

