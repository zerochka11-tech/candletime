'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type CookiePreferences = {
  necessary: boolean // Всегда true
  analytics: boolean
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
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
        // Если ошибка парсинга, показываем баннер
        setShowBanner(true)
      }
    } else {
      setShowBanner(true)
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem('cookie-preferences', JSON.stringify(preferences))
    setShowBanner(false)
    setShowSettings(false)
    
    if (preferences.analytics) {
      window.dispatchEvent(new Event('cookie-consent-given'))
    }
  }

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
    }
    setPreferences(allAccepted)
    localStorage.setItem('cookie-preferences', JSON.stringify(allAccepted))
    setShowBanner(false)
    window.dispatchEvent(new Event('cookie-consent-given'))
  }

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
    }
    setPreferences(onlyNecessary)
    localStorage.setItem('cookie-preferences', JSON.stringify(onlyNecessary))
    setShowBanner(false)
  }

  if (!showBanner) {
    // Не показываем кнопку, управление cookies доступно в /privacy
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl transition-colors duration-200">
      <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6 sm:py-4">
        {!showSettings ? (
          // Баннер (компактный)
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-100 sm:text-sm">
              Мы используем cookies для улучшения работы сайта.{' '}
              <Link
                href="/privacy"
                className="underline transition-colors hover:text-slate-900 dark:hover:text-slate-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                Подробнее
              </Link>
              .
            </p>
            <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
              <button
                onClick={handleRejectAll}
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 sm:px-4 sm:py-2 sm:text-sm"
              >
                Отклонить
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 sm:px-4 sm:py-2 sm:text-sm"
              >
                Настроить
              </button>
              <button
                onClick={handleAcceptAll}
                className="rounded-lg bg-slate-900 dark:bg-white px-3 py-1.5 text-xs font-medium text-white dark:text-slate-900 transition-colors hover:bg-slate-800 dark:hover:bg-slate-100 sm:px-4 sm:py-2 sm:text-sm"
              >
                Принять
              </button>
            </div>
          </div>
        ) : (
          // Настройки (компактные)
          <>
            <div className="mb-3">
              <h3 className="mb-3 text-base font-semibold sm:text-lg">Настройки cookies</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium sm:text-base">Необходимые</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Обязательные для работы сайта
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.necessary}
                    disabled
                    className="h-4 w-4 cursor-not-allowed sm:h-5 sm:w-5"
                    aria-label="Необходимые cookies (всегда включены)"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium sm:text-base">Аналитика</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Google Analytics и Яндекс.Метрика для улучшения сайта
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences({ ...preferences, analytics: e.target.checked })
                    }
                    className="h-4 w-4 cursor-pointer sm:h-5 sm:w-5"
                    aria-label="Аналитика cookies"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 sm:px-4 sm:py-2 sm:text-sm"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-slate-900 dark:bg-white px-3 py-1.5 text-xs font-medium text-white dark:text-slate-900 transition-colors hover:bg-slate-800 dark:hover:bg-slate-100 sm:px-4 sm:py-2 sm:text-sm"
              >
                Сохранить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

