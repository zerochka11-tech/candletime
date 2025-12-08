import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candleId = searchParams.get('id');

    if (!candleId) {
      return new Response('Missing candle ID', { status: 400 });
    }

    // Получаем данные свечи из БД
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: candle, error } = await supabase
      .from('candles')
      .select('title, message, is_anonymous, candle_type')
      .eq('id', candleId)
      .single();

    if (error || !candle) {
      return new Response('Candle not found', { status: 404 });
    }

    const title = candle.is_anonymous ? 'Анонимная свеча' : candle.title;
    const description = candle.message || title;
    const candleType = candle.candle_type || 'calm';

    // Эмодзи для типов свечей
    const typeEmojis: Record<string, string> = {
      calm: '🕊️',
      support: '🤝',
      memory: '🌙',
      gratitude: '✨',
      hope: '🌟',
      love: '💝',
    };

    const emoji = typeEmojis[candleType] || '🕯️';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9, #ffffff)',
            position: 'relative',
          }}
        >
          {/* Декоративные элементы */}
          <div
            style={{
              position: 'absolute',
              top: 50,
              left: 200,
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: '#f59e0b',
              opacity: 0.05,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 100,
              right: 200,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: '#6366f1',
              opacity: 0.05,
            }}
          />

          {/* Свеча */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: 40,
            }}
          >
            {/* Эмодзи типа */}
            <div
              style={{
                fontSize: 80,
                marginBottom: 20,
              }}
            >
              {emoji}
            </div>
            {/* Пламя */}
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '15px solid transparent',
                borderRight: '15px solid transparent',
                borderBottom: '40px solid #f59e0b',
                marginBottom: -5,
                filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.5))',
              }}
            />
            {/* Фитиль */}
            <div
              style={{
                width: 4,
                height: 30,
                background: '#475569',
              }}
            />
            {/* Тело свечи */}
            <div
              style={{
                width: 50,
                height: 150,
                background: '#ffffff',
                border: '2px solid #e2e8f0',
                borderRadius: '25px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            />
            {/* Тень */}
            <div
              style={{
                width: 80,
                height: 15,
                background: '#000000',
                opacity: 0.1,
                borderRadius: '50%',
                marginTop: -5,
              }}
            />
          </div>

          {/* Текст */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              maxWidth: 900,
              padding: '0 40px',
            }}
          >
            <h1
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: '#1e293b',
                textAlign: 'center',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {title.length > 50 ? title.substring(0, 50) + '...' : title}
            </h1>
            {description && description !== title && (
              <p
                style={{
                  fontSize: 24,
                  color: '#64748b',
                  textAlign: 'center',
                  margin: 0,
                  lineHeight: 1.4,
                  maxHeight: 120,
                  overflow: 'hidden',
                }}
              >
                {description.length > 100 ? description.substring(0, 100) + '...' : description}
              </p>
            )}
            <p
              style={{
                fontSize: 20,
                color: '#94a3b8',
                textAlign: 'center',
                margin: 0,
                marginTop: 8,
              }}
            >
              CandleTime
            </p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`Error generating candle OG image: ${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}

