import { writable } from 'svelte/store';

export const fullscreenModal = writable({
	isOpen: false,
	cardSet: null,
	title: ''
});

export const openFullscreenModal = (cardSet, title = '') => {
	fullscreenModal.set({
		isOpen: true,
		cardSet,
		title
	});
};

export const closeFullscreenModal = () => {
	fullscreenModal.set({
		isOpen: false,
		cardSet: null,
		title: ''
	});
};
