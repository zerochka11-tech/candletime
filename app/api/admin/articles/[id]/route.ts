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

// GET - получение одной статьи (для админ-панели)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError } = await checkAdminAuth(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const { id } = await params;

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      article: data,
    });
  } catch (error: any) {
    console.error('Error loading article:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - удаление статьи
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError } = await checkAdminAuth(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const { id } = await params;

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - обновление статьи (все поля)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError } = await checkAdminAuth(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const { id } = await params;
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

    const supabaseAdmin = getSupabaseAdmin();

    // Если меняется slug, проверяем уникальность
    if (slug) {
      // Валидация slug
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        return NextResponse.json(
          { error: 'Invalid slug format. Only lowercase letters, numbers, and hyphens are allowed.' },
          { status: 400 }
        );
      }

      const { data: existing } = await supabaseAdmin
        .from('articles')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Article with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Если указана категория, проверяем её существование
    if (category_id !== undefined) {
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
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title.trim();
    if (slug !== undefined) updateData.slug = slug.trim();
    if (excerpt !== undefined) updateData.excerpt = excerpt?.trim() || null;
    if (content !== undefined) updateData.content = content.trim();
    if (category_id !== undefined) updateData.category_id = category_id || null;
    if (seo_title !== undefined) updateData.seo_title = seo_title?.trim() || null;
    if (seo_description !== undefined) updateData.seo_description = seo_description?.trim() || null;
    if (seo_keywords !== undefined) {
      updateData.seo_keywords = seo_keywords && Array.isArray(seo_keywords) && seo_keywords.length > 0 ? seo_keywords : null;
    }
    if (featured_image_url !== undefined) updateData.featured_image_url = featured_image_url?.trim() || null;
    if (reading_time !== undefined) updateData.reading_time = reading_time || null;
    if (published !== undefined) {
      updateData.published = published;
      if (published && !published_at && updateData.published_at === undefined) {
        // Если публикуем и published_at не установлен, устанавливаем текущую дату
        updateData.published_at = new Date().toISOString();
      } else if (!published) {
        updateData.published_at = null;
      }
    }
    if (published_at !== undefined) {
      updateData.published_at = published_at || null;
    }

    const { data, error } = await supabaseAdmin
      .from('articles')
      .update(updateData)
      .eq('id', id)
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
    console.error('Error updating article:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

