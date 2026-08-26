import { setAssessment, getAssessment, onProgressChange } from '../lib/progress';

const qid = document.querySelector<HTMLElement>('[data-question-page]')?.dataset.qid;
if (qid) {
	const questionId: string = qid;
	const revealBtn = document.getElementById('reveal-btn') as HTMLButtonElement | null;
	const answerSection = document.getElementById('answer-section');
	const thinkArea = document.getElementById('think-area');
	const assessActions = document.getElementById('assess-actions');
	const knowBtn = document.getElementById('know-btn');
	const reviewBtn = document.getElementById('review-btn');
	const feedback = document.getElementById('assessment-feedback');
	const statusPill = document.getElementById('status-pill');

	function reveal() {
		if (!answerSection) return;
		answerSection.hidden = false;
		answerSection.classList.add('animate-fade-in');
		thinkArea?.classList.add('hidden');
		revealBtn?.classList.add('hidden');
		assessActions?.classList.remove('hidden');
		assessActions?.classList.add('flex');
		// scroll the answer into view comfortably
		setTimeout(() => answerSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
	}

	function paintStatus() {
		const status = getAssessment(questionId);
		if (!statusPill) return;
		statusPill.className =
			'mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium';
		if (status === 'known') {
			statusPill.classList.add('bg-emerald-100', 'text-emerald-700', 'dark:bg-emerald-950/60', 'dark:text-emerald-400');
			statusPill.textContent = '✓ Completed — you know this';
		} else if (status === 'review') {
			statusPill.classList.add('bg-amber-100', 'text-amber-700', 'dark:bg-amber-950/60', 'dark:text-amber-400');
			statusPill.textContent = '↻ Marked for review';
		} else {
			statusPill.classList.add('bg-surface-raised', 'text-[color:var(--ink-secondary)]');
			statusPill.textContent = 'Not practiced yet';
		}
	}

	function showFeedback(kind: 'known' | 'review') {
		if (!feedback) return;
		feedback.classList.remove(
			'hidden',
			'bg-emerald-50', 'text-emerald-700', 'dark:bg-emerald-950/40', 'dark:text-emerald-400',
			'bg-amber-50', 'text-amber-700', 'dark:bg-amber-950/40', 'dark:text-amber-400',
		);
		if (kind === 'known') {
			feedback.classList.add('bg-emerald-50', 'text-emerald-700', 'dark:bg-emerald-950/40', 'dark:text-emerald-400');
			feedback.textContent = 'Nice — marked as completed. Keep the streak going!';
		} else {
			feedback.classList.add('bg-amber-50', 'text-amber-700', 'dark:bg-amber-950/40', 'dark:text-amber-400');
			feedback.textContent = 'Added to your review list. Revisit it after a break — spaced repetition works.';
		}
	}

	revealBtn?.addEventListener('click', reveal);

	knowBtn?.addEventListener('click', () => {
		setAssessment(questionId, 'known');
		showFeedback('known');
		paintStatus();
	});

	reviewBtn?.addEventListener('click', () => {
		setAssessment(questionId, 'review');
		showFeedback('review');
		paintStatus();
	});

	onProgressChange(paintStatus);
}
