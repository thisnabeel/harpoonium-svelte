import { writable } from 'svelte/store';

export const activeButton = writable(null); // 'filter' | 'explore' | null

export const showFilter = writable(false);
export const showExplore = writable(false);

// Update the active button and corresponding views
export function setActiveButton(button) {
	if (button === null) {
		activeButton.set(null);
		showFilter.set(false);
		showExplore.set(false);
		return;
	}

	activeButton.set(button);
	showFilter.set(button === 'filter');
	showExplore.set(button === 'explore');
}
