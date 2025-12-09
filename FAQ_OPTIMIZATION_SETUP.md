# 📋 Инструкция по выполнению SQL скрипта для оптимизации

## ⚠️ Важно!

**НЕ копируйте код из TypeScript файлов!** 
Нужно выполнять только SQL код из файла `supabase-faq-optimization-indexes.sql`

---

## 📝 Пошаговая инструкция

### Шаг 1: Откройте Supabase Dashboard

1. Перейдите на https://supabase.com/dashboard
2. Выберите ваш проект
3. В левом меню найдите **"SQL Editor"** (или **"SQL Editor"**)

### Шаг 2: Откройте SQL файл

Откройте файл `supabase-faq-optimization-indexes.sql` в вашем редакторе кода (например, VS Code или Cursor).

### Шаг 3: Скопируйте SQL код

**Скопируйте ВСЕ содержимое** файла `supabase-faq-optimization-indexes.sql` (только SQL команды, НЕ TypeScript код!)

### Шаг 4: Вставьте в SQL Editor

1. В Supabase SQL Editor вставьте скопированный SQL код
2. Убедитесь, что в редакторе нет TypeScript кода типа `import { createClient } from '@supabase/supabase-js';`

### Шаг 5: Выполните скрипт

1. Нажмите кнопку **"Run"** (или `Ctrl+Enter` / `Cmd+Enter`)
2. Должно появиться сообщение об успешном выполнении

---

## 🔍 Что должно быть в SQL Editor

**Правильно (SQL код):**
```sql
CREATE INDEX IF NOT EXISTS idx_articles_published_at_desc ON articles(published_at DESC) WHERE published = true AND published_at IS NOT NULL;
```

**Неправильно (TypeScript код):**
```typescript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(...)
```

---

## 🎯 Альтернативный способ: выполнение по частям

Если весь скрипт не работает, выполните индексы по одному:

### Индекс 1 (самый важный):
```sql
CREATE INDEX IF NOT EXISTS idx_articles_published_at_desc ON articles(published_at DESC) WHERE published = true AND published_at IS NOT NULL;
```

### Индекс 2:
```sql
CREATE INDEX IF NOT EXISTS idx_articles_category_published ON articles(category_id, published, published_at DESC) WHERE published = true AND published_at IS NOT NULL;
```

### Индекс 3:
```sql
CREATE INDEX IF NOT EXISTS idx_articles_views_desc ON articles(views_count DESC) WHERE published = true;
```

### Индекс 4:
```sql
CREATE INDEX IF NOT EXISTS idx_articles_reading_time ON articles(reading_time) WHERE published = true;
```

### Индекс 5:
```sql
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug) WHERE published = true;
```

### Индекс 6:
```sql
CREATE INDEX IF NOT EXISTS idx_articles_category_date_nav ON articles(category_id, published_at DESC) WHERE published = true AND published_at IS NOT NULL;
```

### Индекс 7:
```sql
CREATE INDEX IF NOT EXISTS idx_articles_published_created ON articles(published, created_at DESC);
```

---

## ✅ Проверка результата

После выполнения скрипта выполните этот запрос для проверки:

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'articles' 
ORDER BY indexname;
```

Вы должны увидеть созданные индексы, включая:
- `idx_articles_published_at_desc`
- `idx_articles_category_published`
- `idx_articles_views_desc`
- `idx_articles_reading_time`
- `idx_articles_slug`
- `idx_articles_category_date_nav`
- `idx_articles_published_created`

---

## 🚨 Решение проблем

### Ошибка: "syntax error at or near import"
**Причина:** Вы пытаетесь выполнить TypeScript код вместо SQL.

**Решение:** 
1. Убедитесь, что вы копируете код из файла `supabase-faq-optimization-indexes.sql`
2. НЕ копируйте код из файлов `.ts` или `.tsx`
3. В SQL Editor должен быть ТОЛЬКО SQL код

### Ошибка: "relation articles does not exist"
**Причина:** Таблица `articles` не существует или имеет другое имя.

**Решение:** 
1. Проверьте, что таблица `articles` существует в вашей базе данных
2. Если таблица имеет другое имя, замените `articles` на правильное имя в SQL скрипте

### Ошибка: "index already exists"
**Причина:** Индексы уже существуют.

**Решение:** Это нормально! Инструкция `IF NOT EXISTS` предотвращает ошибки. Индексы просто не будут пересозданы.

---

## 📞 Нужна помощь?

Если возникли проблемы:
1. Убедитесь, что вы в правильном проекте Supabase
2. Проверьте, что таблица `articles` существует
3. Убедитесь, что используете SQL код, а не TypeScript

