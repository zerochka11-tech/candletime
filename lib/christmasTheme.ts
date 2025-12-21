import { supabase } from './supabaseClient';

/**
 * Проверяет, включена ли рождественская тема на сайте
 * @returns Promise<boolean> - true, если тема включена
 */
export async function isChristmasThemeEnabled(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'christmas_theme_enabled')
      .single();

    if (error || !data) {
      console.error('[ChristmasTheme] Error loading theme setting:', error);
      return false;
    }

    // value хранится как JSONB, может быть строкой "true"/"false" или boolean
    const value = data.value;
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value === 'true' || value === '"true"';
    }
    // JSONB может вернуть объект, проверяем его значение
    if (value && typeof value === 'object') {
      // Если это объект с булевым значением
      if ('value' in value) {
        return value.value === true || value.value === 'true';
      }
      // Если это просто булево значение в объекте
      return value === true;
    }

    return false;
  } catch (error) {
    console.error('[ChristmasTheme] Error checking theme:', error);
    return false;
  }
}

/**
 * Устанавливает состояние рождественской темы (только для администраторов)
 * @param enabled - включить или выключить тему
 * @returns Promise<boolean> - true, если успешно
 */
export async function setChristmasThemeEnabled(enabled: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        {
          key: 'christmas_theme_enabled',
          value: enabled,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'key',
        }
      );

    if (error) {
      console.error('[ChristmasTheme] Error updating theme setting:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[ChristmasTheme] Error setting theme:', error);
    return false;
  }
}

