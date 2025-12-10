import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

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
  const userEmail = (user.email || '').toLowerCase();
  
  if (!normalizedAdminEmails.includes(userEmail)) {
    return { error: 'Forbidden', user: null };
  }

  return { error: null, user };
}

// POST - создание новой статьи
export async function POST(request: NextRequest) {
  try {
    const { error: authError, user } = await checkAdminAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      category_id,
      seo_title,
      seo_description,
      seo_keywords,
      featured_image_url,
      reading_time,
      published,
      published_at,
    } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, content' },
        { status: 400 }
      );
    }

    // Валидация slug
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Invalid slug format. Only lowercase letters, numbers, and hyphens are allowed.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Проверяем уникальность slug
    const { data: existing } = await supabaseAdmin
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Article with this slug already exists' },
        { status: 400 }
      );
    }

    // Если указана категория, проверяем её существование
    if (category_id) {
      const { data: category } = await supabaseAdmin
        .from('article_categories')
        .select('id')
        .eq('id', category_id)
        .single();

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 400 }
        );
      }
    }

    // Создаем статью
    const { data, error } = await supabaseAdmin
      .from('articles')
      .insert({
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt?.trim() || null,
        content: content.trim(),
        category_id: category_id || null,
        author_id: user.id,
        seo_title: seo_title?.trim() || null,
        seo_description: seo_description?.trim() || null,
        seo_keywords: seo_keywords && Array.isArray(seo_keywords) && seo_keywords.length > 0 ? seo_keywords : null,
        featured_image_url: featured_image_url?.trim() || null,
        reading_time: reading_time || null,
        published: published || false,
        published_at: published && published_at ? published_at : (published ? new Date().toISOString() : null),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      article: data,
    });
  } catch (error: any) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - получение списка статей (для админ-панели)
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await checkAdminAuth(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const searchParams = request.nextUrl.searchParams;
    
    const filter = searchParams.get('filter') || 'all'; // 'all' | 'published' | 'draft'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '50', 10);
    
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage - 1;

    // Загружаем только нужные поля (БЕЗ content для списка!)
    let query = supabaseAdmin
      .from('articles')
      .select(`
        id,
        title,
        slug,
        excerpt,
        published,
        published_at,
        created_at,
        updated_at,
        views_count,
        reading_time,
        seo_title,
        seo_description,
        author_id
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(startIndex, endIndex);

    if (filter === 'published') {
      query = query.eq('published', true);
    } else if (filter === 'draft') {
      query = query.eq('published', false);
    }
    // 'all' - без фильтра, показываем все

    const { data, error, count } = await query;

    if (error) {
      console.error('Error loading articles:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to load articles' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      articles: data || [],
      count: count || 0,
      page,
      perPage,
    });
  } catch (error: any) {
    console.error('Error loading articles:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

