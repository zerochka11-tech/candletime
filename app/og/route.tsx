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
              fontSize: 72,
              fontWeight: 700,
              color: '#1e293b',
              textAlign: 'center',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: 28,
              color: '#64748b',
              textAlign: 'center',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {description}
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
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}

