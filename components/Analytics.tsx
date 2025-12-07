'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

export function Analytics() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    // Проверяем согласие при загрузке
    const checkConsent = () => {
      const saved = localStorage.getItem('cookie-preferences')
      if (saved) {
        try {
          const preferences = JSON.parse(saved)
          if (preferences.analytics) {
            setEnabled(true)
          }
        } catch {
          // Если ошибка парсинга, не включаем аналитику
        }
      }
    }

    checkConsent()

    // Слушаем событие согласия
    const handleConsent = () => {
      setEnabled(true)
    }
    window.addEventListener('cookie-consent-given', handleConsent)

    return () => {
      window.removeEventListener('cookie-consent-given', handleConsent)
    }
  }, [])

  if (!enabled) return null

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-M4TVTP953T"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-M4TVTP953T', {
            anonymize_ip: true,
          });
        `}
      </Script>
    </>
  )
}

