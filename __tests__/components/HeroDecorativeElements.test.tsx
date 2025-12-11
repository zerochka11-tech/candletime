/**
 * Unit тесты для декоративных элементов HERO блока
 */

import {
  countStarsInRange,
  getTotalStarCount,
  countCloudsInRange,
  getTotalCloudCount,
  countSymbolsInRange,
  getTotalSymbolCount,
  countGoldenElementsInRange,
  getTotalGoldenElementCount,
  getTotalDecorativeElementCount,
  isValidPosition,
  isValidZIndex,
} from '@/lib/decorativeElements';

describe('HeroDecorativeElements', () => {
  describe('countStarsInRange', () => {
    it('подсчитывает звезды в верхней части (0-20%)', () => {
      expect(countStarsInRange(0, 20)).toBe(15);
    });

    it('подсчитывает звезды в верхней-средней части (20-40%)', () => {
      expect(countStarsInRange(20, 40)).toBe(20);
    });

    it('подсчитывает звезды в средней части (40-60%)', () => {
      expect(countStarsInRange(40, 60)).toBe(24);
    });

    it('подсчитывает звезды в нижней-средней части (60-80%)', () => {
      expect(countStarsInRange(60, 80)).toBe(20);
    });

    it('подсчитывает звезды в нижней части (80-100%)', () => {
      expect(countStarsInRange(80, 100)).toBe(15);
    });

    it('возвращает 0 для диапазона вне допустимых зон', () => {
      expect(countStarsInRange(101, 200)).toBe(0);
    });
  });

  describe('getTotalStarCount', () => {
    it('подсчитывает общее количество звезд', () => {
      const total = getTotalStarCount();
      expect(total).toBe(94);
    });

    it('сумма всех диапазонов равна общему количеству', () => {
      const sum =
        countStarsInRange(0, 20) +
        countStarsInRange(20, 40) +
        countStarsInRange(40, 60) +
        countStarsInRange(60, 80) +
        countStarsInRange(80, 100);
      expect(sum).toBe(getTotalStarCount());
    });
  });

  describe('countCloudsInRange', () => {
    it('подсчитывает облака в верхней части (0-25%)', () => {
      expect(countCloudsInRange(0, 25)).toBe(8);
    });

    it('подсчитывает облака в средней части (25-75%)', () => {
      expect(countCloudsInRange(25, 75)).toBe(7);
    });

    it('подсчитывает облака в нижней части (75-100%)', () => {
      expect(countCloudsInRange(75, 100)).toBe(6);
    });

    it('возвращает 0 для диапазона вне допустимых зон', () => {
      expect(countCloudsInRange(101, 200)).toBe(0);
    });
  });

  describe('getTotalCloudCount', () => {
    it('подсчитывает общее количество облаков', () => {
      const total = getTotalCloudCount();
      expect(total).toBe(21);
    });

    it('сумма всех диапазонов равна общему количеству', () => {
      const sum =
        countCloudsInRange(0, 25) +
        countCloudsInRange(25, 75) +
        countCloudsInRange(75, 100);
      expect(sum).toBe(getTotalCloudCount());
    });
  });

  describe('countSymbolsInRange', () => {
    it('подсчитывает символы в верхней части (0-25%)', () => {
      expect(countSymbolsInRange(0, 25)).toBe(9);
    });

    it('подсчитывает символы в средней части (25-75%)', () => {
      expect(countSymbolsInRange(25, 75)).toBe(4);
    });

    it('подсчитывает символы в нижней части (75-100%)', () => {
      expect(countSymbolsInRange(75, 100)).toBe(4);
    });

    it('возвращает 0 для диапазона вне допустимых зон', () => {
      expect(countSymbolsInRange(101, 200)).toBe(0);
    });
  });

  describe('getTotalSymbolCount', () => {
    it('подсчитывает общее количество символов', () => {
      const total = getTotalSymbolCount();
      expect(total).toBe(17);
    });

    it('сумма всех диапазонов равна общему количеству', () => {
      const sum =
        countSymbolsInRange(0, 25) +
        countSymbolsInRange(25, 75) +
        countSymbolsInRange(75, 100);
      expect(sum).toBe(getTotalSymbolCount());
    });
  });

  describe('countGoldenElementsInRange', () => {
    it('подсчитывает золотые элементы в верхней части (0-25%)', () => {
      expect(countGoldenElementsInRange(0, 25)).toBe(9);
    });

    it('подсчитывает золотые элементы в средней части (25-75%)', () => {
      expect(countGoldenElementsInRange(25, 75)).toBe(7);
    });

    it('подсчитывает золотые элементы в нижней части (75-100%)', () => {
      expect(countGoldenElementsInRange(75, 100)).toBe(9);
    });

    it('возвращает 0 для диапазона вне допустимых зон', () => {
      expect(countGoldenElementsInRange(101, 200)).toBe(0);
    });
  });

  describe('getTotalGoldenElementCount', () => {
    it('подсчитывает общее количество золотых элементов', () => {
      const total = getTotalGoldenElementCount();
      expect(total).toBe(25);
    });

    it('сумма всех диапазонов равна общему количеству', () => {
      const sum =
        countGoldenElementsInRange(0, 25) +
        countGoldenElementsInRange(25, 75) +
        countGoldenElementsInRange(75, 100);
      expect(sum).toBe(getTotalGoldenElementCount());
    });
  });

  describe('getTotalDecorativeElementCount', () => {
    it('подсчитывает общее количество всех декоративных элементов', () => {
      const total = getTotalDecorativeElementCount();
      expect(total).toBe(157);
    });

    it('сумма всех типов элементов равна общему количеству', () => {
      const sum =
        getTotalStarCount() +
        getTotalCloudCount() +
        getTotalSymbolCount() +
        getTotalGoldenElementCount();
      expect(sum).toBe(getTotalDecorativeElementCount());
    });
  });

  describe('isValidPosition', () => {
    it('возвращает true для позиции в допустимом диапазоне', () => {
      expect(isValidPosition(0)).toBe(true);
      expect(isValidPosition(50)).toBe(true);
      expect(isValidPosition(100)).toBe(true);
    });

    it('возвращает false для позиции вне допустимого диапазона', () => {
      expect(isValidPosition(-1)).toBe(false);
      expect(isValidPosition(101)).toBe(false);
      expect(isValidPosition(200)).toBe(false);
    });
  });

  describe('isValidZIndex', () => {
    it('возвращает true, если декоративные элементы за контентом', () => {
      expect(isValidZIndex(0, 10)).toBe(true);
      expect(isValidZIndex(1, 10)).toBe(true);
      expect(isValidZIndex(5, 10)).toBe(true);
    });

    it('возвращает false, если декоративные элементы перекрывают контент', () => {
      expect(isValidZIndex(10, 10)).toBe(false);
      expect(isValidZIndex(10, 0)).toBe(false);
      expect(isValidZIndex(15, 10)).toBe(false);
    });
  });
});

