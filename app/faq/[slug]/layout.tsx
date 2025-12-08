import { Metadata } from 'next';
import { generateMetadata as generateBaseMetadata, generateBreadcrumbList } from '@/lib/seo';
import { createClient } from '@supabase/supabase-js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://candletime.ru';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data: article } = await supabase
      .from('articles')
      .select('title, seo_title, seo_description, excerpt')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (!article) {
      return generateBaseMetadata({
        title: 'Статья не найдена',
        description: 'Запрашиваемая статья не найдена',
        path: `/faq/${slug}`,
      });
    }

    const title = article.seo_title || article.title;
    const description = article.seo_description || article.excerpt || article.title;

    return generateBaseMetadata({
      title,
      description,
      path: `/faq/${slug}`,
      type: 'article',
    });
  } catch (error) {
    return generateBaseMetadata({
      title: 'Статья',
      description: 'Просмотр статьи',
      path: `/faq/${slug}`,
      type: 'article',
    });
  }
}

export default async function ArticleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const { data: article } = await supabase
      .from('articles')
      .select('title, category_id, article_categories(name, slug)')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (article) {
      const category = article.article_categories as any;
      const breadcrumbItems = [
        { name: 'Главная', url: siteUrl },
        { name: 'FAQ и Статьи', url: `${siteUrl}/faq` },
      ];

      if (category) {
        breadcrumbItems.push({
          name: category.name,
          url: `${siteUrl}/faq?category=${category.slug}`,
        });
      }

      breadcrumbItems.push({
        name: article.title,
        url: `${siteUrl}/faq/${slug}`,
      });

      const breadcrumbData = generateBreadcrumbList(breadcrumbItems);

      return (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
          />
          {children}
        </>
      );
    }
  } catch (error) {
    // Игнорируем ошибки
  }

  return <>{children}</>;
}

