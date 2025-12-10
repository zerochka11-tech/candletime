import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateArticle } from '@/lib/gemini';
import { replaceTemplateVariables, createVariablesFromSimpleMode, validateTemplateVariables } from '@/lib/promptTemplates';

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
    const { 
      topic, 
      candleType, 
      language, 
      categoryId,
      // Новые поля для режима шаблона
      templateId,
      templateVariables,
      useTemplate = false,
    } = body;

    let finalPrompt: string | undefined;

    // Если используется режим шаблона
    if (useTemplate && templateId) {
      const supabaseAdmin = getSupabaseAdmin();

      // Получаем шаблон
      const { data: template, error: templateError } = await supabaseAdmin
        .from('prompt_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError || !template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      // В режиме шаблона используем промпт как есть, без подстановки переменных
      // Мастер-промпт должен быть самодостаточным и содержать всю необходимую информацию
      finalPrompt = template.prompt;
    } else {
      // Простой режим - валидация входных данных
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
    }

    // Генерация статьи через Gemini
    // В режиме шаблона промпт самодостаточен, в простом режиме используем стандартные параметры
    const generated = await generateArticle({
      topic: useTemplate ? 'Generated from template' : topic?.trim() || '',
      candleType: useTemplate ? undefined : (candleType || undefined),
      language: useTemplate ? 'ru' : (language || 'ru') as 'ru' | 'en',
      customPrompt: finalPrompt,
    });

    // Сохранение в БД
    const supabaseAdmin = getSupabaseAdmin();

    // Определяем category_id на основе categorySlug из генерации или переданного categoryId
    let finalCategoryId: string | null = null;
    
    if (categoryId) {
      // Если категория передана вручную, используем её
      finalCategoryId = categoryId;
    } else if (generated.categorySlug) {
      // Если категория определена автоматически, получаем её ID
      const { data: category } = await supabaseAdmin
        .from('article_categories')
        .select('id')
        .eq('slug', generated.categorySlug)
        .single();
      
      if (category) {
        finalCategoryId = category.id;
      }
    }

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
          ...(finalCategoryId && { category_id: finalCategoryId }),
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
      // Проверяем, что slug не пустой
      if (!generated.slug || generated.slug.trim().length === 0) {
        console.error('Generated slug is empty. Title:', generated.title);
        return NextResponse.json(
          { error: 'Failed to generate slug. Please try again or edit the article manually.' },
          { status: 500 }
        );
      }

      // Проверяем, что контент не пустой
      if (!generated.content || generated.content.trim().length === 0) {
        console.error('Generated content is empty');
        return NextResponse.json(
          { error: 'Generated content is empty. Please check the prompt template.' },
          { status: 500 }
        );
      }

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
          ...(finalCategoryId && { category_id: finalCategoryId }),
        })
        .select('id, slug')
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

