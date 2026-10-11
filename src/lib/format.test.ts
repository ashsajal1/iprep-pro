import { describe, expect, it } from 'vitest';
import { escapeHtml, renderInline } from './format';

describe('escapeHtml', () => {
	it('escapes markup characters', () => {
		expect(escapeHtml('<b>"a" & \'b\'</b>')).toBe('&lt;b&gt;&quot;a&quot; &amp; \'b\'&lt;/b&gt;');
	});
});

describe('renderInline', () => {
	it('renders backtick spans as code elements', () => {
		const html = renderInline('Run `docker ps -a` to list all.');
		expect(html).toContain('<code class="');
		expect(html).toContain('docker ps -a');
		expect(html).not.toContain('`');
		expect(html.startsWith('Run ')).toBe(true);
	});

	it('renders multiple code spans', () => {
		const html = renderInline('`-p` vs `-P` vs `EXPOSE`');
		expect(html.match(/<code/g)?.length).toBe(3);
	});

	it('escapes HTML inside and outside code spans', () => {
		const html = renderInline('Use `<b>x</b>` and <i>y</i>.');
		expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
		expect(html).toContain('&lt;i&gt;y&lt;/i&gt;');
		expect(html).not.toContain('<b>');
		expect(html).not.toContain('<i>');
	});

	it('renders **bold** outside code spans', () => {
		const html = renderInline('This is **important** and `**literal**`.');
		expect(html).toContain('<strong>important</strong>');
		expect(html).toContain('<code class="');
		expect(html).toContain('**literal**');
	});

	it('leaves a lone trailing backtick as plain text', () => {
		const html = renderInline('weird ` typo');
		expect(html).toContain('`');
		expect(html).not.toContain('<code');
	});

	it('passes plain text through escaped', () => {
		expect(renderInline('Just words.')).toBe('Just words.');
	});
});
