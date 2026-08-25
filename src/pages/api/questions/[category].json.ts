import type { APIRoute } from 'astro';
import { allQuestions, categories, getQuestionsByCategory } from '../../../lib/content';
import { highlight, normalizeLang } from '../../../lib/highlight';
import type { Question } from '../../../lib/types';

export const getStaticPaths = () => [
	...categories.map((c) => ({ params: { category: c.id } })),
	{ params: { category: 'all' } },
];

/**
 * Full question content for a category (or every category) — consumed by the
 * practice runner. Code examples are pre-highlighted with Shiki at build time
 * so the client only ever injects ready-made HTML.
 */
export const GET: APIRoute = async ({ params }) => {
	const categoryId = params.category ?? '';
	const source =
		categoryId === 'all' ? allQuestions : getQuestionsByCategory(categoryId);

	const questions = await Promise.all(
		source.map(async (q: Question) => ({
			...q,
			exampleHtml: q.example
				? await highlight(q.example, normalizeLang(q.exampleLanguage))
				: undefined,
		})),
	);

	return new Response(JSON.stringify({ category: categoryId, questions }), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
};
