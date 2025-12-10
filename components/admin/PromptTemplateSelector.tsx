'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/admin';
import type { PromptTemplate } from '@/lib/promptTemplates';

type PromptTemplateSelectorProps = {
  value: string | null;
  onChange: (templateId: string | null) => void;
  onEdit?: (templateId: string) => void;
  disabled?: boolean;
  autoSelectDefault?: boolean;
};

export default function PromptTemplateSelector({
  value,
  onChange,
  onEdit,
  disabled = false,
  autoSelectDefault = false,
}: PromptTemplateSelectorProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  // Автоматический выбор шаблона по умолчанию при первой загрузке
  useEffect(() => {
    if (autoSelectDefault && templates.length > 0 && !value) {
      const defaultTemplate = templates.find(t => t.is_default);
      if (defaultTemplate) {
        onChange(defaultTemplate.id);
      }
    }
  }, [templates, autoSelectDefault, value, onChange]);

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
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTemplate = templates.find((t) => t.id === value);

  return (
    <div className="space-y-2">
      {selectedTemplate && onEdit && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onEdit(selectedTemplate.id)}
            className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Редактировать
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-slate-300 bg-white p-3 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400">
          Загрузка шаблонов...
        </div>
      ) : (
        <>
          {/* Поиск */}
          {templates.length > 3 && (
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск шаблонов..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          )}

          {/* Выбор шаблона */}
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value || null)}
            disabled={disabled}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 disabled:opacity-50"
          >
            <option value="">Выберите шаблон...</option>
            {filteredTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
                {template.is_default && ' (по умолчанию)'}
                {template.is_system && ' [Системный]'}
              </option>
            ))}
          </select>

          {/* Информация о выбранном шаблоне */}
          {selectedTemplate && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-800 dark:bg-blue-900/20">
              <div className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                {selectedTemplate.name}
              </div>
              {selectedTemplate.description && (
                <div className="mb-2 text-xs text-blue-800 dark:text-blue-300">
                  {selectedTemplate.description}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {Array.isArray(selectedTemplate.variables) && selectedTemplate.variables.length > 0 && (
                  <div className="text-xs font-medium text-blue-700 dark:text-blue-400">
                    Переменные: {selectedTemplate.variables.join(', ')}
                  </div>
                )}
                {selectedTemplate.is_default && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-800 dark:text-blue-300">
                    По умолчанию
                  </span>
                )}
                {selectedTemplate.is_system && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                    Системный
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

