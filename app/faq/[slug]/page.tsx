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
import { ScrollToTop } from '@/components/ScrollToTop';

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
      
      {/* Кнопка "Наверх" */}
      <ScrollToTop />

      <div className="flex flex-col gap-2.5 sm:gap-4 w-full overflow-x-hidden">
        {/* Хлебные крошки */}
        <div className="w-full overflow-x-auto -mx-1 px-1">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Контент статьи */}
        <article className="w-full overflow-x-hidden">
          {/* Метаданные и категория - компактно вверху */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-4 sm:mb-6 pb-2.5 sm:pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 sm:gap-y-1.5">
              {article.category && (
                <Link
                  href={`/faq?category=${article.category.slug}`}
                  className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm transition-all duration-200 hover:from-amber-50 hover:to-amber-100/50 dark:hover:from-amber-900/30 dark:hover:to-amber-800/20 hover:border-amber-200 dark:hover:border-amber-800/50 hover:-translate-y-0.5 hover:shadow-md active:scale-95 touch-manipulation border border-transparent min-h-[28px] sm:min-h-[32px]"
                >
                  <span className="text-[9px] sm:text-[10px]">📂</span>
                  <span className="line-clamp-1">{article.category.name}</span>
                </Link>
              )}
              <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-[9px] sm:text-xs text-slate-600 dark:text-slate-400">
                {article.published_at && (
                  <span className="inline-flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                    <span className="text-[9px] sm:text-[10px]">📅</span>
                    <span className="hidden sm:inline">{formatDate(article.published_at)}</span>
                    <span className="sm:hidden">{new Date(article.published_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </span>
                )}
                {article.reading_time && (
                  <span className="inline-flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                    <span className="text-[9px] sm:text-[10px]">⏱️</span>
                    <span>{article.reading_time} мин</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                  <span className="text-[9px] sm:text-[10px]">👁️</span>
                  <span>{article.views_count}</span>
                </span>
                {article.updated_at && article.updated_at !== article.published_at && (
                  <span className="inline-flex items-center gap-0.5 sm:gap-1 text-amber-600 dark:text-amber-400 whitespace-nowrap">
                    <span className="text-[9px] sm:text-[10px]">🔄</span>
                    <span className="hidden sm:inline">Обновлено </span>
                    <span className="hidden sm:inline">{formatDate(article.updated_at)}</span>
                    <span className="sm:hidden">{new Date(article.updated_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Кнопки поделиться */}
            <div className="w-full sm:w-auto overflow-x-auto -mx-1 px-1">
              <ShareButtons
                title={article.title}
                url={`/faq/${article.slug}`}
                description={article.excerpt || undefined}
              />
            </div>
          </div>

          {/* Markdown контент с заголовком */}
          <div className="prose prose-sm sm:prose-base md:prose-lg lg:prose-xl prose-slate max-w-none dark:prose-invert w-full 
            prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-slate-100
            prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4 sm:prose-p:mb-5 prose-p:mt-0 prose-p:text-sm sm:prose-p:text-base lg:prose-p:text-lg prose-p:leading-[1.7]
            prose-a:text-amber-600 dark:prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline prose-a:text-sm sm:prose-a:text-base lg:prose-a:text-lg
            prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-strong:font-semibold
            prose-code:text-amber-700 dark:prose-code:text-amber-300 prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs sm:prose-code:text-sm prose-code:font-mono
            prose-pre:bg-slate-900 dark:prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-300 dark:prose-pre:border-slate-700 prose-pre:text-xs sm:prose-pre:text-sm prose-pre:overflow-x-auto prose-pre:font-mono
            prose-blockquote:border-l-amber-500 dark:prose-blockquote:border-l-amber-400 prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-slate-800/50 prose-blockquote:py-2 prose-blockquote:px-3 sm:prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:my-4 sm:prose-blockquote:my-6 prose-blockquote:text-sm sm:prose-blockquote:text-base lg:prose-blockquote:text-lg prose-blockquote:leading-relaxed
            prose-ul:marker:text-amber-600 dark:prose-ul:marker:text-amber-400 prose-ul:mb-4 sm:prose-ul:mb-5 prose-ul:mt-0 prose-ul:pl-5 sm:prose-ul:pl-6 prose-ul:text-sm sm:prose-ul:text-base lg:prose-ul:text-lg
            prose-ol:marker:text-amber-600 dark:prose-ol:marker:text-amber-400 prose-ol:mb-4 sm:prose-ol:mb-5 prose-ol:mt-0 prose-ol:pl-5 sm:prose-ol:pl-6 prose-ol:text-sm sm:prose-ol:text-base lg:prose-ol:text-lg
            prose-li:my-1 sm:prose-li:my-1.5 prose-li:leading-relaxed
            prose-hr:border-slate-300 dark:prose-hr:border-slate-700 prose-hr:my-6 sm:prose-hr:my-8 lg:prose-hr:my-10
            prose-img:rounded-xl prose-img:shadow-md prose-img:my-6 sm:prose-img:my-8 lg:prose-img:my-10 prose-img:max-w-full prose-img:h-auto
            prose-table:border-slate-300 dark:prose-table:border-slate-700 prose-table:my-4 sm:prose-table:my-6 lg:prose-table:my-8 prose-table:text-xs sm:prose-table:text-sm prose-table:overflow-x-auto prose-table:block
            prose-h1:text-3xl prose-h1:sm:text-4xl prose-h1:md:text-5xl prose-h1:lg:text-7xl prose-h1:xl:text-8xl prose-h1:2xl:text-9xl prose-h1:font-bold prose-h1:leading-tight prose-h1:tracking-tight prose-h1:mb-4 sm:prose-h1:mb-5 lg:prose-h1:mb-6 prose-h1:mt-0
            prose-h2:text-base prose-h2:sm:text-lg prose-h2:md:text-xl prose-h2:lg:text-2xl prose-h2:xl:text-2xl prose-h2:2xl:text-3xl prose-h2:font-bold prose-h2:mt-6 sm:prose-h2:mt-8 lg:prose-h2:mt-10 prose-h2:mb-2.5 sm:prose-h2:mb-3 lg:prose-h2:mb-4 prose-h2:leading-tight prose-h2:first:mt-4 sm:prose-h2:first:mt-5 lg:prose-h2:first:mt-6
            prose-h3:text-sm prose-h3:sm:text-base prose-h3:md:text-lg prose-h3:lg:text-xl prose-h3:xl:text-xl prose-h3:2xl:text-2xl prose-h3:font-bold prose-h3:mt-5 sm:prose-h3:mt-6 lg:prose-h3:mt-8 prose-h3:mb-2 sm:prose-h3:mb-2.5 lg:prose-h3:mb-3 prose-h3:leading-tight
            prose-h4:text-xs prose-h4:sm:text-sm prose-h4:md:text-base prose-h4:lg:text-lg prose-h4:xl:text-lg prose-h4:2xl:text-xl prose-h4:font-bold prose-h4:mt-4 sm:prose-h4:mt-5 lg:prose-h4:mt-6 prose-h4:mb-1.5 sm:prose-h4:mb-2 lg:prose-h4:mb-2.5 prose-h4:leading-tight">
            {/* Заголовок статьи - перед контентом */}
            <h1 className="!text-3xl !sm:text-4xl !md:text-5xl !lg:text-7xl !xl:text-8xl !2xl:text-9xl !font-bold !leading-tight !tracking-tight !mb-4 !sm:mb-5 !lg:mb-6 !mt-0 !bg-gradient-to-r !from-slate-900 !to-slate-700 dark:!from-slate-100 dark:!to-slate-300 !bg-clip-text !text-transparent break-words">
              {article.title}
            </h1>
            <MarkdownContent content={article.content} articleTitle={article.title} />
          </div>
        </article>

        {/* Теги */}
        {article.seo_keywords && article.seo_keywords.length > 0 && (
          <div className="w-full pt-2.5 sm:pt-4 border-t border-slate-300 dark:border-slate-700 overflow-x-hidden">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-2.5">
              <span className="text-[10px] sm:text-xs">🏷️</span>
              <span className="text-[9px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Теги:</span>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-1.5 sm:gap-2">
              {article.seo_keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-800/20 border border-amber-200 dark:border-amber-800/50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-xs font-medium text-amber-700 dark:text-amber-300 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105 break-words min-h-[24px] sm:min-h-[28px]"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Похожие статьи */}
        {relatedArticles.length > 0 && (
          <div className="w-full pt-2.5 sm:pt-4 border-t border-slate-300 dark:border-slate-700 overflow-x-hidden">
            <div className="flex items-center gap-1.5 mb-2 sm:mb-2.5">
              <span className="text-[10px] sm:text-xs">📚</span>
              <h3 className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-900 dark:text-slate-100">
                Похожие статьи
              </h3>
            </div>
            <div className="grid gap-2 sm:gap-2.5 sm:grid-cols-2">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/faq/${related.slug}`}
                  className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-2 sm:p-2.5 shadow-sm sm:shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md sm:hover:shadow-lg active:scale-[0.98] touch-manipulation min-h-[60px] sm:min-h-[80px]"
                >
                  {/* Декоративный градиент */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-amber-500/10 dark:to-indigo-500/10" />
                  
                  <div className="relative flex flex-col gap-0.5 sm:gap-1 pr-5 sm:pr-6">
                    <h4 className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-900 group-hover:text-amber-600 dark:text-slate-100 dark:group-hover:text-amber-400 line-clamp-2 break-words transition-colors leading-tight">
                      {related.title}
                    </h4>
                    {related.excerpt && (
                      <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-600 dark:text-slate-400 line-clamp-2 break-words leading-relaxed">
                        {related.excerpt}
                      </p>
                    )}
                  </div>
                  
                  {/* Индикатор перехода */}
                  <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-800/20 text-amber-600 dark:text-amber-400 opacity-0 shadow-sm transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:scale-110">
                    <svg className="h-2 w-2 sm:h-2.5 sm:w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Навигация */}
        <div className="w-full pt-2.5 sm:pt-4 border-t border-slate-300 dark:border-slate-700 overflow-x-hidden relative">
          {/* Декоративная линия */}
          <div className="absolute top-0 left-0 w-8 sm:w-12 h-0.5 bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full"></div>
          <div className="flex flex-col gap-2 sm:gap-2.5 sm:flex-row sm:justify-between sm:items-center">
            {navigation.prev ? (
              <Link
                href={`/faq/${navigation.prev.slug}`}
                className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-2 sm:p-2.5 shadow-sm sm:shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md sm:hover:shadow-lg active:scale-[0.98] touch-manipulation sm:flex-1 min-w-0 min-h-[60px] sm:min-h-[70px]"
              >
                {/* Декоративный градиент */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-amber-500/10 dark:to-indigo-500/10" />
                
                <div className="relative flex items-center gap-1.5 sm:gap-2">
                  <div className="flex-shrink-0 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-400 transition-all duration-300 group-hover:from-amber-50 group-hover:to-amber-100/50 dark:group-hover:from-amber-900/30 dark:group-hover:to-amber-800/20 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:scale-110 shadow-sm">
                    <svg
                      className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform group-hover:-translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="text-[9px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wider">
                      Предыдущая
                    </div>
                    <div className="text-[10px] sm:text-xs font-semibold text-slate-900 dark:text-slate-100 truncate break-words group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-tight">
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
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl sm:rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 px-2.5 sm:px-3 py-2 text-[10px] sm:text-xs font-medium text-slate-700 shadow-sm sm:shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md sm:hover:shadow-lg dark:text-slate-300 sm:mx-2.5 whitespace-nowrap active:scale-[0.98] touch-manipulation hover:bg-gradient-to-br hover:from-amber-50 hover:to-amber-100/50 dark:hover:from-amber-900/20 dark:hover:to-amber-800/10 min-h-[40px] sm:min-h-[44px]"
            >
              <span className="text-[9px] sm:text-[10px]">📚</span>
              <span>Все статьи</span>
            </Link>

            {navigation.next ? (
              <Link
                href={`/faq/${navigation.next.slug}`}
                className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-2 sm:p-2.5 shadow-sm sm:shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md sm:hover:shadow-lg active:scale-[0.98] touch-manipulation sm:flex-1 min-w-0 min-h-[60px] sm:min-h-[70px]"
              >
                {/* Декоративный градиент */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-amber-500/10 dark:to-indigo-500/10" />
                
                <div className="relative flex items-center gap-1.5 sm:gap-2 text-right">
                  <div className="min-w-0 flex-1 text-right overflow-hidden">
                    <div className="text-[9px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wider">
                      Следующая
                    </div>
                    <div className="text-[10px] sm:text-xs font-semibold text-slate-900 dark:text-slate-100 truncate break-words group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-tight">
                      {navigation.next.title}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-400 transition-all duration-300 group-hover:from-amber-50 group-hover:to-amber-100/50 dark:group-hover:from-amber-900/30 dark:group-hover:to-amber-800/20 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:scale-110 shadow-sm">
                    <svg
                      className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform group-hover:translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
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

