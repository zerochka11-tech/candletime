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
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Извлекаем заголовки H2 и H3 из markdown контента
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const matches = Array.from(content.matchAll(headingRegex));
    
    const extractedHeadings: Heading[] = matches.map((match, index) => {
      const level = match[1].length;
      const text = match[2].trim();
      // Создаем ID из текста заголовка
      const id = `heading-${index}-${text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)}`;
      
      return { id, text, level };
    });

    setHeadings(extractedHeadings);

    // Добавляем ID к заголовкам в DOM после рендера markdown
    const updateHeadings = () => {
      const headingElements = document.querySelectorAll('article h2, article h3');
      headingElements.forEach((el, index) => {
        if (index < extractedHeadings.length && !el.id) {
          el.id = extractedHeadings[index].id;
        }
      });
    };

    // Несколько попыток обновления для надежности
    const timers = [
      setTimeout(updateHeadings, 100),
      setTimeout(updateHeadings, 500),
      setTimeout(updateHeadings, 1000),
    ];
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [content]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0% -35% 0%',
        threshold: 0,
      }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach((heading) => {
        const element = document.getElementById(heading.id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Отступ от верха
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  if (headings.length === 0) return null;

  return (
    <nav className="hidden lg:block sticky top-24 self-start w-64 ml-8">
      <div className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">📑</span>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Содержание
            </h3>
          </div>
          
          <ul className="space-y-1.5 text-xs">
            {headings.map((heading) => (
              <li key={heading.id}>
                <button
                  onClick={() => scrollToHeading(heading.id)}
                  className={`w-full text-left px-2 py-1 rounded-lg transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-700 ${
                    heading.level === 3 ? 'pl-4' : ''
                  } ${
                    activeId === heading.id
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-medium border-l-2 border-amber-500 dark:border-amber-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {heading.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
