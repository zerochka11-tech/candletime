'use client'

import { useState, useEffect } from 'react'

type CookiePreferences = {
  necessary: boolean
  analytics: boolean
}

export default function PrivacyPage() {
  const [showCookieSettings, setShowCookieSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
  })

  useEffect(() => {
    const saved = localStorage.getItem('cookie-preferences')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setPreferences(parsed)
      } catch {
        // Если ошибка парсинга, используем значения по умолчанию
      }
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem('cookie-preferences', JSON.stringify(preferences))
    setShowCookieSettings(false)
    
    if (preferences.analytics) {
      window.dispatchEvent(new Event('cookie-consent-given'))
    }
    
    alert('Настройки cookies сохранены')
  }

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
    }
    setPreferences(allAccepted)
    localStorage.setItem('cookie-preferences', JSON.stringify(allAccepted))
    setShowCookieSettings(false)
    window.dispatchEvent(new Event('cookie-consent-given'))
    alert('Все cookies приняты')
  }

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
    }
    setPreferences(onlyNecessary)
    localStorage.setItem('cookie-preferences', JSON.stringify(onlyNecessary))
    setShowCookieSettings(false)
    alert('Аналитические cookies отклонены')
  }
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <header className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 md:text-3xl">
          Политика конфиденциальности
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 md:text-base">
          Последнее обновление: {new Date().toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </header>

      <section className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
            1. Какие данные мы собираем
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 md:text-base">
            Мы собираем следующие типы данных:
          </p>
          <ul className="list-disc space-y-1.5 sm:space-y-2 pl-5 sm:pl-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 md:text-base">
          <li>
            <strong>Email адрес</strong> — при регистрации аккаунта
          </li>
          <li>
            <strong>Данные о свечах</strong> — название, сообщение, тип свечи, дата создания
          </li>
          <li>
            <strong>IP-адреса</strong> — анонимизированные, для аналитики и безопасности
          </li>
          <li>
            <strong>Данные о посещениях</strong> — через Google Analytics и Yandex.Metrica (только с вашего согласия)
          </li>
          <li>
            <strong>Cookies</strong> — технические cookies для работы сайта, аналитические — только с согласия
          </li>
          </ul>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
            2. Как мы используем данные
          </h2>
          <ul className="list-disc space-y-1.5 sm:space-y-2 pl-5 sm:pl-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 md:text-base">
          <li>
            <strong>Для работы сервиса</strong> — хранение и отображение ваших свечей, управление аккаунтом
          </li>
          <li>
            <strong>Для аналитики</strong> — улучшение сайта, понимание поведения пользователей (только с согласия)
          </li>
          <li>
            <strong>Для связи</strong> — отправка уведомлений, ответы на запросы (если необходимо)
          </li>
          <li>
            <strong>Для безопасности</strong> — защита от злоупотреблений, обеспечение безопасности данных
          </li>
          </ul>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
            3. С кем мы делимся данными
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 md:text-base">
            Мы не продаем ваши данные третьим лицам. Данные используются только для работы сервиса:
          </p>
          <ul className="list-disc space-y-1.5 sm:space-y-2 pl-5 sm:pl-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 md:text-base">
          <li>
            <strong>Google Analytics</strong> — для аналитики посещений (только с вашего согласия, IP анонимизирован)
          </li>
          <li>
            <strong>Yandex.Metrica</strong> — для аналитики посещений (только с вашего согласия, IP анонимизирован)
          </li>
          <li>
            <strong>Supabase</strong> — для хранения данных (база данных, аутентификация)
          </li>
          <li>
            <strong>Vercel</strong> — для хостинга сайта
          </li>
          </ul>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 md:text-base">
            Все сервисы соответствуют требованиям GDPR и используют современные стандарты безопасности.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
            4. Ваши права
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 md:text-base">
            В соответствии с GDPR, вы имеете следующие права:
          </p>
          <ul className="list-disc space-y-1.5 sm:space-y-2 pl-5 sm:pl-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 md:text-base">
          <li>
            <strong>Право на доступ</strong> — вы можете запросить копию всех ваших данных
          </li>
          <li>
            <strong>Право на удаление</strong> — вы можете удалить свой аккаунт и все данные в любой момент
          </li>
          <li>
            <strong>Право на исправление</strong> — вы можете изменить свои данные в настройках аккаунта
          </li>
          <li>
            <strong>Право на отзыв согласия</strong> — вы можете отозвать согласие на обработку данных в настройках cookies
          </li>
          <li>
            <strong>Право на переносимость данных</strong> — вы можете экспортировать свои данные в формате JSON
          </li>
          </ul>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 md:text-base">
            Для реализации этих прав обращайтесь на{' '}
            <a
              href="mailto:privacy@candletime.ru"
              className="font-medium text-slate-900 dark:text-slate-100 underline transition-colors hover:text-slate-700 dark:hover:text-slate-300"
            >
              privacy@candletime.ru
            </a>
            . Мы ответим в течение 30 дней.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
            5. Cookies
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 md:text-base">
            Мы используем следующие типы cookies:
          </p>
          <ul className="list-disc space-y-1.5 sm:space-y-2 pl-5 sm:pl-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 md:text-base">
          <li>
            <strong>Необходимые cookies</strong> — обязательные для работы сайта (аутентификация, настройки)
          </li>
          <li>
            <strong>Аналитические cookies</strong> — для аналитики посещений (только с вашего согласия)
          </li>
          </ul>
          
          <div className="mt-4 sm:mt-6 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:p-4 md:p-6 shadow-md transition-colors duration-200">
            <div className="mb-3 sm:mb-4 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">Управление cookies</h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
                  Вы можете изменить настройки cookies в любое время
                </p>
              </div>
              {!showCookieSettings && (
                <button
                  onClick={() => setShowCookieSettings(true)}
                  className="rounded-lg bg-slate-900 dark:bg-slate-700 px-4 py-2.5 sm:py-2 text-xs font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-slate-600 hover:shadow-md sm:text-sm min-h-[44px] sm:min-h-0"
                >
                  Настроить cookies
                </button>
              )}
            </div>

            {showCookieSettings && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="group flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 p-3 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm sm:p-4">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 sm:text-base">Необходимые</p>
                      <p className="mt-1 text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
                        Обязательные для работы сайта
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.necessary}
                      disabled
                      className="h-5 w-5 sm:h-5 sm:w-5 cursor-not-allowed"
                      aria-label="Необходимые cookies (всегда включены)"
                    />
                  </div>
                  <div className="group flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 p-3 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm sm:p-4">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 sm:text-base">Аналитика</p>
                      <p className="mt-1 text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
                        Google Analytics для улучшения сайта
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) =>
                        setPreferences({ ...preferences, analytics: e.target.checked })
                      }
                      className="h-5 w-5 sm:h-5 sm:w-5 cursor-pointer"
                      aria-label="Аналитика cookies"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    onClick={handleRejectAll}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 sm:py-2 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md sm:px-4 sm:text-sm min-h-[44px] sm:min-h-0"
                  >
                    Отклонить аналитику
                  </button>
                  <button
                    onClick={() => setShowCookieSettings(false)}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 sm:py-2 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md sm:px-4 sm:text-sm min-h-[44px] sm:min-h-0"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="rounded-lg bg-slate-900 dark:bg-slate-700 px-3 py-2.5 sm:py-2 text-xs font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-slate-600 hover:shadow-md sm:px-4 sm:text-sm min-h-[44px] sm:min-h-0"
                  >
                    Принять все
                  </button>
                  <button
                    onClick={handleSave}
                    className="rounded-lg bg-slate-900 dark:bg-slate-700 px-3 py-2.5 sm:py-2 text-xs font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-slate-600 hover:shadow-md sm:px-4 sm:text-sm min-h-[44px] sm:min-h-0"
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
            6. Безопасность данных
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 md:text-base">
            Мы принимаем меры для защиты ваших данных:
          </p>
          <ul className="list-disc space-y-1.5 sm:space-y-2 pl-5 sm:pl-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 md:text-base">
          <li>HTTPS шифрование для всех соединений</li>
          <li>Анонимизация IP-адресов в аналитике</li>
          <li>Безопасное хранение паролей (bcrypt)</li>
          <li>Row Level Security (RLS) в базе данных</li>
          <li>Регулярные обновления безопасности</li>
          </ul>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
            7. Хранение данных
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 md:text-base">
            Данные хранятся до тех пор, пока:
          </p>
          <ul className="list-disc space-y-1.5 sm:space-y-2 pl-5 sm:pl-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 md:text-base">
          <li>Вы не удалите свой аккаунт</li>
          <li>Вы не запросите удаление данных</li>
          <li>Данные не требуются для выполнения юридических обязательств</li>
          </ul>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 md:text-base">
            После удаления аккаунта все данные удаляются безвозвратно в течение 30 дней.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
            8. Изменения в политике
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 md:text-base">
            Мы можем обновлять эту политику конфиденциальности. О значительных изменениях мы уведомим вас через сайт или email.
            Дата последнего обновления указана в начале документа.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
            9. Контакты
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 md:text-base">
            По вопросам о конфиденциальности и обработке данных обращайтесь:
          </p>
          <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 md:text-base">
          <li>
            <strong>Email:</strong>{' '}
            <a
              href="mailto:privacy@candletime.ru"
              className="font-medium text-slate-900 dark:text-slate-100 underline transition-colors hover:text-slate-700 dark:hover:text-slate-300"
            >
              privacy@candletime.ru
            </a>
          </li>
          <li>
            <strong>Сайт:</strong>{' '}
            <a
              href="https://candletime.ru"
              className="font-medium text-slate-900 dark:text-slate-100 underline transition-colors hover:text-slate-700 dark:hover:text-slate-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              candletime.ru
            </a>
          </li>
          </ul>
        </div>
      </section>

      <div className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative">
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 md:text-base">
            Используя наш сайт, вы соглашаетесь с этой политикой конфиденциальности.
            Если вы не согласны с какими-либо условиями, пожалуйста, не используйте наш сервис.
          </p>
        </div>
      </div>
    </div>
  );
}

