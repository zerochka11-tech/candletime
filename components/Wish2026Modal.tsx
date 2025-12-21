'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface Wish2026ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Wish2026Modal({ isOpen, onClose }: Wish2026ModalProps) {
  // Закрытие по Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // Блокируем скролл body при открытом модальном окне
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop с анимацией */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      />

      {/* Modal с анимацией */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wish-modal-title"
        aria-describedby="wish-modal-description"
        className="relative w-full max-w-md rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl animate-[modalSlideIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
          aria-label="Закрыть модальное окно"
        >
          <svg
            className="h-5 w-5 text-slate-500 dark:text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Контент */}
        <div className="relative p-6 sm:p-8">
          <header className="text-center space-y-4 mb-6">
            {/* Иконка */}
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 mb-1" aria-hidden="true">
              <span className="text-xl animate-twinkle">✨</span>
            </div>
            
            {/* Основной заголовок */}
            <h2 id="wish-modal-title" className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Загадай желание на 2026 год
            </h2>
            
            {/* Описание заголовка */}
            <p id="wish-modal-description" className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
              Новый год — время для новых начинаний и исполнения мечтаний. 
              Запиши своё самое заветное желание и зажги свечу, которая будет напоминать тебе о важном.
            </p>
          </header>

          {/* Основной контент */}
          <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="sr-only">Как это работает</h3>
            <div className="space-y-3">
              <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
                Вернись к своей свече в любой момент, чтобы вспомнить о своих намерениях и проверить, как идут дела.
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
                Твоя свеча будет гореть выбранное время — день, неделя или месяц. 
                Когда время закончится, свеча исчезнет из списка активных, но ты всегда сможешь вернуться к ней по ссылке.
              </p>
            </div>
          </section>

          {/* Кнопка действия */}
          <footer className="pt-6">
            <Link
              href="/wish-2026"
              onClick={onClose}
              className="group w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-6 sm:px-8 py-3 text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
            >
              <span className="text-base transition-transform duration-300 group-hover:scale-110" aria-hidden="true">✨</span>
              <span>Загадать желание</span>
              <svg
                className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}

