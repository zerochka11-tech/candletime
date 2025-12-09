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
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5" />
        
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-8 md:flex-row md:items-center md:justify-between">
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
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5" />
      
      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 md:flex-row md:items-center md:justify-between">
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
      } else {
        // Сохраняем ID созданной свечи
        setCreatedCandleId(data?.id || null);
        
        // Очистка черновика после успешного создания
        clearDraft();

        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error(err);
      setError('Произошла ошибка. Попробуй ещё раз.');
    } finally {
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
