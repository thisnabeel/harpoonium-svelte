<script>
	import { onMount } from 'svelte';
	import API from '$lib/api/api';
	import TweetCard from './TweetCard.svelte';
	import LoadingState from './LoadingState.svelte';
	import ErrorState from './ErrorState.svelte';
	import { theme } from '$lib/stores/main';

	export let tweets = [];
	let loading = false;
	let error = null;

	function handleScroll(event) {
		const element = event.target;
		// TODO: Implement infinite scroll if needed
	}
</script>

<div class="tweet-list-container {$theme}">
	<div class="tweet-list" on:scroll={handleScroll}>
		{#if tweets.length === 0}
			<div class="empty-state">
				<p>No Books in your library yet.</p>
				<p class="subtitle">Subscribe to books to see other's thoughts here!</p>
			</div>
		{:else}
			{#each tweets as tweet (tweet.id)}
				<TweetCard {tweet} />
			{/each}
		{/if}

		{#if error}
			<ErrorState message={error} />
		{/if}
	</div>
</div>

<style>
	.tweet-list-container {
		margin: 0 auto;
		padding: 1rem;
	}

	.tweet-list {
		height: calc(100vh - 150px);
		overflow-y: auto;
		padding: 1rem;
		border-radius: 12px;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 2rem;
		background: rgba(29, 155, 240, 0.05);
		border: 1px solid rgba(29, 155, 240, 0.1);
		border-radius: 1rem;
		margin: 1rem;
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

	@media (max-width: 768px) {
		.tweet-list-container {
			padding: 0.5rem;
		}

		.tweet-list {
			height: calc(100vh - 200px);
			padding: 0.5rem;
		}

		.empty-state {
			padding: 2rem 1rem;
		}
	}
</style>
