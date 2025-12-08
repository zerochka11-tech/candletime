/**
 * Скрипт для инициализации темы до гидратации React
 * Предотвращает мигание при загрузке страницы
 */
export function ThemeScript() {
  const code = `
    (function() {
      const theme = localStorage.getItem('theme') || 'system';
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const finalTheme = theme === 'system' ? systemTheme : theme;
      document.documentElement.classList.add(finalTheme);
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

