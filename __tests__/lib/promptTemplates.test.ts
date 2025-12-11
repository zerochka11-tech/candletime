/**
 * Unit тесты для lib/promptTemplates.ts
 */

import {
  extractVariablesFromPrompt,
  replaceTemplateVariables,
  validateTemplateVariables,
  validatePromptTemplate,
  createVariablesFromSimpleMode,
  getVariableValue,
} from '@/lib/promptTemplates';
import type { PromptTemplate } from '@/lib/promptTemplates';

describe('lib/promptTemplates', () => {
  describe('extractVariablesFromPrompt', () => {
    it('извлекает переменные из промпта', () => {
      const prompt = 'Напиши статью про {topic} для {language}';
      const vars = extractVariablesFromPrompt(prompt);

      expect(vars).toEqual(['topic', 'language']);
    });

    it('извлекает уникальные переменные', () => {
      const prompt = 'Напиши про {topic} и еще про {topic}';
      const vars = extractVariablesFromPrompt(prompt);

      expect(vars).toEqual(['topic']);
    });

    it('обрабатывает промпт без переменных', () => {
      const prompt = 'Напиши статью про медитацию';
      const vars = extractVariablesFromPrompt(prompt);

      expect(vars).toEqual([]);
    });

    it('обрабатывает пустой промпт', () => {
      const vars = extractVariablesFromPrompt('');

      expect(vars).toEqual([]);
    });

    it('обрабатывает переменные с пробелами', () => {
      const prompt = 'Напиши про { topic }';
      const vars = extractVariablesFromPrompt(prompt);

      expect(vars).toEqual(['topic']);
    });

    it('обрабатывает множественные переменные', () => {
      const prompt = 'Напиши про {topic} для {language} с {candleType}';
      const vars = extractVariablesFromPrompt(prompt);

      expect(vars).toEqual(['topic', 'language', 'candleType']);
    });
  });

  describe('replaceTemplateVariables', () => {
    it('заменяет переменные на значения', () => {
      const template = 'Напиши про {topic}';
      const result = replaceTemplateVariables(template, { topic: 'медитация' });

      expect(result).toBe('Напиши про медитация');
    });

    it('заменяет множественные переменные', () => {
      const template = 'Напиши про {topic} для {language}';
      const result = replaceTemplateVariables(template, {
        topic: 'медитация',
        language: 'ru',
      });

      expect(result).toBe('Напиши про медитация для ru');
    });

    it('заменяет все вхождения переменной', () => {
      const template = 'Напиши про {topic} и еще про {topic}';
      const result = replaceTemplateVariables(template, { topic: 'медитация' });

      expect(result).toBe('Напиши про медитация и еще про медитация');
    });

    it('обрабатывает незаполненные переменные', () => {
      const template = 'Напиши про {topic}';
      const result = replaceTemplateVariables(template, { topic: undefined });

      expect(result).toBe('Напиши про ');
    });

    it('обрабатывает переменные, которых нет в объекте', () => {
      const template = 'Напиши про {topic}';
      const result = replaceTemplateVariables(template, {});

      // Функция не удаляет незаполненные переменные (закомментировано в коде)
      expect(result).toBe('Напиши про {topic}');
    });

    it('обрабатывает пустой шаблон', () => {
      const result = replaceTemplateVariables('', { topic: 'медитация' });

      expect(result).toBe('');
    });
  });

  describe('validateTemplateVariables', () => {
    it('валидирует, что все обязательные переменные заполнены', () => {
      const template: PromptTemplate = {
        id: '1',
        name: 'Шаблон',
        prompt: 'Напиши про {topic}',
        variables: ['topic'],
        is_default: false,
        is_system: false,
        created_at: '2025-01-15',
        updated_at: '2025-01-15',
      };

      const result = validateTemplateVariables(template, { topic: 'медитация' });

      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('возвращает ошибку, если обязательная переменная не заполнена', () => {
      const template: PromptTemplate = {
        id: '1',
        name: 'Шаблон',
        prompt: 'Напиши про {topic}',
        variables: ['topic'],
        is_default: false,
        is_system: false,
        created_at: '2025-01-15',
        updated_at: '2025-01-15',
      };

      const result = validateTemplateVariables(template, {});

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('topic');
    });

    it('возвращает ошибку, если переменная пустая строка', () => {
      const template: PromptTemplate = {
        id: '1',
        name: 'Шаблон',
        prompt: 'Напиши про {topic}',
        variables: ['topic'],
        is_default: false,
        is_system: false,
        created_at: '2025-01-15',
        updated_at: '2025-01-15',
      };

      const result = validateTemplateVariables(template, { topic: '   ' });

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('topic');
    });

    it('обрабатывает переменные с объектами описания', () => {
      const template: PromptTemplate = {
        id: '1',
        name: 'Шаблон',
        prompt: 'Напиши про {topic}',
        variables: [
          {
            name: 'topic',
            label: 'Тема',
            required: true,
          },
        ],
        is_default: false,
        is_system: false,
        created_at: '2025-01-15',
        updated_at: '2025-01-15',
      };

      const result = validateTemplateVariables(template, { topic: 'медитация' });

      expect(result.valid).toBe(true);
    });

    it('игнорирует необязательные переменные', () => {
      const template: PromptTemplate = {
        id: '1',
        name: 'Шаблон',
        prompt: 'Напиши про {topic}',
        variables: [
          {
            name: 'topic',
            label: 'Тема',
            required: false,
          },
        ],
        is_default: false,
        is_system: false,
        created_at: '2025-01-15',
        updated_at: '2025-01-15',
      };

      const result = validateTemplateVariables(template, {});

      expect(result.valid).toBe(true);
    });
  });

  describe('validatePromptTemplate', () => {
    it('валидирует корректный шаблон', () => {
      const result = validatePromptTemplate({
        name: 'Мой шаблон',
        prompt: 'Напиши статью про {topic} для {language}. Это длинный промпт, который содержит более 50 символов для прохождения валидации.',
        variables: ['topic', 'language'],
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('возвращает ошибку, если название слишком короткое', () => {
      const result = validatePromptTemplate({
        name: 'А',
        prompt: 'Напиши статью про {topic}',
        variables: ['topic'],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Название шаблона должно содержать минимум 3 символа');
    });

    it('возвращает ошибку, если название слишком длинное', () => {
      const longName = 'А'.repeat(101);
      const result = validatePromptTemplate({
        name: longName,
        prompt: 'Напиши статью про {topic}',
        variables: ['topic'],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Название шаблона не должно превышать 100 символов');
    });

    it('возвращает ошибку, если промпт слишком короткий', () => {
      const result = validatePromptTemplate({
        name: 'Мой шаблон',
        prompt: 'Короткий',
        variables: [],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Промпт должен содержать минимум 50 символов');
    });

    it('обрабатывает пустой промпт', () => {
      const result = validatePromptTemplate({
        name: 'Мой шаблон',
        prompt: '',
        variables: [],
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('обрабатывает шаблон без переменных', () => {
      const result = validatePromptTemplate({
        name: 'Мой шаблон',
        prompt: 'Напиши статью про медитацию без переменных. Это длинный промпт, который содержит более 50 символов для прохождения валидации.',
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('createVariablesFromSimpleMode', () => {
    it('создает переменные из простого режима', () => {
      const vars = createVariablesFromSimpleMode({
        topic: 'Медитация',
        language: 'ru',
      });

      expect(vars.topic).toBe('Медитация');
      expect(vars.language).toBe('ru');
    });

    it('использует ru как язык по умолчанию', () => {
      const vars = createVariablesFromSimpleMode({
        topic: 'Медитация',
      });

      expect(vars.language).toBe('ru');
    });

    it('добавляет CTA секцию для типа свечи', () => {
      const vars = createVariablesFromSimpleMode({
        topic: 'Медитация',
        candleType: 'calm',
        language: 'ru',
      });

      expect(vars.candleType).toBe('calm');
      expect(vars.ctaSection).toContain('спокойствия');
      expect(vars.candleTypeCTA).toBe(' с призывом к действию');
    });

    it('не добавляет CTA, если тип свечи не указан', () => {
      const vars = createVariablesFromSimpleMode({
        topic: 'Медитация',
        language: 'ru',
      });

      expect(vars.ctaSection).toBe('');
      expect(vars.candleTypeCTA).toBe('');
    });

    it('обрабатывает разные типы свечей', () => {
      const types = ['calm', 'support', 'memory', 'gratitude', 'focus'] as const;

      types.forEach(type => {
        const vars = createVariablesFromSimpleMode({
          topic: 'Тема',
          candleType: type,
          language: 'ru',
        });

        expect(vars.candleType).toBe(type);
        expect(vars.ctaSection.length).toBeGreaterThan(0);
      });
    });

    it('обрабатывает английский язык', () => {
      const vars = createVariablesFromSimpleMode({
        topic: 'Meditation',
        candleType: 'calm',
        language: 'en',
      });

      expect(vars.language).toBe('en');
      expect(vars.ctaSection).toContain('calm');
    });

    it('добавляет categoryName, если указано', () => {
      const vars = createVariablesFromSimpleMode({
        topic: 'Медитация',
        categoryName: 'FAQ',
      });

      expect(vars.categoryName).toBe('FAQ');
    });
  });

  describe('getVariableValue', () => {
    it('возвращает значение переменной', () => {
      const variables = { topic: 'медитация', language: 'ru' };
      const value = getVariableValue(variables, 'topic');

      expect(value).toBe('медитация');
    });

    it('возвращает пустую строку, если переменная не найдена', () => {
      const variables = { topic: 'медитация' };
      const value = getVariableValue(variables, 'language');

      expect(value).toBe('');
    });

    it('обрабатывает пустой объект переменных', () => {
      const value = getVariableValue({}, 'topic');

      expect(value).toBe('');
    });
  });
});

