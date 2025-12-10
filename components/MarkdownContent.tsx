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
  // Если контент пустой, возвращаем сообщение
  if (!content || content.trim() === '') {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-800 dark:bg-amber-900/20">
        <p className="text-amber-800 dark:text-amber-300">
          Контент отсутствует. Пожалуйста, отредактируйте статью и добавьте контент.
        </p>
      </div>
    );
  }

  // Удаляем markdown код блоки из начала контента, если они есть
  // Иногда контент может содержать ```markdown ... ```
  let processedContent = content
    .replace(/^```[\w]*\n?/i, '') // Удаляем открывающий ```markdown
    .replace(/\n?```\s*$/i, '') // Удаляем закрывающий ```
    .trim();

  // Удаляем первый заголовок, если он совпадает с title статьи
  if (articleTitle) {
    // Проверяем, начинается ли контент с заголовка h1 или h2, который совпадает с title
    const titleRegex = new RegExp(`^#+\\s*${articleTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'im');
    if (titleRegex.test(processedContent)) {
      // Удаляем первую строку с заголовком
      processedContent = processedContent.replace(titleRegex, '').trim();
    } else {
      // Если точного совпадения нет, удаляем первую строку с #, если она есть
      // Это помогает избежать дублирования заголовка
      const lines = processedContent.split('\n');
      if (lines[0] && lines[0].trim().match(/^#+\s/)) {
        // Проверяем, не слишком ли длинный заголовок (вероятно, это не title статьи)
        const firstLine = lines[0].trim();
        const headerText = firstLine.replace(/^#+\s*/, '').trim();
        // Если заголовок короткий (до 100 символов) и похож на title, удаляем его
        if (headerText.length <= 100 && 
            (headerText.toLowerCase().includes(articleTitle.toLowerCase().substring(0, 20)) ||
             articleTitle.toLowerCase().includes(headerText.toLowerCase().substring(0, 20)))) {
          lines.shift();
          processedContent = lines.join('\n').trim();
        }
      }
    }
  } else {
    // Если title не передан, просто удаляем первую строку с #, если она есть
    const lines = processedContent.split('\n');
    if (lines[0] && lines[0].trim().match(/^#+\s/)) {
      lines.shift();
      processedContent = lines.join('\n').trim();
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
    <div className="prose prose-slate max-w-none dark:prose-invert w-full overflow-x-hidden [&>*:first-child]:!mt-0
      prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-headings:break-words
      prose-h2:text-base prose-h2:sm:text-lg prose-h2:md:text-xl prose-h2:lg:text-2xl prose-h2:xl:text-2xl prose-h2:2xl:text-3xl prose-h2:mt-6 sm:prose-h2:mt-8 lg:prose-h2:mt-10 prose-h2:mb-2.5 sm:prose-h2:mb-3 lg:prose-h2:mb-4 prose-h2:leading-tight prose-h2:first:mt-4 sm:prose-h2:first:mt-5 lg:prose-h2:first:mt-6
      prose-h3:text-sm prose-h3:sm:text-base prose-h3:md:text-lg prose-h3:lg:text-xl prose-h3:xl:text-xl prose-h3:2xl:text-2xl prose-h3:mt-5 sm:prose-h3:mt-6 lg:prose-h3:mt-8 prose-h3:mb-2 sm:prose-h3:mb-2.5 lg:prose-h3:mb-3 prose-h3:leading-tight
      prose-h4:text-xs prose-h4:sm:text-sm prose-h4:md:text-base prose-h4:lg:text-lg prose-h4:xl:text-lg prose-h4:2xl:text-xl prose-h4:mt-4 sm:prose-h4:mt-5 lg:prose-h4:mt-6 prose-h4:mb-1.5 sm:prose-h4:mb-2 lg:prose-h4:mb-2.5 prose-h4:leading-tight prose-h4:font-bold
      prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-[1.7] prose-p:text-sm sm:prose-p:text-base lg:prose-p:text-lg prose-p:mb-4 sm:prose-p:mb-5 prose-p:break-words prose-p:font-normal prose-p:first:mt-0
      prose-a:text-amber-600 dark:prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline prose-a:text-sm sm:prose-a:text-base lg:prose-a:text-lg prose-a:font-medium prose-a:break-words
      prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-strong:font-semibold
      prose-ul:my-4 sm:prose-ul:my-5 prose-ol:my-4 sm:prose-ol:my-5 prose-li:my-1 sm:prose-li:my-1.5 prose-li:leading-relaxed prose-li:break-words prose-li:text-sm sm:prose-li:text-base lg:prose-li:text-lg prose-ul:pl-5 sm:prose-ul:pl-6 prose-ol:pl-5 sm:prose-ol:pl-6
      prose-ul:marker:text-amber-600 dark:prose-ul:marker:text-amber-400 prose-ol:marker:text-amber-600 dark:prose-ol:marker:text-amber-400
      prose-hr:my-6 sm:prose-hr:my-8 lg:prose-hr:my-10 prose-hr:border-slate-300 dark:prose-hr:border-slate-700
      prose-blockquote:border-l-amber-500 dark:prose-blockquote:border-l-amber-400 prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-slate-800/50 prose-blockquote:py-2 prose-blockquote:px-3 sm:prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:my-4 sm:prose-blockquote:my-6 prose-blockquote:break-words prose-blockquote:text-sm sm:prose-blockquote:text-base lg:prose-blockquote:text-lg prose-blockquote:leading-relaxed prose-blockquote:italic
      prose-code:text-amber-700 dark:prose-code:text-amber-300 prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs sm:prose-code:text-sm prose-code:break-all prose-code:font-mono
      prose-pre:bg-slate-900 dark:prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-300 dark:prose-pre:border-slate-700 prose-pre:rounded-xl prose-pre:my-6 prose-pre:overflow-x-auto prose-pre:max-w-full prose-pre:text-xs sm:prose-pre:text-sm prose-pre:font-mono
      prose-table:w-full prose-table:overflow-x-auto prose-table:block prose-table:max-w-full prose-table:my-4 sm:prose-table:my-6 lg:prose-table:my-8 prose-table:text-xs sm:prose-table:text-sm prose-table:border-slate-300 dark:prose-table:border-slate-700
      prose-img:max-w-full prose-img:h-auto prose-img:rounded-xl prose-img:shadow-md prose-img:my-6 sm:prose-img:my-8 lg:prose-img:my-10">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={rehypePlugins}
        components={{
          // Кастомные компоненты для улучшения отображения
          a: ({ href, children, ...props }) => {
            // Если ссылка внутренняя, используем Next.js Link
            if (href && (href.startsWith('/') || href.startsWith('#'))) {
              return (
                <Link href={href} className="text-slate-900 underline decoration-2 underline-offset-2 decoration-amber-500 hover:decoration-amber-600 font-medium dark:text-slate-100" {...props}>
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
                className="text-slate-900 underline decoration-2 underline-offset-2 decoration-amber-500 hover:decoration-amber-600 font-medium dark:text-slate-100"
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
              <div className="overflow-x-auto w-full -mx-2 sm:mx-0 my-6">
                <pre className="overflow-x-auto rounded-lg bg-slate-900 dark:bg-slate-950 p-3 sm:p-4 text-xs sm:text-sm max-w-full">
                  <code className="text-inherit break-all whitespace-pre" {...props}>
                    {codeString}
                  </code>
                </pre>
              </div>
            );
          },
          // Улучшенное отображение списков
          ul: ({ children, ...props }) => (
            <ul className="list-disc space-y-2 pl-6 first:mt-0" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal space-y-2 pl-6 first:mt-0" {...props}>
              {children}
            </ol>
          ),
          // Улучшенное отображение заголовков
          // Преобразуем h1 в h2, так как h1 уже используется на странице для SEO
          h1: ({ children, ...props }) => (
            <h2 className="mb-4 mt-8 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 first:mt-0" {...props}>
              {children}
            </h2>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="mb-3 mt-6 text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 first:mt-0" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="mb-2 mt-4 text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 first:mt-0" {...props}>
              {children}
            </h3>
          ),
          // Улучшенное отображение блоков цитат
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="relative my-6 border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-900/10 pl-6 py-4 italic text-slate-700 dark:text-slate-300 rounded-r-lg"
              {...props}
            >
              <div className="absolute -left-2 top-4 text-2xl text-amber-500/30">"</div>
              {children}
            </blockquote>
          ),
          // Улучшенные изображения
          img: ({ src, alt, ...props }) => (
            <div className="my-8 overflow-hidden rounded-xl shadow-md">
              <img
                src={src}
                alt={alt}
                className="w-full object-cover"
                loading="lazy"
                {...props}
              />
              {alt && (
                <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400 italic">
                  {alt}
                </p>
              )}
            </div>
          ),
          // Улучшенное отображение таблиц
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto w-full -mx-2 sm:mx-0 my-6">
              <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-700 w-full" {...props}>
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

