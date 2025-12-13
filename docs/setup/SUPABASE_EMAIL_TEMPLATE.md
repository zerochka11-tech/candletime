# 📧 Текст для Email Template в Supabase

## Тема письма (Subject):

```
Подтверди свой email для CandleTime
```

---

## Тело письма (Body) - HTML:

```html
<h2>Добро пожаловать в CandleTime! 🕯️</h2>

<p>Спасибо за регистрацию! Чтобы начать использовать аккаунт, подтверди свой email адрес.</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #1e293b; color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: 500; margin: 16px 0;">Подтвердить email</a></p>

<p>Или скопируй и вставь эту ссылку в браузер:</p>
<p style="word-break: break-all; color: #64748b; font-size: 14px;">{{ .ConfirmationURL }}</p>

<p style="color: #64748b; font-size: 14px; margin-top: 24px;">Если ты не регистрировался на CandleTime, просто проигнорируй это письмо.</p>

<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

<p style="color: #64748b; font-size: 12px; line-height: 1.6;">
  <strong>CandleTime</strong> - Тихое место для символических свечей<br>
  <a href="{{ .SiteURL }}" style="color: #64748b;">{{ .SiteURL }}</a>
</p>
```

---

## Альтернативный вариант (более минималистичный):

```html
<div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.6;">
  
  <h2 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">Добро пожаловать в CandleTime! 🕯️</h2>
  
  <p style="color: #475569; font-size: 16px; margin-bottom: 24px;">
    Спасибо за регистрацию! Чтобы начать использовать аккаунт, подтверди свой email адрес.
  </p>
  
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background-color: #1e293b; color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: 500; font-size: 16px;">
      Подтвердить email
    </a>
  </div>
  
  <p style="color: #64748b; font-size: 14px; margin-top: 32px;">
    Или скопируй и вставь эту ссылку в браузер:
  </p>
  <p style="word-break: break-all; color: #94a3b8; font-size: 12px; background-color: #f8fafc; padding: 12px; border-radius: 8px; margin: 8px 0;">
    {{ .ConfirmationURL }}
  </p>
  
  <p style="color: #94a3b8; font-size: 13px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
    Если ты не регистрировался на CandleTime, просто проигнорируй это письмо.
  </p>
  
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
  
  <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0;">
    <strong style="color: #64748b;">CandleTime</strong> - Тихое место для символических свечей<br>
    <a href="{{ .SiteURL }}" style="color: #64748b; text-decoration: none;">{{ .SiteURL }}</a>
  </p>
  
</div>
```

---

## Рекомендуемый вариант (профессиональный и красивый):

```html
<div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1e293b; line-height: 1.6; background-color: #ffffff;">
  
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #1e293b; font-size: 28px; margin: 0 0 8px 0; font-weight: 600;">🕯️ CandleTime</h1>
    <p style="color: #64748b; font-size: 14px; margin: 0;">Тихое место для символических свечей</p>
  </div>
  
  <h2 style="color: #1e293b; font-size: 22px; margin-bottom: 16px; font-weight: 600;">Добро пожаловать!</h2>
  
  <p style="color: #475569; font-size: 16px; margin-bottom: 24px;">
    Спасибо за регистрацию на CandleTime! Чтобы начать использовать аккаунт и сохранять свои свечи, подтверди свой email адрес.
  </p>
  
  <div style="text-align: center; margin: 40px 0;">
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background-color: #1e293b; color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: 500; font-size: 16px; transition: background-color 0.2s;">
      Подтвердить email
    </a>
  </div>
  
  <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="color: #64748b; font-size: 13px; margin: 0 0 8px 0; font-weight: 500;">Или скопируй и вставь эту ссылку:</p>
    <p style="word-break: break-all; color: #94a3b8; font-size: 12px; margin: 0; font-family: monospace;">
      {{ .ConfirmationURL }}
    </p>
  </div>
  
  <p style="color: #94a3b8; font-size: 13px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
    Если ты не регистрировался на CandleTime, просто проигнорируй это письмо. Твой аккаунт не будет создан.
  </p>
  
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
  
  <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
    <strong style="color: #64748b;">CandleTime</strong><br>
    Тихое место без ленты и лайков — только спокойный жест внимания<br>
    <a href="{{ .SiteURL }}" style="color: #64748b; text-decoration: none;">{{ .SiteURL }}</a>
  </p>
  
</div>
```

---

## Инструкция по вставке:

1. **Тема письма (Subject):**
   - Скопируй текст из раздела "Тема письма"
   - Вставь в поле "Subject" в Supabase

2. **Тело письма (Body):**
   - Выбери один из вариантов (рекомендую "Рекомендуемый вариант")
   - Скопируй весь HTML код
   - В Supabase переключись на вкладку "Source"
   - Вставь код в редактор
   - Нажми "Preview" чтобы посмотреть как будет выглядеть письмо
   - Сохрани изменения

---

## Доступные переменные:

- `{{ .ConfirmationURL }}` - ссылка для подтверждения email
- `{{ .Email }}` - email пользователя
- `{{ .SiteURL }}` - URL сайта
- `{{ .Token }}` - токен подтверждения (обычно не нужен)
- `{{ .TokenHash }}` - хеш токена (обычно не нужен)
- `{{ .RedirectTo }}` - URL для редиректа после подтверждения

---

**Рекомендация:** Используй "Рекомендуемый вариант" - он самый красивый и профессиональный.

