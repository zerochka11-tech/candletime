'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { LocationSelector } from '@/components/geographic/LocationSelector';

// Типы свечей
const CANDLE_TYPES = [
  {
    id: 'calm',
    label: 'Спокойствие',
    emoji: '🕊️',
  },
  {
    id: 'support',
    label: 'Поддержка',
    emoji: '🤝',
  },
  {
    id: 'memory',
    label: 'Память',
    emoji: '🌙',
  },
  {
    id: 'gratitude',
    label: 'Благодарность',
    emoji: '✨',
  },
  {
    id: 'focus',
    label: 'Фокус',
    emoji: '🎯',
  },
] as const;

type CandleTypeId = (typeof CANDLE_TYPES)[number]['id'];

// Варианты длительности
const DURATION_OPTIONS = [
  { value: '1', label: '1 час' },
  { value: '24', label: '24 часа' },
  { value: '168', label: '7 дней' },
] as const;

const CANDLE_COLORS: Record<
  CandleTypeId | 'default',
  { glow: string; flameFrom: string; flameTo: string }
> = {
  calm: {
    glow: 'bg-sky-300/40',
    flameFrom: 'from-sky-50',
    flameTo: 'to-sky-200',
  },
  support: {
    glow: 'bg-emerald-300/40',
    flameFrom: 'from-emerald-50',
    flameTo: 'to-emerald-200',
  },
  memory: {
    glow: 'bg-indigo-300/40',
    flameFrom: 'from-indigo-50',
    flameTo: 'to-indigo-200',
  },
  gratitude: {
    glow: 'bg-amber-300/50',
    flameFrom: 'from-amber-50',
    flameTo: 'to-amber-200',
  },
  focus: {
    glow: 'bg-rose-300/40',
    flameFrom: 'from-rose-50',
    flameTo: 'to-rose-200',
  },
  default: {
    glow: 'bg-amber-300/50',
    flameFrom: 'from-amber-200',
    flameTo: 'to-amber-50',
  },
};

// Тексты для превью и карточки под иконками
const CANDLE_COPY: Record<
  CandleTypeId,
  { title: string; previewText: string; cardText: string }
> = {
  calm: {
    title: 'Свеча спокойствия',
    previewText:
      'Спокойная свеча, когда хочется выдохнуть, перед сном или сложным разговором.',
    cardText: 'Немного тишины, чтобы собрать мысли и отпустить напряжение.',
  },
  support: {
    title: 'Свеча поддержки',
    previewText:
      'Свеча поддержки — тихий жест «я рядом» для друга, коллеги или близкого человека.',
    cardText: 'Когда важно дать понять кому-то, что он не один.',
  },
  memory: {
    title: 'Свеча памяти',
    previewText:
      'Свеча памяти — для важных дат, людей и моментов, которые хочется отметить мягко.',
    cardText: 'Тёплое напоминание о том, что для тебя по-настоящему важно.',
  },
  gratitude: {
    title: 'Свеча благодарности',
    previewText:
      'Свеча благодарности — за день, человека, событие или маленькую победу.',
    cardText: 'Фиксирует момент «спасибо», который не хочется просто пролистать.',
  },
  focus: {
    title: 'Свеча фокуса',
    previewText:
      'Свеча фокуса — перед задачей, дедлайном или новой целью, чтобы настроиться.',
    cardText: 'Помогает на пару часов убрать лишнее и сфокусироваться на главном.',
  },
};

