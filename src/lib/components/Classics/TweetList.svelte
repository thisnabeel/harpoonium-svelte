<script>
	import { onMount } from 'svelte';
	import API from '$lib/api/api';
	import TweetCard from './TweetCard.svelte';
	import LoadingState from './LoadingState.svelte';
	import ErrorState from './ErrorState.svelte';
	import { theme } from '$lib/stores/main';

	let tweets = [];
	let loading = true;
	let error = null;
	let page = 1;
	let hasMore = true;
	let sortBy = 'newest';

	const TWEETS_PER_PAGE = 10;

	async function fetchTweets(reset = false) {
		// if (reset) {
		// 	page = 1;
		// 	tweets = [];
		// }

		// if (!hasMore || loading) return;

		// loading = true;
		// error = null;

		try {
			const response = await API.get('/chapters/classics_home');

			// if (response.length < TWEETS_PER_PAGE) {
			// 	hasMore = false;
			// }

			// tweets = reset ? response : [...tweets, ...response];
			tweets = response;
			page++;
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	function handleScroll(event) {
		const element = event.target;
		if (
			element.scrollHeight - element.scrollTop <= element.clientHeight + 100 &&
			!loading &&
			hasMore
		) {
			fetchTweets();
		}
	}

	function handleSortChange(event) {
		sortBy = event.target.value;
		fetchTweets(true);
	}

	onMount(() => {
		fetchTweets();
	});
</script>

<div class="tweet-list-container {$theme}">
	<!-- <div class="header">
		<h1>Literary Tweets</h1>
		<select value={sortBy} on:change={handleSortChange}>
			<option value="newest">Newest First</option>
			<option value="oldest">Oldest First</option>
			<option value="book">By Book Title</option>
		</select>
	</div> -->

	<div class="tweet-list" on:scroll={handleScroll}>
		{#each tweets as tweet}
			<TweetCard {tweet} />
		{/each}

		{#if loading}
			<LoadingState />
		{/if}

		{#if error}
			<ErrorState message={error} retryCallback={() => fetchTweets(true)} />
		{/if}

		{#if !loading && !error && tweets.length === 0}
			<div class="empty-state">
				<p>No literary tweets found. Check back later for more bookish thoughts!</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.tweet-list-container {
		/* max-width: 600px; */
		margin: 0 auto;
		padding: 1rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding: 0 1rem;
	}

	h1 {
		font-family: 'Georgia', serif;
		color: #1a1a1a;
		font-size: 2rem;
		margin: 0;
	}

	select {
		padding: 0.5rem;
		border: 1px solid #2f3336;
		border-radius: 4px;
		font-family: 'Georgia', serif;
		background-color: white;
		cursor: pointer;
	}

	.tweet-list {
		height: calc(100vh - 150px);
		overflow-y: auto;
		padding: 1rem;
		/* border: 1px solid #e0e0e0; */
		border-radius: 12px;
		/* background-color: #f8f8f8; */
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: #666;
		font-family: 'Georgia', serif;
		font-style: italic;
	}

	@media (max-width: 768px) {
		.tweet-list-container {
			padding: 0.5rem;
		}

		.header {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
			padding: 0 0.5rem;
		}

		.tweet-list {
			height: calc(100vh - 200px);
			padding: 0.5rem;
		}
	}
</style>
