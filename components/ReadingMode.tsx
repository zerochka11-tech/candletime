'use client';

import { useState, useEffect } from 'react';

export function ReadingModeToggle() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (isActive) {
      document.body.classList.add('reading-mode');
      document.documentElement.style.fontSize = '18px';
    } else {
      document.body.classList.remove('reading-mode');
      document.documentElement.style.fontSize = '';
    }

    return () => {
      document.body.classList.remove('reading-mode');
      document.documentElement.style.fontSize = '';
    };
  }, [isActive]);

  return (
    <button
      onClick={() => setIsActive(!isActive)}
      type="button"
      className="reading-mode-toggle fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 p-3 text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl dark:bg-slate-100 dark:text-slate-900"
      title={isActive ? 'Выйти из режима чтения' : 'Режим чтения'}
      aria-label={isActive ? 'Выйти из режима чтения' : 'Включить режим чтения'}
    >
      <span className="text-xl">{isActive ? '✕' : '📖'}</span>
    </button>
  );
}

