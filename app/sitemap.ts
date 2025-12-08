import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://candletime.ru';

// Создаем клиент Supabase для серверной стороны
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Статические страницы
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/light`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/candles`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // Получаем активные свечи для динамических страниц
  try {
    const nowIso = new Date().toISOString();
    
    const { data: candles, error } = await supabase
      .from('candles')
      .select('id, created_at, expires_at')
      .gt('expires_at', nowIso)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1000); // Ограничиваем до 1000 свечей для производительности

    if (error) {
      console.error('Error fetching candles for sitemap:', error);
      return staticPages;
    }

    // Добавляем динамические страницы свечей
    const candlePages: MetadataRoute.Sitemap = (candles || []).map((candle) => ({
      url: `${siteUrl}/candle/${candle.id}`,
      lastModified: new Date(candle.created_at),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

    // Получаем опубликованные статьи
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('slug, updated_at, published_at')
      .eq('published', true)
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(500); // Ограничиваем до 500 статей

    const articlePages: MetadataRoute.Sitemap = (articles || []).map((article) => ({
      url: `${siteUrl}/faq/${article.slug}`,
      lastModified: article.updated_at ? new Date(article.updated_at) : new Date(article.published_at!),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...candlePages, ...articlePages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // В случае ошибки возвращаем хотя бы статические страницы
    return staticPages;
  }
}

