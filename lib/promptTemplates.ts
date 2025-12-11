/**
 * Утилиты для работы с промпт-шаблонами
 */

export type PromptTemplateVariable = {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  defaultValue?: string;
  type?: 'text' | 'select' | 'textarea';
  options?: string[]; // Для типа select
};

export type PromptTemplate = {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  variables: string[] | PromptTemplateVariable[];
  author_id?: string;
  is_default: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Извлекает все переменные из промпт-шаблона
 * Находит все вхождения вида {variableName}
 * 
 * @param prompt - Текст промпта с переменными в фигурных скобках
 * @returns Массив уникальных имен переменных
 * 
 * @example
 * ```typescript
 * const vars = extractVariablesFromPrompt('Напиши статью про {topic} для {language}');
 * // Возвращает: ['topic', 'language']
 * ```
 */
export function extractVariablesFromPrompt(prompt: string): string[] {
  const regex = /\{([^}]+)\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(prompt)) !== null) {
    const varName = match[1].trim();
    // Пропускаем пустые и уже добавленные переменные
    if (varName && !variables.includes(varName)) {
      variables.push(varName);
    }
  }

  return variables;
}

/**
 * Заменяет переменные в шаблоне на их значения
 * 
 * @param template - Шаблон с переменными вида {variableName}
 * @param variables - Объект с значениями переменных
 * @returns Шаблон с подставленными значениями
 * 
 * @example
 * ```typescript
 * const result = replaceTemplateVariables(
 *   'Напиши про {topic}',
 *   { topic: 'медитация' }
 * );
 * // Возвращает: 'Напиши про медитация'
 * ```
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string | undefined>
): string {
  let result = template;

  // Заменяем все переменные вида {variableName}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value || '');
  }

  // Удаляем незаполненные переменные (опционально - можно оставить)
  // result = result.replace(/\{[^}]+\}/g, '');

  return result;
}

/**
 * Проверяет, все ли обязательные переменные заполнены
 * 
 * @param template - Шаблон промпта с описанием переменных
 * @param providedVariables - Предоставленные значения переменных
 * @returns Объект с результатом валидации и списком отсутствующих переменных
 * 
 * @example
 * ```typescript
 * const result = validateTemplateVariables(template, { topic: 'медитация' });
 * // Возвращает: { valid: true, missing: [] } или { valid: false, missing: ['language'] }
 * ```
 */
