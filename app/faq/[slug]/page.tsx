'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { generateArticleStructuredData } from '@/lib/seo';
import { MarkdownContent } from '@/components/MarkdownContent';
import { Breadcrumbs } from '@/components/Breadcrumbs';

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

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      loadArticle();
    }
  }, [slug]);

  useEffect(() => {
    if (article) {
      // Увеличиваем счетчик просмотров
      incrementViews();
      // Добавляем структурированные данные
      addStructuredData();
    }
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

    try {
      await supabase.rpc('increment_article_views', {
        article_uuid: article.id,
      });
    } catch (error) {
      // Игнорируем ошибки при увеличении счетчика
      console.error('Error incrementing views:', error);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-64 w-full rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-800">
          <h1 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Статья не найдена
          </h1>
          <p className="mb-6 text-slate-600 dark:text-slate-400">
            Запрашиваемая статья не существует или еще не опубликована.
          </p>
          <Link
            href="/faq"
            className="inline-block rounded-full bg-slate-900 px-6 py-3 text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Вернуться к списку статей
          </Link>
        </div>
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
    <article className="mx-auto w-full max-w-4xl">
      {/* Хлебные крошки */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Заголовок */}
      <header className="mb-8 pb-8 border-b-2 border-slate-200 dark:border-slate-800">
        {article.category && (
          <Link
            href={`/faq?category=${article.category.slug}`}
            className="mb-4 inline-block rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {article.category.name}
          </Link>
        )}
        <h1 className="mb-4 text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
          {article.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-500">
          {article.published_at && (
            <span>📅 {formatDate(article.published_at)}</span>
          )}
          {article.reading_time && (
            <span>⏱️ {article.reading_time} мин чтения</span>
          )}
          <span>👁️ {article.views_count} просмотров</span>
        </div>
      </header>

      {/* Контент статьи */}
      <div className="mt-8">
        <MarkdownContent content={article.content} articleTitle={article.title} />
      </div>

      {/* Ключевые слова (если есть) */}
      {article.seo_keywords && article.seo_keywords.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Теги:
          </span>
          {article.seo_keywords.map((keyword, index) => (
            <span
              key={index}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      {/* Навигация */}
      <div className="mt-12 flex justify-between border-t border-slate-200 pt-8 dark:border-slate-800">
        <Link
          href="/faq"
          className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          ← Все статьи
        </Link>
      </div>
    </article>
  );
}

