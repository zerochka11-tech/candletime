'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { generateCandlesItemList } from '@/lib/seo';
import { ArticleSkeleton } from '@/components/ui/ArticleSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  views_count: number;
  reading_time: number | null;
  featured_image_url: string | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

type SortOption = 'date-desc' | 'date-asc' | 'popularity' | 'reading-time';

const ARTICLES_PER_PAGE = 12;

export default function FAQPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchArticles();
      } else {
        loadData();
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, sortBy, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Проверяем сессию пользователя для диагностики
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('[FAQ] Loading articles for user:', user.email);
      } else {
        console.log('[FAQ] Loading articles for anonymous user');
      }

      // Вычисляем диапазон для пагинации
      const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
      const endIndex = startIndex + ARTICLES_PER_PAGE - 1;

      // Определяем параметры сортировки для сервера
      let orderColumn = 'published_at';
      let ascending = false;
      
      switch (sortBy) {
        case 'date-asc':
          orderColumn = 'published_at';
          ascending = true;
          break;
        case 'date-desc':
          orderColumn = 'published_at';
          ascending = false;
          break;
        case 'popularity':
          orderColumn = 'views_count';
          ascending = false;
          break;
        case 'reading-time':
          orderColumn = 'reading_time';
          ascending = true;
          break;
      }

      // Параллельная загрузка категорий и статей
      const [categoriesResult, articlesResult] = await Promise.all([
        supabase
          .from('article_categories')
          .select('id, name, slug')
          .order('name'),
        (() => {
          let query = supabase
            .from('articles')
            .select(`
              id,
              title,
              slug,
              excerpt,
              published_at,
              views_count,
              reading_time,
              featured_image_url,
              article_categories (
                id,
                name,
                slug
              )
            `, { count: 'exact' })
            .eq('published', true)
            .not('published_at', 'is', null)
            .lte('published_at', new Date().toISOString())
            .order(orderColumn, { ascending })
            .range(startIndex, endIndex);

          if (selectedCategory) {
            query = query.eq('category_id', selectedCategory);
          }

          return query;
        })()
      ]);

      if (categoriesResult.data) {
        setCategories(categoriesResult.data);
      }

      if (articlesResult.error) {
        console.error('[FAQ] Error loading articles:', {
          error: articlesResult.error,
          message: articlesResult.error.message,
          details: articlesResult.error.details,
          hint: articlesResult.error.hint,
          code: articlesResult.error.code,
        });
        // Устанавливаем пустые данные вместо возврата, чтобы UI обновился
        setArticles([]);
        setTotalCount(0);
        return;
      }

      // Обрабатываем случай, когда data может быть null или undefined
      if (articlesResult.data) {
        const formattedArticles = articlesResult.data.map((article: any) => ({
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          published_at: article.published_at,
          category: article.article_categories,
          views_count: article.views_count || 0,
          reading_time: article.reading_time,
          featured_image_url: article.featured_image_url,
        }));

        setArticles(formattedArticles);
        setTotalCount(articlesResult.count || 0);
        console.log(`[FAQ] Loaded ${formattedArticles.length} articles (total: ${articlesResult.count || 0})`);
      } else {
        // Если data === null или undefined, устанавливаем пустые данные
        console.warn('[FAQ] articlesResult.data is null or undefined');
        setArticles([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('[FAQ] Error loading articles:', error);
      // При любой ошибке устанавливаем пустые данные
      setArticles([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const searchArticles = async () => {
    if (!searchQuery.trim()) {
      loadData();
      return;
    }

    try {
      setLoading(true);

      // Вычисляем диапазон для пагинации
      const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
      const endIndex = startIndex + ARTICLES_PER_PAGE - 1;

      // Определяем параметры сортировки для сервера
      let orderColumn = 'published_at';
      let ascending = false;
      
      switch (sortBy) {
        case 'date-asc':
          orderColumn = 'published_at';
          ascending = true;
          break;
        case 'date-desc':
          orderColumn = 'published_at';
          ascending = false;
          break;
        case 'popularity':
          orderColumn = 'views_count';
          ascending = false;
          break;
        case 'reading-time':
          orderColumn = 'reading_time';
          ascending = true;
          break;
      }

      // Параллельная загрузка категорий и результатов поиска
      const [categoriesResult, articlesResult] = await Promise.all([
        supabase
          .from('article_categories')
          .select('id, name, slug')
          .order('name'),
        (() => {
          let query = supabase
            .from('articles')
            .select(`
              id,
              title,
              slug,
              excerpt,
              published_at,
              views_count,
              reading_time,
              featured_image_url,
              article_categories (
                id,
                name,
                slug
              )
            `, { count: 'exact' })
            .eq('published', true)
            .not('published_at', 'is', null)
            .lte('published_at', new Date().toISOString())
            .or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`)
            .order(orderColumn, { ascending })
            .range(startIndex, endIndex);

          if (selectedCategory) {
            query = query.eq('category_id', selectedCategory);
          }

          return query;
        })()
      ]);

      if (categoriesResult.data) {
        setCategories(categoriesResult.data);
      }

      if (articlesResult.error) {
        console.error('[FAQ] Error searching articles:', {
          error: articlesResult.error,
          message: articlesResult.error.message,
          details: articlesResult.error.details,
          hint: articlesResult.error.hint,
          code: articlesResult.error.code,
        });
        // Устанавливаем пустые данные вместо возврата, чтобы UI обновился
        setArticles([]);
        setTotalCount(0);
        return;
      }

      // Обрабатываем случай, когда data может быть null или undefined
      if (articlesResult.data) {
        const formattedArticles = articlesResult.data.map((article: any) => ({
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          published_at: article.published_at,
          category: article.article_categories,
          views_count: article.views_count || 0,
          reading_time: article.reading_time,
          featured_image_url: article.featured_image_url,
        }));

        setArticles(formattedArticles);
        setTotalCount(articlesResult.count || 0);
        console.log(`[FAQ] Search found ${formattedArticles.length} articles (total: ${articlesResult.count || 0})`);
      } else {
        // Если data === null или undefined, устанавливаем пустые данные
        console.warn('[FAQ] articlesResult.data is null or undefined (search)');
        setArticles([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('[FAQ] Error searching articles:', error);
      // При любой ошибке устанавливаем пустые данные
      setArticles([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };


  const highlightText = (text: string, query: string): string => {
    if (!query.trim() || !text) return text;
    
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.replace(regex, '<mark class="bg-amber-200 dark:bg-amber-900/50 text-slate-900 dark:text-slate-100 px-0.5 rounded">$1</mark>');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Если меньше 7 дней - показываем "X дней назад"
    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays} дн. назад`;

    // Если меньше года - показываем дату без года
    if (diffDays < 365) {
      return date.toLocaleDateString('ru-RU', {
        month: 'short',
        day: 'numeric',
      });
    }

    // Полная дата
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Заголовок + Поиск */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-3 shadow-md sm:p-4 md:p-5 transition-colors duration-200">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative space-y-3 sm:space-y-4">
          {/* Заголовок */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30 text-base sm:text-lg shadow-sm">
              📚
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl md:text-2xl truncate">
                FAQ и Статьи
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
                Ответы на вопросы и полезные материалы
              </p>
            </div>
          </div>

          {/* Поиск */}
          <div className="relative">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-slate-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск статей..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-slate-500 dark:focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 touch-manipulation"
                  aria-label="Очистить поиск"
                  type="button"
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Фильтры и сортировка */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            {/* Компактные фильтры по категориям */}
            {categories.length > 0 && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  Категория:
                </span>
                <div className="flex flex-wrap gap-1.5 sm:gap-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`inline-flex items-center justify-center gap-1 rounded-full px-2.5 sm:px-2.5 py-1.5 sm:py-1 min-h-[32px] sm:min-h-0 text-[10px] sm:text-[10px] font-medium transition-all duration-200 hover:-translate-y-0.5 active:scale-95 touch-manipulation ${
                      selectedCategory === null
                        ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-sm dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                    type="button"
                  >
                    Все
                    {selectedCategory === null && <span className="text-[9px]">✓</span>}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`inline-flex items-center justify-center gap-1 rounded-full px-2.5 sm:px-2.5 py-1.5 sm:py-1 min-h-[32px] sm:min-h-0 text-[10px] sm:text-[10px] font-medium transition-all duration-200 hover:-translate-y-0.5 active:scale-95 touch-manipulation ${
                        selectedCategory === category.id
                          ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-sm dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                      }`}
                      type="button"
                    >
                      <span className="truncate max-w-[120px] sm:max-w-none">{category.name}</span>
                      {selectedCategory === category.id && <span className="text-[9px] flex-shrink-0">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Выпадающий список сортировки */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 whitespace-nowrap">
                Сортировка:
              </span>
              <div className="relative w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full sm:w-auto appearance-none rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 sm:px-2.5 py-2 sm:py-1 pr-8 sm:pr-7 min-h-[32px] sm:min-h-0 text-[10px] sm:text-[10px] font-medium text-slate-900 dark:text-slate-100 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:border-slate-500 dark:focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 cursor-pointer touch-manipulation"
                >
                  <option value="date-desc">🕐 Новые первыми</option>
                  <option value="date-asc">📅 Старые первыми</option>
                  <option value="popularity">🔥 По популярности</option>
                  <option value="reading-time">⏱️ По времени чтения</option>
                </select>
                <div className="pointer-events-none absolute right-2 sm:right-1.5 top-1/2 -translate-y-1/2">
                  <svg className="h-3.5 w-3.5 sm:h-3 sm:w-3 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Список статей */}
      {loading ? (
        <div className="grid gap-3 sm:gap-4">
          <ArticleSkeleton count={3} />
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          icon={searchQuery ? '🔍' : '📝'}
          title={searchQuery ? `Ничего не найдено по запросу "${searchQuery}"` : 'Статьи пока не опубликованы'}
          description={searchQuery ? 'Попробуйте изменить поисковый запрос или очистить фильтры.' : 'Скоро здесь появятся полезные материалы!'}
        />
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/faq/${article.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-3 sm:p-4 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg active:scale-[0.98] touch-manipulation"
            >
              {/* Декоративный градиент */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-amber-500/10 dark:to-indigo-500/10" />
              
              <div className="relative flex flex-col gap-3 sm:flex-row sm:gap-4">
                {article.featured_image_url && (
                  <div className="h-40 sm:h-28 md:h-32 w-full sm:w-32 md:w-36 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 shadow-sm transition-transform duration-300 group-hover:scale-[1.02] dark:bg-slate-700">
                    <img
                      src={article.featured_image_url}
                      alt={article.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col justify-between gap-2 sm:gap-3 min-w-0">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {article.category && (
                        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-[10px] sm:text-[10px] font-medium text-slate-700 shadow-sm dark:bg-slate-700 dark:text-slate-300">
                          {article.category.name}
                        </span>
                      )}
                    </div>
                    <h2
                      className="mb-1.5 sm:mb-2 text-base sm:text-lg md:text-xl font-semibold text-slate-900 transition-colors group-hover:text-slate-700 dark:text-slate-100 dark:group-hover:text-slate-300 line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: searchQuery.trim() ? highlightText(article.title, searchQuery) : article.title,
                      }}
                    />
                    {article.excerpt && (
                      <p
                        className="mb-2 line-clamp-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400"
                        dangerouslySetInnerHTML={{
                          __html: searchQuery.trim() ? highlightText(article.excerpt, searchQuery) : article.excerpt,
                        }}
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-500">
                    {article.published_at && (
                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <span className="text-xs">📅</span>
                        <span className="hidden sm:inline">{formatDate(article.published_at)}</span>
                        <span className="sm:hidden">{new Date(article.published_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')}</span>
                      </span>
                    )}
                    {article.reading_time && (
                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <span className="text-xs">⏱️</span>
                        <span>{article.reading_time} мин</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                      <span className="text-xs">👁️</span>
                      <span>{article.views_count}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Индикатор перехода */}
              <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex h-7 w-7 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 opacity-0 sm:opacity-0 shadow-sm transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5 dark:bg-slate-700 dark:text-slate-400">
                <svg className="h-3.5 w-3.5 sm:h-3 sm:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Пагинация */}
      {!loading && totalCount > ARTICLES_PER_PAGE && (
        <section className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-3 sm:p-4 shadow-md transition-colors duration-200">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
          
          <div className="relative flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center sm:text-left">
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
            
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-center">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 sm:px-4 py-2 sm:py-1.5 min-h-[36px] sm:min-h-0 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 dark:disabled:hover:translate-y-0 touch-manipulation"
                type="button"
                aria-label="Предыдущая страница"
              >
                <svg className="h-4 w-4 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Предыдущая</span>
              </button>

              <div className="flex items-center gap-1 sm:gap-1.5">
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
                          <span className="px-1 sm:px-2 text-xs text-slate-500 dark:text-slate-400">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`inline-flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 touch-manipulation ${
                            currentPage === page
                              ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900'
                              : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600'
                          }`}
                          type="button"
                          aria-label={`Страница ${page}`}
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
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 sm:px-4 py-2 sm:py-1.5 min-h-[36px] sm:min-h-0 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 dark:disabled:hover:translate-y-0 touch-manipulation"
                type="button"
                aria-label="Следующая страница"
              >
                <span className="hidden sm:inline">Следующая</span>
                <svg className="h-4 w-4 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

