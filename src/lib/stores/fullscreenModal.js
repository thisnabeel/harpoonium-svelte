import { writable } from 'svelte/store';

export const fullscreenModal = writable({
	isOpen: false,
	cardSet: null,
	title: ''
});

export const openFullscreenModal = (cardSet, title = '') => {
	console.log('openFullscreenModal called with:', { cardSet, title });
	fullscreenModal.set({
		isOpen: true,
		cardSet,
		title
	});
	console.log('Store updated');
};

export const closeFullscreenModal = () => {
	console.log('closeFullscreenModal called');
	fullscreenModal.set({
		isOpen: false,
		cardSet: null,
		title: ''
	});
};
