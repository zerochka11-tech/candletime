'use client';

import { useState } from 'react';
import { MarkdownContent } from '@/components/MarkdownContent';

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  articleTitle?: string;
};

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Начните писать статью в формате Markdown...',
  articleTitle,
}: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800 overflow-hidden">
      {/* Панель управления видом */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('edit')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'edit'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            📝 Редактор
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'split'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            ↔️ Разделить
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'preview'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            👁️ Предпросмотр
          </button>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {value.length} символов
        </div>
      </div>

      {/* Контент */}
      <div className="flex flex-1 overflow-hidden" style={{ height: '600px' }}>
        {/* Редактор */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            className={`flex flex-col overflow-hidden ${
              viewMode === 'split' ? 'w-1/2 border-r border-slate-200 dark:border-slate-700' : 'w-full'
            }`}
          >
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="flex-1 resize-none border-0 bg-transparent p-4 font-mono text-sm text-slate-900 outline-none dark:text-slate-100"
              spellCheck={false}
            />
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                💡 Подсказка: Используйте Markdown синтаксис. Поддерживаются заголовки, списки, ссылки, изображения и многое другое.
              </p>
            </div>
          </div>
        )}

        {/* Предпросмотр */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={`flex-1 overflow-y-auto ${
              viewMode === 'split' ? 'w-1/2' : 'w-full'
            }`}
          >
            <div className="p-6">
              {value.trim() ? (
                <MarkdownContent content={value} articleTitle={articleTitle} />
              ) : (
                <div className="text-center text-slate-400 dark:text-slate-500">
                  Предпросмотр появится здесь
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

