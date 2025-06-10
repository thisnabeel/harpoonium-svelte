<script>
	import Api from '$lib/api/api';
	import { onMount } from 'svelte';

	let classicBooks = [];
	let isLoading = true;
	let error = null;

	onMount(async () => {
		try {
			const response = await Api.get('/classic_books');
			classicBooks = response;
		} catch (err) {
			error = 'Failed to load classic books. Please try again later.';
			console.error('Error loading classic books:', err);
		} finally {
			isLoading = false;
		}
	});
</script>

<div class="container">
	<h1>Classic Books</h1>

	{#if isLoading}
		<div class="loading-state">
			<div class="spinner" />
			<p>Loading classic books...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p>{error}</p>
		</div>
	{:else if classicBooks.length === 0}
		<div class="empty-state">
			<p>No classic books available yet.</p>
		</div>
	{:else}
		<div class="books-grid">
			{#each classicBooks as book}
				<div class="book-card">
					<div class="book-image">
						<img src={book.image_url} alt={book.title} />
					</div>
					<div class="book-content">
						<h2>{book.title}</h2>
						<p class="description">{book.description}</p>
						<div class="stats">
							<div class="stat">
								<i class="fas fa-book" />
								<span>{book.chapter_count} Chapters</span>
							</div>
							<div class="stat">
								<i class="fab fa-twitter" />
								<span>{book.tweet_count} Tweets</span>
							</div>
						</div>
						<a href="/books/{book.slug}" class="view-button"> View Book </a>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.container {
		width: 90%;
		max-width: 1200px;
		margin: 2rem auto;
		padding: 0 1rem;
	}

	h1 {
		color: #1d9bf0;
		margin-bottom: 2rem;
		font-size: 2rem;
	}

	.books-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 2rem;
	}

	.book-card {
		background: white;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s ease;
	}

	.book-card:hover {
		transform: translateY(-4px);
	}

	.book-image {
		width: 100%;
		height: 200px;
		overflow: hidden;
	}

	.book-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.book-content {
		padding: 1.5rem;
	}

	.book-content h2 {
		margin: 0 0 0.5rem;
		color: #1d9bf0;
		font-size: 1.5rem;
	}

	.description {
		color: #536471;
		margin-bottom: 1rem;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.stats {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #536471;
	}

	.stat i {
		color: #1d9bf0;
	}

	.view-button {
		display: inline-block;
		background: #1d9bf0;
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 20px;
		text-decoration: none;
		font-weight: 600;
		transition: background 0.2s ease;
	}

	.view-button:hover {
		background: #1a8cd8;
	}

	.loading-state,
	.error-state,
	.empty-state {
		text-align: center;
		padding: 3rem 2rem;
		background: rgba(29, 155, 240, 0.05);
		border-radius: 1rem;
		border: 1px solid rgba(29, 155, 240, 0.1);
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

	:global(.dark) .book-card {
		background: #15202b;
	}

	:global(.dark) .description {
		color: #71767b;
	}

	:global(.dark) .stat {
		color: #71767b;
	}

	:global(.dark) .loading-state,
	:global(.dark) .error-state,
	:global(.dark) .empty-state {
		background: rgba(29, 155, 240, 0.1);
		border-color: rgba(29, 155, 240, 0.2);
		color: #fff;
	}

	@media (max-width: 640px) {
		.container {
			width: 100%;
			margin: 1rem auto;
		}

		.books-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		h1 {
			font-size: 1.5rem;
			margin-bottom: 1.5rem;
		}
	}
</style>
