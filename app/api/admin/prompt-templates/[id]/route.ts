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

// GET - получение конкретного шаблона
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError, user } = await checkAdminAuth(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from('prompt_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching prompt template:', error);
      return NextResponse.json(
        { error: `Failed to fetch template: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      template: data,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/prompt-templates/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch prompt template' },
      { status: 500 }
    );
  }
}

// PATCH - обновление шаблона
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError, user } = await checkAdminAuth(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const supabaseAdmin = getSupabaseAdmin();

    // Проверяем существование шаблона и права доступа
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('prompt_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Системные шаблоны могут редактировать все админы
    // Пользовательские шаблоны может редактировать только автор
    if (!existing.is_system && existing.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own templates' },
        { status: 403 }
      );
    }

    // Подготовка данных для обновления
    const updateData: any = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length < 3) {
        return NextResponse.json(
          { error: 'Name must be at least 3 characters long' },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    if (body.prompt !== undefined) {
      if (typeof body.prompt !== 'string' || body.prompt.trim().length < 50) {
        return NextResponse.json(
          { error: 'Prompt must be at least 50 characters long' },
          { status: 400 }
        );
      }

      // Валидация обновленного промпта
      const variables = extractVariablesFromPrompt(body.prompt);
      const validation = validatePromptTemplate({
        name: updateData.name || existing.name,
        prompt: body.prompt,
        variables,
      });

      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.errors.join('; ') },
          { status: 400 }
        );
      }

      updateData.prompt = body.prompt.trim();
      updateData.variables = variables;
    }

    if (body.is_default !== undefined) {
      // Если устанавливается как шаблон по умолчанию, снимаем флаг с других
      if (body.is_default) {
        await supabaseAdmin
          .from('prompt_templates')
          .update({ is_default: false })
          .neq('id', id);
      }
      updateData.is_default = body.is_default;
    }

    // Обновление шаблона
    const { data, error } = await supabaseAdmin
      .from('prompt_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating prompt template:', error);
      return NextResponse.json(
        { error: `Failed to update template: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      template: data,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/prompt-templates/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update prompt template' },
      { status: 500 }
    );
  }
}

// DELETE - удаление шаблона
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError, user } = await checkAdminAuth(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabaseAdmin = getSupabaseAdmin();

    // Проверяем существование шаблона и права доступа
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('prompt_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Системные шаблоны нельзя удалять
    if (existing.is_system) {
      return NextResponse.json(
        { error: 'Cannot delete system template' },
        { status: 403 }
      );
    }

    // Пользовательские шаблоны может удалять только автор
    if (existing.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own templates' },
        { status: 403 }
      );
    }

    // Удаление шаблона
    const { error } = await supabaseAdmin
      .from('prompt_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting prompt template:', error);
      return NextResponse.json(
        { error: `Failed to delete template: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/prompt-templates/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete prompt template' },
      { status: 500 }
    );
  }
}

