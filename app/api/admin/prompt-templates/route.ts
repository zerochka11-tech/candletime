import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validatePromptTemplate, extractVariablesFromPrompt } from '@/lib/promptTemplates';

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

// GET - список всех шаблонов
export async function GET(request: NextRequest) {
  try {
    const { error: authError, user } = await checkAdminAuth(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('prompt_templates')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prompt templates:', error);
      return NextResponse.json(
        { error: `Failed to fetch templates: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      templates: data || [],
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/prompt-templates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch prompt templates' },
      { status: 500 }
    );
  }
}

// POST - создание нового шаблона
export async function POST(request: NextRequest) {
  try {
    const { error: authError, user } = await checkAdminAuth(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, prompt, is_default } = body;

    // Валидация входных данных
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return NextResponse.json(
        { error: 'Name must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 50) {
      return NextResponse.json(
        { error: 'Prompt must be at least 50 characters long' },
        { status: 400 }
      );
    }

    // Валидация шаблона
    const variables = extractVariablesFromPrompt(prompt);
    const validation = validatePromptTemplate({ name, prompt, variables });

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join('; ') },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Если устанавливается как шаблон по умолчанию, снимаем флаг с других
    if (is_default) {
      await supabaseAdmin
        .from('prompt_templates')
        .update({ is_default: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Обновим все, кроме несуществующего ID
    }

    // Создание шаблона
    const { data, error } = await supabaseAdmin
      .from('prompt_templates')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        prompt: prompt.trim(),
        variables: variables,
        author_id: user.id,
        is_default: is_default || false,
        is_system: false, // Пользовательские шаблоны не системные
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating prompt template:', error);
      return NextResponse.json(
        { error: `Failed to create template: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      template: data,
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/prompt-templates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create prompt template' },
      { status: 500 }
    );
  }
}

