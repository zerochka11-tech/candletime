/**
 * Централизованная обработка ошибок
 */

type ErrorContext = {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Логирует ошибку с дополнительным контекстом для отладки
 * 
 * @param error - Ошибка (Error объект или любое значение)
 * @param context - Дополнительный контекст (компонент, действие, метаданные)
 * 
 * @example
 * ```typescript
 * logError(new Error('Failed to load'), {
 *   component: 'HomePage',
 *   action: 'loadStats',
 *   metadata: { userId: '123' }
 * });
 * ```
 */
export function logError(
  error: Error | unknown,
  context?: ErrorContext
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const logData = {
    message: errorMessage,
    stack: errorStack,
    context: context || {},
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  };

  // В development выводим полную информацию
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Error:', logData);
    return;
  }

  // В production логируем только важную информацию
  console.error('Error:', {
    message: errorMessage,
    component: context?.component,
    action: context?.action,
  });

  // TODO: Здесь можно добавить отправку в Sentry или другой сервис мониторинга
  // if (typeof window !== 'undefined' && window.Sentry) {
  //   window.Sentry.captureException(error, { extra: context });
  // }
}

/**
 * Обрабатывает ошибки Supabase и возвращает понятное пользователю сообщение
 * 
 * @param error - Ошибка от Supabase или другая ошибка
 * @param context - Дополнительный контекст для логирования
 * @returns Понятное сообщение об ошибке на русском языке
 * 
 * @example
 * ```typescript
 * try {
 *   await supabase.from('candles').insert(data);
 * } catch (error) {
 *   const message = handleSupabaseError(error, { component: 'LightPage' });
 *   setError(message);
 * }
 * ```
 */
export function handleSupabaseError(
  error: unknown,
  context?: ErrorContext
): string {
  if (error instanceof Error) {
    logError(error, context);
    
    // Пользовательские сообщения для разных типов ошибок
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Ошибка сети. Проверьте подключение к интернету.';
    }
    
    if (error.message.includes('auth')) {
      return 'Ошибка авторизации. Пожалуйста, войдите снова.';
    }
    
    if (error.message.includes('permission') || error.message.includes('RLS')) {
      return 'Недостаточно прав для выполнения этого действия.';
    }
  }
  
  logError(error, context);
  return 'Произошла ошибка. Пожалуйста, попробуйте позже.';
}

/**
 * Создает пользовательское сообщение об ошибке из любого типа ошибки
 * 
 * @param error - Ошибка любого типа
 * @returns Сообщение об ошибке или 'Произошла неизвестная ошибка'
 * 
 * @example
 * ```typescript
 * const message = createErrorMessage(new Error('Network error'));
 * // Возвращает: 'Network error'
 * ```
 */
export function createErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Произошла неизвестная ошибка';
}


