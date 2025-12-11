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
  const [editingCategory, setEditingCategory] = useState(false);
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
      {/* Заголовок с градиентом и иконками */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:to-slate-800">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-start gap-2.5">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                {editingMain ? (
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-lg font-bold text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Название статьи"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-start gap-2">
                    <h1 className="text-lg font-bold leading-snug text-slate-900 dark:text-slate-100 break-words">
                      {article.title}
                    </h1>
                    <button
                      onClick={() => setEditingMain(true)}
                      className="mt-0.5 flex-shrink-0 rounded-lg p-1 text-slate-500 transition-all hover:bg-white/80 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 hover:scale-105"
                      title="Редактировать название и slug"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
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
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      📅 {new Date(article.published_at).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      }).replace(/\//g, '.')}
                    </span>
                  )}
                  {categories.find((c) => c.id === article.category_id) && (
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {categories.find((c) => c.id === article.category_id)?.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 lg:flex-shrink-0">
            <Link
              href="/admin/articles"
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </Link>
            {article.published ? (
              <button
                onClick={() => handleApprove(false)}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-amber-700 hover:shadow-sm"
              >
                Снять с публикации
              </button>
            ) : (
              <button
                onClick={() => handleApprove(true)}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-green-700 hover:shadow-sm"
              >
                Опубликовать
              </button>
            )}
            {article.published && (
              <Link
                href={`/faq/${article.slug}`}
                target="_blank"
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Просмотр
              </Link>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-red-700 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? 'Удаление...' : 'Удалить'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
        {/* Основной контент */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-800 overflow-hidden">
            {/* Заголовок */}
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white p-3 dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {editingContent ? 'Редактирование контента' : 'Предпросмотр статьи'}
                    </h2>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {editingContent ? 'Измените содержимое статьи' : 'Как статья будет выглядеть на сайте'}
                    </p>
                  </div>
                </div>
                {!editingContent && (
                  <button
                    onClick={() => setEditingContent(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-slate-800 hover:shadow-sm dark:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Редактировать
                  </button>
                )}
              </div>
            </div>
            {/* Контент */}
            <div className="p-4">
              {editingContent ? (
                <div className="space-y-3">
                  <MarkdownEditor
                    value={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                    articleTitle={formData.title || article.title}
                  />
                  <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={handleSaveContent}
                      disabled={saving}
                      className="flex items-center gap-1.5 flex-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-green-700 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Сохранение...
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Сохранить
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingContent(false);
                        setFormData({ ...formData, content: article.content });
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="min-h-[200px] rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 dark:border-slate-700 dark:from-slate-900/50 dark:to-slate-800">
                  {article.content && article.content.trim().length > 0 ? (
                    <MarkdownContent content={article.content} articleTitle={article.title} />
                  ) : (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-800 dark:bg-amber-900/20">
                      <p className="text-amber-800 dark:text-amber-300">
                        Контент отсутствует. Нажмите "Редактировать" для добавления содержимого статьи.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Метаданные и редактирование */}
        <div className="space-y-4 lg:sticky lg:top-4">
          {/* Редактирование основных полей */}
          {editingMain && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-800 overflow-hidden">
              <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <svg className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Редактирование
                  </h3>
                </div>
              </div>
              <div className="p-3 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Название статьи
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Название статьи"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Slug (URL)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="slug-статьи"
                  />
                  <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                    Только латинские буквы, цифры и дефисы
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Краткое описание (Excerpt)
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) =>
                      setFormData({ ...formData, excerpt: e.target.value })
                    }
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Краткое описание для превью"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Категория
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData({ ...formData, category_id: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Featured Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.featured_image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, featured_image_url: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={handleSaveMain}
                    disabled={saving}
                    className="flex items-center gap-1.5 flex-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-green-700 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Сохранить
                      </>
                    )}
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
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Статистика */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-800 overflow-hidden">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white p-3 dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <svg className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Статистика
                </h3>
              </div>
            </div>
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 p-2 dark:from-slate-900/50 dark:to-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="mb-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">Просмотры</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {article.views_count}
                  </div>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 p-2 dark:from-slate-900/50 dark:to-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="mb-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">Время чтения</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {article.reading_time || '—'}
                    {article.reading_time && <span className="text-xs font-normal text-slate-500"> мин</span>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                  <div className="mb-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">Создано</div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {new Date(article.created_at).toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }).replace(/\//g, '.')}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                  <div className="mb-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">Обновлено</div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {new Date(article.updated_at).toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }).replace(/\//g, '.')}
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                <div className="mb-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">Slug</div>
                <div className="font-mono text-[10px] text-slate-900 dark:text-slate-100 break-all leading-relaxed">
                  {article.slug || '—'}
                </div>
                {!article.slug && (
                  <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
                    ⚠️ Slug не установлен
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-2 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Категория</div>
                  {!editingCategory && (
                    <button
                      onClick={() => setEditingCategory(true)}
                      className="rounded p-0.5 text-slate-500 transition-all hover:bg-white/80 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200 hover:scale-105"
                      title="Изменить категорию"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
                {editingCategory ? (
                  <div className="space-y-1.5">
                    <select
                      value={formData.category_id}
                      onChange={(e) =>
                        setFormData({ ...formData, category_id: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      autoFocus
                    >
                      <option value="">Без категории</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-1.5">
                      <button
                        onClick={async () => {
                          if (!article) return;
                          setSaving(true);
                          try {
                            const token = await getAuthToken();
                            const response = await fetch(`/api/admin/articles/${id}`, {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({
                                category_id: formData.category_id || null,
                              }),
                            });

                            const result = await response.json();

                            if (response.ok) {
                              showToast('Категория обновлена!', 'success');
                              setEditingCategory(false);
                              loadArticle();
                            } else {
                              showToast(`Ошибка: ${result.error || 'Не удалось обновить категорию'}`, 'error');
                            }
                          } catch (error: any) {
                            showToast(`Ошибка: ${error.message}`, 'error');
                          } finally {
                            setSaving(false);
                          }
                        }}
                        disabled={saving}
                        className="flex items-center gap-1 flex-1 rounded-lg bg-green-600 px-2 py-1 text-[10px] font-medium text-white transition-all hover:bg-green-700 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <>
                            <svg className="h-2.5 w-2.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Сохранение...
                          </>
                        ) : (
                          <>
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Сохранить
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingCategory(false);
                          setFormData({ ...formData, category_id: article.category_id || '' });
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {article.category_id ? (
                      <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
                        {categories.find((c) => c.id === article.category_id)?.name || '—'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Не выбрана</span>
                    )}
                  </div>
                )}
              </div>
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

          {/* Метаданные */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-800 overflow-hidden">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white p-3 dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <svg className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Метаданные
                  </h3>
                </div>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-slate-800 hover:shadow-sm dark:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Редактировать
                  </button>
                )}
              </div>
            </div>
            <div className="p-3">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      SEO Title
                    </label>
                    <span
                      className={`text-[10px] ${
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
                    className={`w-full rounded-lg border px-2.5 py-1.5 text-xs text-slate-900 transition-colors dark:bg-slate-900 dark:text-slate-100 ${
                      formData.seo_title.length > 0 && formData.seo_title.length <= 60
                        ? 'border-green-500 dark:border-green-500'
                        : formData.seo_title.length > 60
                        ? 'border-amber-500 dark:border-amber-500'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                    placeholder={article.title}
                  />
                  <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                    Рекомендуемая длина: до 60 символов
                  </p>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      SEO Description
                    </label>
                    <span
                      className={`text-[10px] ${
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
                    rows={2}
                    className={`w-full rounded-lg border px-2.5 py-1.5 text-xs text-slate-900 transition-colors dark:bg-slate-900 dark:text-slate-100 ${
                      formData.seo_description.length >= 150 && formData.seo_description.length <= 160
                        ? 'border-green-500 dark:border-green-500'
                        : formData.seo_description.length > 160
                        ? 'border-amber-500 dark:border-amber-500'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                    placeholder="Описание для поисковых систем (150-160 символов)"
                  />
                  <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                    Рекомендуемая длина: 150-160 символов
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    SEO Keywords (через запятую)
                  </label>
                  <input
                    type="text"
                    value={formData.seo_keywords}
                    onChange={(e) =>
                      setFormData({ ...formData, seo_keywords: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="ключевое слово 1, ключевое слово 2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Excerpt (краткое описание)
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) =>
                      setFormData({ ...formData, excerpt: e.target.value })
                    }
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Краткое описание для превью"
                  />
                </div>
                <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 flex-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-green-700 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Сохранить
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      loadArticle();
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="rounded-lg bg-gradient-to-br from-slate-50 to-white p-2.5 dark:from-slate-900/50 dark:to-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="mb-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">SEO Title</div>
                  <div className="text-xs font-semibold leading-relaxed text-slate-900 dark:text-slate-100">
                    {article.seo_title || article.title}
                  </div>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-slate-50 to-white p-2.5 dark:from-slate-900/50 dark:to-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="mb-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">SEO Description</div>
                  <div className="text-xs leading-relaxed text-slate-900 dark:text-slate-100">
                    {article.seo_description || article.excerpt || '—'}
                  </div>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-slate-50 to-white p-2.5 dark:from-slate-900/50 dark:to-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="mb-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Keywords</div>
                  <div className="flex flex-wrap gap-1.5">
                    {article.seo_keywords && article.seo_keywords.length > 0 ? (
                      article.seo_keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          {keyword}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Не указаны</span>
                    )}
                  </div>
                </div>
                {article.excerpt && (
                  <div className="rounded-lg bg-gradient-to-br from-slate-50 to-white p-2.5 dark:from-slate-900/50 dark:to-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="mb-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Excerpt</div>
                    <div className="text-xs leading-relaxed text-slate-900 dark:text-slate-100">
                      {article.excerpt}
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
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

