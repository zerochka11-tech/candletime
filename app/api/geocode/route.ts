import { NextRequest, NextResponse } from 'next/server';

/**
 * Геокодинг через Nominatim (OpenStreetMap)
 * Преобразует адрес/название места в координаты
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  try {
    // Nominatim API (бесплатный, OpenStreetMap)
    // Rate limit: 1 запрос/сек (достаточно для нашего случая)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'CandleTime/1.0 (contact@candletime.ru)', // Требуется Nominatim
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Преобразуем результаты в наш формат
    const results = data.map((item: any) => ({
      display_name: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      country: item.address?.country,
      city: item.address?.city || item.address?.town || item.address?.village,
      region: item.address?.state || item.address?.region,
      address: item.display_name,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Failed to geocode location' },
      { status: 500 }
    );
  }
}

