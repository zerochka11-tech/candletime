'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { checkAdminAccess, getAuthToken } from '@/lib/admin';

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  views_count: number;
  reading_time: number | null;
  seo_title: string | null;
  seo_description: string | null;
  author_id: string | null;
};

type FileArticle = {
  filename: string;
  slug: string;
  path: string;
};

export default function AdminArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [fileArticles, setFileArticles] = useState<FileArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [importing, setImporting] = useState<string | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadArticles();
      loadFileArticles();
    }
  }, [isAdmin, filter]);

  const checkAccess = async () => {
    const { isAdmin: admin, error } = await checkAdminAccess();
    if (!admin) {
      router.push('/auth/login?redirect=/admin/articles');
      return;
    }
    setIsAdmin(true);
  };

  const loadArticles = async () => {
    try {
      let query = supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'published') {
        query = query.eq('published', true);
      } else if (filter === 'draft') {
        query = query.eq('published', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading articles:', error);
        return;
      }

      setArticles(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFileArticles = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/admin/articles/import', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const { files } = await response.json();
        setFileArticles(files || []);
      }
    } catch (error) {
      console.error('Error loading file articles:', error);
    }
  };

  const handleImport = async (file: FileArticle) => {
    try {
      setImporting(file.slug);
      const token = await getAuthToken();

      const response = await fetch('/api/admin/articles/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slug: file.slug,
          filename: file.filename,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          `Статья "${file.slug}" успешно ${result.action === 'created' ? 'создана' : 'обновлена'}!`
        );
        loadArticles();
      } else {
        alert(`Ошибка: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Ошибка: ${error.message}`);
    } finally {
      setImporting(null);
    }
  };

  const handleApprove = async (article: Article, approve: boolean) => {
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
      const response = await fetch(`/api/admin/articles/${article.id}/approve`, {
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
        loadArticles();
      } else {
        alert(`Ошибка: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Ошибка: ${error.message}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-800">
          <p className="text-slate-600 dark:text-slate-400">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800 animate-pulse"
            >
              <div className="h-6 w-3/4 rounded bg-slate-200 dark:bg-slate-700 mb-3" />
              <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const publishedCount = articles.filter((a) => a.published).length;
  const draftCount = articles.filter((a) => !a.published).length;

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* Статистика */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800">
          <div className="text-sm text-slate-600 dark:text-slate-400">Всего статей</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {articles.length}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800">
          <div className="text-sm text-slate-600 dark:text-slate-400">Опубликовано</div>
          <div className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
            {publishedCount}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800">
          <div className="text-sm text-slate-600 dark:text-slate-400">Черновики</div>
          <div className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {draftCount}
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          Все ({articles.length})
        </button>
        <button
          onClick={() => setFilter('published')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
            filter === 'published'
              ? 'bg-green-600 text-white dark:bg-green-500'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          Опубликованные ({publishedCount})
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
            filter === 'draft'
              ? 'bg-amber-600 text-white dark:bg-amber-500'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          Черновики ({draftCount})
        </button>
      </div>

      {/* Файлы для импорта */}
      {fileArticles.length > 0 && (
        <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
            📁 Файлы готовы к импорту ({fileArticles.length})
          </h2>
          <div className="space-y-2">
            {fileArticles.map((file) => (
              <div
                key={file.slug}
                className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-3 dark:border-blue-800 dark:bg-slate-800"
              >
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {file.filename}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    slug: {file.slug}
                  </div>
                </div>
                <button
                  onClick={() => handleImport(file)}
                  disabled={importing === file.slug}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {importing === file.slug ? 'Импорт...' : 'Импортировать'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Список статей */}
      {articles.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-800">
          <p className="text-slate-600 dark:text-slate-400">
            Статьи не найдены. Импортируйте статьи из файлов или создайте новую.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
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
                  <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="mb-3 text-slate-600 dark:text-slate-400">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-500">
                    <span>slug: {article.slug}</span>
                    {article.reading_time && (
                      <span>⏱️ {article.reading_time} мин</span>
                    )}
                    <span>👁️ {article.views_count} просмотров</span>
                    <span>
                      Создано: {new Date(article.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
                <div className="ml-4 flex flex-col gap-2">
                  <Link
                    href={`/admin/articles/${article.id}`}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Просмотр
                  </Link>
                  {article.published ? (
                    <button
                      onClick={() => handleApprove(article, false)}
                      className="rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
                    >
                      Снять
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApprove(article, true)}
                      className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                    >
                      Опубликовать
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

