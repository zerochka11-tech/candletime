'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import Link from 'next/link';
import type { Components } from 'react-markdown';

interface MarkdownContentProps {
  content: string;
  articleTitle?: string; // Опциональный title статьи для проверки дублирования
}

/**
 * Компонент для отображения Markdown контента
 * Поддерживает GitHub Flavored Markdown и безопасный рендеринг HTML
 */
export function MarkdownContent({ content, articleTitle }: MarkdownContentProps) {
  // Если контент пустой, возвращаем пустой div
  if (!content || content.trim() === '') {
    return <div className="text-slate-600 dark:text-slate-400">Контент отсутствует</div>;
  }

  // Удаляем первый заголовок, если он совпадает с title статьи
  let processedContent = content;
  if (articleTitle) {
    // Проверяем, начинается ли контент с заголовка h1 или h2, который совпадает с title
    const titleRegex = new RegExp(`^#+\\s*${articleTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'im');
    if (titleRegex.test(processedContent)) {
      // Удаляем первую строку с заголовком
      processedContent = processedContent.replace(titleRegex, '').trim();
    }
  }

  // Проверяем, является ли контент HTML (содержит HTML теги)
  // Если да, используем rehypeRaw для рендеринга HTML
  // Если нет, рендерим как Markdown
  const isHTML = /<[a-z][\s\S]*>/i.test(processedContent);
  const rehypePlugins = isHTML 
    ? [rehypeRaw, rehypeSanitize] 
    : [rehypeSanitize];

  return (
    <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-bold prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-a:text-slate-900 dark:prose-a:text-slate-100 prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-code:text-slate-900 dark:prose-code:text-slate-100 prose-pre:bg-slate-100 dark:prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={rehypePlugins}
        components={{
          // Кастомные компоненты для улучшения отображения
          a: ({ href, children, ...props }) => {
            // Если ссылка внутренняя, используем Next.js Link
            if (href && (href.startsWith('/') || href.startsWith('#'))) {
              return (
                <Link href={href} {...props}>
                  {children}
                </Link>
              );
            }
            // Внешние ссылки открываются в новой вкладке
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-900 underline hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300"
                {...props}
              >
                {children}
              </a>
            );
          },
          // Улучшенное отображение кода
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            const codeString = String(children).replace(/\n$/, '');

            if (isInline) {
              return (
                <code
                  className="rounded bg-slate-100 px-1.5 py-0.5 text-sm font-mono text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                  {...props}
                >
                  {codeString}
                </code>
              );
            }

            // Для блоков кода используем простой pre без подсветки синтаксиса
            // (можно добавить react-syntax-highlighter позже)
            return (
              <pre className="overflow-x-auto rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
                <code className="text-sm" {...props}>
                  {codeString}
                </code>
              </pre>
            );
          },
          // Улучшенное отображение списков
          ul: ({ children, ...props }) => (
            <ul className="list-disc space-y-2 pl-6" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal space-y-2 pl-6" {...props}>
              {children}
            </ol>
          ),
          // Улучшенное отображение заголовков
          // Преобразуем h1 в h2, так как h1 уже используется на странице для SEO
          h1: ({ children, ...props }) => (
            <h2 className="mb-4 mt-8 text-3xl font-bold text-slate-900 dark:text-slate-100" {...props}>
              {children}
            </h2>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="mb-3 mt-6 text-2xl font-bold text-slate-900 dark:text-slate-100" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="mb-2 mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100" {...props}>
              {children}
            </h3>
          ),
          // Улучшенное отображение блоков цитат
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-l-4 border-slate-300 pl-4 italic text-slate-600 dark:border-slate-600 dark:text-slate-400"
              {...props}
            >
              {children}
            </blockquote>
          ),
          // Улучшенное отображение таблиц
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-700" {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th
              className="border border-slate-300 bg-slate-100 px-4 py-2 text-left font-semibold dark:border-slate-700 dark:bg-slate-800"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td
              className="border border-slate-300 px-4 py-2 dark:border-slate-700"
              {...props}
            >
              {children}
            </td>
          ),
        } as Components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

