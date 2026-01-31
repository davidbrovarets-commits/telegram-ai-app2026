
import { describe, it, expect } from 'vitest';
import { generateFileName } from './imageUtils';

describe('imageUtils', () => {
    it('generateFileName should return a string with timestamp', () => {
        const name = generateFileName('test');
        expect(name).toContain('test');
        expect(name).toContain('.jpg');
    });
});
