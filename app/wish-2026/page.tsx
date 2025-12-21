'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Wish2026Page() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [duration, setDuration] = useState<24 | 168 | 720>(168); // 1 день, 1 неделя, 1 месяц
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Вычисляем дату истечения
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + duration);

      // Создаём свечу с особым типом для желаний на 2026 год
      const { data, error: insertError } = await supabase
        .from('candles')
        .insert({
          title: title || '✨ Желание на 2026 год 🎄',
          message: message || 'Пусть 2026 год принесёт исполнение всех желаний и воплощение самых заветных мечтаний!',
          expires_at: expiresAt.toISOString(),
          duration_hours: duration,
          is_anonymous: isAnonymous,
          candle_type: 'wish_2026',
          status: 'active',
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Перенаправляем на страницу свечи
      router.push(`/candle/${data.id}`);
    } catch (err: any) {
      console.error('Error creating wish candle:', err);
      setError(err.message || 'Не удалось зажечь новогоднюю свечу. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* Заголовок */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-6 sm:p-8 md:p-10 shadow-md">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative text-center space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
            ✨ Загадай желание на 2026 год 🎄
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Новый год — время для новых начинаний и исполнения мечтаний. 
            Запиши своё самое заветное желание и зажги свечу, которая будет напоминать тебе о важном. 
            Вернись к ней в любой момент, чтобы вспомнить о своих намерениях и проверить, как идут дела.
          </p>
        </div>
      </section>

      {/* Форма */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-6 sm:p-8 md:p-10 shadow-md">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Заголовок желания */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                🎁 Краткое название твоего желания (необязательно)
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Новый дом, Путешествие мечты, Здоровье близких, Карьерный рост..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-400/20"
                maxLength={100}
              />
            </div>

            {/* Текст желания */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                ⭐ Твоё самое заветное желание на 2026 год
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Опиши своё желание подробнее. Что ты хочешь, чтобы произошло в новом году? Какие цели и мечты ты хочешь воплотить? Что важно для тебя в 2026 году? Пусть это будет твоим намерением на весь год..."
                rows={8}
                required
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-400/20 resize-none"
                maxLength={1000}
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {message.length}/1000 символов
              </p>
            </div>

            {/* Длительность свечи */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                ✨ Как долго будет гореть твоя новогодняя свеча?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 24, label: '1 день', emoji: '❄️' },
                  { value: 168, label: '1 неделя', emoji: '🎄' },
                  { value: 720, label: '1 месяц', emoji: '🎁' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDuration(option.value as 24 | 168 | 720)}
                    className={`rounded-lg border-2 p-4 text-center transition-all ${
                      duration === option.value
                        ? 'border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-900/20 shadow-md'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="text-2xl mb-2">{option.emoji}</div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Анонимность */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-amber-600 focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-400/20"
              />
              <label htmlFor="anonymous" className="text-sm text-slate-700 dark:text-slate-300">
                🔒 Сделать заголовок анонимным (только заголовок будет скрыт на странице свечей, само желание останется видимым)
              </label>
            </div>

            {/* Ошибка */}
            {error && (
              <div className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4">
                <p className="text-sm text-red-700 dark:text-red-400">❌ {error}</p>
              </div>
            )}

            {/* Кнопка */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="group w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-4 py-3 sm:py-2.5 text-xs font-medium text-slate-900 shadow-md transition-all hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-lg sm:gap-2 sm:px-6 sm:py-3 sm:text-sm min-h-[44px] sm:min-h-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Зажигаем новогоднюю свечу...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Зажечь свечу с желанием на 2026 год</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Информационный блок */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative space-y-5">
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
              Как это работает?
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 md:text-base">
              Новый год — время загадывать желания и ставить цели. Запиши своё самое важное намерение на 2026 год 
              и зажги символическую свечу. Она будет напоминать тебе о твоих мечтах и поможет вернуться к ним в любой момент.
            </p>
          </div>

          <ul className="space-y-2.5 sm:space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <li className="group relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:p-4 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 dark:from-amber-900/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex gap-2.5 sm:gap-3 md:gap-4">
                <div className="mt-0.5 flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30 text-base sm:text-lg shadow-md transition-transform duration-300 group-hover:scale-110">
                  ✍️
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100">Запиши своё новогоднее желание.</div>
                  <div className="break-words text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Опиши своё самое заветное желание на 2026 год — что важно для тебя, какие цели и мечты ты хочешь воплотить в новом году.</div>
                </div>
              </div>
            </li>
            <li className="group relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:p-4 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 dark:from-emerald-900/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex gap-2.5 sm:gap-3 md:gap-4">
                <div className="mt-0.5 flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:to-emerald-800/30 text-base sm:text-lg shadow-md transition-transform duration-300 group-hover:scale-110">
                  ⏱️
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100">Выбери, как долго будет гореть свеча.</div>
                  <div className="break-words text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Твоя новогодняя свеча будет гореть выбранное время — день, неделя или месяц. Когда время закончится, свеча исчезнет из списка активных, но ты всегда сможешь вернуться к ней по ссылке.</div>
                </div>
              </div>
            </li>
            <li className="group relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:p-4 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 dark:from-indigo-900/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex gap-2.5 sm:gap-3 md:gap-4">
                <div className="mt-0.5 flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-indigo-800/30 text-base sm:text-lg shadow-md transition-transform duration-300 group-hover:scale-110">
                  👀
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100">Вернись к своему желанию в любой момент.</div>
                  <div className="break-words text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Ты сможешь вернуться к своей новогодней свече в любое время по ссылке, чтобы вспомнить о своих намерениях и проверить, как идут дела. Если у тебя есть аккаунт, все твои свечи будут в разделе "Мои свечи".</div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

