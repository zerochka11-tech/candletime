'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/admin';
import type { PromptTemplate } from '@/lib/promptTemplates';
import { validatePromptTemplate, extractVariablesFromPrompt } from '@/lib/promptTemplates';
import ConfirmDialog from './ConfirmDialog';
import { showToast } from './Toast';

type PromptTemplateManagerProps = {
  open: boolean;
  onClose: () => void;
};

type TemplateFormData = {
  name: string;
  description: string;
  prompt: string;
  is_default: boolean;
};

export default function PromptTemplateManager({
  open,
  onClose,
}: PromptTemplateManagerProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    prompt: '',
    is_default: false,
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadTemplates();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setShowCreateForm(false);
      setEditingTemplate(null);
      setFormData({ name: '', description: '', prompt: '', is_default: false });
      setFormErrors([]);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        console.error('No auth token available');
        return;
      }

      const response = await fetch('/api/admin/prompt-templates', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTemplates(result.templates || []);
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      showToast('Ошибка при загрузке шаблонов', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      prompt: '',
      is_default: false,
    });
    setFormErrors([]);
    setShowCreateForm(true);
  };

  const handleEdit = (template: PromptTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      prompt: template.prompt,
      is_default: template.is_default,
    });
    setFormErrors([]);
    setShowCreateForm(true);
  };

  const handleSave = async () => {
    // Валидация формы
    const variables = extractVariablesFromPrompt(formData.prompt);
    const validation = validatePromptTemplate({
      name: formData.name,
      prompt: formData.prompt,
      variables,
    });

    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    setSaving(true);
    setFormErrors([]);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Не удалось получить токен авторизации');
      }

      if (editingTemplate) {
        // Обновление существующего шаблона
        const response = await fetch(`/api/admin/prompt-templates/${editingTemplate.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            prompt: formData.prompt.trim(),
            is_default: formData.is_default,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Ошибка при обновлении шаблона');
        }

        showToast('Шаблон успешно обновлен', 'success');
      } else {
        // Создание нового шаблона
        const response = await fetch('/api/admin/prompt-templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            prompt: formData.prompt.trim(),
            is_default: formData.is_default,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Ошибка при создании шаблона');
        }

        showToast('Шаблон успешно создан', 'success');
      }

      // Перезагружаем список шаблонов
      await loadTemplates();
      setShowCreateForm(false);
      setEditingTemplate(null);
      setFormData({ name: '', description: '', prompt: '', is_default: false });
    } catch (error: any) {
      console.error('Error saving template:', error);
      showToast(error.message || 'Ошибка при сохранении шаблона', 'error');
      setFormErrors([error.message || 'Ошибка при сохранении']);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Не удалось получить токен авторизации');
      }

      const response = await fetch(`/api/admin/prompt-templates/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка при удалении шаблона');
      }

      showToast('Шаблон успешно удален', 'success');
      await loadTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      showToast(error.message || 'Ошибка при удалении шаблона', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };


  const detectedVariables = formData.prompt ? extractVariablesFromPrompt(formData.prompt) : [];

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-manager-title"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-300 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800 flex flex-col">
        {/* Заголовок с градиентом */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
              </svg>
            </div>
            <div>
              <h2 id="template-manager-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Управление промпт-шаблонами
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Создание и редактирование шаблонов для генерации статей
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
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
          {showCreateForm ? (
            /* Форма создания/редактирования */
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                    <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {editingTemplate ? 'Редактирование шаблона' : 'Создание нового шаблона'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingTemplate(null);
                    setFormData({ name: '', description: '', prompt: '', is_default: false });
                    setFormErrors([]);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Назад к списку
                </button>
              </div>

              {/* Ошибки валидации */}
              {formErrors.length > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                  <svg className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900 dark:text-red-300 mb-1">Ошибки валидации:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-800 dark:text-red-400">
                      {formErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Название */}
              <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-800">
                <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Название шаблона <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Например: Стандартный шаблон для SEO статей"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                  required
                />
              </div>

              {/* Описание */}
              <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-800">
                <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Описание <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(опционально)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Краткое описание назначения шаблона"
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Промпт */}
              <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-800">
                <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Промпт-шаблон <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder="Введите промпт-шаблон. Используйте переменные в формате {variableName}, например: {topic}, {language}, {candleType}"
                  rows={10}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                  required
                />
                {detectedVariables.length > 0 && (
                  <div className="mt-2 rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                      Обнаружены переменные: <span className="font-mono">{detectedVariables.join(', ')}</span>
                    </p>
                  </div>
                )}
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Используйте переменные в фигурных скобках, например: {'{topic}'}, {'{language}'}, {'{candleType}'}
                </p>
              </div>

              {/* Флаг "По умолчанию" - только для пользовательских шаблонов */}
              {!editingTemplate?.is_system && (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-800">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="is_default" className="text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer">
                    Установить как шаблон по умолчанию
                  </label>
                </div>
              )}

              {/* Кнопки */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingTemplate(null);
                    setFormData({ name: '', description: '', prompt: '', is_default: false });
                    setFormErrors([]);
                  }}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Сохранение...
                    </span>
                  ) : (
                    editingTemplate ? 'Сохранить изменения' : 'Создать шаблон'
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Список шаблонов */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                    <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Список шаблонов <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({templates.length})</span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCreate}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-green-700 hover:to-emerald-700 hover:shadow-xl"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Создать шаблон
                </button>
              </div>

              {/* Поиск */}
              {templates.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-800">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск шаблонов..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              )}

              {/* Список */}
              {loading ? (
                <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 text-center dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-800">
                  <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Загрузка шаблонов...
                  </div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 text-center dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {searchQuery ? 'Шаблоны не найдены' : 'Нет шаблонов. Создайте первый шаблон.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {template.name}
                            </h4>
                            {template.is_default && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                По умолчанию
                              </span>
                            )}
                            {template.is_system && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                Системный
                              </span>
                            )}
                          </div>
                          {template.description && (
                            <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
                              {template.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            {Array.isArray(template.variables) && template.variables.length > 0 && (
                              <>
                                <span className="font-medium">Переменные:</span>
                                <span className="font-mono text-blue-600 dark:text-blue-400">{template.variables.join(', ')}</span>
                                <span>•</span>
                              </>
                            )}
                            <span>
                              Создан: {new Date(template.created_at).toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              }).replace(/\//g, '.')}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {/* Редактирование доступно для всех шаблонов (системные можно редактировать, но не удалять) */}
                          <button
                            type="button"
                            onClick={() => handleEdit(template)}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Редактировать
                          </button>
                          {/* Удаление доступно только для пользовательских шаблонов */}
                          {!template.is_system && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm({ id: template.id, name: template.name })}
                              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-red-700 hover:shadow-sm"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Удалить
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Диалог подтверждения удаления */}
        {deleteConfirm && (
          <ConfirmDialog
            open={!!deleteConfirm}
            title="Удалить шаблон?"
            message={`Вы уверены, что хотите удалить шаблон "${deleteConfirm.name}"? Это действие нельзя отменить.`}
            confirmText="Удалить"
            cancelText="Отмена"
            confirmVariant="danger"
            onConfirm={handleDelete}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </div>
    </div>
  );
}

