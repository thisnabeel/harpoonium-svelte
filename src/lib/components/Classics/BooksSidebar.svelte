<script>
	import { onMount } from 'svelte';
	import API from '$lib/api/api';

	let books = [];
	let loading = true;
	let error = null;
	let selectedBook = null;

	export let onBookSelect = (book) => {};

	async function fetchBooks() {
		try {
			const response = await API.get('/chapters/books');
			books = response;
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	function handleBookClick(book) {
		selectedBook = book;
		onBookSelect(book);
	}

	onMount(() => {
		fetchBooks();
	});
</script>

<div class="sidebar">
	<h2>Classic Books</h2>

	{#if loading}
		<div class="loading">Loading books...</div>
	{/if}

	{#if error}
		<div class="error">{error}</div>
	{/if}

	{#if !loading && !error}
		<div class="book-list">
			{#each books as book}
				<button
					class="book-item"
					class:selected={selectedBook === book}
					on:click={() => handleBookClick(book)}
				>
					{book.title}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.sidebar {
		width: 250px;
		height: 100vh;
		background-color: #f8f8f8;
		border-right: 1px solid #e0e0e0;
		padding: 1.5rem;
		overflow-y: auto;
	}

	h2 {
		font-family: 'Georgia', serif;
		color: #1a1a1a;
		font-size: 1.5rem;
		margin: 0 0 1.5rem 0;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #d0d0d0;
	}

	.book-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.book-item {
		background: none;
		border: none;
		padding: 0.75rem;
		text-align: left;
		font-family: 'Georgia', serif;
		color: #333;
		cursor: pointer;
		border-radius: 6px;
		transition: all 0.2s ease;
	}

	.book-item:hover {
		background-color: #e8e8e8;
	}

	.book-item.selected {
		background-color: #1a1a1a;
		color: white;
	}

	.loading,
	.error {
		padding: 1rem;
		text-align: center;
		font-family: 'Georgia', serif;
		color: #666;
		font-style: italic;
	}

	.error {
		color: #dc3545;
	}

	@media (max-width: 768px) {
		.sidebar {
			width: 100%;
			height: auto;
			border-right: none;
			border-bottom: 1px solid #e0e0e0;
		}

		.book-list {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
			gap: 0.5rem;
		}
	}
</style>
