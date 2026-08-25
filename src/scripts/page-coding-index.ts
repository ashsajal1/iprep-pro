import { isChallengeSolved, onProgressChange } from '../lib/progress';

function paint(): void {
	document.querySelectorAll<HTMLElement>('[data-challenge-card]').forEach((card) => {
		const id = card.dataset.challengeCard!;
		const badge = card.querySelector<HTMLElement>('[data-solved-badge]');
		if (!badge) return;
		badge.classList.toggle('hidden', !isChallengeSolved(id));
	});
}

paint();
onProgressChange(paint);