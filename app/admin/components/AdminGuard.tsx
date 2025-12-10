'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { checkAdminAccess } from '@/lib/admin';

/**
 * Client Component для проверки прав администратора
 * Проверяет доступ на клиенте и показывает контент только после проверки
 */
export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { isAdmin, error } = await checkAdminAccess();
        
        if (!isAdmin) {
          // Не авторизован или не админ - редирект на логин
          // Сохраняем текущий путь для редиректа после логина
          const redirectPath = pathname || '/admin/articles';
          setShouldRedirect(true);
          // Используем setTimeout, чтобы избежать мигания при перезагрузке
          setTimeout(() => {
            router.replace(`/auth/login?redirect=${encodeURIComponent(redirectPath)}`);
          }, 100);
          return;
        }

        // Авторизован и админ - показываем контент
        setIsAuthorized(true);
      } catch (error) {
        console.error('AdminGuard check error:', error);
        // При ошибке - редирект на логин
        setShouldRedirect(true);
        setTimeout(() => {
          router.replace('/auth/login?redirect=/admin/articles');
        }, 100);
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Запускаем только один раз при монтировании

  // Пока проверяем - показываем минимальный loading state вместо null
  // Это предотвращает мигание экрана логина при перезагрузке
  if (isChecking || (!isAuthorized && !shouldRedirect)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100"></div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  // Если нужно редиректить, показываем пустой экран
  if (shouldRedirect) {
    return null;
  }

  // Авторизован - показываем контент
  return <>{children}</>;
}

