import { writable } from 'svelte/store';
import Api from '$lib/api/api';

export const subscribedBooks = writable([]);
export const allBooks = writable([]);
export const isLoadingSubscribed = writable(false);
export const isSubscribing = writable(false);
export const subscribedTweets = writable([]);
export const isLoadingTweets = writable(false);

export async function fetchSubscribedTweets(userId) {
	if (!userId) return;

	isLoadingTweets.set(true);
	try {
		const tweets = await Api.get(`/classic_books/${userId}/subscribed_tweets`);
		subscribedTweets.set(tweets);
	} catch (error) {
		console.error('Failed to fetch subscribed tweets:', error);
		subscribedTweets.set([]);
	}
	isLoadingTweets.set(false);
}

export async function fetchSubscribedBooks(userId) {
	if (!userId) return;

	isLoadingSubscribed.set(true);
	try {
		const books = await Api.get(`/classic_books/${userId}/subscribed`);
		subscribedBooks.set(books);
	} catch (error) {
		console.error('Failed to fetch subscribed books:', error);
		subscribedBooks.set([]);
	}
	isLoadingSubscribed.set(false);
}

export async function fetchAllBooks() {
	try {
		const books = await Api.get('/classic_books');
		allBooks.set(books);
	} catch (error) {
		console.error('Failed to fetch all books:', error);
		allBooks.set([]);
	}
}

export async function handleSubscribe(book, userId) {
	if (!userId) return;

	isSubscribing.set(true);
	try {
		const response = await Api.post(`/classic_books/${book.id}/subscribe/${userId}`);
		subscribedBooks.update((books) => [...books, response.book]);
		allBooks.update((books) => books.filter((b) => b.id !== book.id));
		await fetchSubscribedTweets(userId);
	} catch (error) {
		console.error('Failed to subscribe to book:', error);
	}
	isSubscribing.set(false);
}

export async function handleUnsubscribe(book, userId) {
	if (!userId) return;

	isSubscribing.set(true);
	try {
		await Api.delete(`/classic_books/${book.id}/unsubscribe/${userId}`);
		subscribedBooks.update((books) => books.filter((b) => b.id !== book.id));
		allBooks.update((books) => [...books, book]);
		await fetchSubscribedTweets(userId);
	} catch (error) {
		console.error('Failed to unsubscribe from book:', error);
	}
	isSubscribing.set(false);
}
