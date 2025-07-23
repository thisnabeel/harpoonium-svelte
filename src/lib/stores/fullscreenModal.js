import { writable } from 'svelte/store';

export const fullscreenModal = writable({
	isOpen: false,
	cardSet: null,
	title: '',
	bookData: null, // New field to store the full book data with current and siblings
	currentChapter: null
});

export const openFullscreenModal = (
	cardSet,
	title = '',
	bookData = null,
	currentChapter = null
) => {
	console.log('openFullscreenModal called with:', { cardSet, title, bookData, currentChapter });
	fullscreenModal.set({
		isOpen: true,
		cardSet,
		title,
		bookData,
		currentChapter
	});
	console.log('Store updated');
};

export const closeFullscreenModal = () => {
	console.log('closeFullscreenModal called');
	fullscreenModal.set({
		isOpen: false,
		cardSet: null,
		title: '',
		bookData: null,
		currentChapter: null
	});
};
