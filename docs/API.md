# API Документация CandleTime

Полная документация всех API endpoints проекта CandleTime.

## Базовый URL

Все API endpoints доступны по адресу:
```
https://candletime.ru/api
```

## Аутентификация

Большинство endpoints не требуют аутентификации. Админские endpoints требуют Bearer токен в заголовке `Authorization`.

```http
Authorization: Bearer <access_token>
```

---

## Публичные API

### GET /api/geocode

Геокодирование адресов в координаты через OpenStreetMap Nominatim.

**Параметры запроса:**
- `q` (string, required) - Адрес или название места для геокодирования

**Пример запроса:**
```http
GET /api/geocode?q=Москва, Россия
```

**Пример ответа:**
```json
{
  "results": [
    {
      "display_name": "Москва, Центральный федеральный округ, Россия",
      "latitude": 55.7558,
      "longitude": 37.6173,
      "country": "Россия",
      "city": "Москва",
      "region": "Центральный федеральный округ",
      "address": "Москва, Центральный федеральный округ, Россия"
    }
  ]
}
```

**Ошибки:**
- `400` - Параметр `q` не указан
- `500` - Ошибка геокодирования

---

### GET /api/map/candles

Получение свечей для отображения на интерактивной карте.

**Параметры запроса:**
- `bounds` (string, optional) - Границы карты в формате "minLat,minLng,maxLat,maxLng"
- `type` (string, optional) - Фильтр по типу свечи: `calm`, `support`, `memory`, `gratitude`, `focus`, или `all`
- `status` (string, optional) - Фильтр по статусу: `active` (по умолчанию) или `all`

**Пример запроса:**
```http
GET /api/map/candles?bounds=55.5,37.5,56.0,38.0&type=calm&status=active
```

**Пример ответа:**
```json
{
  "candles": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Моя свеча",
      "type": "calm",
      "lat": 55.7558,
      "lng": 37.6173,
      "country": "Россия",
      "city": "Москва",
      "createdAt": "2025-01-15T10:00:00Z",
      "expiresAt": "2025-01-16T10:00:00Z",
      "status": "active"
    }
  ]
}
```

**Ошибки:**
- `500` - Ошибка получения данных

**Примечания:**
- Лимит: максимум 1000 свечей за запрос
- Используются анонимизированные координаты для приватности

---

### GET /api/map/stats

Статистика по свечам на карте (по странам и городам).

**Пример запроса:**
```http
GET /api/map/stats
```

**Пример ответа:**
```json
{
  "countries": {
    "Россия": 150,
    "Украина": 45,
    "Беларусь": 30
  },
  "topCities": [
    {
      "city": "Москва",
      "country": "Россия",
      "count": 50
    },
    {
      "city": "Санкт-Петербург",
      "country": "Россия",
      "count": 30
    }
  ],
  "totalCandles": 225
}
```

**Ошибки:**
- `500` - Ошибка получения статистики

---

## Админские API

Все админские endpoints требуют аутентификации через Bearer токен.

### GET /api/admin/check

Проверка прав администратора текущего пользователя.

**Заголовки:**
- `Authorization: Bearer <access_token>` (опционально, можно использовать cookies)

**Пример запроса:**
```http
GET /api/admin/check
```

**Пример ответа:**
```json
{
  "isAdmin": true,
  "user": {
    "email": "admin@example.com"
  }
}
```

**Ошибки:**
- `401` - Пользователь не авторизован
- `500` - Ошибка проверки

---

### GET /api/admin/settings

Получение всех настроек сайта (только для администраторов).

**Заголовки:**
- `Authorization: Bearer <access_token>` (required)

**Пример запроса:**
```http
GET /api/admin/settings
```

**Пример ответа:**
```json
{
  "settings": [
    {
      "key": "christmas_theme_enabled",
      "value": true,
      "updated_at": "2025-01-27T10:00:00Z"
    }
  ]
}
```

**Ошибки:**
- `401` - Не авторизован
- `403` - Нет прав администратора
- `500` - Ошибка получения данных

---

### PUT /api/admin/settings

Обновление настройки сайта (только для администраторов).

**Заголовки:**
- `Authorization: Bearer <access_token>` (required)

**Тело запроса:**
```json
{
  "key": "christmas_theme_enabled",
  "value": true
}
```

**Обязательные поля:**
- `key` - Ключ настройки (например, "christmas_theme_enabled")
- `value` - Значение настройки (может быть boolean, string, number, object)

**Пример ответа:**
```json
{
  "key": "christmas_theme_enabled",
  "value": true,
  "updated_at": "2025-01-27T10:00:00Z"
}
```

**Ошибки:**
- `400` - Неверные данные (не указаны обязательные поля)
- `401` - Не авторизован
- `403` - Нет прав администратора
- `500` - Ошибка обновления

**Примечания:**
- Настройка создаётся автоматически, если её ещё нет в базе данных
- Изменения применяются сразу после сохранения
- Пользователи увидят изменения в течение 30 секунд (автообновление через хук `useChristmasTheme`)

