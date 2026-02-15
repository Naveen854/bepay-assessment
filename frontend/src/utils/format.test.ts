import { formatDate, formatCurrency } from './format';
import { describe, it, expect } from 'vitest';

describe('format utils', () => {
    describe('formatDate', () => {
        it('should format date correctly', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            // Depending on timezone, might vary, but let's assume UTC or check rough format
            const formatted = formatDate(date);
            expect(formatted).toMatch(/Jan 1, 2023/);
        });

        it('should handle string input', () => {
            expect(formatDate('2023-05-15')).toMatch(/May 15, 2023/);
        });

        it('should return empty string for null/undefined', () => {
            expect(formatDate(null as any)).toBe('');
        });
    });

    describe('formatCurrency', () => {
        it('should format USD by default', () => {
            expect(formatCurrency(100)).toBe('$100.00');
        });

        it('should format EUR', () => {
            // Note: in node/jsdom environment, locale might vary, but en-US usually renders ‚Ç¼100.00 or similar
            const result = formatCurrency(100, 'EUR');
            expect(result).toMatch(/100\.00/);
            expect(result).toContain('€');
        });

        it('should handle decimals', () => {
            expect(formatCurrency(10.5)).toBe('$10.50');
        });
    });
});
