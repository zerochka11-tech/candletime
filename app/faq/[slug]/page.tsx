'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { generateArticleStructuredData } from '@/lib/seo';
import { MarkdownContent } from '@/components/MarkdownContent';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ReadingProgress } from '@/components/ReadingProgress';
import { ShareButtons } from '@/components/ShareButtons';

type Article = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  published_at: string | null;
  updated_at: string;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  views_count: number;
  reading_time: number | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
};

type RelatedArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string | null;
};

type NavigationArticle = {
  id: string;
  title: string;
  slug: string;
};

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [navigation, setNavigation] = useState<{
    prev: NavigationArticle | null;
    next: NavigationArticle | null;
  }>({ prev: null, next: null });

  useEffect(() => {
    if (slug) {
      loadArticle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (article) {
      // Добавляем структурированные данные (синхронно)
      addStructuredData();
      // Параллельная загрузка похожих статей и навигации
      Promise.all([
        loadRelatedArticles(),
        loadNavigation()
      ]).catch((error) => {
        console.error('Error loading related data:', error);
      });
      // Увеличиваем счетчик просмотров в фоне (не блокирует)
      incrementViews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article]);

  const loadArticle = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          slug,
          content,
          excerpt,
          published_at,
          updated_at,
          views_count,
          reading_time,
          seo_title,
          seo_description,
          seo_keywords,
          article_categories (
            id,
            name,
            slug
          )
        `)
        .eq('slug', slug)
        .eq('published', true)
        .not('published_at', 'is', null)
        .lte('published_at', new Date().toISOString())
        .single();

      if (error || !data) {
        setNotFound(true);
        return;
      }

      const formattedArticle = {
        id: data.id,
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        published_at: data.published_at,
        updated_at: data.updated_at,
        views_count: data.views_count || 0,
        reading_time: data.reading_time,
        seo_title: data.seo_title,
        seo_description: data.seo_description,
        seo_keywords: data.seo_keywords,
        category: (data.article_categories as any) || null,
      };

      setArticle(formattedArticle);
    } catch (error) {
      console.error('Error loading article:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async () => {
    if (!article) return;

    // Выполняем в фоне, не блокируем рендер
    setTimeout(async () => {
      try {
        await supabase.rpc('increment_article_views', {
          article_uuid: article.id,
        });
      } catch (error) {
        // Игнорируем ошибки при увеличении счетчика
        console.error('Error incrementing views:', error);
      }
    }, 100);
  };

  const addStructuredData = () => {
    if (!article) return;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://candletime.ru';
    const structuredData = generateArticleStructuredData({
      title: article.title,
      description: article.excerpt || article.seo_description || article.title,
      content: article.content,
      publishedAt: article.published_at!,
      modifiedAt: article.updated_at,
      url: `${siteUrl}/faq/${article.slug}`,
      author: {
        name: 'CandleTime',
      },
    });

    // Удаляем старые структурированные данные
    const existingScript = document.querySelector('script[data-article-structured]');
    if (existingScript) {
      existingScript.remove();
    }

    // Добавляем новые
    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-article-structured', 'true');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  };

  const loadRelatedArticles = async () => {
    if (!article?.category) return;

    try {
      const { data } = await supabase
        .from('articles')
        .select('id, title, slug, excerpt, published_at')
        .eq('category_id', article.category.id)
        .neq('id', article.id)
        .eq('published', true)
        .not('published_at', 'is', null)
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false })
        .limit(3);

      if (data) {
        setRelatedArticles(data as RelatedArticle[]);
      }
    } catch (error) {
      console.error('Error loading related articles:', error);
    }
  };

  const loadNavigation = async () => {
    if (!article?.category || !article.published_at) return;

    try {
      // Оптимизированная навигация: два отдельных запроса вместо загрузки всех статей
      const [prevResult, nextResult] = await Promise.all([
        // Предыдущая статья (более старая по дате публикации)
        supabase
          .from('articles')
          .select('id, title, slug')
          .eq('category_id', article.category.id)
          .eq('published', true)
          .not('published_at', 'is', null)
          .lt('published_at', article.published_at)
          .order('published_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        
        // Следующая статья (более новая по дате публикации)
        supabase
          .from('articles')
          .select('id, title, slug')
          .eq('category_id', article.category.id)
          .eq('published', true)
          .not('published_at', 'is', null)
          .gt('published_at', article.published_at)
          .order('published_at', { ascending: true })
          .limit(1)
          .maybeSingle()
      ]);

      setNavigation({
        prev: prevResult.data || null,
        next: nextResult.data || null,
      });
    } catch (error) {
      console.error('Error loading navigation:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3 sm:gap-4 w-full overflow-x-hidden">
        <div className="w-full animate-pulse">
          <div className="h-8 w-3/4 rounded-2xl bg-slate-200 dark:bg-slate-700 mb-3 sm:mb-4" />
          <div className="h-4 w-full rounded-2xl bg-slate-200 dark:bg-slate-700 mb-2" />
          <div className="h-4 w-2/3 rounded-2xl bg-slate-200 dark:bg-slate-700 mb-3 sm:mb-4" />
          <div className="space-y-3">
            <div className="h-4 w-full rounded-2xl bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-full rounded-2xl bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-5/6 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="flex flex-col gap-3 sm:gap-4 w-full overflow-x-hidden">
        <section className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-6 sm:p-8 md:p-10 text-center shadow-md transition-colors duration-200">
          {/* Декоративный градиент */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
          
          <div className="relative">
            <div className="mb-3 sm:mb-4 inline-flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 text-xl sm:text-2xl md:text-3xl shadow-sm">
              🔍
            </div>
            <h1 className="mb-3 sm:mb-4 text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 break-words">
              Статья не найдена
            </h1>
            <p className="mb-4 sm:mb-6 text-sm sm:text-base text-slate-600 dark:text-slate-400 break-words">
              Запрашиваемая статья не существует или еще не опубликована.
            </p>
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 dark:bg-slate-100 px-6 py-3 text-sm font-medium text-white dark:text-slate-900 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-slate-200 hover:shadow-lg active:scale-[0.98] touch-manipulation"
            >
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="whitespace-nowrap">Вернуться к списку статей</span>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // Формируем хлебные крошки
  const breadcrumbItems = [
    { name: 'Главная', url: '/' },
    { name: 'FAQ и Статьи', url: '/faq' },
  ];

  if (article.category) {
    breadcrumbItems.push({
      name: article.category.name,
      url: `/faq?category=${article.category.slug}`,
    });
  }

  breadcrumbItems.push({
    name: article.title,
    url: `/faq/${article.slug}`,
  });

  return (
    <>
      {/* Прогресс-бар чтения */}
      <ReadingProgress />

      <div className="flex flex-col gap-3 sm:gap-4 w-full overflow-x-hidden">
        {/* Хлебные крошки */}
        <div className="w-full overflow-x-auto">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Заголовок и метаданные */}
        <header className="flex flex-col gap-3 sm:gap-4 w-full">
          <div className="flex flex-col gap-3 w-full">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl md:text-4xl lg:text-5xl leading-tight tracking-tight break-words">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="text-base text-slate-600 dark:text-slate-400 sm:text-lg md:text-xl leading-relaxed break-words">
                {article.excerpt}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 w-full">
            {article.published_at && (
              <span className="whitespace-nowrap">{formatDate(article.published_at)}</span>
            )}
            {article.reading_time && (
              <span className="whitespace-nowrap">{article.reading_time} мин чтения</span>
            )}
            <span className="whitespace-nowrap">{article.views_count} просмотров</span>
            {article.updated_at && article.updated_at !== article.published_at && (
              <span className="text-amber-600 dark:text-amber-400 whitespace-nowrap">
                Обновлено {formatDate(article.updated_at)}
              </span>
            )}
          </div>

          {/* Кнопки поделиться */}
          <div className="pt-3 w-full overflow-x-auto">
            <ShareButtons
              title={article.title}
              url={`/faq/${article.slug}`}
              description={article.excerpt || undefined}
            />
          </div>
        </header>

        {/* Разделитель */}
        <div className="w-full border-b border-slate-300 dark:border-slate-600 mt-2"></div>

        {/* Контент статьи */}
        <article className="w-full overflow-x-hidden -mt-1">
          <div className="prose prose-lg prose-slate max-w-none dark:prose-invert w-full">
            <MarkdownContent content={article.content} articleTitle={article.title} />
          </div>
        </article>

        {/* Теги */}
        {article.seo_keywords && article.seo_keywords.length > 0 && (
          <div className="w-full pt-3 sm:pt-4 border-t border-slate-300 dark:border-slate-700 overflow-x-hidden">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {article.seo_keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm dark:bg-slate-700 dark:text-slate-300 break-words"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Похожие статьи */}
        {relatedArticles.length > 0 && (
          <div className="w-full pt-3 sm:pt-4 border-t border-slate-300 dark:border-slate-700 overflow-x-hidden">
            <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
              Похожие статьи
            </h3>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/faq/${related.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-3 sm:p-4 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg active:scale-[0.98] touch-manipulation"
                >
                  {/* Декоративный градиент */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-amber-500/10 dark:to-indigo-500/10" />
                  
                  <div className="relative flex flex-col gap-2">
                    <h4 className="text-sm sm:text-base font-semibold text-slate-900 group-hover:text-slate-700 dark:text-slate-100 dark:group-hover:text-slate-300 line-clamp-2 break-words transition-colors">
                      {related.title}
                    </h4>
                    {related.excerpt && (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 break-words">
                        {related.excerpt}
                      </p>
                    )}
                  </div>
                  
                  {/* Индикатор перехода */}
                  <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 opacity-0 shadow-sm transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5 dark:bg-slate-700 dark:text-slate-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Навигация */}
        <div className="w-full pt-3 sm:pt-4 border-t border-slate-300 dark:border-slate-700 overflow-x-hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-stretch">
            {navigation.prev ? (
              <Link
                href={`/faq/${navigation.prev.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-3 sm:p-4 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg active:scale-[0.98] touch-manipulation sm:flex-1 min-w-0"
              >
                {/* Декоративный градиент */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-amber-500/10 dark:to-indigo-500/10" />
                
                <div className="relative flex items-center gap-2 sm:gap-3">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-slate-400 transition-transform group-hover:-translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 whitespace-nowrap">Предыдущая статья</div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate break-words">
                      {navigation.prev.title}
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="hidden sm:block flex-1" />
            )}

            <Link
              href="/faq"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 px-4 py-3 text-xs sm:text-sm font-medium text-slate-700 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg dark:text-slate-300 sm:mx-4 whitespace-nowrap active:scale-[0.98] touch-manipulation"
            >
              Все статьи
            </Link>

            {navigation.next ? (
              <Link
                href={`/faq/${navigation.next.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-3 sm:p-4 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg active:scale-[0.98] touch-manipulation sm:flex-1 min-w-0"
              >
                {/* Декоративный градиент */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-amber-500/10 dark:to-indigo-500/10" />
                
                <div className="relative flex items-center gap-2 sm:gap-3 text-right">
                  <div className="min-w-0 flex-1 text-right overflow-hidden">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 whitespace-nowrap">Следующая статья</div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate break-words">
                      {navigation.next.title}
                    </div>
                  </div>
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ) : (
              <div className="hidden sm:block flex-1" />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