---

### GET /api/admin/articles

Получение списка статей (с пагинацией и фильтрацией).

**Параметры запроса:**
- `filter` (string, optional) - Фильтр: `all`, `published`, `draft` (по умолчанию `all`)
- `page` (number, optional) - Номер страницы (по умолчанию 1)
- `perPage` (number, optional) - Количество статей на странице (по умолчанию 50)
- `search` (string, optional) - Поиск по заголовку и slug
- `sortBy` (string, optional) - Сортировка: `newest`, `oldest`, `title-asc`, `title-desc`, `views-desc`, `views-asc`

**Заголовки:**
- `Authorization: Bearer <access_token>` (required)

**Пример запроса:**
```http
GET /api/admin/articles?filter=published&page=1&perPage=20&sortBy=newest
```

**Пример ответа:**
```json
{
  "articles": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Как зажечь свечу",
      "slug": "kak-zazhech-svechu",
      "excerpt": "Пошаговая инструкция...",
      "published": true,
      "published_at": "2025-01-15T10:00:00Z",
      "created_at": "2025-01-15T09:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z",
      "views_count": 150,
      "reading_time": 5,
      "seo_title": "Как зажечь свечу | CandleTime",
      "seo_description": "Пошаговая инструкция...",
      "author_id": "user-id"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 100,
    "perPage": 20
  },
  "stats": {
    "total": 100,
    "published": 80,
    "draft": 20
  }
}
```

**Ошибки:**
- `401` - Не авторизован
- `403` - Нет прав администратора
- `500` - Ошибка получения данных

---

### POST /api/admin/articles

Создание новой статьи.

**Заголовки:**
- `Authorization: Bearer <access_token>` (required)

**Тело запроса:**
```json
{
  "title": "Название статьи",
  "slug": "nazvanie-stati",
  "excerpt": "Краткое описание",
  "content": "# Заголовок\n\nПолный текст статьи в Markdown...",
  "category_id": "category-uuid",
  "seo_title": "SEO заголовок",
  "seo_description": "SEO описание",
  "seo_keywords": ["ключевое", "слово"],
  "featured_image_url": "https://example.com/image.jpg",
  "reading_time": 5,
  "published": false,
  "published_at": "2025-01-20T10:00:00Z"
}
```

**Обязательные поля:**
- `title` - Заголовок статьи
- `slug` - URL-friendly идентификатор (только латиница, цифры и дефисы)
- `content` - Полный текст статьи

**Пример ответа:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Название статьи",
  "slug": "nazvanie-stati",
  "created_at": "2025-01-15T10:00:00Z"
}
```

**Ошибки:**
- `400` - Неверные данные (не указаны обязательные поля, неверный формат slug, slug уже существует)
- `401` - Не авторизован
- `403` - Нет прав администратора
- `500` - Ошибка создания

---

### GET /api/admin/articles/[id]

Получение одной статьи по ID.

**Заголовки:**
- `Authorization: Bearer <access_token>` (required)

**Пример запроса:**
```http
GET /api/admin/articles/123e4567-e89b-12d3-a456-426614174000
```

**Пример ответа:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Как зажечь свечу",
  "slug": "kak-zazhech-svechu",
  "excerpt": "...",
  "content": "...",
  "category_id": "...",
  "published": true,
  "published_at": "2025-01-15T10:00:00Z",
  "created_at": "2025-01-15T09:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z",
  "views_count": 150,
  "reading_time": 5,
  "seo_title": "...",
  "seo_description": "...",
  "seo_keywords": [...],
  "featured_image_url": "...",
  "author_id": "..."
}
```

**Ошибки:**
- `401` - Не авторизован
- `403` - Нет прав администратора
- `404` - Статья не найдена
- `500` - Ошибка получения

---

### PUT /api/admin/articles/[id]

Обновление статьи.

**Заголовки:**
- `Authorization: Bearer <access_token>` (required)

**Тело запроса:** (все поля опциональны, обновляются только указанные)
```json
{
  "title": "Обновленный заголовок",
  "content": "Обновленный контент",
  "published": true
}
```

