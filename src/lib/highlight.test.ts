import { describe, expect, it } from 'vitest';
import { normalizeLang } from './highlight';

describe('normalizeLang', () => {
	it('maps common aliases', () => {
		expect(normalizeLang('javascript')).toBe('js');
		expect(normalizeLang('typescript')).toBe('ts');
		expect(normalizeLang('shell')).toBe('bash');
		expect(normalizeLang('sh')).toBe('bash');
	});

	it('passes through supported values', () => {
		for (const lang of ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'sql']) {
			expect(normalizeLang(lang)).toBe(lang);
		}
	});

	it('falls back safely for unknown or missing languages', () => {
		expect(normalizeLang('brainfuck')).toBe('txt');
		expect(normalizeLang(undefined)).toBe('ts');
		expect(normalizeLang('')).toBe('ts');
	});
});
