'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getAuthToken } from '@/lib/admin';
import { MarkdownContent } from '@/components/MarkdownContent';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import { showToast } from '@/components/admin/Toast';

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Article = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  views_count: number;
  reading_time: number | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  featured_image_url: string | null;
  category_id: string | null;
};

export default function AdminArticlePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState(false);
  const [editingMain, setEditingMain] = useState(false);
  const [editingContent, setEditingContent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    excerpt: '',
    title: '',
    slug: '',
    content: '',
    category_id: '',
    featured_image_url: '',
  });

  // Проверка доступа теперь происходит на сервере через AdminGuard в layout
  useEffect(() => {
    if (id) {
      loadArticle();
      loadCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  const loadArticle = async () => {
    try {
      // Используем API route с admin клиентом для обхода RLS
      const token = await getAuthToken();
      if (!token) {
        console.error('No auth token available');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/admin/articles/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const result = await response.json();
        console.error('Error loading article:', result.error);
        setLoading(false);
        return;
      }

      const result = await response.json();
      
      if (result.success && result.article) {
        const data = result.article;
        setArticle(data);
        setFormData({
          seo_title: data.seo_title || '',
          seo_description: data.seo_description || '',
          seo_keywords: (data.seo_keywords || []).join(', '),
          excerpt: data.excerpt || '',
          title: data.title || '',
          slug: data.slug || '',
          content: data.content || '',
          category_id: data.category_id || '',
          featured_image_url: data.featured_image_url || '',
        });
      } else {
        console.error('Article not found or error:', result.error);
      }
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!article) return;

    try {
      const keywordsArray = formData.seo_keywords
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const { error } = await supabase
        .from('articles')
        .update({
          seo_title: formData.seo_title || null,
          seo_description: formData.seo_description || null,
          seo_keywords: keywordsArray.length > 0 ? keywordsArray : null,
          excerpt: formData.excerpt || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        showToast(`Ошибка: ${error.message}`, 'error');
        return;
      }

      showToast('Изменения сохранены!', 'success');
      setEditing(false);
      loadArticle();
    } catch (error: any) {
      showToast(`Ошибка: ${error.message}`, 'error');
    }
  };

  const calculateReadingTime = (content: string): number => {
    const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  };

  const handleSaveMain = async () => {
    if (!article) return;

    if (!formData.title.trim()) {
      showToast('Название статьи не может быть пустым', 'warning');
      return;
    }

    if (!formData.slug.trim()) {
      showToast('Slug не может быть пустым', 'warning');
      return;
    }

    // Валидация slug (только латиница, цифры, дефисы)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formData.slug)) {
      showToast('Slug может содержать только латинские буквы, цифры и дефисы', 'warning');
      return;
    }

    setSaving(true);
    try {
      const token = await getAuthToken();
      const readingTime = calculateReadingTime(formData.content || article.content);

      const response = await fetch(`/api/admin/articles/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          slug: formData.slug.trim(),
          excerpt: formData.excerpt.trim() || null,
          category_id: formData.category_id || null,
          featured_image_url: formData.featured_image_url.trim() || null,
          reading_time: readingTime,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showToast('Изменения сохранены!', 'success');
        setEditingMain(false);
        loadArticle();
        // Если slug изменился, обновим URL
        if (result.article?.slug && result.article.slug !== article.slug) {
          router.push(`/admin/articles/${id}`);
        }
      } else {
        showToast(`Ошибка: ${result.error || 'Не удалось сохранить изменения'}`, 'error');
      }
    } catch (error: any) {
      showToast(`Ошибка: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContent = async () => {
    if (!article) return;

    if (!formData.content.trim()) {
      showToast('Контент статьи не может быть пустым', 'warning');
      return;
    }

    setSaving(true);
    try {
      const token = await getAuthToken();
      const readingTime = calculateReadingTime(formData.content);

      const response = await fetch(`/api/admin/articles/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: formData.content.trim(),
          reading_time: readingTime,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showToast('Контент сохранен!', 'success');
        setEditingContent(false);
        loadArticle();
      } else {
        showToast(`Ошибка: ${result.error || 'Не удалось сохранить контент'}`, 'error');
      }
    } catch (error: any) {
      showToast(`Ошибка: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!article) return;

    setDeleting(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        showToast('Статья успешно удалена', 'success');
        router.push('/admin/articles');
      } else {
        showToast(`Ошибка: ${result.error || 'Не удалось удалить статью'}`, 'error');
        setDeleting(false);
      }
    } catch (error: any) {
      showToast(`Ошибка: ${error.message}`, 'error');
      setDeleting(false);
    }
  };

  const handleApprove = async (approve: boolean) => {
    if (!article) return;

    if (
      !confirm(
        approve
          ? `Опубликовать статью "${article.title}"?`
          : `Снять с публикации статью "${article.title}"?`
      )
    ) {
      return;
    }

    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/admin/articles/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          approve,
          published_at: approve ? new Date().toISOString() : null,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showToast(
          approve ? 'Статья успешно опубликована!' : 'Статья снята с публикации',
          'success'
        );
        loadArticle();
      } else {
        showToast(`Ошибка: ${result.error}`, 'error');
      }
    } catch (error: any) {
      showToast(`Ошибка: ${error.message}`, 'error');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-64 w-full rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-800">
          <h1 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Статья не найдена
          </h1>
          <Link
            href="/admin/articles"
            className="inline-block rounded-full bg-slate-900 px-6 py-3 text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Вернуться к списку
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Заголовок с действиями */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                article.published
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}
            >
              {article.published ? 'Опубликовано' : 'Черновик'}
            </span>
            {article.published_at && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                📅 {new Date(article.published_at).toLocaleDateString('ru-RU')}
              </span>
            )}
          </div>
          {editingMain ? (
            <div className="space-y-2">
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-2xl font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder="Название статьи"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {article.title}
              </h1>
              <button
                onClick={() => setEditingMain(true)}
                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                title="Редактировать название и slug"
              >
                ✏️
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {article.published ? (
            <button
              onClick={() => handleApprove(false)}
              className="rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
            >
              Снять с публикации
            </button>
          ) : (
            <button
              onClick={() => handleApprove(true)}
              className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              Опубликовать
            </button>
          )}
          {article.published && (
            <Link
              href={`/faq/${article.slug}`}
              target="_blank"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Просмотр на сайте
            </Link>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Основной контент */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {editingContent ? 'Редактирование контента' : 'Предпросмотр статьи'}
              </h2>
              {!editingContent && (
                <button
                  onClick={() => setEditingContent(true)}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  ✏️ Редактировать контент
                </button>
              )}
            </div>
            {editingContent ? (
              <div className="space-y-4">
                <MarkdownEditor
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  articleTitle={formData.title || article.title}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveContent}
                    disabled={saving}
                    className="flex-1 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Сохранение...' : 'Сохранить контент'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingContent(false);
                      setFormData({ ...formData, content: article.content });
                    }}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <MarkdownContent content={article.content} articleTitle={article.title} />
            )}
          </div>
        </div>

        {/* Метаданные и редактирование */}
        <div className="space-y-6">
          {/* Редактирование основных полей */}
          {editingMain && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800">
              <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Редактирование
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Название статьи
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Название статьи"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Slug (URL)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="slug-статьи"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Только латинские буквы, цифры и дефисы
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Краткое описание (Excerpt)
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) =>
                      setFormData({ ...formData, excerpt: e.target.value })
                    }
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Краткое описание для превью"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Категория
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData({ ...formData, category_id: e.target.value })
                    }
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
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Featured Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.featured_image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, featured_image_url: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveMain}
                    disabled={saving}
                    className="flex-1 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingMain(false);
                      setFormData({
                        ...formData,
                        title: article.title,
                        slug: article.slug,
                        excerpt: article.excerpt || '',
                        category_id: article.category_id || '',
                        featured_image_url: article.featured_image_url || '',
                      });
                    }}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Статистика */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Статистика
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-600 dark:text-slate-400">Просмотры:</span>{' '}
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {article.views_count}
                </span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Время чтения:</span>{' '}
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {article.reading_time || '—'} мин
                </span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Создано:</span>{' '}
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {new Date(article.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Обновлено:</span>{' '}
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {new Date(article.updated_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Slug:</span>{' '}
                <span className="font-mono text-xs text-slate-900 dark:text-slate-100">
                  {article.slug}
                </span>
              </div>
              {article.category_id && (
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Категория:</span>{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {categories.find((c) => c.id === article.category_id)?.name || '—'}
                  </span>
                </div>
              )}
              {article.featured_image_url && (
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Изображение:</span>
                  <div className="mt-1">
                    <a
                      href={article.featured_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline dark:text-blue-400 break-all"
                    >
                      {article.featured_image_url}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Редактирование метаданных */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Метаданные
              </h3>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  Редактировать
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      SEO Title
                    </label>
                    <span
                      className={`text-xs ${
                        formData.seo_title.length > 0 && formData.seo_title.length <= 60
                          ? 'text-green-600 dark:text-green-400'
                          : formData.seo_title.length > 60
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {formData.seo_title.length}/60
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.seo_title}
                    onChange={(e) =>
                      setFormData({ ...formData, seo_title: e.target.value })
                    }
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 transition-colors dark:bg-slate-900 dark:text-slate-100 ${
                      formData.seo_title.length > 0 && formData.seo_title.length <= 60
                        ? 'border-green-500 dark:border-green-500'
                        : formData.seo_title.length > 60
                        ? 'border-amber-500 dark:border-amber-500'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                    placeholder={article.title}
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Рекомендуемая длина: до 60 символов
                  </p>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      SEO Description
                    </label>
                    <span
                      className={`text-xs ${
                        formData.seo_description.length >= 150 && formData.seo_description.length <= 160
                          ? 'text-green-600 dark:text-green-400'
                          : formData.seo_description.length > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {formData.seo_description.length}/160
                    </span>
                  </div>
                  <textarea
                    value={formData.seo_description}
                    onChange={(e) =>
                      setFormData({ ...formData, seo_description: e.target.value })
                    }
                    rows={3}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 transition-colors dark:bg-slate-900 dark:text-slate-100 ${
                      formData.seo_description.length >= 150 && formData.seo_description.length <= 160
                        ? 'border-green-500 dark:border-green-500'
                        : formData.seo_description.length > 160
                        ? 'border-amber-500 dark:border-amber-500'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                    placeholder="Описание для поисковых систем (150-160 символов)"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Рекомендуемая длина: 150-160 символов для лучшей видимости в поисковых системах
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    SEO Keywords (через запятую)
                  </label>
                  <input
                    type="text"
                    value={formData.seo_keywords}
                    onChange={(e) =>
                      setFormData({ ...formData, seo_keywords: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="ключевое слово 1, ключевое слово 2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Excerpt (краткое описание)
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) =>
                      setFormData({ ...formData, excerpt: e.target.value })
                    }
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Краткое описание для превью"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      loadArticle();
                    }}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">SEO Title:</span>
                  <div className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                    {article.seo_title || article.title}
                  </div>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">
                    SEO Description:
                  </span>
                  <div className="mt-1 text-slate-900 dark:text-slate-100">
                    {article.seo_description || '—'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Keywords:</span>
                  <div className="mt-1">
                    {article.seo_keywords && article.seo_keywords.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {article.seo_keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Excerpt:</span>
                  <div className="mt-1 text-slate-900 dark:text-slate-100">
                    {article.excerpt || '—'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Диалог подтверждения удаления */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Удалить статью?"
        message={`Вы уверены, что хотите удалить статью "${article.title}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

