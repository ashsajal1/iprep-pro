import { isChallengeSolved, markChallengeSolved } from '../lib/progress';

/* ------------------------------------------------------------------ */
/* Coding workspace: Monaco editor + sandboxed Web Worker runner       */
/* ------------------------------------------------------------------ */

interface EditorLike {
	getValue(): string;
	setValue(v: string): void;
}

interface CodingTest {
	fn: string;
	args: unknown[];
	expected: unknown;
}

const workspace = document.getElementById('workspace');
if (workspace) {
	const challengeId = (workspace as HTMLElement).dataset.challengeId!;
	const dataEl = document.querySelector('script[data-challenge-data]')!;
	const { starterCode, tests } = JSON.parse(dataEl.textContent!) as {
		starterCode: string;
		tests: CodingTest[];
	};

	const codeKey = `iprep.code.${challengeId}`;
	const RUN_TIMEOUT_MS = 4000;

	const mount = document.getElementById('editor-mount')!;
	const runBtn = document.getElementById('run-btn') as HTMLButtonElement;
	const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
	const scoreLine = document.getElementById('score-line')!;
	const banner = document.getElementById('run-banner')!;
	const resultsList = document.getElementById('test-results')!;
	const consoleWrap = document.getElementById('console-wrap')!;
	const consoleOutput = document.getElementById('console-output')!;
	const hintBtn = document.getElementById('hint-btn') as HTMLButtonElement;
	const hintsList = document.querySelectorAll<HTMLElement>('#hints-list > li');
	const hintCounter = document.getElementById('hint-counter');

	/* ---- editor ---------------------------------------------------------- */

	let monacoThemeObserver: MutationObserver | null = null;

	async function loadMonaco(): Promise<any | null> {
		const w = window as any;
		if (w.monaco) return w.monaco;
		await new Promise<void>((resolve) => {
			const s = document.createElement('script');
			s.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/loader.js';
			s.onload = () => resolve();
			s.onerror = () => resolve();
			document.head.appendChild(s);
			setTimeout(resolve, 8000); // don't hang forever on a slow CDN
		});
		const w2 = window as any;
		if (!w2.require) return null;

		return new Promise((resolve) => {
			w2.require.config({
				paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' },
			});
			w2.require(['vs/editor/editor.main'], () => resolve(w2.monaco ?? null), () =>
				resolve(null),
			);
			setTimeout(() => resolve(w2.monaco ?? null), 8000);
		});
	}

	function createTextareaEditor(initial: string): EditorLike {
		mount.innerHTML = '';
		const ta = document.createElement('textarea');
		ta.value = initial;
		ta.spellcheck = false;
		ta.className =
			'h-full w-full resize-none bg-zinc-50 p-4 font-mono text-[13px] leading-relaxed text-ink outline-none dark:bg-zinc-900';
		ta.setAttribute('aria-label', 'Code editor');
		ta.tabIndex = 0;
		mount.appendChild(ta);
		return {
			getValue: () => ta.value,
			setValue: (v: string) => {
				ta.value = v;
			},
		};
	}

	async function initEditor(): Promise<EditorLike> {
		const saved = localStorage.getItem(codeKey) ?? starterCode;
		const monaco = await loadMonaco();

		if (!monaco) return createTextareaEditor(saved);

		try {
			const editor = monaco.editor.create(mount, {
				value: saved,
				language: 'javascript',
				automaticLayout: true,
				minimap: { enabled: false },
				fontSize: 13,
				lineHeight: 22,
				tabSize: 2,
				scrollBeyondLastLine: false,
				renderLineHighlight: 'none',
				padding: { top: 14, bottom: 14 },
				fixedOverflowWidgets: true,
				theme: document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs',
			});

			monacoThemeObserver = new MutationObserver(() => {
				monaco.editor.setTheme(
					document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs',
				);
			});
			monacoThemeObserver.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ['class'],
			});

			return editor;
		} catch {
			// Any Monaco failure (CDN partial load, theme API changes…) degrades
			// gracefully to a plain textarea so challenges stay usable.
			console.warn('Monaco failed to initialize — falling back to textarea.');
			return createTextareaEditor(saved);
		}
	}

	/* ---- worker lifecycle ------------------------------------------------- */

	let worker: Worker | null = null;
	let workerSeq = 0;
	let currentRun = -1;
	let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
	let passCount = 0;

	function spawnWorker(): Worker {
		worker?.terminate();
		return new Worker('/coding-worker.js');
	}

	function stopRun(): void {
		if (timeoutHandle) clearTimeout(timeoutHandle);
		timeoutHandle = null;
		worker?.terminate(); // kills infinite loops
		worker = null;
		runBtn.disabled = false;
	}

	/* ---- rendering helpers ------------------------------------------------ */

	function showBanner(kind: 'success' | 'error' | 'info', html: string): void {
		banner.classList.remove('hidden', 'bg-emerald-50', 'text-emerald-700', 'dark:bg-emerald-950/50', 'dark:text-emerald-300', 'bg-rose-50', 'text-rose-700', 'dark:bg-rose-950/40', 'dark:text-rose-300', 'bg-indigo-50', 'text-indigo-700', 'dark:bg-indigo-950/40', 'dark:text-indigo-300');
		if (kind === 'success')
			banner.classList.add('bg-emerald-50', 'text-emerald-700', 'dark:bg-emerald-950/50', 'dark:text-emerald-300');
		else if (kind === 'error')
			banner.classList.add('bg-rose-50', 'text-rose-700', 'dark:bg-rose-950/40', 'dark:text-rose-300');
		else banner.classList.add('bg-indigo-50', 'text-indigo-700', 'dark:bg-indigo-950/40', 'dark:text-indigo-300');
		banner.innerHTML = html;
	}

	function resetOutputs(): void {
		resultsList.innerHTML = '';
		resultsList.classList.add('hidden');
		consoleWrap.classList.add('hidden');
		consoleOutput.textContent = '';
		scoreLine.textContent = '';
		scoreLine.classList.remove('text-emerald-600', 'dark:text-emerald-400', 'text-rose-600', 'dark:text-rose-400');
		banner.classList.add('hidden');
	}

	/** After a run finishes, make sure the results are on screen — the panel
	 * sits below the editor and can be out of view on short screens or when
	 * the user submitted from the keyboard mid-page. */
	function revealOutput(): void {
		const panel = document.getElementById('output-panel');
		if (!panel) return;
		panel.dataset.revealed = '1';
		const top = panel.getBoundingClientRect().top + window.scrollY - 84;
		window.scrollTo({ top: Math.max(top, 0), behavior: 'instant' as ScrollBehavior });
	}

	function appendTestRow(index: number, t: CodingTest, passed?: boolean, received?: string, expectedText?: string): void {
		let row = resultsList.querySelector<HTMLLIElement>(`[data-row="${index}"]`);
		if (!row) {
			row = document.createElement('li');
			row.dataset.row = String(index);
			row.className = 'flex items-start gap-3 px-4 py-2.5 text-sm';
			resultsList.appendChild(row);
			resultsList.classList.remove('hidden');
		}
		row.className = `flex items-start gap-3 px-4 py-2.5 text-sm ${
			passed == null
				? 'text-ink-muted'
				: passed
					? 'bg-emerald-50/60 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200'
					: 'bg-rose-50/60 text-rose-800 dark:bg-rose-950/20 dark:text-rose-200'
		}`;
		const call = `${t.fn}(${t.args.map((a) => JSON.stringify(a)).join(', ')})`;
		row.innerHTML = `
			<span class="mt-0.5 shrink-0 font-semibold ${passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}">
				${passed == null ? '…' : passed ? '✓' : '✗'}
			</span>
			<span class="min-w-0 flex-1 font-mono text-xs leading-relaxed">
				<span class="block truncate">${escapeHtml(call)}</span>
				${
					passed === false
						? `<span class="block mt-1">expected <b>${escapeHtml(expectedText ?? '')}</b> — received <b>${escapeHtml(received ?? '')}</b></span>`
						: ''
				}
			</span>`;
	}

	function escapeHtml(s: string): string {
		return s
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;');
	}

	function appendConsoleLine(text: string): void {
		consoleWrap.classList.remove('hidden');
		consoleOutput.textContent += `${text}\n`;
		consoleOutput.scrollTop = consoleOutput.scrollHeight;
	}

	/* ---- run flow ----------------------------------------------------------- */

	let editor: EditorLike | null = null;

	function setCode(v: string): void {
		editor?.setValue(v);
		localStorage.setItem(codeKey, v);
	}

	async function runTests(): Promise<void> {
		if (!editor || runBtn.disabled) return;
		const code = editor.getValue();
		localStorage.setItem(codeKey, code);

		resetOutputs();
		passCount = 0;
		runBtn.disabled = true;
		showBanner('info', 'Running your code…');

		// Fresh worker per run: no state leaks between runs.
		workerSeq += 1;
		currentRun = workerSeq;
		const id = currentRun;
		worker = spawnWorker();

		timeoutHandle = setTimeout(() => {
			stopRun();
			showBanner(
				'error',
				`⏱️ Timed out after ${RUN_TIMEOUT_MS / 1000}s — your code probably has an infinite loop. Check loop conditions and try again.`,
			);
			revealOutput();
		}, RUN_TIMEOUT_MS);

		worker.onmessage = (e: MessageEvent) => {
			const msg = e.data;
			if (msg.id !== currentRun) return;

			switch (msg.type) {
				case 'started':
					// Panel may be below the fold when submitting via keyboard.
					revealOutput();
					break;
				case 'log':
					appendConsoleLine(msg.text);
					break;
				case 'result':
					if (msg.passed) passCount++;
					appendTestRow(msg.index, tests[msg.index], msg.passed, msg.received, msg.expectedText);
					break;
				case 'done': {
					stopRun();
					scoreLine.textContent = `${passCount} / ${tests.length} passing`;

					if (passCount === tests.length && tests.length > 0) {
						const first = markChallengeSolved(challengeId);
						scoreLine.classList.add('text-emerald-600', 'dark:text-emerald-400');
						showBanner(
							'success',
							first
								? `🎉 All ${tests.length} tests passing — challenge solved!${nextSlugHref ? ` <a href="${nextSlugHref}" class="underline underline-offset-2 ml-1">Next challenge →</a>` : ''}`
								: `All ${tests.length} tests still passing ✓`,
						);
					} else {
						scoreLine.classList.add('text-rose-600', 'dark:text-rose-400');
						showBanner('error', `${tests.length - passCount} of ${tests.length} tests failing. Read the ✗ rows below and iterate.`);
					}
					revealOutput();
					break;
				}
				case 'error': {
					stopRun();
					resetOutputs();
					const stageText =
						msg.stage === 'compile'
							? 'Syntax error'
							: msg.stage === 'missing'
								? 'Function not found'
								: 'Runtime error';
					showBanner(
						'error',
						`<b>${stageText}:</b> ${escapeHtml(msg.message)}${
							msg.stage === 'compile' ? '<span class="block mt-1 font-normal">Check for missing brackets, quotes or semicolons.</span>' : ''
						}`,
					);
					revealOutput();
					break;
				}
			}
		};

		worker.onerror = (e) => {
			stopRun();
			showBanner('error', `<b>Worker error:</b> ${escapeHtml(e.message || 'Something went wrong while running your code.')}`);
		};

		worker.postMessage({ type: 'run', id, code, tests });
	}

	const nextSlugHref = workspace.dataset.nextSlug ?? '';

	/* ---- wiring ------------------------------------------------------------ */

	hintBtn.addEventListener('click', () => {
		const nextHint = [...hintsList].find((h) => h.classList.contains('hidden'));
		nextHint?.classList.remove('hidden');
		nextHint?.classList.add('animate-fade-in');
		const shown = [...hintsList].filter((h) => !h.classList.contains('hidden')).length;
		if (hintCounter) hintCounter.textContent = `${shown} / ${hintsList.length}`;
		if (shown >= hintsList.length) hintBtn.disabled = true;
	});

	resetBtn.addEventListener('click', () => {
		setCode(starterCode);
		resetOutputs();
		showBanner('info', 'Editor reset to the starter code.');
	});

	document.addEventListener('keydown', (e) => {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			runTests();
		}
	});

	/* ---- boot -------------------------------------------------------------- */

	runBtn.disabled = true; // until editor ready
	initEditor().then((ed) => {
		editor = ed;
		runBtn.disabled = false;
	});

	runBtn.addEventListener('click', runTests);

	// Solved badge + test hooks
	if (isChallengeSolved(challengeId)) {
		scoreLine.textContent = 'Solved ✓';
		scoreLine.classList.add('text-emerald-600', 'dark:text-emerald-400');
		document.querySelector('[data-solved-marker]')?.removeAttribute('hidden');
	}

	(window as any).__iprep = {
		setCode,
		getCode: () => editor?.getValue() ?? '',
		run: runTests,
	};
}