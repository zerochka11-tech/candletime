'use client';

import { useEffect, useState } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Извлекаем заголовки из markdown контента
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const extracted: Heading[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id =
        text
          .toLowerCase()
          .replace(/[^a-zа-яё0-9\s]+/g, '')
          .replace(/\s+/g, '-')
          .replace(/^-|-$/g, '') || `heading-${extracted.length}`;

      extracted.push({ id, text, level });
    }

    setHeadings(extracted);

    // Добавляем id к заголовкам в DOM после рендера
    const timer = setTimeout(() => {
      extracted.forEach(({ id, text }) => {
        const headings = document.querySelectorAll('h2, h3');
        headings.forEach((h) => {
          if (h.textContent?.trim() === text && !h.id) {
            h.id = id;
          }
        });
      });
    }, 100);

    // Отслеживание активного заголовка при скролле
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0% -70% 0%' }
    );

    // Начинаем наблюдение после таймера
    setTimeout(() => {
      extracted.forEach(({ id }) => {
        const element = document.getElementById(id);
        if (element) observer.observe(element);
      });
    }, 200);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <>
      {/* Мобильная версия - сворачиваемое */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          className="w-full rounded-xl border border-slate-200 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-3 shadow-sm dark:border-slate-700 flex items-center justify-between"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Содержание
          </h3>
          <svg
            className={`h-4 w-4 text-slate-600 dark:text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="mt-2 rounded-xl border border-slate-200 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 shadow-sm dark:border-slate-700">
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {headings.map((heading) => (
                <li
                  key={heading.id}
                  className={`${heading.level === 3 ? 'ml-4' : ''} ${heading.level === 3 ? 'text-xs' : 'text-sm'}`}
                >
                  <a
                    href={`#${heading.id}`}
                    className={`block transition-colors hover:text-slate-900 dark:hover:text-slate-100 ${
                      activeId === heading.id
                        ? 'text-slate-900 dark:text-slate-100 font-medium'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setIsOpen(false);
                      const element = document.getElementById(heading.id);
                      if (element) {
                        const headerOffset = 100;
                        const elementPosition = element.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                        window.scrollTo({
                          top: offsetPosition,
                          behavior: 'smooth',
                        });
                      }
                    }}
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Десктопная версия - липкая */}
      <nav className="table-of-contents sticky top-24 hidden lg:block max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="rounded-xl border border-slate-200 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 shadow-sm dark:border-slate-700">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Содержание
          </h3>
          <ul className="space-y-2">
            {headings.map((heading) => (
              <li
                key={heading.id}
                className={`${heading.level === 3 ? 'ml-4' : ''} ${heading.level === 3 ? 'text-xs' : 'text-sm'}`}
              >
                <a
                  href={`#${heading.id}`}
                  className={`block transition-colors hover:text-slate-900 dark:hover:text-slate-100 ${
                    activeId === heading.id
                      ? 'text-slate-900 dark:text-slate-100 font-medium'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById(heading.id);
                    if (element) {
                      const headerOffset = 100;
                      const elementPosition = element.getBoundingClientRect().top;
                      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                      window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth',
                      });
                    }
                  }}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}

