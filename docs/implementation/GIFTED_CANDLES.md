# 🎁 План реализации подарочных свечей и приглашений

**Дата создания:** 2025  
**Версия:** 1.0  
**Проект:** CandleTime - система подарочных свечей

---

## 📋 Содержание

1. [Обзор концепции](#обзор-концепции)
2. [Пользовательские сценарии](#пользовательские-сценарии)
3. [Технический стек](#технический-стек)
4. [Архитектура решения](#архитектура-решения)
5. [Изменения в базе данных](#изменения-в-базе-данных)
6. [Детальная реализация](#детальная-реализация)
7. [Email система](#email-система)
8. [Компоненты и структура кода](#компоненты-и-структура-кода)
9. [Безопасность и антиспам](#безопасность-и-антиспам)
10. [Пошаговая инструкция внедрения](#пошаговая-инструкция-внедрения)

---

## 🎯 Обзор концепции

### Цель
Позволить пользователям "дарить" свечи другим людям, создавая:
- Вирусный механизм роста через органичное привлечение
- Эмоциональную связь между людьми
- Возможность выразить поддержку, благодарность, память
- Простой способ поздравить или поддержать близких

### Ключевые особенности
- **Простота** - легко отправить свечу любому по email
- **Красота** - красивые email-приглашения с превью
- **Приватность** - даритель может остаться анонимным
- **Гибкость** - работает для зарегистрированных и незарегистрированных пользователей
- **Без спама** - защита от злоупотреблений

### Бизнес-выгоды
- **Вирусный рост** - каждый подарок потенциально привлекает нового пользователя
- **Retention** - получатели возвращаются, чтобы увидеть подарок
- **Engagement** - дарители более вовлечены (создают больше свечей)
- **Эмоциональная связь** - укрепляет ценность сервиса

---

## 👥 Пользовательские сценарии

### Сценарий 1: Подарок другу
**Даритель:** Зарегистрированный пользователь  
**Получатель:** Незарегистрированный пользователь  
**Действия:**
1. Даритель создает свечу поддержки
2. Указывает email друга
3. Добавляет персональное сообщение
4. Отправляет
5. Друг получает email с приглашением
6. Друг открывает страницу свечи (без регистрации)
7. Друг может зарегистрироваться, чтобы сохранить подарок

### Сценарий 2: Подарок коллеге
**Даритель:** Зарегистрированный пользователь  
**Получатель:** Зарегистрированный пользователь  
**Действия:**
1. Даритель создает свечу благодарности
2. Указывает email коллеги
3. Коллега получает email + уведомление в системе
4. Коллега видит подарок в разделе "Мне подарили"

### Сценарий 3: Анонимный подарок
**Даритель:** Зарегистрированный пользователь (выбрал "анонимно")  
**Получатель:** Любой  
**Действия:**
1. Даритель создает свечу
2. Выбирает "Отправить анонимно"
3. Получатель видит подарок, но не знает от кого

### Сценарий 4: Семейный подарок
**Даритель:** Один человек  
**Получатели:** Несколько email-адресов  
**Действия:**
1. Даритель создает свечу памяти
2. Добавляет несколько email-адресов (семья)
3. Все получают персональные email-приглашения

---

## 🛠️ Технический стек

### Основные технологии:
- **Next.js API Routes** - обработка отправки подарков
- **Resend** или **SendGrid** - отправка email (рекомендую Resend для простоты)
- **React Email** - создание красивых HTML email шаблонов
- **Supabase** - хранение данных о подарках
- **Zod** - валидация email и данных

### Альтернативы:
- **Nodemailer** + собственные шаблоны (более гибко, но сложнее)
- **Mailgun** - альтернатива SendGrid
- **Postmark** - хорошая альтернатива для транзакционных email

### Зависимости для установки:
```bash
npm install resend @react-email/components @react-email/render zod
```

---

## 🏗️ Архитектура решения

### Структура компонентов:

```
components/
  gifts/
    GiftCandleForm.tsx          # Форма создания подарка
    GiftPreview.tsx             # Превью подарка перед отправкой
    GiftedCandlesList.tsx       # Список полученных подарков
    GiftedCandlesBadge.tsx      # Бейдж с количеством подарков
    GiftSenderInfo.tsx          # Информация о дарителе
  email/
    GiftInvitationEmail.tsx     # React Email шаблон
app/
  api/
    gifts/
      send.ts                   # API для отправки подарка
      list.ts                   # API для получения списка подарков
      claim.ts                  # API для принятия подарка
  received/
    page.tsx                    # Страница "Мне подарили"
```

### Поток данных:

```
User creates gift → Validate → Store in DB → 
  └─ Send email → Track status →
    └─ Recipient opens → Show candle page →
      └─ Optional registration → Claim gift
```

---

## 💾 Изменения в базе данных

### 1. Обновление таблицы candles

```sql
-- Добавление полей для подарков
ALTER TABLE candles
ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gift_recipient_email TEXT,
ADD COLUMN IF NOT EXISTS gift_sender_message TEXT,
ADD COLUMN IF NOT EXISTS gift_sender_anonymous BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gift_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS gift_opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS gift_claimed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS gift_recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS gift_token TEXT UNIQUE; -- Токен для безопасного доступа

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_candles_gift_recipient_email ON candles(gift_recipient_email) WHERE is_gift = true;
CREATE INDEX IF NOT EXISTS idx_candles_gift_token ON candles(gift_token) WHERE gift_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_candles_gift_recipient_user_id ON candles(gift_recipient_user_id) WHERE gift_recipient_user_id IS NOT NULL;

-- Комментарии
COMMENT ON COLUMN candles.is_gift IS 'Является ли свеча подарком';
COMMENT ON COLUMN candles.gift_recipient_email IS 'Email получателя подарка';
COMMENT ON COLUMN candles.gift_sender_message IS 'Персональное сообщение от дарителя';
COMMENT ON COLUMN candles.gift_sender_anonymous IS 'Остается ли даритель анонимным';
COMMENT ON COLUMN candles.gift_token IS 'Уникальный токен для безопасного доступа к подарку';
```

### 2. Таблица для отслеживания отправки подарков

```sql
-- Таблица для логирования отправок и предотвращения спама
CREATE TABLE IF NOT EXISTS gift_send_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candle_id UUID REFERENCES candles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  email_status TEXT DEFAULT 'pending', -- pending, sent, delivered, opened, failed
  error_message TEXT
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_gift_send_log_sender ON gift_send_log(sender_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_gift_send_log_recipient ON gift_send_log(recipient_email, sent_at);
CREATE INDEX IF NOT EXISTS idx_gift_send_log_status ON gift_send_log(email_status);

-- RLS политики
ALTER TABLE gift_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own send log"
  ON gift_send_log FOR SELECT
  USING (auth.uid() = sender_id);
```

### 3. Функция для генерации токена

```sql
-- Генерация уникального токена для подарка
CREATE OR REPLACE FUNCTION generate_gift_token()
RETURNS TEXT AS $$
BEGIN
  -- Генерируем случайный токен из 32 символов
  RETURN encode(gen_random_bytes(24), 'base64url');
END;
$$ LANGUAGE plpgsql;
```

---

## 💻 Детальная реализация

### 1. Валидация и утилиты

```typescript
// lib/gifts.ts
import { z } from 'zod';
import crypto from 'crypto';

export const GiftCandleSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().max(500).optional(),
  candle_type: z.enum(['calm', 'support', 'memory', 'gratitude', 'focus']),
  duration_hours: z.number().int().min(1).max(720),
  recipient_email: z.string().email(),
  sender_message: z.string().max(500).optional(),
  sender_anonymous: z.boolean().default(false),
});

export type GiftCandleInput = z.infer<typeof GiftCandleSchema>;

/**
 * Генерирует уникальный токен для подарка
 */
export function generateGiftToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

/**
 * Проверяет, можно ли отправить подарок (антиспам)
 */
export async function canSendGift(
  senderId: string | null,
  recipientEmail: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Проверка 1: Нельзя отправлять самому себе
  if (senderId) {
    const { data: user } = await supabase.auth.getUser();
    if (user?.user?.email?.toLowerCase() === recipientEmail.toLowerCase()) {
      return { allowed: false, reason: 'Нельзя отправлять подарок самому себе' };
    }
  }

  // Проверка 2: Rate limiting - не более 10 подарков в час на один email
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const { count } = await supabase
    .from('gift_send_log')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_email', recipientEmail.toLowerCase())
    .gte('sent_at', oneHourAgo.toISOString());

  if (count && count >= 10) {
    return {
      allowed: false,
      reason: 'Слишком много подарков этому получателю. Попробуйте позже.',
    };
  }

  // Проверка 3: Rate limiting для отправителя - не более 20 подарков в день
  if (senderId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: senderCount } = await supabase
      .from('gift_send_log')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', senderId)
      .gte('sent_at', todayStart.toISOString());

    if (senderCount && senderCount >= 20) {
      return {
        allowed: false,
        reason: 'Вы отправили максимальное количество подарков сегодня. Попробуйте завтра.',
      };
    }
  }

  return { allowed: true };
}
```

### 2. API Route для отправки подарка

```typescript
// app/api/gifts/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { GiftCandleSchema, generateGiftToken, canSendGift } from '@/lib/gifts';
import { sendGiftEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Получаем текущего пользователя
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Парсим и валидируем данные
    const body = await request.json();
    const validatedData = GiftCandleSchema.parse(body);

    // Проверка антиспам
    const spamCheck = await canSendGift(user?.id || null, validatedData.recipient_email);
    if (!spamCheck.allowed) {
      return NextResponse.json(
        { error: spamCheck.reason || 'Отправка временно заблокирована' },
        { status: 429 }
      );
    }

    // Создаем свечу-подарок
    const giftToken = generateGiftToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + validatedData.duration_hours);

    const { data: candle, error: candleError } = await supabase
      .from('candles')
      .insert({
        title: validatedData.title,
        message: validatedData.message || null,
        candle_type: validatedData.candle_type,
        duration_hours: validatedData.duration_hours,
        expires_at: expiresAt.toISOString(),
        status: 'active',
        is_gift: true,
        gift_recipient_email: validatedData.recipient_email.toLowerCase(),
        gift_sender_message: validatedData.sender_message || null,
        gift_sender_anonymous: validatedData.sender_anonymous || false,
        gift_token: giftToken,
        gift_sent_at: new Date().toISOString(),
        user_id: user?.id || null,
      })
      .select()
      .single();

    if (candleError) {
      console.error('Error creating gift candle:', candleError);
      return NextResponse.json(
        { error: 'Ошибка при создании подарка' },
        { status: 500 }
      );
    }

    // Отправляем email
    try {
      await sendGiftEmail({
        recipientEmail: validatedData.recipient_email,
        candleId: candle.id,
        giftToken,
        senderName: validatedData.sender_anonymous
          ? null
          : user?.email?.split('@')[0] || 'Кто-то',
        senderMessage: validatedData.sender_message,
        candleTitle: validatedData.title,
        candleMessage: validatedData.message,
        candleType: validatedData.candle_type,
      });
    } catch (emailError) {
      console.error('Error sending gift email:', emailError);
      // Не блокируем создание подарка, если email не отправился
      // Можно добавить в очередь для повторной отправки
    }

    // Логируем отправку
    await supabase.from('gift_send_log').insert({
      candle_id: candle.id,
      sender_id: user?.id || null,
      recipient_email: validatedData.recipient_email.toLowerCase(),
      email_status: 'sent',
    });

    return NextResponse.json({
      success: true,
      candleId: candle.id,
      message: 'Подарок отправлен!',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Неверные данные', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in send gift API:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
```

---

## 📧 Email система

### 1. React Email шаблон

```typescript
// components/email/GiftInvitationEmail.tsx
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Img,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface GiftInvitationEmailProps {
  recipientName?: string;
  senderName?: string | null;
  senderMessage?: string | null;
  candleTitle: string;
  candleMessage?: string;
  candleType: string;
  giftUrl: string;
}

const candleTypeEmojis: Record<string, string> = {
  calm: '🕊️',
  support: '🤝',
  memory: '🌙',
  gratitude: '✨',
  focus: '🎯',
};

const candleTypeLabels: Record<string, string> = {
  calm: 'Спокойствие',
  support: 'Поддержка',
  memory: 'Память',
  gratitude: 'Благодарность',
  focus: 'Фокус',
};

export function GiftInvitationEmail({
  recipientName,
  senderName,
  senderMessage,
  candleTitle,
  candleMessage,
  candleType,
  giftUrl,
}: GiftInvitationEmailProps) {
  const emoji = candleTypeEmojis[candleType] || '🕯️';
  const typeLabel = candleTypeLabels[candleType] || 'Свеча';

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>CandleTime</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>
              {recipientName ? `Привет, ${recipientName}!` : 'Привет!'}
            </Text>

            <Text style={paragraph}>
              {senderName ? (
                <>
                  <strong>{senderName}</strong> подарил(а) тебе символическую свечу на
                  CandleTime.
                </>
              ) : (
                <>Тебе подарили символическую свечу на CandleTime.</>
              )}
            </Text>

            {senderMessage && (
              <Section style={messageBox}>
                <Text style={messageLabel}>Сообщение от дарителя:</Text>
                <Text style={messageText}>{senderMessage}</Text>
              </Section>
            )}

            <Section style={candlePreview}>
              <Text style={candleEmoji}>{emoji}</Text>
              <Text style={candleTitleText}>{candleTitle}</Text>
              <Text style={candleTypeText}>{typeLabel}</Text>
              {candleMessage && (
                <Text style={candleMessageText}>{candleMessage}</Text>
              )}
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={giftUrl}>
                Открыть подарок
              </Button>
            </Section>

            <Hr style={divider} />

            <Text style={footerText}>
              Это символическая свеча, зажженная специально для тебя. Ты можешь открыть её
              и увидеть послание.
            </Text>

            <Text style={footerSmall}>
              Если ты не ожидал(а) этого письма, просто проигнорируй его.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Стили
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 24px',
  backgroundColor: '#1e293b',
  textAlign: 'center' as const,
};

const headerText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: 0,
};

const content = {
  padding: '0 24px',
};

const greeting = {
  fontSize: '20px',
  lineHeight: '26px',
  color: '#0f172a',
  marginBottom: '16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#475569',
  marginBottom: '16px',
};

const messageBox = {
  backgroundColor: '#f1f5f9',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const messageLabel = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#64748b',
  marginBottom: '8px',
};

const messageText = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#0f172a',
  margin: 0,
  fontStyle: 'italic',
};

const candlePreview = {
  backgroundColor: '#fffbeb',
  borderRadius: '12px',
  padding: '32px',
  textAlign: 'center' as const,
  margin: '32px 0',
  border: '2px solid #fbbf24',
};

const candleEmoji = {
  fontSize: '64px',
  margin: '0 0 16px',
  lineHeight: '1',
};

const candleTitleText = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#0f172a',
  margin: '0 0 8px',
};

const candleTypeText = {
  fontSize: '14px',
  color: '#f59e0b',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 16px',
};

const candleMessageText = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#475569',
  margin: 0,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#f59e0b',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const divider = {
  borderColor: '#e2e8f0',
  margin: '32px 0',
};

const footerText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#64748b',
  margin: '0 0 16px',
};

const footerSmall = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#94a3b8',
  margin: 0,
};
```

### 2. Функция отправки email

```typescript
// lib/email.ts
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { GiftInvitationEmail } from '@/components/email/GiftInvitationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendGiftEmailParams {
  recipientEmail: string;
  candleId: string;
  giftToken: string;
  senderName?: string | null;
  senderMessage?: string | null;
  candleTitle: string;
  candleMessage?: string;
  candleType: string;
}

export async function sendGiftEmail(params: SendGiftEmailParams) {
  const { recipientEmail, candleId, giftToken, ...emailProps } = params;

  // URL для открытия подарка
  const giftUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://candletime.ru'}/gift/${giftToken}`;

  // Рендерим HTML email
  const emailHtml = render(
    GiftInvitationEmail({
      ...emailProps,
      giftUrl,
    })
  );

  // Отправляем email
  const { data, error } = await resend.emails.send({
    from: 'CandleTime <noreply@candletime.ru>',
    to: recipientEmail,
    subject: emailProps.senderName
      ? `${emailProps.senderName} подарил(а) тебе свечу`
      : 'Тебе подарили свечу',
    html: emailHtml,
  });

  if (error) {
    console.error('Resend error:', error);
    throw new Error('Failed to send email');
  }

  return data;
}
```

---

## 🧩 Компоненты и структура кода

### 1. Форма создания подарка

```typescript
// components/gifts/GiftCandleForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GiftCandleSchema } from '@/lib/gifts';

interface GiftCandleFormProps {
  onCancel?: () => void;
}

export function GiftCandleForm({ onCancel }: GiftCandleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    candle_type: 'gratitude' as const,
    duration_hours: 24,
    recipient_email: '',
    sender_message: '',
    sender_anonymous: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Валидация на клиенте
      const validated = GiftCandleSchema.parse(formData);

      const response = await fetch('/api/gifts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при отправке подарка');
      }

      // Успех!
      router.push(`/gift/sent?candleId=${data.candleId}`);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError('Пожалуйста, заполните все обязательные поля');
      } else {
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Выбор типа свечи */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Тип свечи
        </label>
        <div className="grid grid-cols-5 gap-2">
          {CANDLE_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setFormData({ ...formData, candle_type: type.id })}
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.candle_type === type.id
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-2xl block mb-1">{type.emoji}</span>
              <span className="text-xs text-slate-600">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Название свечи */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Название свечи *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Например: Для тебя"
          maxLength={100}
          required
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Сообщение к свече */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Сообщение (опционально)
        </label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Твоё послание к свече..."
          maxLength={500}
          rows={3}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Email получателя */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Email получателя *
        </label>
        <input
          type="email"
          value={formData.recipient_email}
          onChange={(e) =>
            setFormData({ ...formData, recipient_email: e.target.value })
          }
          placeholder="friend@example.com"
          required
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Персональное сообщение от дарителя */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Твоё сообщение получателю (опционально)
        </label>
        <textarea
          value={formData.sender_message}
          onChange={(e) =>
            setFormData({ ...formData, sender_message: e.target.value })
          }
          placeholder="Например: Хочу поддержать тебя в этот момент..."
          maxLength={500}
          rows={3}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Анонимность */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="anonymous"
          checked={formData.sender_anonymous}
          onChange={(e) =>
            setFormData({ ...formData, sender_anonymous: e.target.checked })
          }
          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
        />
        <label htmlFor="anonymous" className="text-sm text-slate-700">
          Отправить анонимно
        </label>
      </div>

      {/* Длительность */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Длительность свечи
        </label>
        <select
          value={formData.duration_hours}
          onChange={(e) =>
            setFormData({ ...formData, duration_hours: Number(e.target.value) })
          }
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value={1}>1 час</option>
          <option value={24}>1 день</option>
          <option value={168}>1 неделя</option>
          <option value={720}>30 дней</option>
        </select>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
          {error}
        </div>
      )}

      {/* Кнопки */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
          >
            Отмена
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Отправляем...' : 'Отправить подарок'}
        </button>
      </div>
    </form>
  );
}

const CANDLE_TYPES = [
  { id: 'calm', label: 'Спокойствие', emoji: '🕊️' },
  { id: 'support', label: 'Поддержка', emoji: '🤝' },
  { id: 'memory', label: 'Память', emoji: '🌙' },
  { id: 'gratitude', label: 'Благодарность', emoji: '✨' },
  { id: 'focus', label: 'Фокус', emoji: '🎯' },
] as const;
```

### 2. Страница просмотра подарка

```typescript
// app/[locale]/gift/[token]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function GiftPage() {
  const params = useParams();
  const token = params.token as string;
  const [candle, setCandle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGift();
  }, [token]);

  const loadGift = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('candles')
        .select('*, user:users!candles_user_id_fkey(email)')
        .eq('gift_token', token)
        .eq('is_gift', true)
        .single();

      if (fetchError) throw fetchError;
      if (!data) {
        setError('Подарок не найден');
        return;
      }

      setCandle(data);

      // Отмечаем, что подарок был открыт
      if (!data.gift_opened_at) {
        await supabase
          .from('candles')
          .update({ gift_opened_at: new Date().toISOString() })
          .eq('id', data.id);
      }
    } catch (err) {
      console.error('Error loading gift:', err);
      setError('Ошибка при загрузке подарка');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Загрузка подарка...</p>
      </div>
    );
  }

  if (error || !candle) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Подарок не найден</h1>
        <p className="text-slate-600 mb-6">{error || 'Этот подарок не существует или был удален.'}</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
        >
          На главную
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-8 text-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          🎁 Тебе подарили свечу!
        </h1>
        {!candle.gift_sender_anonymous && candle.user?.email && (
          <p className="text-slate-700">
            От <strong>{candle.user.email.split('@')[0]}</strong>
          </p>
        )}
      </div>

      {candle.gift_sender_message && (
        <div className="bg-slate-50 rounded-lg p-6 mb-6">
          <p className="text-slate-600 mb-2">💌 Сообщение от дарителя:</p>
          <p className="text-slate-900 text-lg italic">{candle.gift_sender_message}</p>
        </div>
      )}

      {/* Отображение свечи */}
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{candle.title}</h2>
        {candle.message && (
          <p className="text-slate-700 mb-6 whitespace-pre-wrap">{candle.message}</p>
        )}
        {/* Здесь можно добавить визуализацию свечи */}
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/auth/signup"
          className="inline-block px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
        >
          Зарегистрироваться, чтобы сохранить подарок
        </Link>
      </div>
    </div>
  );
}
```

### 3. Страница "Мне подарили"

```typescript
// app/[locale]/received/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function ReceivedGiftsPage() {
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGifts();
  }, []);

  const loadGifts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Загружаем подарки по email
      const { data: giftsByEmail } = await supabase
        .from('candles')
        .select('*, sender:users!candles_user_id_fkey(email)')
        .eq('is_gift', true)
        .eq('gift_recipient_email', user.email?.toLowerCase())
        .order('gift_sent_at', { ascending: false });

      // Загружаем подарки, привязанные к аккаунту
      const { data: giftsByUserId } = await supabase
        .from('candles')
        .select('*, sender:users!candles_user_id_fkey(email)')
        .eq('is_gift', true)
        .eq('gift_recipient_user_id', user.id)
        .order('gift_sent_at', { ascending: false });

      // Объединяем и дедуплицируем
      const allGifts = [...(giftsByEmail || []), ...(giftsByUserId || [])];
      const uniqueGifts = Array.from(
        new Map(allGifts.map((gift) => [gift.id, gift])).values()
      );

      setGifts(uniqueGifts);
    } catch (error) {
      console.error('Error loading gifts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">🎁 Мне подарили</h1>

      {gifts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-600 mb-4">
            Пока тебе не дарили свечей, но ты можешь быть первым!
          </p>
          <Link
            href="/light"
            className="inline-block px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            Зажечь свечу
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {gifts.map((gift) => (
            <Link
              key={gift.id}
              href={`/candle/${gift.id}`}
              className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">{gift.title}</h3>
                <span className="text-2xl">
                  {CANDLE_TYPE_EMOJIS[gift.candle_type] || '🕯️'}
                </span>
              </div>

              {gift.gift_sender_message && (
                <p className="text-slate-600 mb-4 line-clamp-2 italic">
                  "{gift.gift_sender_message}"
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>
                  {gift.gift_sender_anonymous
                    ? 'Анонимный подарок'
                    : gift.sender?.email?.split('@')[0] || 'Кто-то'}
                </span>
                <span>
                  {new Date(gift.gift_sent_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const CANDLE_TYPE_EMOJIS: Record<string, string> = {
  calm: '🕊️',
  support: '🤝',
  memory: '🌙',
  gratitude: '✨',
  focus: '🎯',
};
```

---

## 🔒 Безопасность и антиспам

### 1. Rate Limiting

```typescript
// lib/rateLimiter.ts
export async function checkGiftRateLimit(
  senderId: string | null,
  recipientEmail: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Проверки из функции canSendGift (см. выше)
  // + дополнительные проверки:

  // Проверка 4: Не более 3 подарков одному email в день от одного отправителя
  if (senderId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('gift_send_log')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', senderId)
      .eq('recipient_email', recipientEmail.toLowerCase())
      .gte('sent_at', todayStart.toISOString());

    if (count && count >= 3) {
      return {
        allowed: false,
        reason: 'Ты уже отправил(а) подарок этому получателю сегодня',
      };
    }
  }

  return { allowed: true };
}
```

### 2. Валидация email

```typescript
// Проверка на временные/disposable email
const DISPOSABLE_EMAIL_DOMAINS = [
  '10minutemail.com',
  'tempmail.com',
  // ... список временных email сервисов
];

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;

  const domain = email.split('@')[1].toLowerCase();
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
    return false;
  }

  return true;
}
```

### 3. Защита токенов

```typescript
// Токены должны быть:
// - Уникальными (проверка в БД перед созданием)
// - Длинными (24+ байта)
// - Использоваться только один раз для принятия подарка (опционально)
```

---

## 📝 Пошаговая инструкция внедрения

### Шаг 1: Установка зависимостей

```bash
npm install resend @react-email/components @react-email/render zod
```

### Шаг 2: Настройка переменных окружения

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
NEXT_PUBLIC_SITE_URL=https://candletime.ru
```

### Шаг 3: Обновление базы данных

Выполнить SQL скрипты из раздела "Изменения в базе данных"

### Шаг 4: Создание утилит

1. Создать `lib/gifts.ts` с валидацией
2. Создать `lib/email.ts` с функцией отправки
3. Создать `components/email/GiftInvitationEmail.tsx`

### Шаг 5: Создание API routes

1. Создать `app/api/gifts/send/route.ts`
2. Создать `app/api/gifts/list/route.ts` (опционально)

### Шаг 6: Создание компонентов

1. Создать `components/gifts/GiftCandleForm.tsx`
2. Создать страницу `app/[locale]/gift/[token]/page.tsx`
3. Создать страницу `app/[locale]/received/page.tsx`

### Шаг 7: Интеграция в существующие страницы

- Добавить кнопку "Подарить свечу" на странице создания
- Добавить ссылку "Мне подарили" в хедер (если пользователь авторизован)

---

## 📊 Метрики успеха

### Технические метрики:
- ✅ Email доставляется > 95% случаев
- ✅ Время отправки email < 3 секунд
- ✅ Rate limiting работает корректно
- ✅ Нет утечек токенов

### Пользовательские метрики:
- ✅ Adoption rate > 25% (пользователи пробуют функцию)
- ✅ Conversion rate > 15% (получатели регистрируются)
- ✅ Вирусный коэффициент > 1.2 (каждый подарок привлекает > 1.2 новых пользователей)
- ✅ Повторное использование > 40% (дарители отправляют повторно)

---

## 🚀 План внедрения по фазам

### Фаза 1: Базовая функциональность (1 неделя)
1. Обновление БД
2. API для отправки
3. Email шаблоны
4. Форма создания подарка

### Фаза 2: Страницы и интеграция (3-5 дней)
1. Страница просмотра подарка
2. Страница "Мне подарили"
3. Интеграция в существующие страницы

### Фаза 3: Защита и оптимизация (3-5 дней)
1. Rate limiting
2. Антиспам защита
3. Мониторинг метрик
4. Тестирование

---

**Последнее обновление:** 2025  
**Версия документа:** 1.0  
**Статус:** Готов к реализации
