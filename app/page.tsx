'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { HomePageStructuredData } from '@/components/StructuredData';
import Snowflakes from '@/components/Snowflakes';
import { useChristmasTheme } from '@/hooks/useChristmasTheme';
import Wish2026FloatingButton from '@/components/Wish2026FloatingButton';

// Типы свечей для статистики
const CANDLE_TYPES = [
  { id: 'calm', label: 'Спокойствие', emoji: '🕊️' },
  { id: 'support', label: 'Поддержка', emoji: '🤝' },
  { id: 'memory', label: 'Память', emoji: '🌙' },
  { id: 'gratitude', label: 'Благодарность', emoji: '✨' },
  { id: 'focus', label: 'Фокус', emoji: '🎯' },
] as const;

type CandleTypeId = (typeof CANDLE_TYPES)[number]['id'];

export default function HomePage() {
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [popularType, setPopularType] = useState<{
    id: CandleTypeId | null;
    count: number;
  }>({ id: null, count: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const christmasThemeEnabled = useChristmasTheme();

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Таймаут для всего запроса (10 секунд)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Stats loading timeout')), 10000)
        );

        const statsPromise = (async () => {
          const now = new Date();
          const nowIso = now.toISOString();

          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          const startOfTodayIso = startOfToday.toISOString();

          // 1. Кол-во активных свечей
          const { count: active, error: activeError } = await supabase
            .from('candles')
            .select('id', { count: 'exact', head: true })
            .gt('expires_at', nowIso);

          if (activeError) {
            console.error('[Home] Error loading active count:', activeError);
          } else {
            setActiveCount(active ?? 0);
          }

          // 2. Кол-во свечей, зажжённых сегодня
          const { count: today, error: todayError } = await supabase
            .from('candles')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', startOfTodayIso);

          if (todayError) {
            console.error('[Home] Error loading today count:', todayError);
          } else {
            setTodayCount(today ?? 0);
          }

          // 3. Самая популярная свеча (по типу, за всё время)
          const typeCounts = await Promise.all(
            CANDLE_TYPES.map(async (t) => {
              const { count, error } = await supabase
                .from('candles')
                .select('id', { count: 'exact', head: true })
                .eq('candle_type', t.id);
              if (error) {
                console.error(`[Home] Error loading type ${t.id}:`, error);
              }
              return { id: t.id, count: count ?? 0 };
            })
          );

          let best = { id: null as CandleTypeId | null, count: 0 };
          for (const item of typeCounts) {
            if (item.count > best.count) {
              best = { id: item.id as CandleTypeId, count: item.count };
            }
          }
          setPopularType(best);
        })();

        await Promise.race([statsPromise, timeoutPromise]);
      } catch (e: any) {
        console.error('[Home] Failed to load stats:', e);
        // Устанавливаем значения по умолчанию при ошибке
        setActiveCount(0);
        setTodayCount(0);
        setPopularType({ id: null, count: 0 });
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, []);

  const popularMeta =
    popularType.id != null
      ? CANDLE_TYPES.find((t) => t.id === popularType.id)!
      : null;

  return (
    // общий вертикальный стек секций
    <>
      {christmasThemeEnabled && (
        <Snowflakes 
          count={35}
          speed={0.8}
          minSize={0.8}
          maxSize={2.5}
          color="rgba(255, 255, 255, 0.6)"
          wind={true}
          rotation={true}
          zIndex={1}
        />
      )}
      <HomePageStructuredData />
      <div className="flex flex-col gap-6 md:gap-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white shadow-lg">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 z-0" />
        
        {/* Звездочки (мерцающие) - равномерно распределены по всей высоте HERO блока */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {/* Звезды распределены по всей высоте HERO блока (0-100%) */}
          {/* Верхняя часть (0-20%) */}
          <div className="absolute top-[5%] left-[5%] w-0.5 h-0.5 bg-white rounded-full opacity-70 animate-twinkle" style={{ animationDelay: '0s', animationDuration: '3s' }} />
          <div className="absolute top-[8%] left-[12%] w-1 h-1 bg-white rounded-full opacity-80 animate-twinkle" style={{ animationDelay: '0.5s', animationDuration: '4s' }} />
          <div className="absolute top-[6%] left-[20%] w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-twinkle" style={{ animationDelay: '1s', animationDuration: '3.5s' }} />
          <div className="absolute top-[10%] left-[28%] w-0.5 h-0.5 bg-white rounded-full opacity-50 animate-twinkle" style={{ animationDelay: '1.5s', animationDuration: '4.5s' }} />
          <div className="absolute top-[4%] left-[36%] w-0.5 h-0.5 bg-white rounded-full opacity-65 animate-twinkle" style={{ animationDelay: '0.8s', animationDuration: '3.2s' }} />
          <div className="absolute top-[12%] left-[44%] w-1 h-1 bg-white rounded-full opacity-75 animate-twinkle" style={{ animationDelay: '1.2s', animationDuration: '3.8s' }} />
          <div className="absolute top-[7%] left-[52%] w-0.5 h-0.5 bg-white rounded-full opacity-55 animate-twinkle" style={{ animationDelay: '0.3s', animationDuration: '4.2s' }} />
          <div className="absolute top-[9%] left-[60%] w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-twinkle" style={{ animationDelay: '1.8s', animationDuration: '3.6s' }} />
          <div className="absolute top-[11%] left-[68%] w-0.5 h-0.5 bg-white rounded-full opacity-70 animate-twinkle" style={{ animationDelay: '0.6s', animationDuration: '4s' }} />
          <div className="absolute top-[5%] left-[76%] w-1 h-1 bg-white rounded-full opacity-65 animate-twinkle" style={{ animationDelay: '0.9s', animationDuration: '3.4s' }} />
          <div className="absolute top-[8%] left-[84%] w-0.5 h-0.5 bg-white rounded-full opacity-75 animate-twinkle" style={{ animationDelay: '1.4s', animationDuration: '3.9s' }} />
          <div className="absolute top-[13%] right-[10%] w-0.5 h-0.5 bg-white rounded-full opacity-55 animate-twinkle" style={{ animationDelay: '0.7s', animationDuration: '4.1s' }} />
          <div className="absolute top-[6%] right-[5%] w-0.5 h-0.5 bg-white rounded-full opacity-70 animate-twinkle" style={{ animationDelay: '1.1s', animationDuration: '3.7s' }} />
          <div className="absolute top-[10%] right-[2%] w-1 h-1 bg-white rounded-full opacity-60 animate-twinkle" style={{ animationDelay: '0.4s', animationDuration: '4.3s' }} />
          <div className="absolute top-[3%] left-[92%] w-0.5 h-0.5 bg-white rounded-full opacity-65 animate-twinkle" style={{ animationDelay: '1.6s', animationDuration: '3.8s' }} />
          
          {/* Верхняя-средняя часть (20-40%) */}
          <div className="absolute top-[22%] left-[3%] w-0.5 h-0.5 bg-white/40 rounded-full animate-twinkle" style={{ animationDelay: '2s', animationDuration: '3.3s' }} />
          <div className="absolute top-[25%] left-[8%] w-0.5 h-0.5 bg-white/50 rounded-full animate-twinkle" style={{ animationDelay: '2.5s', animationDuration: '3.7s' }} />
          <div className="absolute top-[28%] left-[15%] w-0.5 h-0.5 bg-white/45 rounded-full animate-twinkle" style={{ animationDelay: '1.3s', animationDuration: '4.1s' }} />
          <div className="absolute top-[24%] left-[22%] w-0.5 h-0.5 bg-white/55 rounded-full animate-twinkle" style={{ animationDelay: '2.2s', animationDuration: '3.5s' }} />
          <div className="absolute top-[26%] left-[30%] w-0.5 h-0.5 bg-white/40 rounded-full animate-twinkle" style={{ animationDelay: '1.7s', animationDuration: '3.9s' }} />
          <div className="absolute top-[30%] left-[38%] w-0.5 h-0.5 bg-white/50 rounded-full animate-twinkle" style={{ animationDelay: '2.8s', animationDuration: '3.4s' }} />
          <div className="absolute top-[23%] left-[46%] w-0.5 h-0.5 bg-white/45 rounded-full animate-twinkle" style={{ animationDelay: '1.5s', animationDuration: '4.3s' }} />
          <div className="absolute top-[32%] left-[54%] w-0.5 h-0.5 bg-white/55 rounded-full animate-twinkle" style={{ animationDelay: '2.3s', animationDuration: '3.6s' }} />
          <div className="absolute top-[27%] left-[62%] w-0.5 h-0.5 bg-white/40 rounded-full animate-twinkle" style={{ animationDelay: '1.9s', animationDuration: '3.8s' }} />
          <div className="absolute top-[35%] left-[70%] w-0.5 h-0.5 bg-white/50 rounded-full animate-twinkle" style={{ animationDelay: '2.6s', animationDuration: '3.5s' }} />
          <div className="absolute top-[29%] left-[78%] w-0.5 h-0.5 bg-white/45 rounded-full animate-twinkle" style={{ animationDelay: '1.4s', animationDuration: '4.2s' }} />
          <div className="absolute top-[33%] right-[12%] w-0.5 h-0.5 bg-white/55 rounded-full animate-twinkle" style={{ animationDelay: '2.9s', animationDuration: '3.4s' }} />
          <div className="absolute top-[21%] right-[6%] w-0.5 h-0.5 bg-white/40 rounded-full animate-twinkle" style={{ animationDelay: '2.1s', animationDuration: '3.7s' }} />
          <div className="absolute top-[36%] right-[3%] w-0.5 h-0.5 bg-white/50 rounded-full animate-twinkle" style={{ animationDelay: '1.8s', animationDuration: '3.9s' }} />
          <div className="absolute top-[31%] left-[86%] w-0.5 h-0.5 bg-white/45 rounded-full animate-twinkle" style={{ animationDelay: '2.4s', animationDuration: '3.6s' }} />
          <div className="absolute top-[20%] left-[50%] w-0.5 h-0.5 bg-white/50 rounded-full animate-twinkle" style={{ animationDelay: '2.7s', animationDuration: '3.5s' }} />
          <div className="absolute top-[24%] right-[20%] w-0.5 h-0.5 bg-white/40 rounded-full animate-twinkle" style={{ animationDelay: '1.6s', animationDuration: '4s' }} />
          <div className="absolute top-[28%] left-[94%] w-0.5 h-0.5 bg-white/55 rounded-full animate-twinkle" style={{ animationDelay: '2.5s', animationDuration: '3.4s' }} />
          <div className="absolute top-[34%] left-[6%] w-0.5 h-0.5 bg-white/45 rounded-full animate-twinkle" style={{ animationDelay: '1.2s', animationDuration: '4.1s' }} />
          <div className="absolute top-[26%] right-[8%] w-0.5 h-0.5 bg-white/50 rounded-full animate-twinkle" style={{ animationDelay: '2.8s', animationDuration: '3.3s' }} />
          
          {/* Средняя часть (40-60%) */}
          <div className="absolute top-[42%] left-[4%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '3s', animationDuration: '5s' }} />
          <div className="absolute top-[45%] left-[10%] w-0.5 h-0.5 bg-white/35 rounded-full animate-twinkle" style={{ animationDelay: '3.5s', animationDuration: '5.5s' }} />
          <div className="absolute top-[48%] left-[16%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '4s', animationDuration: '4.5s' }} />
          <div className="absolute top-[44%] left-[24%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '3.2s', animationDuration: '5.2s' }} />
          <div className="absolute top-[52%] left-[32%] w-0.5 h-0.5 bg-white/35 rounded-full animate-twinkle" style={{ animationDelay: '4.5s', animationDuration: '4.8s' }} />
          <div className="absolute top-[47%] left-[40%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '3.8s', animationDuration: '5.3s' }} />
          <div className="absolute top-[49%] left-[48%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '4.2s', animationDuration: '4.7s' }} />
          <div className="absolute top-[46%] left-[56%] w-0.5 h-0.5 bg-white/35 rounded-full animate-twinkle" style={{ animationDelay: '3.6s', animationDuration: '5.1s' }} />
          <div className="absolute top-[51%] left-[64%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '4.8s', animationDuration: '4.9s' }} />
          <div className="absolute top-[43%] left-[72%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '3.4s', animationDuration: '5.4s' }} />
          <div className="absolute top-[50%] left-[80%] w-0.5 h-0.5 bg-white/35 rounded-full animate-twinkle" style={{ animationDelay: '4.1s', animationDuration: '4.6s' }} />
          <div className="absolute top-[45%] right-[10%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '3.9s', animationDuration: '5.2s' }} />
          <div className="absolute top-[48%] right-[4%] w-0.5 h-0.5 bg-white/35 rounded-full animate-twinkle" style={{ animationDelay: '4.3s', animationDuration: '4.8s' }} />
          <div className="absolute top-[44%] right-[2%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '3.7s', animationDuration: '5.3s' }} />
          <div className="absolute top-[52%] left-[88%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '4.6s', animationDuration: '4.7s' }} />
          <div className="absolute top-[55%] left-[6%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '5s', animationDuration: '5.5s' }} />
          <div className="absolute top-[58%] left-[14%] w-0.5 h-0.5 bg-white/35 rounded-full animate-twinkle" style={{ animationDelay: '5.5s', animationDuration: '5.8s' }} />
          <div className="absolute top-[54%] left-[26%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '6s', animationDuration: '5.2s' }} />
          <div className="absolute top-[60%] left-[50%] w-0.5 h-0.5 bg-white/35 rounded-full animate-twinkle" style={{ animationDelay: '5.2s', animationDuration: '5.6s' }} />
          <div className="absolute top-[57%] left-[66%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '5.8s', animationDuration: '5.4s' }} />
          <div className="absolute top-[59%] left-[74%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '5.3s', animationDuration: '5.7s' }} />
          <div className="absolute top-[55%] right-[8%] w-0.5 h-0.5 bg-white/35 rounded-full animate-twinkle" style={{ animationDelay: '5.7s', animationDuration: '5.3s' }} />
          <div className="absolute top-[61%] right-[2%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '5.4s', animationDuration: '5.5s' }} />
          <div className="absolute top-[53%] left-[82%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '6.2s', animationDuration: '5.1s' }} />
          <div className="absolute top-[56%] left-[90%] w-0.5 h-0.5 bg-white/35 rounded-full animate-twinkle" style={{ animationDelay: '5.9s', animationDuration: '5.4s' }} />
          
          {/* Нижняя-средняя часть (60-80%) */}
          <div className="absolute top-[62%] left-[2%] w-0.5 h-0.5 bg-white/20 rounded-full animate-twinkle" style={{ animationDelay: '5s', animationDuration: '6s' }} />
          <div className="absolute top-[65%] left-[18%] w-0.5 h-0.5 bg-white/25 rounded-full animate-twinkle" style={{ animationDelay: '5.5s', animationDuration: '6.5s' }} />
          <div className="absolute top-[63%] left-[34%] w-0.5 h-0.5 bg-white/20 rounded-full animate-twinkle" style={{ animationDelay: '6s', animationDuration: '5.5s' }} />
          <div className="absolute top-[66%] left-[50%] w-0.5 h-0.5 bg-white/25 rounded-full animate-twinkle" style={{ animationDelay: '5.2s', animationDuration: '6.2s' }} />
          <div className="absolute top-[64%] left-[66%] w-0.5 h-0.5 bg-white/20 rounded-full animate-twinkle" style={{ animationDelay: '6.5s', animationDuration: '5.8s' }} />
          <div className="absolute top-[68%] left-[82%] w-0.5 h-0.5 bg-white/25 rounded-full animate-twinkle" style={{ animationDelay: '5.7s', animationDuration: '6.1s' }} />
          <div className="absolute top-[61%] right-[6%] w-0.5 h-0.5 bg-white/20 rounded-full animate-twinkle" style={{ animationDelay: '6.2s', animationDuration: '5.9s' }} />
          <div className="absolute top-[70%] left-[8%] w-0.5 h-0.5 bg-white/20 rounded-full animate-twinkle" style={{ animationDelay: '6.8s', animationDuration: '5.7s' }} />
          <div className="absolute top-[72%] left-[22%] w-0.5 h-0.5 bg-white/25 rounded-full animate-twinkle" style={{ animationDelay: '7s', animationDuration: '5.6s' }} />
          <div className="absolute top-[69%] left-[38%] w-0.5 h-0.5 bg-white/20 rounded-full animate-twinkle" style={{ animationDelay: '6.3s', animationDuration: '5.8s' }} />
          <div className="absolute top-[74%] left-[54%] w-0.5 h-0.5 bg-white/25 rounded-full animate-twinkle" style={{ animationDelay: '7.2s', animationDuration: '5.5s' }} />
          <div className="absolute top-[71%] left-[70%] w-0.5 h-0.5 bg-white/20 rounded-full animate-twinkle" style={{ animationDelay: '6.5s', animationDuration: '5.9s' }} />
          <div className="absolute top-[73%] right-[14%] w-0.5 h-0.5 bg-white/25 rounded-full animate-twinkle" style={{ animationDelay: '7.5s', animationDuration: '5.4s' }} />
          <div className="absolute top-[75%] right-[2%] w-0.5 h-0.5 bg-white/20 rounded-full animate-twinkle" style={{ animationDelay: '6.7s', animationDuration: '5.7s' }} />
          <div className="absolute top-[67%] left-[86%] w-0.5 h-0.5 bg-white/25 rounded-full animate-twinkle" style={{ animationDelay: '7.3s', animationDuration: '5.6s' }} />
          <div className="absolute top-[76%] left-[6%] w-0.5 h-0.5 bg-white/20 rounded-full animate-twinkle" style={{ animationDelay: '7.8s', animationDuration: '5.3s' }} />
          <div className="absolute top-[78%] left-[42%] w-0.5 h-0.5 bg-white/25 rounded-full animate-twinkle" style={{ animationDelay: '7.1s', animationDuration: '5.8s' }} />
          <div className="absolute top-[77%] left-[58%] w-0.5 h-0.5 bg-white/20 rounded-full animate-twinkle" style={{ animationDelay: '6.9s', animationDuration: '5.7s' }} />
          <div className="absolute top-[79%] left-[74%] w-0.5 h-0.5 bg-white/25 rounded-full animate-twinkle" style={{ animationDelay: '7.4s', animationDuration: '5.5s' }} />
          <div className="absolute top-[80%] right-[10%] w-0.5 h-0.5 bg-white/20 rounded-full animate-twinkle" style={{ animationDelay: '7.6s', animationDuration: '5.4s' }} />
          
          {/* Нижняя часть (80-100%) */}
          <div className="absolute top-[82%] left-[7%] w-0.5 h-0.5 bg-white/25 rounded-full animate-twinkle" style={{ animationDelay: '8s', animationDuration: '4.5s' }} />
          <div className="absolute top-[85%] left-[33%] w-0.5 h-0.5 bg-white/40 rounded-full animate-twinkle" style={{ animationDelay: '8.5s', animationDuration: '4.2s' }} />
          <div className="absolute top-[83%] left-[59%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '9s', animationDuration: '4.8s' }} />
          <div className="absolute top-[86%] left-[85%] w-0.5 h-0.5 bg-white/35 rounded-full animate-twinkle" style={{ animationDelay: '8.2s', animationDuration: '4.6s' }} />
          <div className="absolute top-[88%] left-[11%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '9.5s', animationDuration: '4.3s' }} />
          <div className="absolute top-[90%] left-[47%] w-0.5 h-0.5 bg-white/40 rounded-full animate-twinkle" style={{ animationDelay: '10s', animationDuration: '4.7s' }} />
          <div className="absolute top-[87%] left-[73%] w-0.5 h-0.5 bg-white/25 rounded-full animate-twinkle" style={{ animationDelay: '9.2s', animationDuration: '4.4s' }} />
          <div className="absolute top-[84%] left-[18%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '10.5s', animationDuration: '4.9s' }} />
          <div className="absolute top-[89%] left-[46%] w-0.5 h-0.5 bg-white/35 rounded-full animate-twinkle" style={{ animationDelay: '11s', animationDuration: '4.6s' }} />
          <div className="absolute top-[91%] left-[78%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '10.2s', animationDuration: '4.8s' }} />
          <div className="absolute top-[92%] left-[15%] w-0.5 h-0.5 bg-white/25 rounded-full animate-twinkle" style={{ animationDelay: '11.5s', animationDuration: '4.5s' }} />
          <div className="absolute top-[93%] left-[55%] w-0.5 h-0.5 bg-white/35 rounded-full animate-twinkle" style={{ animationDelay: '12s', animationDuration: '4.3s' }} />
          <div className="absolute top-[94%] right-[12%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '11.2s', animationDuration: '4.7s' }} />
          <div className="absolute top-[95%] left-[35%] w-0.5 h-0.5 bg-white/25 rounded-full animate-twinkle" style={{ animationDelay: '12.5s', animationDuration: '4.4s' }} />
          <div className="absolute top-[96%] left-[68%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '11.8s', animationDuration: '4.6s' }} />
        </div>
        
        {/* Облака (пушистые, светло-голубые) - равномерно распределены по всей высоте (0-100%) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Верхние облака (0-25%) */}
          <div className="absolute top-[2%] left-0 w-40 h-20 bg-sky-200/15 dark:bg-sky-300/8 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: '0s', animationDuration: '20s' }} />
          <div className="absolute top-[5%] right-[5%] w-32 h-16 bg-sky-200/20 dark:bg-sky-300/12 rounded-full blur-xl animate-float" style={{ animationDelay: '2s', animationDuration: '15s' }} />
          <div className="absolute top-[8%] left-[15%] w-36 h-18 bg-sky-200/15 dark:bg-sky-300/8 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: '4s', animationDuration: '18s' }} />
          <div className="absolute top-[3%] right-[25%] w-28 h-14 bg-sky-200/20 dark:bg-sky-300/12 rounded-full blur-xl animate-float" style={{ animationDelay: '1s', animationDuration: '16s' }} />
          <div className="absolute top-[6%] left-[50%] w-34 h-17 bg-sky-200/15 dark:bg-sky-300/8 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: '3s', animationDuration: '22s' }} />
          <div className="absolute top-[10%] right-[45%] w-30 h-15 bg-sky-200/18 dark:bg-sky-300/10 rounded-full blur-xl animate-float" style={{ animationDelay: '2.5s', animationDuration: '17s' }} />
          <div className="absolute top-[12%] left-[25%] w-26 h-13 bg-sky-200/12 dark:bg-sky-300/6 rounded-full blur-xl animate-float-slow" style={{ animationDelay: '12s', animationDuration: '18s' }} />
          <div className="absolute top-[15%] right-[18%] w-24 h-12 bg-sky-200/18 dark:bg-sky-300/10 rounded-full blur-lg animate-float" style={{ animationDelay: '13s', animationDuration: '14s' }} />
          
          {/* Средние облака (25-75%) */}
          <div className="absolute top-[28%] left-[8%] w-38 h-19 bg-sky-200/12 dark:bg-sky-300/6 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: '5s', animationDuration: '19s' }} />
          <div className="absolute top-[32%] right-[12%] w-30 h-15 bg-sky-200/18 dark:bg-sky-300/10 rounded-full blur-xl animate-float" style={{ animationDelay: '6s', animationDuration: '16s' }} />
          <div className="absolute top-[35%] left-[55%] w-32 h-16 bg-sky-200/15 dark:bg-sky-300/8 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: '7s', animationDuration: '21s' }} />
          <div className="absolute top-[50%] left-[30%] w-28 h-14 bg-sky-200/10 dark:bg-sky-300/5 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: '14s', animationDuration: '20s' }} />
          <div className="absolute top-[52%] right-[22%] w-26 h-13 bg-sky-200/15 dark:bg-sky-300/8 rounded-full blur-xl animate-float" style={{ animationDelay: '15s', animationDuration: '16s' }} />
          <div className="absolute top-[60%] left-[40%] w-30 h-15 bg-sky-200/12 dark:bg-sky-300/6 rounded-full blur-xl animate-float-slow" style={{ animationDelay: '16s', animationDuration: '18s' }} />
          <div className="absolute top-[65%] right-[15%] w-28 h-14 bg-sky-200/18 dark:bg-sky-300/10 rounded-full blur-xl animate-float" style={{ animationDelay: '17s', animationDuration: '15s' }} />
          
          {/* Нижние облака (75-100%) */}
          <div className="absolute top-[78%] right-[8%] w-36 h-18 bg-sky-200/12 dark:bg-sky-300/6 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: '8s', animationDuration: '20s' }} />
          <div className="absolute top-[82%] left-[20%] w-28 h-14 bg-sky-200/18 dark:bg-sky-300/10 rounded-full blur-xl animate-float" style={{ animationDelay: '9s', animationDuration: '17s' }} />
          <div className="absolute top-[76%] right-[30%] w-34 h-17 bg-sky-200/15 dark:bg-sky-300/8 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: '10s', animationDuration: '18s' }} />
          <div className="absolute top-[80%] left-[70%] w-30 h-15 bg-sky-200/18 dark:bg-sky-300/10 rounded-full blur-xl animate-float" style={{ animationDelay: '11s', animationDuration: '15s' }} />
          <div className="absolute top-[85%] left-[45%] w-32 h-16 bg-sky-200/12 dark:bg-sky-300/6 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: '16s', animationDuration: '19s' }} />
          <div className="absolute top-[88%] right-[18%] w-28 h-14 bg-sky-200/18 dark:bg-sky-300/10 rounded-full blur-xl animate-float" style={{ animationDelay: '17s', animationDuration: '15s' }} />
        </div>
        
        {/* Астрологические символы (едва заметные в облаках) - равномерно распределены по всей высоте (0-100%) */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.08] z-0">
          {/* Верхние символы (0-25%) */}
          <div className="absolute top-[8%] left-[12%] text-sky-200/40 text-xs font-light" style={{ fontFamily: 'serif' }}>♈</div>
          <div className="absolute top-[6%] left-[28%] text-sky-200/40 text-xs font-light" style={{ fontFamily: 'serif' }}>♉</div>
          <div className="absolute top-[10%] left-[48%] text-sky-200/40 text-xs font-light" style={{ fontFamily: 'serif' }}>♊</div>
          <div className="absolute top-[7%] left-[68%] text-sky-200/40 text-xs font-light" style={{ fontFamily: 'serif' }}>♋</div>
          <div className="absolute top-[9%] right-[15%] text-sky-200/40 text-xs font-light" style={{ fontFamily: 'serif' }}>♌</div>
          <div className="absolute top-[5%] right-[35%] text-sky-200/40 text-xs font-light" style={{ fontFamily: 'serif' }}>♍</div>
          <div className="absolute top-[12%] left-[38%] text-sky-200/35 text-xs font-light" style={{ fontFamily: 'serif' }}>☉</div>
          <div className="absolute top-[14%] left-[64%] text-sky-200/35 text-xs font-light" style={{ fontFamily: 'serif' }}>☽</div>
          <div className="absolute top-[11%] right-[28%] text-sky-200/35 text-xs font-light" style={{ fontFamily: 'serif' }}>☿</div>
          
          {/* Средние символы (25-75%) */}
          <div className="absolute top-[30%] left-[20%] text-sky-200/35 text-xs font-light" style={{ fontFamily: 'serif' }}>♎</div>
          <div className="absolute top-[35%] left-[45%] text-sky-200/35 text-xs font-light" style={{ fontFamily: 'serif' }}>♏</div>
          <div className="absolute top-[32%] right-[25%] text-sky-200/35 text-xs font-light" style={{ fontFamily: 'serif' }}>♐</div>
          <div className="absolute top-[50%] left-[38%] text-sky-200/30 text-xs font-light" style={{ fontFamily: 'serif' }}>♀</div>
          <div className="absolute top-[52%] right-[30%] text-sky-200/30 text-xs font-light" style={{ fontFamily: 'serif' }}>♂</div>
          <div className="absolute top-[58%] left-[55%] text-sky-200/30 text-xs font-light" style={{ fontFamily: 'serif' }}>♃</div>
          <div className="absolute top-[62%] right-[20%] text-sky-200/30 text-xs font-light" style={{ fontFamily: 'serif' }}>♄</div>
          
          {/* Нижние символы (75-100%) */}
          <div className="absolute top-[78%] right-[12%] text-sky-200/30 text-xs font-light" style={{ fontFamily: 'serif' }}>♑</div>
          <div className="absolute top-[82%] left-[35%] text-sky-200/30 text-xs font-light" style={{ fontFamily: 'serif' }}>♒</div>
          <div className="absolute top-[76%] right-[40%] text-sky-200/30 text-xs font-light" style={{ fontFamily: 'serif' }}>♓</div>
          <div className="absolute top-[85%] left-[52%] text-sky-200/30 text-xs font-light" style={{ fontFamily: 'serif' }}>♃</div>
          <div className="absolute top-[88%] right-[28%] text-sky-200/30 text-xs font-light" style={{ fontFamily: 'serif' }}>♄</div>
        </div>
        
        {/* Золотые декоративные элементы (листья/лепестки) - равномерно распределены по всей высоте (0-100%) */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {/* Верхние элементы (0-25%) */}
          <div className="absolute top-[12%] left-[8%] w-1.5 h-1.5 bg-amber-300/25 rounded-full blur-sm animate-float" style={{ animationDelay: '5s', animationDuration: '12s' }} />
          <div className="absolute top-[16%] left-[25%] w-2 h-2 bg-amber-400/20 rounded-full blur-sm animate-float-slow" style={{ animationDelay: '6s', animationDuration: '14s' }} />
          <div className="absolute top-[14%] left-[42%] w-1.5 h-1.5 bg-amber-300/25 rounded-full blur-sm animate-float" style={{ animationDelay: '7s', animationDuration: '13s' }} />
          <div className="absolute top-[18%] left-[58%] w-2 h-2 bg-amber-400/20 rounded-full blur-sm animate-float-slow" style={{ animationDelay: '8s', animationDuration: '15s' }} />
          <div className="absolute top-[13%] left-[75%] w-1.5 h-1.5 bg-amber-300/25 rounded-full blur-sm animate-float" style={{ animationDelay: '6.5s', animationDuration: '11s' }} />
          <div className="absolute top-[15%] right-[8%] w-2 h-2 bg-amber-400/20 rounded-full blur-sm animate-float-slow" style={{ animationDelay: '7.5s', animationDuration: '13.5s' }} />
          <div className="absolute top-[9%] left-[19%] w-1.5 h-1.5 bg-amber-300/20 rounded-full blur-sm animate-float" style={{ animationDelay: '13s', animationDuration: '11.5s' }} />
          <div className="absolute top-[11%] left-[53%] w-2 h-2 bg-amber-400/18 rounded-full blur-sm animate-float-slow" style={{ animationDelay: '13.5s', animationDuration: '13.8s' }} />
          <div className="absolute top-[7%] right-[22%] w-1.5 h-1.5 bg-amber-300/22 rounded-full blur-sm animate-float" style={{ animationDelay: '14s', animationDuration: '12s' }} />
          
          {/* Средние элементы (25-75%) */}
          <div className="absolute top-[30%] left-[15%] w-1.5 h-1.5 bg-amber-300/25 rounded-full blur-sm animate-float" style={{ animationDelay: '8.5s', animationDuration: '12.5s' }} />
          <div className="absolute top-[35%] left-[50%] w-2 h-2 bg-amber-400/20 rounded-full blur-sm animate-float-slow" style={{ animationDelay: '9s', animationDuration: '14.5s' }} />
          <div className="absolute top-[32%] right-[18%] w-1.5 h-1.5 bg-amber-300/25 rounded-full blur-sm animate-float" style={{ animationDelay: '9.5s', animationDuration: '12s' }} />
          <div className="absolute top-[50%] left-[32%] w-2 h-2 bg-amber-400/18 rounded-full blur-sm animate-float-slow" style={{ animationDelay: '14.5s', animationDuration: '14.2s' }} />
          <div className="absolute top-[52%] right-[28%] w-1.5 h-1.5 bg-amber-300/20 rounded-full blur-sm animate-float" style={{ animationDelay: '15s', animationDuration: '11.8s' }} />
          <div className="absolute top-[60%] left-[45%] w-2 h-2 bg-amber-400/18 rounded-full blur-sm animate-float-slow" style={{ animationDelay: '16s', animationDuration: '14.5s' }} />
          <div className="absolute top-[65%] right-[25%] w-1.5 h-1.5 bg-amber-300/20 rounded-full blur-sm animate-float" style={{ animationDelay: '16.5s', animationDuration: '12.5s' }} />
          
          {/* Нижние элементы (75-100%) */}
          <div className="absolute top-[68%] left-[12%] w-1.5 h-1.5 bg-amber-300/25 rounded-full blur-sm animate-float" style={{ animationDelay: '10s', animationDuration: '11s' }} />
          <div className="absolute top-[72%] left-[38%] w-2 h-2 bg-amber-400/20 rounded-full blur-sm animate-float-slow" style={{ animationDelay: '10.5s', animationDuration: '13.5s' }} />
          <div className="absolute top-[70%] left-[62%] w-1.5 h-1.5 bg-amber-300/25 rounded-full blur-sm animate-float" style={{ animationDelay: '11s', animationDuration: '12.5s' }} />
          <div className="absolute top-[74%] right-[15%] w-2 h-2 bg-amber-400/20 rounded-full blur-sm animate-float-slow" style={{ animationDelay: '11.5s', animationDuration: '14s' }} />
          <div className="absolute top-[82%] right-[5%] w-1.5 h-1.5 bg-amber-300/25 rounded-full blur-sm animate-float" style={{ animationDelay: '12s', animationDuration: '11.5s' }} />
          <div className="absolute top-[80%] left-[80%] w-2 h-2 bg-amber-400/20 rounded-full blur-sm animate-float-slow" style={{ animationDelay: '12.5s', animationDuration: '13s' }} />
          <div className="absolute top-[76%] left-[28%] w-1.5 h-1.5 bg-amber-300/22 rounded-full blur-sm animate-float" style={{ animationDelay: '15.5s', animationDuration: '12.2s' }} />
          <div className="absolute top-[85%] left-[56%] w-2 h-2 bg-amber-400/18 rounded-full blur-sm animate-float-slow" style={{ animationDelay: '16s', animationDuration: '14.5s' }} />
          <div className="absolute top-[88%] right-[22%] w-1.5 h-1.5 bg-amber-300/20 rounded-full blur-sm animate-float" style={{ animationDelay: '16.5s', animationDuration: '12.5s' }} />
          <div className="absolute top-[90%] left-[88%] w-2 h-2 bg-amber-400/18 rounded-full blur-sm animate-float-slow" style={{ animationDelay: '17s', animationDuration: '13.8s' }} />
        </div>
        
        <div className="relative z-10 flex flex-col items-center gap-6 p-4 sm:gap-8 sm:p-6 md:flex-row md:items-center md:justify-between md:gap-10 md:p-8 lg:p-10">
          {/* Текст */}
          <div className="max-w-xl space-y-4 sm:space-y-5 md:space-y-6">
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.25em] text-slate-300">
              CandleTime
            </p>

            <h1 className="text-xl sm:text-2xl font-bold leading-tight md:text-3xl lg:text-4xl lg:leading-tight">
              Тихое место для
              <br className="hidden sm:block" /> символических свечей
            </h1>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-200 md:text-base">
              Зажги свечу, оставь намерение и вернись позже. Без ленты и лайков — только спокойный жест внимания.
            </p>

            <div className="flex flex-wrap gap-2 sm:gap-2.5 md:gap-3 pt-1 sm:pt-2">
              <Link
                href="/light"
                className="group inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-4 py-3 sm:py-2.5 text-xs font-medium text-slate-900 shadow-md transition-all hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-lg sm:gap-2 sm:px-6 sm:py-3 sm:text-sm min-h-[44px] sm:min-h-0"
              >
                <span>🕯️</span>
                <span className="whitespace-nowrap">Зажечь свечу</span>
              </Link>
              <Link
                href="/candles"
                className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-slate-500/70 px-4 py-3 sm:py-2.5 text-xs font-medium text-slate-50 transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:bg-slate-900/40 sm:gap-2 sm:px-6 sm:py-3 sm:text-sm min-h-[44px] sm:min-h-0"
              >
                <span>👁️</span>
                <span>Посмотреть свечи</span>
              </Link>
            </div>

            <p className="pt-1 sm:pt-2 text-[10px] sm:text-xs leading-relaxed text-slate-300">
              Войдёшь в аккаунт — появится личный кабинет{' '}
              <span className="font-medium text-slate-100">Мои свечи</span> с
              историей именно твоих свечей.
            </p>
          </div>

          {/* Свечка */}
          <div className="flex justify-center md:justify-end">
            <div className="flex flex-col items-center scale-90 sm:scale-100">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-amber-300/50 blur-2xl animate-pulse" />
              <div className="-mt-12 sm:-mt-14 candle-flame flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center">
                <div className="h-10 w-6 sm:h-12 sm:w-7 rounded-full bg-gradient-to-t from-amber-300 via-amber-100 to-amber-50 shadow-lg" />
              </div>
              <div className="-mt-1 h-28 w-8 sm:h-32 sm:w-9 rounded-full bg-slate-50 shadow-inner shadow-slate-900/40" />
            </div>
          </div>
        </div>
      </section>

      {/* Новогодний блок о 2025 годе - компактный и в стиле проекта */}
      {christmasThemeEnabled && (
        <section className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 sm:p-6 shadow-md">
          {/* Декоративный градиент */}
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 via-transparent to-emerald-500/5 dark:from-rose-500/10 dark:to-emerald-500/10" />
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
                Загадай желание на 2026 год
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Запиши своё намерение на новый год и зажги свечу. Вернись к ней позже, 
                когда захочешь вспомнить о важном или проверить, как идут дела.
              </p>
            </div>
            <Link
              href="/wish-2026"
              className="group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-md transition-all hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg min-h-[44px] sm:min-h-0"
            >
              <span>✨</span>
              <span>Загадать желание</span>
              <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      )}

      {/* STATS: 3 блока над "What is this?" */}
      <section className="grid gap-3 sm:gap-4 md:grid-cols-3">
        {/* Активные свечи */}
        <Link href="/candles" className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 dark:from-amber-900/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30 text-base sm:text-lg shadow-md transition-transform duration-300 group-hover:scale-110">
                🔥
              </div>
              <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Активные свечи
              </p>
            </div>
            <div className="flex flex-col gap-1.5 sm:gap-2">
              {statsLoading ? (
                <div className="h-7 w-14 sm:h-8 sm:w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {activeCount ?? 0}
                </p>
              )}
              <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Сейчас горят на странице Свечи
              </span>
            </div>
          </div>
        </Link>

        {/* Свечи, зажжённые сегодня */}
        <Link href="/candles" className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 dark:from-emerald-900/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:to-emerald-800/30 text-base sm:text-lg shadow-md transition-transform duration-300 group-hover:scale-110">
                ✨
              </div>
              <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Сегодня зажгли
              </p>
            </div>
            <div className="flex flex-col gap-1.5 sm:gap-2">
              {statsLoading ? (
                <div className="h-7 w-14 sm:h-8 sm:w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {todayCount ?? 0}
                </p>
              )}
              <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                За текущие сутки (по времени сервера)
              </span>
            </div>
          </div>
        </Link>

        {/* Самая популярная свеча */}
        <Link href="/candles" className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 dark:from-indigo-900/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-indigo-800/30 text-base sm:text-lg shadow-md transition-transform duration-300 group-hover:scale-110">
                {statsLoading
                  ? '🕯️'
                  : popularMeta
                  ? popularMeta.emoji
                  : '🕯️'}
              </div>
              <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Самая популярная свеча
              </p>
            </div>
            <div className="flex flex-col gap-1.5 sm:gap-2">
              {statsLoading ? (
                <div className="h-7 w-20 sm:h-8 sm:w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              ) : (
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 break-words">
                  {popularMeta ? popularMeta.label : '—'}
                </p>
              )}
              {!statsLoading && popularType.count > 0 && (
                <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
                  Зажигали {popularType.count} раз
                </span>
              )}
              {statsLoading && (
                <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
                  Считаем статистику
                </span>
              )}
              {!statsLoading && !popularMeta && (
                <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
                  Ещё нет данных
                </span>
              )}
            </div>
          </div>
        </Link>
      </section>

      {/* WHAT IS THIS */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative space-y-5">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 md:text-2xl">Что это?</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 md:text-base">
              CandleTime — спокойный микросервис, который открывается за пару секунд. Можно пользоваться анонимно или с аккаунтом, если нужна история свечей.{' '}
              <Link href="/faq" className="font-medium text-slate-900 dark:text-slate-100 underline hover:text-slate-700 dark:hover:text-slate-300">
                Узнайте больше в FAQ
              </Link>.
            </p>
          </div>

        <ul className="space-y-2.5 sm:space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <li className="group relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:p-4 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-50/50 dark:from-sky-900/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex gap-2.5 sm:gap-3 md:gap-4">
                <div className="mt-0.5 flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-900/50 dark:to-sky-800/30 text-base sm:text-lg shadow-md transition-transform duration-300 group-hover:scale-110">
                  🎯
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100">Личные намерения.</div>
                  <div className="break-words text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Свеча «про себя» — перед важным звонком, стартом проекта или просто чтобы зафиксировать внутреннее состояние.</div>
                </div>
              </div>
          </li>
            <li className="group relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:p-4 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 dark:from-emerald-900/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex gap-2.5 sm:gap-3 md:gap-4">
                <div className="mt-0.5 flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:to-emerald-800/30 text-base sm:text-lg shadow-md transition-transform duration-300 group-hover:scale-110">
                  🤝
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100">Поддержка других.</div>
                  <div className="break-words text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Имя друга, коллеги или близкого — цифровой жест «я про тебя помню» вместо длинных сообщений.</div>
                </div>
              </div>
          </li>
            <li className="group relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:p-4 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 dark:from-amber-900/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex gap-2.5 sm:gap-3 md:gap-4">
                <div className="mt-0.5 flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30 text-base sm:text-lg shadow-md transition-transform duration-300 group-hover:scale-110">
                  📅
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100">Даты и события.</div>
                  <div className="break-words text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Годовщины, дедлайны, памятные дни — свечи мягко отмечают момент без соцсетевого шума.</div>
                </div>
              </div>
          </li>
        </ul>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/30 to-white dark:from-slate-800 dark:via-slate-800/30 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-rose-500/5 dark:from-indigo-500/10 dark:to-rose-500/10" />
        
        <div className="relative space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 md:text-2xl">
              Как это работает
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 md:text-base">
              Без регистрации можно зажечь свечу. С аккаунтом — появляется
              личная история свечей.
            </p>
          </div>

          <div className="relative grid gap-4 md:gap-6 md:grid-cols-3">
            {/* Декоративная линия между шагами (только на десктопе) */}
            <div className="absolute left-1/2 top-12 hidden h-0.5 w-[calc(66.666%-2rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent md:block" />
            
            <div className="group relative space-y-2.5 sm:space-y-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-50/50 dark:from-sky-900/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-700 dark:to-slate-600 text-sm sm:text-base font-bold text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                    1
                  </div>
                  <div className="text-2xl sm:text-3xl transition-transform duration-300 group-hover:scale-110">✍️</div>
                </div>
                <p className="mb-1.5 sm:mb-2 text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                  Задай намерение
                </p>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  На странице <span className="font-medium text-slate-900 dark:text-slate-100">Зажечь</span> задаёшь
                  заголовок, сообщение и, при желании, анонимность.
                </p>
              </div>
            </div>

            <div className="group relative space-y-2.5 sm:space-y-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 dark:from-emerald-900/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-700 dark:to-slate-600 text-sm sm:text-base font-bold text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                    2
                  </div>
                  <div className="text-2xl sm:text-3xl transition-transform duration-300 group-hover:scale-110">⏱️</div>
                </div>
                <p className="mb-1.5 sm:mb-2 text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                  Выбери длительность
                </p>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Час, сутки или неделя. Когда время заканчивается, свеча
                  автоматически исчезает из списка активных.
                </p>
              </div>
            </div>

            <div className="group relative space-y-2.5 sm:space-y-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 dark:from-amber-900/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-700 dark:to-slate-600 text-sm sm:text-base font-bold text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                    3
                  </div>
                  <div className="text-2xl sm:text-3xl transition-transform duration-300 group-hover:scale-110">👀</div>
                </div>
                <p className="mb-1.5 sm:mb-2 text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                  Вернись и посмотри
                </p>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Активные свечи — на странице{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-100">Свечи</span>, свои — в{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-100">Мои свечи</span> после входа.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 px-4 py-8 text-center text-sm text-slate-100 shadow-lg sm:px-6 sm:py-10 md:px-8 md:py-12">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5" />
        
        {/* Декоративный паттерн */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] bg-[length:24px_24px]" />
        </div>
        
        <div className="relative space-y-6">
          <div className="space-y-3">
            <p className="text-lg font-semibold text-slate-50 md:text-xl lg:text-2xl">
              Попробуй зажечь одну свечу и вернись к ней позже.
            </p>
            <p className="text-sm text-slate-300 md:text-base">
              Просто, спокойно, без лишнего.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 md:gap-3">
            <Link
              href="/light"
              className="group inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-white px-4 py-3 sm:py-2.5 text-xs font-semibold text-slate-900 shadow-md transition-all hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-lg sm:gap-2 sm:px-6 sm:py-3 sm:text-sm min-h-[44px] sm:min-h-0"
            >
              <span className="text-base transition-transform duration-300 group-hover:scale-110">🕯️</span>
              <span>Зажечь свечу</span>
            </Link>
            <Link
              href="/auth/login"
              className="group inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-slate-500/70 bg-slate-900/40 px-4 py-3 sm:py-2.5 text-xs font-medium text-slate-50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-800/60 hover:shadow-lg sm:gap-2 sm:px-6 sm:py-3 sm:text-sm min-h-[44px] sm:min-h-0"
            >
              <span className="text-base transition-transform duration-300 group-hover:scale-110">🔐</span>
              <span className="hidden sm:inline">Войти и Мои свечи</span>
              <span className="sm:hidden">Войти</span>
            </Link>
          </div>

          <p className="pt-2 text-xs text-slate-400 md:text-sm">
            Пет-проект: никаких реальных пожертвований или оплат — только
            символические свечи и текст.
          </p>
        </div>
      </section>
      </div>
      <Wish2026FloatingButton />
    </>
  );
}
