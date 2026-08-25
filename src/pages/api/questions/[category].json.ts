import type { APIRoute } from 'astro';
import { allQuestions, categories, getQuestionsByCategory } from '../../../lib/content';

export const getStaticPaths = () => [
	...categories.map((c) => ({ params: { category: c.id } })),
	{ params: { category: 'all' } },
];

/** Full question content for a category (or every category) — consumed by the practice runner. */
export const GET: APIRoute = ({ params }) => {
	const categoryId = params.category ?? '';
	const questions =
		categoryId === 'all' ? allQuestions : getQuestionsByCategory(categoryId);

	return new Response(JSON.stringify({ category: categoryId, questions }), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
};
