import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateArticle } from '@/lib/gemini';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Проверка прав администратора
async function checkAdminAuth(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { error: 'Unauthorized', user: null };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return { error: 'Unauthorized', user: null };
  }

  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || process.env.ADMIN_EMAILS?.split(',') || [];
  const normalizedAdminEmails = adminEmails.map((email) => email.trim().toLowerCase()).filter(Boolean);
  
  if (!normalizedAdminEmails.includes((user.email || '').toLowerCase())) {
    return { error: 'Forbidden', user: null };
  }

  return { error: null, user };
}

export async function POST(request: NextRequest) {
  try {
    // Проверка прав
    const { error: authError, user } = await checkAdminAuth(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { topic, candleType, language, categoryId } = body;

    // Валидация входных данных
    if (!topic || typeof topic !== 'string' || topic.trim().length < 10) {
      return NextResponse.json(
        { error: 'Topic must be at least 10 characters long' },
        { status: 400 }
      );
    }

    if (topic.length > 200) {
      return NextResponse.json(
        { error: 'Topic must be less than 200 characters' },
        { status: 400 }
      );
    }

    // Генерация статьи через Gemini
    const generated = await generateArticle({
      topic: topic.trim(),
      candleType: candleType || undefined,
      language: language || 'ru',
    });

    // Сохранение в БД
    const supabaseAdmin = getSupabaseAdmin();

    // Проверяем, существует ли уже статья с таким slug
    const { data: existing } = await supabaseAdmin
      .from('articles')
      .select('id, slug')
      .eq('slug', generated.slug)
      .maybeSingle();

    let articleId: string;
    let action: 'created' | 'updated';

    if (existing) {
      // Обновляем существующую статью
      const { data, error } = await supabaseAdmin
        .from('articles')
        .update({
          title: generated.title,
          content: generated.content,
          excerpt: generated.excerpt,
          reading_time: generated.readingTime,
          seo_title: generated.seoTitle,
          seo_description: generated.seoDescription,
          seo_keywords: generated.seoKeywords,
          updated_at: new Date().toISOString(),
          author_id: user.id,
          ...(categoryId && { category_id: categoryId }),
        })
        .eq('slug', generated.slug)
        .select('id')
        .single();

      if (error) {
        console.error('Error updating article:', error);
        return NextResponse.json(
          { error: `Failed to update article: ${error.message}` },
          { status: 500 }
        );
      }

      articleId = data.id;
      action = 'updated';
    } else {
      // Создаем новую статью
      const { data, error } = await supabaseAdmin
        .from('articles')
        .insert({
          title: generated.title,
          slug: generated.slug,
          content: generated.content,
          excerpt: generated.excerpt,
          reading_time: generated.readingTime,
          seo_title: generated.seoTitle,
          seo_description: generated.seoDescription,
          seo_keywords: generated.seoKeywords,
          author_id: user.id,
          published: false, // Всегда создаем как черновик
          published_at: null,
          ...(categoryId && { category_id: categoryId }),
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating article:', error);
        return NextResponse.json(
          { error: `Failed to create article: ${error.message}` },
          { status: 500 }
        );
      }

      articleId = data.id;
      action = 'created';
    }

    return NextResponse.json({
      success: true,
      article: {
        id: articleId,
        ...generated,
      },
      action,
    });
  } catch (error: any) {
    console.error('Error generating article:', error);
    
    // Обработка специфичных ошибок Gemini API
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured. Please set GEMINI_API_KEY in environment variables.' },
        { status: 500 }
      );
    }

    // Обработка rate limit ошибок
    const errorMessage = error.message?.toLowerCase() || '';
    if (
      errorMessage.includes('quota') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('resource_exhausted') ||
      errorMessage.includes('429')
    ) {
      return NextResponse.json(
        { 
          error: 'API rate limit exceeded. Пожалуйста, подождите несколько минут и попробуйте снова. ' +
                 'Gemini API имеет ограничения на количество запросов в минуту. ' +
                 'Вы можете проверить лимиты в Google AI Studio.'
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate article. Please try again.' },
      { status: 500 }
    );
  }
}

