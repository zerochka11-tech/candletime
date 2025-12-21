'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useChristmasTheme } from '@/hooks/useChristmasTheme';
import Wish2026Modal from './Wish2026Modal';

export default function Wish2026FloatingButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const christmasThemeEnabled = useChristmasTheme();

  // Показываем кнопку с небольшой задержкой
  useEffect(() => {
    if (christmasThemeEnabled) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [christmasThemeEnabled]);

  if (!christmasThemeEnabled || !isVisible) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 group flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 opacity-0 animate-[fadeIn_0.6s_ease-out_0.3s_forwards] border border-slate-200/50 dark:border-slate-700/50"
        aria-label="Загадать желание на 2026 год"
        title="Загадай желание на 2026 год"
      >
        {/* Искрящаяся звезда с улучшенной анимацией */}
        <span className="relative text-xl sm:text-2xl animate-twinkle drop-shadow-md filter brightness-110 group-hover:scale-110 transition-transform duration-300">
          ✨
        </span>
      </button>

      <Wish2026Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

