'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getAuthToken } from '@/lib/admin';
import { MarkdownContent } from '@/components/MarkdownContent';

type Article = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  views_count: number;
  reading_time: number | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  featured_image_url: string | null;
  category_id: string | null;
};

export default function AdminArticlePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    excerpt: '',
  });

  // Проверка доступа теперь происходит на сервере через AdminGuard в layout
  useEffect(() => {
    if (id) {
      loadArticle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Error loading article:', error);
        return;
      }

      setArticle(data);
      setFormData({
        seo_title: data.seo_title || '',
        seo_description: data.seo_description || '',
        seo_keywords: (data.seo_keywords || []).join(', '),
        excerpt: data.excerpt || '',
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!article) return;

    try {
      const keywordsArray = formData.seo_keywords
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const { error } = await supabase
        .from('articles')
        .update({
          seo_title: formData.seo_title || null,
          seo_description: formData.seo_description || null,
          seo_keywords: keywordsArray.length > 0 ? keywordsArray : null,
          excerpt: formData.excerpt || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        alert(`Ошибка: ${error.message}`);
        return;
      }

      alert('Изменения сохранены!');
      setEditing(false);
      loadArticle();
    } catch (error: any) {
      alert(`Ошибка: ${error.message}`);
    }
  };

  const handleApprove = async (approve: boolean) => {
    if (!article) return;

    if (
      !confirm(
        approve
          ? `Опубликовать статью "${article.title}"?`
          : `Снять с публикации статью "${article.title}"?`
      )
    ) {
      return;
    }

    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/admin/articles/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          approve,
          published_at: approve ? new Date().toISOString() : null,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        loadArticle();
      } else {
        alert(`Ошибка: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Ошибка: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-64 w-full rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-800">
          <h1 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Статья не найдена
          </h1>
          <Link
            href="/admin/articles"
            className="inline-block rounded-full bg-slate-900 px-6 py-3 text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Вернуться к списку
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Заголовок с действиями */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                article.published
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}
            >
              {article.published ? 'Опубликовано' : 'Черновик'}
            </span>
            {article.published_at && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                📅 {new Date(article.published_at).toLocaleDateString('ru-RU')}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {article.title}
          </h1>
        </div>
        <div className="flex gap-2">
          {article.published ? (
            <button
              onClick={() => handleApprove(false)}
              className="rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
            >
              Снять с публикации
            </button>
          ) : (
            <button
              onClick={() => handleApprove(true)}
              className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              Опубликовать
            </button>
          )}
          {article.published && (
            <Link
              href={`/faq/${article.slug}`}
              target="_blank"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Просмотр на сайте
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Основной контент */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Предпросмотр статьи
            </h2>
            <MarkdownContent content={article.content} articleTitle={article.title} />
          </div>
        </div>

        {/* Метаданные и редактирование */}
        <div className="space-y-6">
          {/* Статистика */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Статистика
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-600 dark:text-slate-400">Просмотры:</span>{' '}
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {article.views_count}
                </span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Время чтения:</span>{' '}
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {article.reading_time || '—'} мин
                </span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Создано:</span>{' '}
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {new Date(article.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Обновлено:</span>{' '}
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {new Date(article.updated_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Slug:</span>{' '}
                <span className="font-mono text-xs text-slate-900 dark:text-slate-100">
                  {article.slug}
                </span>
              </div>
            </div>
          </div>

          {/* Редактирование метаданных */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Метаданные
              </h3>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  Редактировать
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={formData.seo_title}
                    onChange={(e) =>
                      setFormData({ ...formData, seo_title: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder={article.title}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    SEO Description
                  </label>
                  <textarea
                    value={formData.seo_description}
                    onChange={(e) =>
                      setFormData({ ...formData, seo_description: e.target.value })
                    }
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Описание для поисковых систем (150-160 символов)"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    SEO Keywords (через запятую)
                  </label>
                  <input
                    type="text"
                    value={formData.seo_keywords}
                    onChange={(e) =>
                      setFormData({ ...formData, seo_keywords: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="ключевое слово 1, ключевое слово 2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Excerpt (краткое описание)
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) =>
                      setFormData({ ...formData, excerpt: e.target.value })
                    }
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Краткое описание для превью"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      loadArticle();
                    }}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">SEO Title:</span>
                  <div className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                    {article.seo_title || article.title}
                  </div>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">
                    SEO Description:
                  </span>
                  <div className="mt-1 text-slate-900 dark:text-slate-100">
                    {article.seo_description || '—'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Keywords:</span>
                  <div className="mt-1">
                    {article.seo_keywords && article.seo_keywords.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {article.seo_keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Excerpt:</span>
                  <div className="mt-1 text-slate-900 dark:text-slate-100">
                    {article.excerpt || '—'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

