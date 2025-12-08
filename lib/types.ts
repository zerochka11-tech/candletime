/**
 * Централизованные типы для проекта CandleTime
 */

export type CandleTypeId = 'calm' | 'support' | 'memory' | 'gratitude' | 'focus';

export type CandleStatus = 'active' | 'expired' | 'extinguished';

export interface Candle {
  id: string;
  title: string;
  message: string | null;
  created_at: string;
  expires_at: string;
  status: string;
  candle_type: CandleTypeId | null;
  is_anonymous?: boolean;
  user_id?: string;
}

export interface CandleType {
  id: CandleTypeId;
  label: string;
  emoji: string;
}

export interface CandleTypeStyle {
  label: string;
  emoji: string;
  cardBg: string;
  chipBg: string;
  chipText: string;
}

export interface UserInfo {
  email: string | null;
  id?: string | null;
  createdAt?: string | null;
}

export interface UserStats {
  totalCandles: number;
  activeCandles: number;
  candlesLast30Days: number;
}

export interface HomePageStats {
  activeCount: number;
  todayCount: number;
  popularType: {
    id: CandleTypeId | null;
    count: number;
  };
}