**Пример ответа:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Обновленный заголовок",
  "updated_at": "2025-01-15T11:00:00Z"
}
```

**Ошибки:**
- `400` - Неверные данные
- `401` - Не авторизован
- `403` - Нет прав администратора
- `404` - Статья не найдена
- `500` - Ошибка обновления

---

### DELETE /api/admin/articles/[id]

Удаление статьи.

**Заголовки:**
- `Authorization: Bearer <access_token>` (required)

**Пример запроса:**
```http
DELETE /api/admin/articles/123e4567-e89b-12d3-a456-426614174000
```

**Пример ответа:**
```json
{
  "success": true,
  "id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Ошибки:**
- `401` - Не авторизован
- `403` - Нет прав администратора
- `404` - Статья не найдена
- `500` - Ошибка удаления

---

### POST /api/admin/articles/[id]/approve

Одобрение статьи для публикации.

**Заголовки:**
- `Authorization: Bearer <access_token>` (required)

**Тело запроса:**
```json
{
  "published": true,
  "published_at": "2025-01-20T10:00:00Z"
}
```

**Пример ответа:**
```json
{
  "success": true,
  "article": {
    "id": "...",
    "published": true,
    "published_at": "2025-01-20T10:00:00Z"
  }
}
```

---

### POST /api/admin/articles/generate

Генерация статьи через Gemini API.

**Заголовки:**
- `Authorization: Bearer <access_token>` (required)

**Тело запроса:**
```json
{
  "topic": "Тема статьи",
  "candleType": "calm",
  "language": "ru",
  "templateId": "template-uuid",
  "variables": {
    "topic": "Медитация",
    "language": "ru"
  }
}
```

**Пример ответа:**
```json
{
  "title": "Медитация для начинающих",
  "content": "# Медитация для начинающих\n\nПолный текст...",
  "excerpt": "Краткое описание...",
  "seoTitle": "Медитация для начинающих | CandleTime",
  "seoDescription": "...",
  "seoKeywords": ["медитация", "спокойствие"],
  "readingTime": 8,
  "slug": "meditatsiya-dlya-nachinayushchikh",
  "categorySlug": "seo"
}
```

**Ошибки:**
- `400` - Неверные параметры
- `401` - Не авторизован
- `403` - Нет прав администратора
- `429` - Rate limit Gemini API
- `500` - Ошибка генерации

---

### POST /api/admin/articles/import

Импорт статьи из файла Markdown.

**Заголовки:**
- `Authorization: Bearer <access_token>` (required)
- `Content-Type: multipart/form-data`

**Тело запроса (FormData):**
- `file` (File) - Файл Markdown
- `category_id` (string, optional) - ID категории
- `published` (boolean, optional) - Опубликовать сразу

**Пример ответа:**
```json
{
  "success": true,
  "article": {
    "id": "...",
    "title": "...",
    "slug": "..."
  }
}
```

---

### GET /api/admin/prompt-templates

Получение списка промпт-шаблонов.

**Заголовки:**
- `Authorization: Bearer <access_token>` (required)

**Пример ответа:**
```json
{
  "templates": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Стандартный шаблон",
      "description": "Описание шаблона",
      "prompt": "Напиши статью про {topic}...",
      "variables": ["topic", "language"],
      "is_default": true,
      "is_system": false,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### POST /api/admin/prompt-templates

Создание нового промпт-шаблона.

**Заголовки:**
- `Authorization: Bearer <access_token>` (required)

**Тело запроса:**
```json
{
  "name": "Название шаблона",
  "description": "Описание",
  "prompt": "Напиши статью про {topic} для {language}",
  "variables": ["topic", "language"],
  "is_default": false
}
```

---

### GET /api/admin/prompt-templates/[id]

Получение одного шаблона.

**Заголовки:**
- `Authorization: Bearer <access_token>` (required)

---

### PUT /api/admin/prompt-templates/[id]

Обновление шаблона.

**Заголовки:**
- `Authorization: Bearer <access_token>` (required)

---

### DELETE /api/admin/prompt-templates/[id]

Удаление шаблона.

**Заголовки:**
- `Authorization: Bearer <access_token>` (required)

---

## Коды ошибок

- `400` - Bad Request - Неверные параметры запроса
- `401` - Unauthorized - Требуется аутентификация
- `403` - Forbidden - Нет прав доступа
- `404` - Not Found - Ресурс не найден
- `429` - Too Many Requests - Превышен лимит запросов
- `500` - Internal Server Error - Внутренняя ошибка сервера

---

## Rate Limiting

- Публичные endpoints: без ограничений (но рекомендуется не более 10 запросов/сек)
- Админские endpoints: без ограничений (только для авторизованных администраторов)

---

## Примеры использования

### JavaScript/TypeScript

```typescript
// Получение свечей для карты
const response = await fetch('/api/map/candles?type=calm&status=active');
const data = await response.json();
console.log(data.candles);

// Создание статьи (требует аутентификации)
const token = await getAuthToken(); // Получить токен из сессии
const response = await fetch('/api/admin/articles', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Моя статья',
    slug: 'moya-statya',
    content: '# Заголовок\n\nТекст...'
  })
});
const article = await response.json();
```

### cURL

```bash
# Геокодирование
curl "https://candletime.ru/api/geocode?q=Москва"

# Получение свечей для карты
curl "https://candletime.ru/api/map/candles?type=calm"

# Создание статьи (требует токен)
curl -X POST "https://candletime.ru/api/admin/articles" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Моя статья",
    "slug": "moya-statya",
    "content": "# Заголовок\n\nТекст..."
  }'
```

---

## Версионирование

Текущая версия API: `v1` (неявная)

В будущем может быть добавлено версионирование через префикс `/api/v1/`.

---

## Поддержка

Если у вас есть вопросы по API, создайте issue в репозитории проекта.

