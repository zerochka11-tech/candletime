import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // Оптимизация для продакшена
  compress: true,
  
  // Правильная обработка статических файлов
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  
  // Настройки для продакшена
  poweredByHeader: false,
  
  // ВАЖНО: Не устанавливаем basePath или assetPrefix
  // Это может сломать пути к статическим файлам на Vercel
  // Используй только если деплоишь в подпапку
};

export default withNextIntl(nextConfig);
