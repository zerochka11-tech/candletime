'use client';

import { useState } from 'react';

interface ShareButtonsProps {
  title: string;
  url: string;
  description?: string;
}

export function ShareButtons({ title, url, description }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const fullUrl = `${siteUrl}${url}`;
  const shareText = `${title}${description ? ` - ${description}` : ''}`;

  const shareLinks = {
    telegram: `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`,
    vk: `https://vk.com/share.php?url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(title)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${fullUrl}`)}`,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="share-buttons flex flex-wrap items-center gap-2 w-full overflow-x-auto pb-1">
      <a
        href={shareLinks.telegram}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-900/20"
        title="Поделиться в Telegram"
      >
        <span>📱</span>
        <span className="hidden sm:inline">Telegram</span>
      </a>

      <a
        href={shareLinks.vk}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-900/20"
        title="Поделиться в VK"
      >
        <span>VK</span>
      </a>

      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-900/20"
        title="Поделиться в Twitter"
      >
        <span>🐦</span>
        <span className="hidden sm:inline">Twitter</span>
      </a>

      <button
        onClick={handleCopy}
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        title="Копировать ссылку"
      >
        <span>{copied ? '✓' : '🔗'}</span>
        <span className="hidden sm:inline">
          {copied ? 'Скопировано!' : 'Копировать ссылку'}
        </span>
        <span className="sm:hidden">{copied ? '✓' : '🔗'}</span>
      </button>
    </div>
  );
}