export function validateTemplateVariables(
  template: PromptTemplate,
  providedVariables: Record<string, string>
): { valid: boolean; missing: string[] } {
  const requiredVariables: string[] = [];

  // Определяем обязательные переменные
  if (Array.isArray(template.variables)) {
    template.variables.forEach((v) => {
      if (typeof v === 'string') {
        // Если переменная - topic, она обязательна
        if (v === 'topic') {
          requiredVariables.push(v);
        }
      } else {
        // Если это объект с описанием переменной
        if (v.required !== false) {
          requiredVariables.push(v.name);
        }
      }
    });
  }

  // Проверяем наличие обязательных переменных
  const missing = requiredVariables.filter(
    (v) => !providedVariables[v] || providedVariables[v].trim().length === 0
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Валидирует промпт-шаблон на корректность
 * 
 * @param template - Шаблон для валидации
 * @param template.name - Название шаблона (минимум 3 символа, максимум 100)
 * @param template.prompt - Текст промпта (минимум 50 символов)
 * @param template.variables - Массив объявленных переменных (опционально)
 * @returns Объект с результатом валидации и списком ошибок
 * 
 * @example
 * ```typescript
 * const result = validatePromptTemplate({
 *   name: 'Мой шаблон',
 *   prompt: 'Напиши статью про {topic}',
 *   variables: ['topic']
 * });
 * // Возвращает: { valid: true, errors: [] } или { valid: false, errors: [...] }
 * ```
 */
export function validatePromptTemplate(template: {
  name: string;
  prompt: string;
  variables?: string[];
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Валидация названия
  if (!template.name || template.name.trim().length < 3) {
    errors.push('Название шаблона должно содержать минимум 3 символа');
  }

  if (template.name && template.name.length > 100) {
    errors.push('Название шаблона не должно превышать 100 символов');
  }

  // Валидация промпта
  if (!template.prompt || template.prompt.trim().length < 50) {
    errors.push('Промпт должен содержать минимум 50 символов');
  }

  // Примечание: переменная {topic} больше не обязательна, так как промпт может быть самодостаточным

  // Проверка валидности переменных
  const variables = extractVariablesFromPrompt(template.prompt);
  const declaredVariables = template.variables || [];

  // Проверяем, что все переменные в промпте объявлены в массиве variables
  const undeclared = variables.filter((v) => !declaredVariables.includes(v));
  if (undeclared.length > 0) {
    // Не критическая ошибка, но предупреждение
    console.warn(`Необъявленные переменные в промпте: ${undeclared.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Создает объект с переменными из простого режима генерации статьи
 * Автоматически добавляет CTA секцию для типа свечи, если указан
 * 
 * @param params - Параметры простого режима
 * @param params.topic - Тема статьи
 * @param params.candleType - Тип свечи (опционально)
 * @param params.language - Язык статьи (по умолчанию 'ru')
 * @param params.categoryName - Название категории (опционально)
 * @returns Объект с переменными для подстановки в шаблон
 * 
 * @example
 * ```typescript
 * const vars = createVariablesFromSimpleMode({
 *   topic: 'Медитация',
 *   candleType: 'calm',
 *   language: 'ru'
 * });
 * ```
 */
export function createVariablesFromSimpleMode(params: {
  topic: string;
  candleType?: string;
  language?: 'ru' | 'en';
  categoryName?: string;
}): Record<string, string> {
  const variables: Record<string, string> = {
    topic: params.topic,
    language: params.language || 'ru',
  };

  // Специальная обработка candleType для создания CTA секции
  if (params.candleType) {
    variables.candleType = params.candleType;

    const candleTypeDescriptions: Record<string, { ru: string; en: string }> = {
      calm: {
        ru: 'Спокойствие - для умиротворения и гармонии',
        en: 'Calm - for peace and harmony',
      },
      support: {
        ru: 'Поддержка - чтобы поддержать кого-то',
        en: 'Support - to support someone',
      },
      memory: {
        ru: 'Память - в память о ком-то или о чем-то',
        en: 'Memory - in memory of someone or something',
      },
      gratitude: {
        ru: 'Благодарность - чтобы выразить благодарность',
        en: 'Gratitude - to express gratitude',
      },
      focus: {
        ru: 'Фокус - для концентрации и намерений',
        en: 'Focus - for concentration and intentions',
      },
    };

    const lang = params.language || 'ru';
    const candleDesc = candleTypeDescriptions[params.candleType]?.[lang] || params.candleType;

    const candleTypeLabels: Record<string, { ru: string; en: string }> = {
      calm: { ru: 'спокойствия', en: 'calm' },
      support: { ru: 'поддержки', en: 'support' },
      memory: { ru: 'памяти', en: 'memory' },
      gratitude: { ru: 'благодарности', en: 'gratitude' },
      focus: { ru: 'фокуса', en: 'focus' },
    };

    const candleLabel = candleTypeLabels[params.candleType]?.[lang] || params.candleType;

    // Создаем секцию CTA для вставки в промпт
    variables.ctaSection =
      lang === 'ru'
        ? `\n\nВ конце статьи добавь мягкий призыв к действию с упоминанием символической свечи типа "${candleDesc}". Например: "Готовы начать? Зажгите свою первую свечу ${candleLabel} прямо сейчас."`
        : `\n\nAt the end of the article, add a soft call to action mentioning a symbolic candle of type "${candleDesc}".`;

    variables.candleTypeCTA = params.candleType ? ' с призывом к действию' : '';
  } else {
    variables.ctaSection = '';
    variables.candleTypeCTA = '';
  }

  if (params.categoryName) {
    variables.categoryName = params.categoryName;
  }

  return variables;
}

/**
 * Получает значение переменной из объекта переменных
 * 
 * @param variables - Объект с переменными
 * @param variableName - Имя переменной
 * @returns Значение переменной или пустая строка, если переменная не найдена
 * 
 * @example
 * ```typescript
 * const value = getVariableValue({ topic: 'медитация' }, 'topic');
 * // Возвращает: 'медитация'
 * ```
 */
export function getVariableValue(
  variables: Record<string, string>,
  variableName: string
): string {
  return variables[variableName] || '';
}

