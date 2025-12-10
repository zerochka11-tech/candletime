'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { checkAdminAccess, getAuthToken } from '@/lib/admin';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import GenerateArticleDialog from '@/components/admin/GenerateArticleDialog';
import PromptTemplateManager from '@/components/admin/PromptTemplateManager';
import { showToast } from '@/components/admin/Toast';

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

const ARTICLES_PER_PAGE = 50;

type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'views-desc' | 'views-asc';

export default function AdminArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [fileArticles, setFileArticles] = useState<FileArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [importing, setImporting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Проверка доступа теперь происходит на сервере через AdminGuard
  // Просто загружаем данные сразу
  useEffect(() => {
    loadArticles();
    loadFileArticles();
    loadStats();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Проверка доступа перенесена на сервер (AdminGuard)
  // Оставляем функцию для совместимости, но она больше не используется
  // (можно удалить в будущем после тестирования)

  const loadStats = async () => {
    try {
      // Используем API route с admin клиентом для обхода RLS
      const token = await getAuthToken();
      if (!token) {
        console.error('No auth token available');
        return;
      }

      // Параллельная загрузка статистики через API
      const [allResponse, publishedResponse, draftResponse] = await Promise.all([
        fetch('/api/admin/articles?filter=all&page=1&perPage=1', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/articles?filter=published&page=1&perPage=1', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/articles?filter=draft&page=1&perPage=1', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [allResult, publishedResult, draftResult] = await Promise.all([
        allResponse.json(),
        publishedResponse.json(),
        draftResponse.json(),
      ]);

      if (allResult.success) {
        setTotalCount(allResult.count || 0);
      }
      if (publishedResult.success) {
        setPublishedCount(publishedResult.count || 0);
      }
      if (draftResult.success) {
        setDraftCount(draftResult.count || 0);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadArticles = async () => {
    try {
      setLoading(true);
      
      // Используем API route с admin клиентом для обхода RLS
      const token = await getAuthToken();
      if (!token) {
        console.error('No auth token available');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/admin/articles?filter=${filter}&page=${currentPage}&perPage=${ARTICLES_PER_PAGE}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const result = await response.json();
        console.error('Error loading articles:', result.error);
        setArticles([]);
        setLoading(false);
        return;
      }

      const result = await response.json();
      
      if (result.success) {
        setArticles(result.articles || []);
        setTotalCount(result.count || 0);
      } else {
        console.error('Error loading articles:', result.error);
        setArticles([]);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
      setArticles([]);
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

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('article_categories')
        .select('id, name, slug')
        .order('name');

      if (error) {
        console.error('Error loading categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
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
        showToast(
          `Статья "${file.slug}" успешно ${result.action === 'created' ? 'создана' : 'обновлена'}!`,
          'success'
        );
        await Promise.all([loadArticles(), loadStats()]);
      } else {
        showToast(`Ошибка: ${result.error}`, 'error');
      }
    } catch (error: any) {
      showToast(`Ошибка: ${error.message}`, 'error');
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
        showToast(
          approve ? 'Статья успешно опубликована!' : 'Статья снята с публикации',
          'success'
        );
        await Promise.all([loadArticles(), loadStats()]);
      } else {
        showToast(`Ошибка: ${result.error}`, 'error');
      }
    } catch (error: any) {
      showToast(`Ошибка: ${error.message}`, 'error');
    }
  };

  const handleDelete = async (article: Article) => {
    setDeleteConfirm({ id: article.id, title: article.title });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    setDeleting(deleteConfirm.id);
    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/admin/articles/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        await Promise.all([loadArticles(), loadStats()]);
        showToast('Статья успешно удалена', 'success');
      } else {
        showToast(`Ошибка: ${result.error || 'Не удалось удалить статью'}`, 'error');
      }
    } catch (error: any) {
      showToast(`Ошибка: ${error.message}`, 'error');
    } finally {
      setDeleting(null);
      setDeleteConfirm(null);
    }
  };

  // Фильтрация и сортировка статей
  const filteredAndSortedArticles = useMemo(() => {
    let filtered = [...articles];

    // Поиск
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.slug.toLowerCase().includes(query) ||
          (article.excerpt && article.excerpt.toLowerCase().includes(query))
      );
    }

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title, 'ru');
        case 'title-desc':
          return b.title.localeCompare(a.title, 'ru');
        case 'views-desc':
          return b.views_count - a.views_count;
        case 'views-asc':
          return a.views_count - b.views_count;
        default:
          return 0;
      }
    });

    return filtered;
  }, [articles, searchQuery, sortBy]);

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

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* Заголовок с кнопками создания */}
      <div className="mb-6 flex items-center justify-between">
        <div></div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTemplateManager(true)}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 flex items-center gap-2"
          >
            <span>📝</span>
            <span>Шаблоны промптов</span>
          </button>
          <button
            onClick={() => setShowGenerateDialog(true)}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 flex items-center gap-2"
          >
            <span>🤖</span>
            <span>Сгенерировать статью</span>
          </button>
          <Link
            href="/admin/articles/new"
            className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            + Создать статью
          </Link>
        </div>
      </div>

      {/* Статистика */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800">
          <div className="text-sm text-slate-600 dark:text-slate-400">Всего статей</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {totalCount}
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

      {/* Поиск и сортировка */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Поиск */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию, slug или описанию..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Сортировка */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600 dark:text-slate-400">Сортировка:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
            <option value="title-asc">По названию (А-Я)</option>
            <option value="title-desc">По названию (Я-А)</option>
            <option value="views-desc">По просмотрам (↓)</option>
            <option value="views-asc">По просмотрам (↑)</option>
          </select>
        </div>
      </div>

      {/* Фильтры */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-slate-900 text-white shadow-md dark:bg-slate-100 dark:text-slate-900'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          <span>📋</span>
          <span>Все ({totalCount})</span>
        </button>
        <button
          onClick={() => setFilter('published')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            filter === 'published'
              ? 'bg-green-600 text-white shadow-md dark:bg-green-500'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          <span>✅</span>
          <span>Опубликованные ({publishedCount})</span>
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            filter === 'draft'
              ? 'bg-amber-600 text-white shadow-md dark:bg-amber-500'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          <span>📝</span>
          <span>Черновики ({draftCount})</span>
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
      ) : filteredAndSortedArticles.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-800">
          <p className="text-slate-600 dark:text-slate-400">
            По запросу "{searchQuery}" ничего не найдено.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedArticles.map((article) => (
            <div
              key={article.id}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-800 dark:hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="mb-3 flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                        article.published
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}
                    >
                      <span>{article.published ? '✅' : '📝'}</span>
                      <span>{article.published ? 'Опубликовано' : 'Черновик'}</span>
                    </span>
                    {article.published_at && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>📅</span>
                        <span>{new Date(article.published_at).toLocaleDateString('ru-RU')}</span>
                      </span>
                    )}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="mb-4 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1 font-mono">
                      <span>🔗</span>
                      <span className="truncate max-w-[200px]">{article.slug}</span>
                    </span>
                    {article.reading_time && (
                      <span className="inline-flex items-center gap-1">
                        <span>⏱️</span>
                        <span>{article.reading_time} мин</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <span>👁️</span>
                      <span>{article.views_count}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span>📅</span>
                      <span>{new Date(article.created_at).toLocaleDateString('ru-RU')}</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Link
                    href={`/admin/articles/${article.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <span>👁️</span>
                    <span>Просмотр</span>
                  </Link>
                  {article.published ? (
                    <button
                      onClick={() => handleApprove(article, false)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-amber-700 hover:shadow-sm"
                    >
                      <span>📤</span>
                      <span>Снять</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApprove(article, true)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-green-700 hover:shadow-sm"
                    >
                      <span>✅</span>
                      <span>Опубликовать</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(article)}
                    disabled={deleting === article.id}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-700 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>🗑️</span>
                    <span>{deleting === article.id ? 'Удаление...' : 'Удалить'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Пагинация */}
      {!loading && totalCount > ARTICLES_PER_PAGE && !searchQuery && (
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Показано{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {Math.min((currentPage - 1) * ARTICLES_PER_PAGE + 1, totalCount)}
            </span>
            {' - '}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {Math.min(currentPage * ARTICLES_PER_PAGE, totalCount)}
            </span>
            {' из '}
            <span className="font-medium text-slate-900 dark:text-slate-100">{totalCount}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              type="button"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Предыдущая
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.ceil(totalCount / ARTICLES_PER_PAGE) }, (_, i) => i + 1)
                .filter((page) => {
                  const totalPages = Math.ceil(totalCount / ARTICLES_PER_PAGE);
                  return (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  );
                })
                .map((page, index, array) => {
                  const prevPage = array[index - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <div key={page} className="flex items-center gap-1">
                      {showEllipsis && (
                        <span className="px-2 text-xs text-slate-500 dark:text-slate-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${
                          currentPage === page
                            ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900'
                            : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600'
                        }`}
                        type="button"
                      >
                        {page}
                      </button>
                    </div>
                  );
                })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(Math.ceil(totalCount / ARTICLES_PER_PAGE), p + 1))}
              disabled={currentPage >= Math.ceil(totalCount / ARTICLES_PER_PAGE)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              type="button"
            >
              Следующая
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Диалог подтверждения удаления */}
      {deleteConfirm && (
        <ConfirmDialog
          open={!!deleteConfirm}
          title="Удалить статью?"
          message={`Вы уверены, что хотите удалить статью "${deleteConfirm.title}"? Это действие нельзя отменить.`}
          confirmText="Удалить"
          cancelText="Отмена"
          confirmVariant="danger"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Диалог генерации статьи */}
      <GenerateArticleDialog
        open={showGenerateDialog}
        onClose={() => setShowGenerateDialog(false)}
        onSuccess={() => {
          loadArticles();
          loadStats();
        }}
        categories={categories}
        onManageTemplates={() => {
          setShowGenerateDialog(false);
          setShowTemplateManager(true);
        }}
      />

      {/* Управление промпт-шаблонами */}
      <PromptTemplateManager
        open={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
      />
    </div>
  );
}

