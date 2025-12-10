'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

const YANDEX_METRIKA_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || '105780499'

export function YandexMetrika() {
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

  if (!enabled || !YANDEX_METRIKA_ID) return null

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`
          (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_ID}', 'ym');

          ym(${YANDEX_METRIKA_ID}, 'init', {
            ssr: true,
            webvisor: true,
            clickmap: true,
            ecommerce: "dataLayer",
            accurateTrackBounce: true,
            trackLinks: true
          });
        `}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  )
}

