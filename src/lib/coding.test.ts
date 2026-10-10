import { describe, expect, it } from 'vitest';
import { allChallenges, getChallengeBySlug } from './content';

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

describe('coding challenge integrity', () => {
	it('loads a healthy set of challenges', () => {
		expect(allChallenges.length).toBeGreaterThanOrEqual(10);
	});

	it('has globally unique ids and slugs', () => {
		const ids = allChallenges.map((c) => c.id);
		const slugs = allChallenges.map((c) => c.slug);
		expect(new Set(ids).size).toBe(ids.length);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it('uses clean kebab-case slugs that match lookup by slug', () => {
		for (const c of allChallenges) {
			expect(c.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
			expect(getChallengeBySlug(c.slug)?.id).toBe(c.id);
		}
	});

	it('never ships empty content fields', () => {
		for (const c of allChallenges) {
			expect(c.title.trim(), c.id).toBeTruthy();
			expect(c.description.trim(), c.id).toBeTruthy();
			expect(c.topic.trim(), c.id).toBeTruthy();
			expect(c.starterCode.includes('function'), `${c.id} starter`).toBe(true);
			expect(c.solution.trim(), c.id).toBeTruthy();
			for (const h of c.hints) expect(h.trim(), `${c.id} hint`).toBeTruthy();
		}
	});

	it('defines every tested function inside its official solution', () => {
		for (const c of allChallenges) {
			const fns = [...new Set(c.tests.map((t) => t.fn))];
			const variants = [c.solution, ...(c.solutions ?? []).map((v) => v.code)];
			for (const fn of fns) {
				expect(IDENTIFIER.test(fn), `${c.id} fn=${fn}`).toBe(true);
				expect(
					c.starterCode.includes(fn),
					`${c.id} starter should mention ${fn}`,
				).toBe(true);
				for (const code of variants) {
					expect(
						new RegExp(`(function\\s+${fn}\\b|${fn}\\s*=)`).test(code),
						`${c.id} solution defines ${fn}`,
					).toBe(true);
				}
			}
		}
	});

	it('uses JSON-safe, well-formed test cases', () => {
		for (const c of allChallenges) {
			expect(c.tests.length, c.id).toBeGreaterThanOrEqual(3);
			for (const t of c.tests) {
				expect(Array.isArray(t.args), `${c.id}`).toBe(true);
				const reserialized = JSON.parse(JSON.stringify({ args: t.args, expected: t.expected }));
				expect(reserialized.args).toEqual(t.args);
				expect(reserialized.expected).toEqual(t.expected);
			}
		}
	});

	it('includes at least one beginner-friendly entry point', () => {
		expect(allChallenges.some((c) => c.difficulty === 'beginner')).toBe(true);
	});

	it('keeps solution variants well-formed with unique approach labels', () => {
		for (const c of allChallenges) {
			const variants = c.solutions ?? [];
			const approaches = variants.map((v) => v.approach);
			expect(new Set(approaches).size, `${c.id} approaches`).toBe(approaches.length);
			for (const v of variants) {
				expect(v.approach.trim(), `${c.id} approach`).toBeTruthy();
				expect(v.code.trim(), `${c.id} [${v.approach}] code`).toBeTruthy();
			}
		}
	});

	it('marks exactly one recommended variant with usage notes per multi-solution challenge', () => {
		for (const c of allChallenges) {
			if (!c.solutions?.length) continue;
			expect(
				c.solutions.filter((v) => v.recommended),
				`${c.id} recommended`,
			).toHaveLength(1);
			for (const v of c.solutions) {
				expect(v.note?.trim(), `${c.id} [${v.approach}] note`).toBeTruthy();
			}
		}
	});

	it('passes every challenge test with each official solution variant', () => {
		for (const c of allChallenges) {
			const variants = [
				{ approach: 'Solution', code: c.solution },
				...(c.solutions ?? []),
			];
			for (const v of variants) {
				for (const t of c.tests) {
					const fn = new Function(`${v.code}; return ${t.fn};`)() as (
						...args: unknown[]
					) => unknown;
					expect(
						fn(...t.args),
						`${c.slug} [${v.approach}] ${t.fn}(${JSON.stringify(t.args)})`,
					).toEqual(t.expected);
				}
			}
		}
	});
});
