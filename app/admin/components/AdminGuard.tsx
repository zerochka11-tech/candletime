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

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { isAdmin, error } = await checkAdminAccess();
        
        if (!isAdmin) {
          // Не авторизован или не админ - редирект на логин
          // Сохраняем текущий путь для редиректа после логина
          const redirectPath = pathname || '/admin/articles';
          router.replace(`/auth/login?redirect=${encodeURIComponent(redirectPath)}`);
          return;
        }

        // Авторизован и админ - показываем контент
        setIsAuthorized(true);
      } catch (error) {
        console.error('AdminGuard check error:', error);
        // При ошибке - редирект на логин
        router.replace('/auth/login?redirect=/admin/articles');
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Запускаем только один раз при монтировании

  // Пока проверяем - ничего не показываем (редирект произойдет до рендера контента)
  if (isChecking || !isAuthorized) {
    return null;
  }

  // Авторизован - показываем контент
  return <>{children}</>;
}

