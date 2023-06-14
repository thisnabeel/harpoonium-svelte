import { readable, writable } from 'svelte/store';

// export const api = readable('http://localhost:3000');
// export const api = readable('https://www.harpoonium.com');

export const selectedChapter = writable(null);

export const selectChapter = (item) => {
	selectedChapter.set(item);
};
