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

    // Цвета для разных типов свечей
    const typeColors: Record<string, { glow: string; flame: string; gradient: string }> = {
      calm: {
        glow: 'rgba(14, 165, 233, 0.2)',
        flame: '#38bdf8',
        gradient: 'linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)',
      },
      support: {
        glow: 'rgba(16, 185, 129, 0.2)',
        flame: '#34d399',
        gradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
      },
      memory: {
        glow: 'rgba(99, 102, 241, 0.2)',
        flame: '#818cf8',
        gradient: 'linear-gradient(135deg, #312e81 0%, #3730a3 50%, #4338ca 100%)',
      },
      gratitude: {
        glow: 'rgba(245, 158, 11, 0.2)',
        flame: '#fbbf24',
        gradient: 'linear-gradient(135deg, #78350f 0%, #92400e 50%, #b45309 100%)',
      },
      focus: {
        glow: 'rgba(244, 63, 94, 0.2)',
        flame: '#fb7185',
        gradient: 'linear-gradient(135deg, #881337 0%, #9f1239 50%, #be123c 100%)',
      },
    };

    const colors = typeColors[candleType] || typeColors.gratitude;

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
            background: colors.gradient,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Декоративные градиентные круги */}
          <div
            style={{
              position: 'absolute',
              top: -100,
              left: -100,
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
              filter: 'blur(60px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -150,
              right: -150,
              width: 500,
              height: 500,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
              filter: 'blur(80px)',
            }}
          />

          {/* Сетка паттерн */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              opacity: 0.5,
            }}
          />

          {/* Основной контент */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 30,
              zIndex: 1,
              maxWidth: 1000,
              padding: '60px 40px',
            }}
          >
            {/* Эмодзи типа с фоном */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                marginBottom: 10,
                fontSize: 70,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              }}
            >
              {emoji}
            </div>

            {/* Свеча с улучшенным дизайном */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0,
              }}
            >
              {/* Свечение вокруг пламени */}
              <div
                style={{
                  position: 'absolute',
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
                  filter: 'blur(20px)',
                  marginTop: -20,
                }}
              />
              {/* Пламя с градиентом */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '20px solid transparent',
                  borderRight: '20px solid transparent',
                  borderBottom: `50px solid ${colors.flame}`,
                  marginBottom: -2,
                  filter: `drop-shadow(0 0 20px ${colors.glow})`,
                  position: 'relative',
                }}
              >
                {/* Внутреннее пламя */}
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: -8,
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderBottom: `25px solid ${colors.flame}`,
                    opacity: 0.8,
                  }}
                />
              </div>
              {/* Фитиль */}
              <div
                style={{
                  width: 3,
                  height: 25,
                  background: 'linear-gradient(to bottom, #475569, #1e293b)',
                  borderRadius: '2px',
                }}
              />
              {/* Тело свечи с градиентом */}
              <div
                style={{
                  width: 60,
                  height: 180,
                  background: 'linear-gradient(to bottom, #ffffff, #f8fafc)',
                  border: '3px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '30px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 2px 8px rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                }}
              >
                {/* Отблеск на свече */}
                <div
                  style={{
                    position: 'absolute',
                    top: 20,
                    left: 10,
                    width: 20,
                    height: 140,
                    background: 'linear-gradient(to right, rgba(255, 255, 255, 0.3), transparent)',
                    borderRadius: '10px',
                  }}
                />
              </div>
              {/* Тень под свечой */}
              <div
                style={{
                  width: 100,
                  height: 20,
                  background: 'radial-gradient(ellipse, rgba(0, 0, 0, 0.3) 0%, transparent 70%)',
                  borderRadius: '50%',
                  marginTop: -5,
                }}
              />
            </div>

            {/* Текст с улучшенной типографикой */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                textAlign: 'center',
              }}
            >
              {/* Заголовок */}
              <h1
                style={{
                  fontSize: title.length > 40 ? 48 : title.length > 30 ? 56 : 64,
                  fontWeight: 800,
                  color: '#ffffff',
                  textAlign: 'center',
                  margin: 0,
                  lineHeight: 1.1,
                  textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                  letterSpacing: '-0.02em',
                  maxWidth: 900,
                }}
              >
                {title.length > 60 ? title.substring(0, 60) + '...' : title}
              </h1>

              {/* Описание */}
              {description && description !== title && (
                <p
                  style={{
                    fontSize: 24,
                    color: '#e2e8f0',
                    textAlign: 'center',
                    margin: 0,
                    lineHeight: 1.5,
                    maxWidth: 800,
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                    fontWeight: 400,
                  }}
                >
                  {description.length > 120 ? description.substring(0, 120) + '...' : description}
                </p>
              )}

              {/* Бренд */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: colors.flame,
                    boxShadow: `0 0 20px ${colors.glow}`,
                  }}
                />
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: '#cbd5e1',
                    letterSpacing: '0.05em',
                  }}
                >
                  CandleTime
                </span>
              </div>
            </div>
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

