'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface ArticleFeedbackProps {
  articleId: string;
}

export function ArticleFeedback({ articleId }: ArticleFeedbackProps) {
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (value: 'helpful' | 'not-helpful') => {
    if (submitted || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Сохраняем feedback в localStorage для предотвращения повторных отправок
      const feedbackKey = `article-feedback-${articleId}`;
      const existingFeedback = localStorage.getItem(feedbackKey);
      
      if (existingFeedback) {
        setSubmitted(true);
        setFeedback(value as 'helpful' | 'not-helpful');
        setIsSubmitting(false);
        return;
      }

      // Здесь можно добавить сохранение в базу данных
      // const { error } = await supabase
      //   .from('article_feedback')
      //   .insert({ article_id: articleId, feedback: value });

      // Сохраняем в localStorage
      localStorage.setItem(feedbackKey, value);
      setFeedback(value);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Проверяем, был ли уже отправлен feedback
    const feedbackKey = `article-feedback-${articleId}`;
    const existingFeedback = localStorage.getItem(feedbackKey);
    if (existingFeedback) {
      setFeedback(existingFeedback as 'helpful' | 'not-helpful');
      setSubmitted(true);
    }
  }, [articleId]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md">
      {/* Декоративный градиент */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">💭</span>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Была ли статья полезной?
          </h3>
        </div>
        
        {!submitted ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleFeedback('helpful')}
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-800/20 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              <span className="text-base">👍</span>
              <span>Да</span>
            </button>
            
            <button
              onClick={() => handleFeedback('not-helpful')}
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              <span className="text-base">👎</span>
              <span>Нет</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {feedback === 'helpful' ? (
                <span className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <span>👍</span>
                  <span>Спасибо за отзыв!</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span>👎</span>
                  <span>Спасибо за обратную связь. Мы работаем над улучшением контента.</span>
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

