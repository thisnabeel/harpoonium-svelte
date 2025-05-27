import { readable, writable } from 'svelte/store';

// export const api = readable('http://localhost:3000');
// export const api = readable('https://www.harpoonium.com');

export const chapters = writable([]);
export const chaptersMap = writable([]);

export const wonders = writable([]);
export const wondersMap = writable([]);
export const popularWonders = writable([]);

export const mapShown = writable(false);

export const selectedChapter = writable(null);
export const selectedWonder = writable(null);

export const selectedFeel = writable(null);

export const selectChapter = (item) => {
	selectedChapter.set(item);
	selectedFeel.set(item.feel);
	selectedWonder.set(null);
};

export const selectWonder = (item) => {
	selectedWonder.set(item);
	selectedChapter.set(null);
};

export const goHome = () => {
	selectedWonder.set(null);
	selectedChapter.set(null);
};

export const signIn = () => {
	selectedWonder.set(null);
	selectedChapter.set(null);
};

export const theme = writable('dark');
