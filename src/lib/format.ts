/**
 * Minimal inline-markdown renderer for question content.
 *
 * Question copy uses `code` spans (CLI commands, flags, paths) and
 * occasionally **bold**. Both the static pages and the client-side runners
 * inject this copy as HTML, so raw backticks would otherwise show literally
 * (see practice-page report: `` `docker run …` `` rendered as plain text).
 *
 * `renderInline` escapes HTML first, then converts code spans and bold to
 * styled elements. Bold is applied only outside code spans so
 * `` `a **b**` `` keeps its literal asterisks.
 */

const CODE_CLASS =
	'rounded-md border border-line bg-surface-raised px-1.5 py-0.5 font-mono text-[0.85em] font-medium break-words text-ink';

export function escapeHtml(s: string): string {
	return s
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

function renderBold(s: string): string {
	return s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

/** Escape `text` and render inline `code` + **bold** as HTML. */
export function renderInline(text: string): string {
	const parts = text.split('`');
	let out = '';
	for (let i = 0; i < parts.length; i++) {
		if (i % 2 === 1) {
			// Inside backticks → code span (no bold processing).
			// A lone trailing backtick leaves parts even-length; treat the
			// remainder as plain text instead of swallowing it into code.
			if (i === parts.length - 1) {
				out += '`' + renderBold(escapeHtml(parts[i]));
			} else {
				out += `<code class="${CODE_CLASS}">${escapeHtml(parts[i])}</code>`;
			}
		} else {
			out += renderBold(escapeHtml(parts[i]));
		}
	}
	return out;
}
