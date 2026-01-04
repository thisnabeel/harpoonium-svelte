import { writable } from 'svelte/store';

export const fullscreenModal = writable({
	isOpen: false,
	cardSet: null,
	title: '',
	bookData: null, // New field to store the full book data with current and siblings
	currentChapter: null,
	initialCardIndex: null, // Optional initial card index to start at
	bookId: null // Root book/chapter ID for loading cursor
});

export const openFullscreenModal = (
	cardSet,
	title = '',
	bookData = null,
	currentChapter = null,
	initialCardIndex = null,
	bookId = null
) => {
	console.log('openFullscreenModal called with:', { cardSet, title, bookData, currentChapter, initialCardIndex, bookId });
	fullscreenModal.set({
		isOpen: true,
		cardSet,
		title,
		bookData,
		currentChapter,
		initialCardIndex,
		bookId
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
		currentChapter: null,
		initialCardIndex: null,
		bookId: null
	});
};
