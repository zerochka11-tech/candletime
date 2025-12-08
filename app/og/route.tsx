import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'CandleTime';
    const description = searchParams.get('description') || 'Тихое место для символических свечей';

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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
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
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
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
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)',
            filter: 'blur(100px)',
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
            gap: 40,
            zIndex: 1,
            maxWidth: 1000,
            padding: '60px 40px',
          }}
        >
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
                background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%)',
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
                borderBottom: '50px solid #fbbf24',
                marginBottom: -2,
                filter: 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.8))',
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
                  borderBottom: '25px solid #fcd34d',
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
              gap: 20,
              textAlign: 'center',
            }}
          >
            {/* Логотип/Бренд */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#fbbf24',
                  boxShadow: '0 0 20px rgba(251, 191, 36, 0.6)',
                }}
              />
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: '#e2e8f0',
                  letterSpacing: '0.05em',
                }}
              >
                CandleTime
              </span>
            </div>

            {/* Заголовок */}
            <h1
              style={{
                fontSize: title.length > 30 ? 56 : 72,
                fontWeight: 800,
                color: '#ffffff',
                textAlign: 'center',
                margin: 0,
                lineHeight: 1.1,
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </h1>

            {/* Описание */}
            <p
              style={{
                fontSize: 28,
                color: '#cbd5e1',
                textAlign: 'center',
                margin: 0,
                lineHeight: 1.5,
                maxWidth: 800,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                fontWeight: 400,
              }}
            >
              {description}
            </p>
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
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}

