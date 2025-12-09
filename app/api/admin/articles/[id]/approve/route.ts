import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { error: 'Unauthorized', user: null };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return { error: 'Unauthorized', user: null };
  }

  // Используем NEXT_PUBLIC_ADMIN_EMAILS для единообразия
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || process.env.ADMIN_EMAILS?.split(',') || [];
  if (!adminEmails.includes(user.email || '')) {
    return { error: 'Forbidden', user: null };
  }

  return { error: null, user };
}

export async function POST(
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
    const { approve, published_at } = body;

    if (approve === undefined) {
      return NextResponse.json(
        { error: 'Missing approve parameter' },
        { status: 400 }
      );
    }

    const updateData: any = {
      published: approve,
      updated_at: new Date().toISOString(),
    };

    if (approve) {
      updateData.published_at = published_at || new Date().toISOString();
    } else {
      updateData.published_at = null;
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
    console.error('Error approving article:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

