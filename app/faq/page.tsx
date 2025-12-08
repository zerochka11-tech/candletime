'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { generateCandlesItemList } from '@/lib/seo';

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

export default function FAQPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Загружаем категории
      const { data: categoriesData } = await supabase
        .from('article_categories')
        .select('id, name, slug')
        .order('name');

      if (categoriesData) {
        setCategories(categoriesData);
      }

      // Загружаем статьи
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
        `)
        .eq('published', true)
        .not('published_at', 'is', null)
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data: articlesData, error } = await query;

      if (error) {
        console.error('Error loading articles:', error);
        return;
      }

      if (articlesData) {
        const formattedArticles = articlesData.map((article: any) => ({
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
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Заголовок */}
      <div className="mb-8 text-center">
        <h1 className="mb-3 text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
          FAQ и Статьи
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Ответы на вопросы и полезные материалы о CandleTime
        </p>
      </div>

      {/* Фильтр по категориям */}
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selectedCategory === null
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Все
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {/* Список статей */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800 animate-pulse"
            >
              <div className="h-6 w-3/4 rounded bg-slate-200 dark:bg-slate-700 mb-3" />
              <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700 mb-2" />
              <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-800">
          <p className="text-slate-600 dark:text-slate-400">
            Статьи пока не опубликованы. Скоро здесь появятся полезные материалы!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/faq/${article.slug}`}
              className="group block rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-800 dark:hover:border-slate-700"
            >
              <div className="flex flex-col gap-4 sm:flex-row">
                {article.featured_image_url && (
                  <div className="h-32 w-full flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-32 dark:bg-slate-700">
                    <img
                      src={article.featured_image_url}
                      alt={article.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  {article.category && (
                    <span className="mb-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      {article.category.name}
                    </span>
                  )}
                  <h2 className="mb-2 text-xl font-semibold text-slate-900 transition-colors group-hover:text-slate-700 dark:text-slate-100 dark:group-hover:text-slate-300">
                    {article.title}
                  </h2>
                  {article.excerpt && (
                    <p className="mb-3 text-slate-600 dark:text-slate-400">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-500">
                    {article.published_at && (
                      <span>{formatDate(article.published_at)}</span>
                    )}
                    {article.reading_time && (
                      <span>⏱️ {article.reading_time} мин чтения</span>
                    )}
                    <span>👁️ {article.views_count} просмотров</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

