import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * API endpoint для получения свечей для отображения на интерактивной карте
 * Поддерживает фильтрацию по границам карты, типу свечи и статусу
 * 
 * @param request - Next.js request объект с query параметрами
 * @param request.query.bounds - Границы карты в формате "minLat,minLng,maxLat,maxLng" (опционально)
 * @param request.query.type - Тип свечи: 'calm', 'support', 'memory', 'gratitude', 'focus', или 'all' (опционально)
 * @param request.query.status - Статус свечи: 'active' (по умолчанию) или 'all' (опционально)
 * @returns JSON с массивом свечей для карты или ошибкой
 * 
 * @example
 * GET /api/map/candles?bounds=55.5,37.5,56.0,38.0&type=calm&status=active
 * 
 * Response:
 * {
 *   "candles": [
 *     {
 *       "id": "...",
 *       "title": "Моя свеча",
 *       "type": "calm",
 *       "lat": 55.7558,
 *       "lng": 37.6173,
 *       "country": "Россия",
 *       "city": "Москва"
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bounds = searchParams.get('bounds'); // "minLat,minLng,maxLat,maxLng"
  const candleType = searchParams.get('type'); // Опциональный фильтр по типу
  const status = searchParams.get('status') || 'active'; // active, all

  try {
    let query = supabase
      .from('candles')
      .select('id, title, candle_type, created_at, expires_at, status, location_anonymized_lat, location_anonymized_lng, location_country, location_city')
      .eq('location_show_on_map', true)
      .neq('location_type', 'none')
      .not('location_anonymized_lat', 'is', null)
      .not('location_anonymized_lng', 'is', null);

    // Фильтр по статусу
    if (status === 'active') {
      const now = new Date().toISOString();
      query = query.gt('expires_at', now).eq('status', 'active');
    }

    // Фильтр по типу свечи
    if (candleType && candleType !== 'all') {
      query = query.eq('candle_type', candleType);
    }

    // Фильтр по границам карты (если указаны)
    if (bounds) {
      const [minLat, minLng, maxLat, maxLng] = bounds.split(',').map(parseFloat);
      query = query
        .gte('location_anonymized_lat', minLat)
        .lte('location_anonymized_lat', maxLat)
        .gte('location_anonymized_lng', minLng)
        .lte('location_anonymized_lng', maxLng);
    }

    const { data, error } = await query.limit(1000); // Лимит для производительности

    if (error) {
      throw error;
    }

    // Преобразуем в формат для карты
    const candles = (data || []).map((candle) => ({
      id: candle.id,
      title: candle.title,
      type: candle.candle_type,
      lat: parseFloat(candle.location_anonymized_lat),
      lng: parseFloat(candle.location_anonymized_lng),
      country: candle.location_country,
      city: candle.location_city,
      createdAt: candle.created_at,
      expiresAt: candle.expires_at,
      status: candle.status,
    }));

    return NextResponse.json({ candles });
  } catch (error) {
    console.error('Map candles error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candles' },
      { status: 500 }
    );
  }
}

