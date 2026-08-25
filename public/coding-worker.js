/**
 * iPrep Pro — coding challenge runner (Web Worker).
 *
 * Runs untrusted user code off the main thread:
 *  1. Compiles it with new Function (syntax errors surface immediately).
 *  2. Calls each test's function with JSON-safe args.
 *  3. Deep-compares the result against the expected value.
 *  4. Streams console.log output back to the page.
 *
 * Infinite loops are handled on the page side by terminating this worker
 * after a timeout and respawning a fresh one.
 */

'use strict';

/* ---- deep equality (JSON-safe values + NaN) --------------------------- */

function deepEqual(a, b) {
	if (Object.is(a, b)) return true;
	if (typeof a !== typeof b) return false;
	if (a === null || b === null || typeof a !== 'object') return false;

	if (Array.isArray(a) || Array.isArray(b)) {
		if (!Array.isArray(a) || !Array.isArray(b)) return false;
		if (a.length !== b.length) return false;
		return a.every((item, i) => deepEqual(item, b[i]));
	}

	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);
	if (aKeys.length !== bKeys.length) return false;
	return aKeys.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
}

/* ---- value formatting for messages ------------------------------------- */

function formatValue(value) {
	try {
		if (typeof value === 'string') return JSON.stringify(value);
		if (value === undefined) return 'undefined';
		if (typeof value === 'function') return '[function]';
		if (value instanceof Error) return `${value.name}: ${value.message}`;
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

/* ---- message handling --------------------------------------------------- */

self.onmessage = (event) => {
	const { type, id, code, tests } = event.data ?? {};
	if (type !== 'run') return;

	/** Stream a console line back to the page. */
	const log = (...parts) => {
		self.postMessage({
			type: 'log',
			id,
			text: parts.map((p) => (typeof p === 'string' ? p : formatValue(p))).join(' '),
		});
	};

	// Give user code a console that streams to the editor output panel.
	self.console = { ...self.console, log, info: log, warn: log, error: log };

	// Function names under test, derived from the challenge definition.
	const fnNames = [...new Set(tests.map((t) => t.fn))];

	let factory;
	try {
		// User code first so error line numbers match their editor (line 1 = line 1).
		factory = new Function(
			`${code}\n;return {${fnNames
				.map((n) => `${/^[A-Za-z_$][\w$]*$/.test(n) ? n : JSON.stringify(n)}: typeof ${n} === 'function' ? ${n} : undefined`)
				.join(',')}};`,
		);
	} catch (err) {
		self.postMessage({ type: 'error', id, stage: 'compile', message: err.message });
		return;
	}

	let fns;
	try {
		fns = factory();
	} catch (err) {
		self.postMessage({
			type: 'error',
			id,
			stage: 'runtime',
			message: `${err.name ?? 'Error'}: ${err.message}`,
		});
		return;
	}

	const missing = fnNames.filter((n) => typeof fns?.[n] !== 'function');
	if (missing.length > 0) {
		self.postMessage({
			type: 'error',
			id,
			stage: 'missing',
			message: `Define ${missing.map((n) => `"${n}()"`).join(', ')} — ${missing.length === 1 ? 'it' : 'they'} were not found in your code.`,
		});
		return;
	}

	self.postMessage({ type: 'started', id });

	(async () => {
		for (let i = 0; i < tests.length; i++) {
			const t = tests[i];
			try {
				const result = await fns[t.fn](...t.args);
				const passed = deepEqual(result, t.expected);
				self.postMessage({
					type: 'result',
					id,
					index: i,
					passed,
					received: passed ? undefined : formatValue(result),
					expectedText: formatValue(t.expected),
				});
			} catch (err) {
				self.postMessage({
					type: 'result',
					id,
					index: i,
					passed: false,
					received: `${err.name ?? 'Error'}: ${err.message}`,
					expectedText: formatValue(t.expected),
				});
			}
		}
		self.postMessage({ type: 'done', id });
	})();
};
