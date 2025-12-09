'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MapPopup } from './MapPopup';
import { renderToStaticMarkup } from 'react-dom/server';

// Исправление иконок Leaflet для Next.js
// Используем стандартные иконки Leaflet, но они будут переопределены для свечей
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface Candle {
  id: string;
  title: string;
  type: string | null;
  lat: number;
  lng: number;
  country?: string;
  city?: string;
}

interface MapMarkersProps {
  candles: Candle[];
}

// Иконки для разных типов свечей
const getCandleIcon = (type: string | null) => {
  const colors: Record<string, string> = {
    calm: '#0ea5e9', // sky
    support: '#10b981', // emerald
    memory: '#6366f1', // indigo
    gratitude: '#f59e0b', // amber
    focus: '#f43f5e', // rose
  };

  const color = colors[type || 'default'] || '#64748b';

  return L.divIcon({
    className: 'candle-marker',
    html: `<div style="
      width: 20px;
      height: 20px;
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

export function MapMarkers({ candles }: MapMarkersProps) {
  const map = useMap();
  const markersRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    // Удаляем старые маркеры
    if (markersRef.current) {
      map.removeLayer(markersRef.current);
    }

    if (candles.length === 0) {
      markersRef.current = null;
      return;
    }

    // Создаем кластер группу
    const markers = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    // Добавляем маркеры
    candles.forEach((candle) => {
      const marker = L.marker([candle.lat, candle.lng], {
        icon: getCandleIcon(candle.type),
      });

      // Popup с информацией
      const popupContent = renderToStaticMarkup(<MapPopup candle={candle} />);
      marker.bindPopup(popupContent, {
        className: 'candle-popup',
      });

      markers.addLayer(marker);
    });

    map.addLayer(markers);
    markersRef.current = markers;

    return () => {
      if (markersRef.current) {
        map.removeLayer(markersRef.current);
        markersRef.current = null;
      }
    };
  }, [map, candles]);

  return null;
}