/** Свеча в HERO - универсальный блок */
function CandleHero({ 
  selectedTemplate, 
  isCustom, 
  selectedType 
}: { 
  selectedTemplate: string | null;
  isCustom: boolean;
  selectedType: CandleTypeId;
}) {
  // Если выбран шаблон, показываем его информацию
  const template = selectedTemplate 
    ? CANDLE_TEMPLATES.find((t) => t.id === selectedTemplate)
    : null;

  // Если своя свеча, показываем тип
  const typeMeta = isCustom 
    ? CANDLE_TYPES.find((t) => t.id === selectedType) ?? CANDLE_TYPES[0]
    : null;
  const typeCopy = isCustom && typeMeta
    ? CANDLE_COPY[selectedType]
    : null;

  // Цвета для свечи
  const colors = template 
    ? CANDLE_COLORS[template.type] ?? CANDLE_COLORS.default
    : isCustom
    ? CANDLE_COLORS[selectedType] ?? CANDLE_COLORS.default
    : CANDLE_COLORS.default;

  // Если ничего не выбрано - показываем общий призыв
  if (!selectedTemplate && !isCustom) {
    return (
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-4 py-6 text-white shadow-[0_16px_40px_rgba(15,23,42,0.5)] sm:px-6 sm:py-8 md:px-10 md:py-10">
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
        
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-8 md:flex-row md:items-center md:justify-between">
          {/* Текст */}
          <div className="max-w-lg space-y-3 text-center md:text-left">
            <h2 className="text-2xl font-bold leading-tight md:text-3xl lg:text-4xl lg:leading-tight">
              Зажги свою свечу
            </h2>
            <p className="text-sm leading-relaxed text-slate-200/90 md:text-base">
              Выбери готовый шаблон для быстрого старта или создай свою уникальную свечу с нуля. 
              Каждая свеча — это маленький момент внимания и заботы.
            </p>
          </div>

          {/* Свечка */}
          <div className="flex justify-center md:justify-end">
            <div className="flex flex-col items-center">
              <div className="h-24 w-24 rounded-full bg-amber-300/50 blur-2xl animate-pulse" />
              <div className="-mt-14 candle-flame flex h-14 w-14 items-center justify-center">
                <div className="h-12 w-7 rounded-full bg-gradient-to-t from-amber-300 via-amber-100 to-amber-50 shadow-lg" />
              </div>
              <div className="-mt-1 h-32 w-9 rounded-full bg-slate-50 shadow-inner shadow-slate-900/40" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Если выбран шаблон или своя свеча - показываем соответствующую информацию
  const title = template 
    ? `${template.emoji} ${template.name}`
    : typeCopy && typeMeta
    ? `${typeMeta.emoji} ${typeCopy.title}`
    : 'Своя свеча';

  const description = template
    ? template.message
    : typeCopy
    ? typeCopy.previewText
    : 'Создай свою уникальную свечу';

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-4 py-5 text-white shadow-[0_16px_40px_rgba(15,23,42,0.5)] sm:px-6 sm:py-6 md:px-8 md:py-7">
      {/* Декоративный градиент */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 z-0" />
      
      {/* Декоративные элементы (звезды, облака, символы, золотые элементы) - аналогично главной странице */}
      {/* Звездочки */}
      <div className="absolute inset-0 pointer-events-none z-0">
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
        <div className="absolute top-[22%] left-[3%] w-0.5 h-0.5 bg-white/40 rounded-full animate-twinkle" style={{ animationDelay: '2s', animationDuration: '3.3s' }} />
        <div className="absolute top-[25%] left-[8%] w-0.5 h-0.5 bg-white/50 rounded-full animate-twinkle" style={{ animationDelay: '2.5s', animationDuration: '3.7s' }} />
        <div className="absolute top-[50%] left-[50%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '4.2s', animationDuration: '4.7s' }} />
        <div className="absolute top-[75%] left-[50%] w-0.5 h-0.5 bg-white/25 rounded-full animate-twinkle" style={{ animationDelay: '7.2s', animationDuration: '5.5s' }} />
        <div className="absolute top-[95%] left-[50%] w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle" style={{ animationDelay: '12s', animationDuration: '4.3s' }} />
      </div>
      
      {/* Облака */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[2%] left-0 w-40 h-20 bg-sky-200/15 dark:bg-sky-300/8 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: '0s', animationDuration: '20s' }} />
        <div className="absolute top-[5%] right-[5%] w-32 h-16 bg-sky-200/20 dark:bg-sky-300/12 rounded-full blur-xl animate-float" style={{ animationDelay: '2s', animationDuration: '15s' }} />
        <div className="absolute top-[50%] left-[30%] w-28 h-14 bg-sky-200/10 dark:bg-sky-300/5 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: '14s', animationDuration: '20s' }} />
        <div className="absolute top-[85%] left-[45%] w-32 h-16 bg-sky-200/12 dark:bg-sky-300/6 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: '16s', animationDuration: '19s' }} />
      </div>
      
      {/* Астрологические символы */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.08] z-0">
        <div className="absolute top-[8%] left-[12%] text-sky-200/40 text-xs font-light" style={{ fontFamily: 'serif' }}>♈</div>
        <div className="absolute top-[6%] left-[28%] text-sky-200/40 text-xs font-light" style={{ fontFamily: 'serif' }}>♉</div>
        <div className="absolute top-[10%] left-[48%] text-sky-200/40 text-xs font-light" style={{ fontFamily: 'serif' }}>♊</div>
        <div className="absolute top-[50%] left-[38%] text-sky-200/30 text-xs font-light" style={{ fontFamily: 'serif' }}>♀</div>
        <div className="absolute top-[85%] left-[52%] text-sky-200/30 text-xs font-light" style={{ fontFamily: 'serif' }}>♃</div>
      </div>
      
      {/* Золотые элементы */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[12%] left-[8%] w-1.5 h-1.5 bg-amber-300/25 rounded-full blur-sm animate-float" style={{ animationDelay: '5s', animationDuration: '12s' }} />
        <div className="absolute top-[16%] left-[25%] w-2 h-2 bg-amber-400/20 rounded-full blur-sm animate-float-slow" style={{ animationDelay: '6s', animationDuration: '14s' }} />
        <div className="absolute top-[50%] left-[32%] w-2 h-2 bg-amber-400/18 rounded-full blur-sm animate-float-slow" style={{ animationDelay: '14.5s', animationDuration: '14.2s' }} />
        <div className="absolute top-[85%] left-[56%] w-2 h-2 bg-amber-400/18 rounded-full blur-sm animate-float-slow" style={{ animationDelay: '16s', animationDuration: '14.5s' }} />
      </div>
      
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6 md:flex-row md:items-center md:justify-between">
        {/* Текст */}
        <div className="max-w-md space-y-2 text-center md:text-left">
          <h2 className="text-lg font-semibold leading-snug md:text-xl">
            {title}
          </h2>
          <p className="text-sm text-slate-200/90 md:text-base">
            {description}
          </p>
        </div>

        {/* Свечка */}
        <div className="flex justify-center md:justify-end">
          <div className="flex flex-col items-center">
            <div
              className={`h-20 w-20 rounded-full blur-2xl transition-all duration-500 ${colors.glow}`}
            />
            <div className="-mt-12 candle-flame flex h-12 w-12 items-center justify-center">
              <div
                className={`h-10 w-6 rounded-full bg-gradient-to-t ${colors.flameFrom} ${colors.flameTo} shadow-md transition-transform duration-300`}
              />
            </div>
            <div className="-mt-1 h-28 w-8 rounded-full bg-slate-50 shadow-inner shadow-slate-900/40" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Модалка после успешного зажигания свечи */
function CandleSuccessModal({
  open,
  onClose,
  onViewAll,
  candleId,
}: {
  open: boolean;
  onClose: () => void;
  onViewAll: () => void;
  candleId: string | null;
}) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const candleUrl = candleId ? `${window.location.origin}/candle/${candleId}` : null;

  const handleCopyLink = async () => {
    if (!candleUrl) return;
    try {
      await navigator.clipboard.writeText(candleUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const handleShare = async () => {
    if (!candleUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Моя свеча',
          text: 'Посмотри на мою свечу',
          url: candleUrl,
        });
      } else {
        // Fallback на копирование
        handleCopyLink();
      }
    } catch (e) {
      // Пользователь отменил шаринг
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm"
      aria-labelledby="candle-success-title"
      aria-modal="true"
      role="dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900/95 px-6 py-6 text-slate-50 shadow-2xl ring-1 ring-slate-700/60">
        <div className="flex flex-col items-center gap-4">
          {/* Анимированная свеча */}
          <div className="flex flex-col items-center">
            <div className="h-24 w-24 rounded-full bg-amber-300/50 blur-2xl animate-pulse" />
            <div className="-mt-16 flex h-16 w-16 items-center justify-center">
              <div className="h-14 w-8 rounded-full bg-gradient-to-t from-amber-300 via-amber-100 to-amber-50 shadow-[0_0_30px_rgba(251,191,36,0.9)] animate-bounce" />
            </div>
            <div className="-mt-1 h-28 w-8 rounded-full bg-slate-50 shadow-inner shadow-slate-900/60" />
          </div>

          <div className="space-y-2 text-center">
            <h2 id="candle-success-title" className="text-lg font-semibold">
              Свеча зажжена ✨
            </h2>
            <p className="text-xs text-slate-300">
              Твоя свеча теперь горит вместе с другими.
            </p>
          </div>

          {/* Две основные кнопки */}
          <div className="mt-3 flex w-full flex-col gap-2">
            <Link
              href="/candles"
              onClick={onClose}
              className="w-full rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-md text-center"
            >
              Посмотреть все свечи
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full border border-slate-500/70 bg-slate-900 px-4 py-2.5 text-xs font-medium text-slate-50 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-800"
            >
              Зажечь ещё одну свечу
            </button>
          </div>

          {/* Иконки дополнительных действий */}
          {candleUrl && (
            <div className="mt-3 flex items-center justify-center gap-3 border-t border-slate-700/50 pt-3">
              <Link
                href={candleUrl}
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-500/50 bg-slate-800 text-base transition hover:border-slate-400 hover:bg-slate-700"
                title="Посмотреть мою свечу"
              >
                👁️
              </Link>
              <button
                type="button"
                onClick={handleShare}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-500/50 bg-slate-800 text-base transition hover:border-slate-400 hover:bg-slate-700"
                title="Поделиться"
              >
                📤
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-500/50 bg-slate-800 text-base transition hover:border-slate-400 hover:bg-slate-700"
                title={copied ? 'Скопировано!' : 'Копировать ссылку'}
              >
                {copied ? '✓' : '🔗'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const MAX_TITLE_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 500;

// Шаблоны свечей
const CANDLE_TEMPLATES = [
  {
    id: 'morning',
    name: 'Утренняя свеча',
    type: 'focus' as CandleTypeId,
    title: 'На новый день',
    message: 'Пусть сегодня будет продуктивным и спокойным.',
    duration: '24',
    emoji: '🌅',
  },
  {
    id: 'gratitude',
    name: 'Благодарность',
    type: 'gratitude' as CandleTypeId,
    title: 'За сегодня',
    message: 'Спасибо за этот день и все хорошее, что в нем было.',
    duration: '24',
    emoji: '🙏',
  },
  {
    id: 'support',
    name: 'Поддержка друга',
    type: 'support' as CandleTypeId,
    title: 'Для [имя]',
    message: 'Я рядом. Всё будет хорошо.',
    duration: '168',
    emoji: '🤝',
  },
  {
    id: 'calm',
    name: 'Спокойствие',
    type: 'calm' as CandleTypeId,
    title: 'Момент тишины',
    message: 'Время остановиться и просто быть.',
    duration: '1',
    emoji: '🕊️',
  },
  {
    id: 'memory',
    name: 'Память',
    type: 'memory' as CandleTypeId,
    title: 'В память о [имя/событие]',
    message: 'Помню и чту.',
    duration: '168',
    emoji: '🌙',
  },
  {
    id: 'release',
    name: 'За релиз в продакшн',
    type: 'focus' as CandleTypeId,
    title: 'За релиз в продакшн',
    message: 'Пусть всё работает, багов нет, а мониторинг молчит.',
    duration: '24',
    emoji: '🚀',
  },
  {
    id: 'deploy',
    name: 'За деплой без багов',
    type: 'gratitude' as CandleTypeId,
    title: 'За успешный деплой',
    message: 'Всё задеплоилось с первого раза. Чудо!',
    duration: '1',
    emoji: '✨',
  },
  {
    id: 'ticket',
    name: 'За закрытый тикет',
    type: 'gratitude' as CandleTypeId,
    title: 'За закрытый тикет',
    message: 'Ещё один тикет в Done. Маленькая победа!',
    duration: '24',
    emoji: '✅',
  },
  {
    id: 'code-review',
    name: 'За код-ревью',
    type: 'support' as CandleTypeId,
    title: 'За код-ревью',
    message: 'Спасибо за ревью! Комментарии конструктивные, багов не нашли.',
    duration: '24',
    emoji: '👀',
  },
  {
    id: 'no-coffee',
    name: 'За код без кофеина',
    type: 'focus' as CandleTypeId,
    title: 'За код без кофеина',
    message: 'Написал рабочий код на трезвую голову. Горжусь собой.',
    duration: '1',
    emoji: '☕',
  },
  {
    id: 'bug-fix',
    name: 'За починку бага',
    type: 'gratitude' as CandleTypeId,
    title: 'За починку бага',
    message: 'Нашёл и исправил баг, который мучил неделю. Победа!',
    duration: '24',
    emoji: '🐛',
  },
  {
    id: 'standup',
    name: 'За выживание на стендапе',
    type: 'calm' as CandleTypeId,
    title: 'За выживание на стендапе',
    message: 'Пережил ещё один стендап. Всё хорошо.',
    duration: '1',
    emoji: '💪',
  },
  {
    id: 'merge-request',
    name: 'За успешный MR',
    type: 'gratitude' as CandleTypeId,
    title: 'За успешный merge request',
    message: 'MR принят без комментариев. Идеально!',
    duration: '24',
    emoji: '🔀',
  },
  {
    id: 'sprint-done',
    name: 'За завершение спринта',
    type: 'gratitude' as CandleTypeId,
    title: 'За завершение спринта',
    message: 'Спринт завершен. Все задачи закрыты. Отдыхай!',
    duration: '168',
    emoji: '🏁',
  },
  {
    id: 'hard-task',
    name: 'За решение сложной задачи',
    type: 'focus' as CandleTypeId,
    title: 'За решение сложной задачи',
    message: 'Решил сложную задачу. Мозг работает!',
    duration: '24',
    emoji: '🧩',
  },
] as const;

// Ключ для localStorage
const DRAFT_STORAGE_KEY = 'candletime_draft';

// Тип черновика
type Draft = {
  selectedTemplate: string | null;
  isCustom: boolean;
  type: CandleTypeId;
  title: string;
  message: string;
  duration: string;
  isAnonymous: boolean;
  location?: {
    display_name: string;
    latitude: number;
    longitude: number;
    country?: string;
    city?: string;
    region?: string;
  } | null;
  showOnMap?: boolean;
};

export default function LightCandlePage() {
  const router = useRouter();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [selectedType, setSelectedType] = useState<CandleTypeId>('calm');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [duration, setDuration] = useState<string>('24');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [createdCandleId, setCreatedCandleId] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    display_name: string;
    latitude: number;
    longitude: number;
    country?: string;
    city?: string;
    region?: string;
  } | null>(null);
  const [showOnMap, setShowOnMap] = useState(true);

  // Загрузка черновика при монтировании
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft: Draft = JSON.parse(savedDraft);
        // Поддержка старых черновиков без selectedTemplate/isCustom
        if ('selectedTemplate' in draft) {
          setSelectedTemplate(draft.selectedTemplate);
          setIsCustom(draft.isCustom || false);
        } else {
          // Старый формат - определяем автоматически
          setIsCustom(true);
        }
        setSelectedType(draft.type);
        setTitle(draft.title);
        setMessage(draft.message);
        setDuration(draft.duration);
        setIsAnonymous(draft.isAnonymous);
        if (draft.location) {
          setLocation(draft.location);
        }
        if (draft.showOnMap !== undefined) {
          setShowOnMap(draft.showOnMap);
        }
        setHasDraft(true);
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  // Сохранение черновика при изменении полей
  useEffect(() => {
    const draft: Draft = {
      selectedTemplate,
      isCustom,
      type: selectedType,
      title,
      message,
      duration,
      isAnonymous,
      location,
      showOnMap,
    };

    // Сохраняем только если есть хотя бы название или сообщение
    if (title.trim() || message.trim()) {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setHasDraft(true);
    } else {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraft(false);
    }
  }, [selectedTemplate, isCustom, selectedType, title, message, duration, isAnonymous, location, showOnMap]);

  // Применение шаблона
  const applyTemplate = (template: typeof CANDLE_TEMPLATES[number]) => {
    setSelectedTemplate(template.id);
    setIsCustom(false);
    setSelectedType(template.type);
    setTitle(template.title);
    setMessage(template.message);
    setDuration(template.duration);
    setIsAnonymous(false);
  };

  // Переключение на свою свечу
  const enableCustom = () => {
    setSelectedTemplate(null);
    setIsCustom(true);
    setTitle('');
    setMessage('');
    setDuration('24');
    setIsAnonymous(false);
    setSelectedType('calm');
  };

  // Очистка черновика
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setTitle('');
    setMessage('');
    setDuration('24');
    setIsAnonymous(false);
    setSelectedType('calm');
    setSelectedTemplate(null);
    setIsCustom(false);
    setLocation(null);
    setShowOnMap(true);
    setHasDraft(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Валидация на клиенте
    if (!title.trim()) {
      setError('Название свечи обязательно для заполнения.');
      setLoading(false);
      return;
    }

    if (title.length > MAX_TITLE_LENGTH) {
      setError(`Название не должно превышать ${MAX_TITLE_LENGTH} символов.`);
      setLoading(false);
      return;
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      setError(`Сообщение не должно превышать ${MAX_MESSAGE_LENGTH} символов.`);
      setLoading(false);
      return;
    }

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      const durationHours = parseInt(duration, 10);
      const createdAt = new Date();
      const expiresAt = new Date(
        createdAt.getTime() + durationHours * 60 * 60 * 1000
      );

      // Подготовка данных для вставки
      const insertData: any = {
        title: title.trim(),
        message: message.trim() || null,
        is_anonymous: isAnonymous,
        duration_hours: durationHours,
        expires_at: expiresAt.toISOString(),
        status: 'active',
        user_id: user ? user.id : null,
        candle_type: selectedType,
      };

      // Добавляем геоданные, если они есть
      if (location) {
        insertData.location_latitude = location.latitude;
        insertData.location_longitude = location.longitude;
        insertData.location_country = location.country || null;
        insertData.location_city = location.city || null;
        insertData.location_region = location.region || null;
        insertData.location_address = location.display_name;
        insertData.location_show_on_map = showOnMap;
        // Определяем тип локации
        if (location.city && location.country) {
          insertData.location_type = 'city';
        } else if (location.country) {
          insertData.location_type = 'country';
        } else {
          insertData.location_type = 'precise';
        }
      } else {
        insertData.location_type = 'none';
      }

      const { data, error } = await supabase
        .from('candles')
        .insert(insertData)
        .select('id')
        .single();

      if (error) {
        console.error(error);
        setError('Не удалось создать свечу. Попробуй ещё раз.');
        setLoading(false);
      } else {
        // Сохраняем ID созданной свечи
        setCreatedCandleId(data?.id || null);
        
        // Оптимистичное обновление: очищаем форму и черновик сразу
        // Это дает мгновенную обратную связь пользователю
        clearDraft();
        setTitle('');
        setMessage('');
        
        // Открываем модалку успеха (уже показывает оптимистичный результат)
        setShowSuccessModal(true);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Произошла ошибка. Попробуй ещё раз.');
      setLoading(false);
    }
  };

  const activeMeta = CANDLE_TYPES.find((t) => t.id === selectedType)!;
  const activeCopy = CANDLE_COPY[selectedType];

  return (
    <>
      <div className="flex flex-col gap-6 md:gap-8">
        {/* HERO со свечой и динамичным текстом */}
        <CandleHero 
          selectedTemplate={selectedTemplate}
          isCustom={isCustom}
          selectedType={selectedType}
        />

        {/* Выбор: шаблоны или своя свеча */}
        {!selectedTemplate && !isCustom && (
          <section className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
            {/* Декоративный градиент */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
            
            <div className="relative mb-4 space-y-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 md:text-xl">
                Выбери шаблон или создай свою свечу
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 md:text-base">
                Шаблоны помогут быстро зажечь свечу, или создай свою с нуля
              </p>
            </div>

            {/* Шаблоны */}
            <div className="relative mb-4">
              <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Быстрые шаблоны
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                {CANDLE_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="group relative flex flex-col items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 sm:p-4 min-h-[80px] sm:min-h-0 text-[10px] sm:text-xs shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg"
                  >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-slate-50/50 dark:from-slate-700/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="relative text-xl sm:text-2xl transition-transform duration-300 group-hover:scale-110">{template.emoji}</span>
                    <span className="relative font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 text-center leading-tight">
                      {template.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Кнопка "Своя свеча" */}
            <div className="relative border-t border-slate-300 dark:border-slate-700 pt-4">
              <button
                type="button"
                onClick={enableCustom}
                className="group w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3.5 sm:py-3 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg min-h-[48px] sm:min-h-0"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="text-base transition-transform duration-300 group-hover:scale-110">✨</span>
                  <span>Создать свою свечу</span>
                </span>
              </button>
            </div>

            {hasDraft && (
              <div className="relative mt-4 rounded-xl border border-amber-300 dark:border-amber-600 bg-white dark:bg-slate-800 p-3 shadow-md transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                    💾 У тебя есть сохраненный черновик
                  </p>
                  <button
                    type="button"
                    onClick={clearDraft}
                    className="text-xs font-medium text-amber-700 dark:text-amber-400 transition hover:text-amber-900 dark:hover:text-amber-200 hover:underline"
                  >
                    Очистить
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Форма (показывается только если выбран шаблон или своя свеча) */}
        {(selectedTemplate || isCustom) && (
          <section className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
            {/* Декоративный градиент */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
            
            <div className="relative mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 md:text-xl">
                  {selectedTemplate
                    ? CANDLE_TEMPLATES.find((t) => t.id === selectedTemplate)?.name
                    : 'Своя свеча'}
                </h2>
                {selectedTemplate && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 md:text-sm">
                    Можешь изменить название и сообщение
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTemplate(null);
                  setIsCustom(false);
                  setTitle('');
                  setMessage('');
                  setDuration('24');
                  setIsAnonymous(false);
                  setSelectedType('calm');
                }}
                className="text-xs text-slate-500 dark:text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-300 hover:underline md:text-sm"
              >
                ← Назад к выбору
              </button>
            </div>

            <form onSubmit={handleSubmit} className="relative space-y-6" noValidate>
              {/* Тип свечи (только для своей свечи) */}
              {isCustom && (
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-slate-900 dark:text-slate-100 md:text-base">
                    Тип свечи
                  </label>

                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
                    {CANDLE_TYPES.map((type) => {
                      const isActive = type.id === selectedType;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => setSelectedType(type.id)}
                          className={
                            'group relative flex flex-col items-center justify-center rounded-2xl border py-2.5 sm:py-2 min-h-[80px] sm:min-h-0 text-[10px] sm:text-xs transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 ' +
                            (isActive
                              ? 'border-slate-900 dark:border-slate-100 bg-slate-900/90 dark:bg-slate-100 text-slate-50 dark:text-slate-900 shadow-md'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-md hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg')
                          }
                        >
                          {!isActive && (
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-50/50 dark:from-slate-700/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          )}
                          <div
                            className={
                              'relative mb-1 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-base sm:text-lg transition-transform duration-300 ' +
                              (isActive
                                ? 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100'
                                : 'bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 group-hover:scale-110')
                            }
                          >
                            {type.emoji}
                          </div>
                          <span
                            className={
                              'relative min-h-[14px] sm:min-h-[16px] flex items-center text-center leading-tight ' +
                              (isActive
                                ? 'font-semibold'
                                : 'font-medium text-slate-700 dark:text-slate-300')
                            }
                          >
                            {type.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Карточка с текстом по выбранному типу */}
                  <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-xs text-slate-700 dark:text-slate-300 shadow-md transition-colors duration-200">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{activeMeta.emoji}</span>
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {activeCopy.title}
                        </span>
                        <span className="mx-1.5 text-slate-400 dark:text-slate-500">•</span>
                        <span>{activeCopy.cardText}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* Остальные поля */}
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 md:text-base">
                    Название свечи <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <span
                    className={`text-xs md:text-sm ${
                      title.length > MAX_TITLE_LENGTH
                        ? 'text-red-600 dark:text-red-400'
                        : title.length > MAX_TITLE_LENGTH * 0.8
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {title.length}/{MAX_TITLE_LENGTH}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={MAX_TITLE_LENGTH}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Для кого-то, для чего-то или только сегодня"
                  className={`w-full rounded-xl border px-3 py-3 sm:py-2.5 text-sm outline-none transition shadow-md min-h-[44px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                    title.length > MAX_TITLE_LENGTH
                      ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 focus:border-red-500 dark:focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-slate-500 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-500'
                  }`}
                />
                {title.length > MAX_TITLE_LENGTH * 0.8 && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    Осталось {MAX_TITLE_LENGTH - title.length} символов
                  </p>
                )}
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 md:text-base">
                    Сообщение
                  </label>
                  <span
                    className={`text-xs md:text-sm ${
                      message.length > MAX_MESSAGE_LENGTH
                        ? 'text-red-600 dark:text-red-400'
                        : message.length > MAX_MESSAGE_LENGTH * 0.8
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {message.length}/{MAX_MESSAGE_LENGTH}
                  </span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={MAX_MESSAGE_LENGTH}
                  rows={4}
                  placeholder="Короткое сообщение (по желанию)"
                  className={`w-full rounded-xl border px-3 py-3 sm:py-2.5 text-sm outline-none transition resize-none shadow-md min-h-[100px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                    message.length > MAX_MESSAGE_LENGTH
                      ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 focus:border-red-500 dark:focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-slate-500 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-500'
                  }`}
                />
                {message.length > MAX_MESSAGE_LENGTH * 0.8 && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    Осталось {MAX_MESSAGE_LENGTH - message.length} символов
                  </p>
                )}
              </div>
            </div>

            {/* Выбор места */}
            <LocationSelector
              onLocationSelect={setLocation}
              initialLocation={location || undefined}
              showOnMap={showOnMap}
              onShowOnMapChange={setShowOnMap}
            />

            {/* Длительность + анонимность */}
            <div className="grid gap-4 md:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)] md:items-end">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-slate-100 md:text-base">
                  Длительность
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3 sm:py-2.5 text-sm outline-none transition shadow-md min-h-[44px] text-slate-900 dark:text-slate-100 focus:border-slate-500 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="group flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:p-3 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg md:justify-center min-h-[44px]">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-5 w-5 sm:h-4 sm:w-4 rounded border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 transition focus:ring-2 focus:ring-slate-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Анонимно
                </span>
              </label>
            </div>

            {/* Кнопка + сообщения */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={loading || !title.trim() || title.length > MAX_TITLE_LENGTH || message.length > MAX_MESSAGE_LENGTH}
                className="w-full rounded-full bg-slate-900 dark:bg-slate-700 px-6 py-3.5 sm:py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-slate-600 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:hover:translate-y-0 min-h-[48px] sm:min-h-0"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Зажигаем…</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <span>🕯️</span>
                    <span>Зажечь свечу</span>
                  </span>
                )}
              </button>

              {error && (
                <div className="rounded-xl border border-red-300 dark:border-red-600 bg-white dark:bg-slate-800 p-3 shadow-md transition-colors duration-200">
                  <p className="text-xs font-medium text-red-800 dark:text-red-300 md:text-sm">{error}</p>
                </div>
              )}

              {!title.trim() && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Заполни название свечи, чтобы продолжить
                </p>
              )}
            </div>
          </form>
        </section>
        )}
      </div>

      {/* Модалка после успешного зажигания */}
      <CandleSuccessModal
        open={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setCreatedCandleId(null);
        }}
        onViewAll={() => {
          setShowSuccessModal(false);
          setCreatedCandleId(null);
          router.push('/candles');
        }}
        candleId={createdCandleId}
      />
    </>
  );
}
