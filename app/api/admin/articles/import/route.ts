import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

  // Простая проверка: можно расширить через таблицу ролей
  // Используем NEXT_PUBLIC_ADMIN_EMAILS для единообразия
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || process.env.ADMIN_EMAILS?.split(',') || [];
  if (!adminEmails.includes(user.email || '')) {
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
    const { slug, filename } = body;

    if (!slug || !filename) {
      return NextResponse.json(
        { error: 'Missing slug or filename' },
        { status: 400 }
      );
    }

    // Читаем файл из seo-articles
    const filePath = path.join(process.cwd(), 'seo-articles', filename);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    // Парсим Markdown: извлекаем H1 как title, остальное как content
    const lines = content.split('\n');
    let title = '';
    let contentStart = 0;

    // Ищем H1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('# ')) {
        title = lines[i].replace(/^# /, '').trim();
        contentStart = i + 1;
        break;
      }
    }

    if (!title) {
      // Если нет H1, используем slug как title
      title = slug
        .split('-')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    // Остальной контент
    const articleContent = lines.slice(contentStart).join('\n').trim();

    // Генерируем excerpt из первых 150 символов
    const excerpt = articleContent
      .replace(/[#*\[\]]/g, '')
      .substring(0, 150)
      .trim() + '...';

    // Вычисляем время чтения (примерно 200 слов в минуту)
    const wordCount = articleContent.split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const supabaseAdmin = getSupabaseAdmin();
    
    // Проверяем, существует ли уже статья
    const { data: existing } = await supabaseAdmin
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      // Обновляем существующую статью
      const { data, error } = await supabaseAdmin
        .from('articles')
        .update({
          title,
          content: articleContent,
          excerpt,
          reading_time: readingTime,
          updated_at: new Date().toISOString(),
        })
        .eq('slug', slug)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        article: data,
        action: 'updated',
      });
    } else {
      // Создаем новую статью
      const { data, error } = await supabaseAdmin
        .from('articles')
        .insert({
          title,
          slug,
          content: articleContent,
          excerpt,
          reading_time: readingTime,
          author_id: user.id,
          published: false, // По умолчанию не опубликована
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        article: data,
        action: 'created',
      });
    }
  } catch (error: any) {
    console.error('Error importing article:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET список файлов из seo-articles
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await checkAdminAuth(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const articlesDir = path.join(process.cwd(), 'seo-articles');
    
    if (!fs.existsSync(articlesDir)) {
      return NextResponse.json({ files: [] });
    }

    const files = fs.readdirSync(articlesDir)
      .filter((file) => file.endsWith('.md'))
      .map((file) => ({
        filename: file,
        slug: file.replace('.md', ''),
        path: path.join(articlesDir, file),
      }));

    return NextResponse.json({ files });
  } catch (error: any) {
    console.error('Error listing articles:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

