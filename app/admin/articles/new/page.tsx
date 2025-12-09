'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getAuthToken } from '@/lib/admin';
import MarkdownEditor from '@/components/admin/MarkdownEditor';

type Category = {
  id: string;
  name: string;
  slug: string;
};

export default function NewArticlePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category_id: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    featured_image_url: '',
    published: false,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  // Автоматическая генерация slug из title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('article_categories')
        .select('id, name, slug')
        .order('name');

      if (error) {
        console.error('Error loading categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const calculateReadingTime = (content: string): number => {
    const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length;
    return Math.max(1, Math.ceil(wordCount / 200)); // 200 слов в минуту
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Название статьи обязательно');
      return;
    }

    if (!formData.slug.trim()) {
      alert('Slug обязательно');
      return;
    }

    // Валидация slug
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formData.slug)) {
      alert('Slug может содержать только латинские буквы, цифры и дефисы');
      return;
    }

    if (!formData.content.trim()) {
      alert('Контент статьи обязателен');
      return;
    }

    setLoading(true);

    try {
      const token = await getAuthToken();
      const keywordsArray = formData.seo_keywords
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const readingTime = calculateReadingTime(formData.content);

      const response = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          slug: formData.slug.trim(),
          excerpt: formData.excerpt.trim() || null,
          content: formData.content.trim(),
          category_id: formData.category_id || null,
          seo_title: formData.seo_title.trim() || null,
          seo_description: formData.seo_description.trim() || null,
          seo_keywords: keywordsArray.length > 0 ? keywordsArray : null,
          featured_image_url: formData.featured_image_url.trim() || null,
          reading_time: readingTime,
          published: formData.published,
          published_at: formData.published ? new Date().toISOString() : null,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Статья успешно создана!');
        router.push(`/admin/articles/${result.article.id}`);
      } else {
        alert(`Ошибка: ${result.error || 'Не удалось создать статью'}`);
      }
    } catch (error: any) {
      alert(`Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Заголовок */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Создать новую статью
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Заполните форму для создания новой статьи
          </p>
        </div>
        <Link
          href="/admin/articles"
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          ← Назад к списку
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Основная форма */}
          <div className="lg:col-span-2 space-y-6">
            {/* Основные поля */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Основная информация
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Название статьи <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Введите название статьи"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Slug (URL) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="slug-статьи"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Только латинские буквы, цифры и дефисы. Генерируется автоматически из названия.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Краткое описание (Excerpt)
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Краткое описание для превью (100-150 символов)"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formData.excerpt.length} символов
                  </p>
                </div>
              </div>
            </div>

            {/* Редактор контента */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Контент статьи <span className="text-red-500">*</span>
              </h2>
              <MarkdownEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                articleTitle={formData.title}
              />
            </div>
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            {/* Публикация */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800">
              <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Публикация
              </h3>
              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-700"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Опубликовать сразу
                  </span>
                </label>
              </div>
            </div>

            {/* Категория */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800">
              <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Категория
              </h3>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">Без категории</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SEO */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800">
              <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                SEO настройки
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={formData.seo_title}
                    onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder={formData.title || 'SEO заголовок'}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    SEO Description
                  </label>
                  <textarea
                    value={formData.seo_description}
                    onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Описание для поисковых систем (150-160 символов)"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formData.seo_description.length} символов
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    SEO Keywords
                  </label>
                  <input
                    type="text"
                    value={formData.seo_keywords}
                    onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="ключевое слово 1, ключевое слово 2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Featured Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.featured_image_url}
                    onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Создание...' : 'Создать статью'}
              </button>
              <Link
                href="/admin/articles"
                className="w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Отмена
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

