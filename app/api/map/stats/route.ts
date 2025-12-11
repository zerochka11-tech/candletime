import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * API endpoint для получения статистики по свечам на карте
 * Возвращает количество свечей по странам, топ городов и общее количество
 * 
 * @returns JSON со статистикой: countries (объект страна->количество), topCities (массив топ-20 городов), totalCandles (общее количество)
 * 
 * @example
 * GET /api/map/stats
 * 
 * Response:
 * {
 *   "countries": { "Россия": 150, "Украина": 45 },
 *   "topCities": [
 *     { "city": "Москва", "country": "Россия", "count": 50 }
 *   ],
 *   "totalCandles": 225
 * }
 */
export async function GET() {
  try {
    // Статистика по странам
    const { data: countryStats } = await supabase
      .from('candles')
      .select('location_country')
      .eq('location_show_on_map', true)
      .not('location_country', 'is', null);

    const countryCounts: Record<string, number> = {};
    countryStats?.forEach((candle) => {
      const country = candle.location_country;
      if (country) {
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      }
    });

    // Статистика по городам (топ 20)
    const { data: cityStats } = await supabase
      .from('candles')
      .select('location_city, location_country')
      .eq('location_show_on_map', true)
      .not('location_city', 'is', null)
      .limit(1000);

    const cityCounts: Record<string, { count: number; country: string }> = {};
    cityStats?.forEach((candle) => {
      const city = candle.location_city;
      const country = candle.location_country;
      if (city) {
        if (!cityCounts[city]) {
          cityCounts[city] = { count: 0, country: country || '' };
        }
        cityCounts[city].count++;
      }
    });

    // Топ городов
    const topCities = Object.entries(cityCounts)
      .map(([city, data]) => ({ city, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Общее количество свечей на карте
    const { count: totalCount } = await supabase
      .from('candles')
      .select('id', { count: 'exact', head: true })
      .eq('location_show_on_map', true)
      .neq('location_type', 'none');

    return NextResponse.json({
      countries: countryCounts,
      topCities,
      totalCandles: totalCount || 0,
    });
  } catch (error) {
    console.error('Map stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

