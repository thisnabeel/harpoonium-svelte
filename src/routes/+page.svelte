<script>
	import Home from '$lib/pages/Home/Home.svelte';

	import Api from '$lib/api/api.js';
	import { popularWonders } from '$lib/stores/main.js';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { user } from '$lib/stores/user';
	import {
		subscribedBooks,
		subscribedTweets,
		isLoadingTweets,
		fetchSubscribedBooks,
		fetchSubscribedTweets
	} from '$lib/stores/books';
	import Quiz from '$lib/components/Chapters/Tabs/Quiz/Quiz.svelte';
	import TweetList from '$lib/components/Classics/TweetList.svelte';
	import BookScroller from '$lib/components/Classics/BookScroller.svelte';
	import TweetComposer from '$lib/components/Classics/TweetComposer.svelte';
	import BookCard from '$lib/components/Classics/BookCard.svelte';
	import { showFilter, showExplore } from '$lib/stores/header';
	import Header from '$lib/components/Header/Header.svelte';

	const fetchPopularWonders = async () => {
		const response = await Api.get('/museum.json');
		let json = response;
		popularWonders.set(json);
	};

	let quizzes = [];
	const fetchQuestions = async () => {
		quizzes = await Api.get('/quizzes.json');
	};

	let selectedBook = null;
	let allBooks = [];
	let isLoadingSubscribed = false;
	let isSubscribing = false;

	async function fetchInitialData() {
		if (!$user) return;
		await Promise.all([fetchSubscribedBooks($user.id), fetchSubscribedTweets($user.id)]);
	}

	function handleBookSelect(event) {
		selectedBook = event.detail;
	}

	async function handleSubscribe(book) {
		if (!$user || isSubscribing) return;

		isSubscribing = true;
		try {
			const response = await Api.post(`/classic_books/${book.id}/subscribe/${$user.id}`);
			await fetchSubscribedTweets($user.id);
		} catch (error) {
			console.error('Failed to subscribe to book:', error);
		}
		isSubscribing = false;
	}

	async function handleUnsubscribe(book) {
		if (!$user || isSubscribing) return;

		isSubscribing = true;
		try {
			await Api.delete(`/classic_books/${book.id}/unsubscribe/${$user.id}`);
			await fetchSubscribedTweets($user.id);
		} catch (error) {
			console.error('Failed to unsubscribe from book:', error);
		}
		isSubscribing = false;
	}

	$: exploreBooks = allBooks.filter(
		(book) => !$subscribedBooks.some((subBook) => subBook.id === book.id)
	);

	$: console.log('subscribedBooks', $subscribedBooks);

	onMount(async () => {
		fetchQuestions();
		await fetchInitialData();
	});
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="harpoonium" />
</svelte:head>

<div class="quizzes">
	{#if $isLoadingTweets}
		<div class="loading-state">
			<div class="spinner" />
			<p>Loading your library thoughts...</p>
		</div>
	{:else if !$user}
		<div class="empty-state">
			<p>Sign in to view your library</p>
			<p class="subtitle">Create an account to start reading classic books!</p>
		</div>
	{:else if $subscribedBooks.length === 0}
		<div class="empty-state">
			<p>Your library is empty</p>
			<p class="subtitle">Use Explore to discover and add classic books to your library!</p>
		</div>
	{:else}
		<TweetList tweets={$subscribedTweets} />
		<TweetComposer subscribedBooks={$subscribedBooks} />
	{/if}
</div>

<!-- <Home /> -->
<style>
	.quizzes {
		font-size: 24px;
		color: #000;
		position: relative;
		margin: 10px;
		text-align: left;
		list-style: none;
		width: 70%;
		margin: 0 auto;
		padding: 20px 0;
	}

	.books-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1.5rem;
		padding: 1rem;
	}

	.book-card {
		background: white;
		border-radius: 12px;
		padding: 1rem;
		text-align: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s ease;
	}

	.book-card:hover {
		transform: translateY(-4px);
	}

	.book-image {
		width: 100%;
		height: 250px;
		object-fit: cover;
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	.book-card h3 {
		font-size: 1.1rem;
		margin: 0 0 1rem 0;
		color: #333;
	}

	.subscribe-button,
	.unsubscribe-button {
		width: 100%;
		padding: 0.75rem;
		border: none;
		border-radius: 9999px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.subscribe-button {
		background-color: #1d9bf0;
		color: white;
	}

	.unsubscribe-button {
		background-color: #f4212e;
		color: white;
	}

	.subscribe-button:hover {
		background-color: #1a8cd8;
	}

	.unsubscribe-button:hover {
		background-color: #d1162b;
	}

	.subscribe-button:disabled,
	.unsubscribe-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.loading-state,
	.empty-state {
		text-align: center;
		padding: 3rem 2rem;
		background: rgba(29, 155, 240, 0.05);
		border-radius: 1rem;
		border: 1px solid rgba(29, 155, 240, 0.1);
		margin: 1rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.empty-state p {
		font-size: 1.2rem;
		font-weight: 500;
		color: #1d9bf0;
		margin: 0;
	}

	.empty-state .subtitle {
		font-size: 1rem;
		font-weight: normal;
		color: #536471;
		margin-top: 0.25rem;
	}

	.spinner {
		width: 30px;
		height: 30px;
		border: 3px solid rgba(29, 155, 240, 0.3);
		border-radius: 50%;
		border-top-color: #1d9bf0;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	:global(.dark) .loading-state,
	:global(.dark) .empty-state {
		background: rgba(29, 155, 240, 0.2);
		color: #fff;
	}

	:global(.dark) .book-card {
		background: #15202b;
	}

	:global(.dark) .book-card h3 {
		color: #e7e9ea;
	}

	:global(.dark) .empty-state {
		background: rgba(239, 243, 244, 0.05);
		border-color: rgba(239, 243, 244, 0.1);
	}

	:global(.dark) .empty-state p {
		color: #1d9bf0;
	}

	:global(.dark) .empty-state .subtitle {
		color: #71767b;
	}

	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 1;
	}

	h1 {
		width: 100%;
	}

	.welcome {
		display: block;
		position: relative;
		width: 100%;
		height: 0;
		padding: 0 0 calc(100% * 495 / 2048) 0;
	}

	.welcome img {
		margin: 0 auto;
		max-width: 350px;
		top: 0;
		display: block;
	}

	@media (max-width: 480px) {
		.quizzes {
			margin: 0;
			width: 100%;
		}

		.books-grid {
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
			gap: 1rem;
			padding: 0.5rem;
		}

		.book-image {
			height: 200px;
		}
	}

	@media (max-width: 640px) {
		.logo {
			max-width: 100px;
			object-fit: contain;
			position: relative;
			top: -20px;
		}

		.button-container {
			width: 100%;
			justify-content: center;
		}
	}
</style>
