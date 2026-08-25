import { codeToHtml } from 'shiki';

/**
 * Highlight code at build time with dual light/dark themes.
 * Colors are emitted as CSS variables and switched by the `.dark` class —
 * see `.shiki span` rules in global.css.
 */
export async function highlight(code: string, lang = 'ts'): Promise<string> {
	return codeToHtml(code.trim(), {
		lang,
		themes: {
			light: 'github-light',
			dark: 'one-dark-pro',
		},
		defaultColor: false,
	});
}

export function normalizeLang(lang?: string): string {
	const aliases: Record<string, string> = {
		javascript: 'js',
		js: 'js',
		typescript: 'ts',
		ts: 'ts',
		jsx: 'jsx',
		tsx: 'tsx',
		html: 'html',
		css: 'css',
		json: 'json',
		bash: 'bash',
		sh: 'bash',
		shell: 'bash',
		sql: 'sql',
		text: 'txt',
		plaintext: 'txt',
	};
	if (!lang) return 'ts';
	return aliases[lang] ?? 'txt';
}
