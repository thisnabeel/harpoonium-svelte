<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api.js';
	import { user } from '$lib/stores/user';
	import { goto } from '$app/navigation';

	let books = [];
	let selectedBook = null;

	onMount(async () => {
		try {
			const response = await Api.get('/classic_books');
			books = response;
		} catch (error) {
			console.error('Failed to fetch books:', error);
		}
	});

	function handleBookClick(book) {
		selectedBook = book;
		dispatchEvent(new CustomEvent('bookSelect', { detail: book }));
	}

	function handleEditClick(event, slug) {
		event.stopPropagation();
		goto(`/chapters/${slug}`);
	}
</script>

<div class="books-scroller">
	<div class="books-container">
		{#each books as book}
			<div
				class="book-item"
				class:selected={selectedBook?.id === book.id}
				on:click={() => handleBookClick(book)}
				on:keydown={(e) => e.key === 'Enter' && handleBookClick(book)}
				role="button"
				tabindex="0"
			>
				<div class="book-cover">
					<img src={book.image_url} alt={book.title} loading="lazy" />
				</div>
				<div class="book-title">{book.title}</div>
				{#if $user?.admin}
					<button class="btn warning edit-btn" on:click={(e) => handleEditClick(e, book.slug)}>
						<i class="fas fa-edit" />
					</button>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.books-scroller {
		width: 100%;
		overflow: hidden;
		position: relative;
		padding: 1rem 0;
	}

	.books-container {
		display: flex;
		gap: 1rem;
		overflow-x: auto;
		scroll-behavior: smooth;
		-webkit-overflow-scrolling: touch;
		padding: 0.5rem;
		scrollbar-width: none; /* Firefox */
	}

	.books-container::-webkit-scrollbar {
		display: none; /* Chrome, Safari, Edge */
	}

	.book-item {
		flex: 0 0 auto;
		width: 120px;
		cursor: pointer;
		transition: transform 0.2s ease;
		text-align: center;
		position: relative;
	}

	.book-item:hover {
		transform: translateY(-5px);
	}

	.book-item.selected {
		transform: translateY(-5px);
	}

	.book-cover {
		width: 100%;
		height: 180px;
		border-radius: 4px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		background: #f0f0f0;
		transition: box-shadow 0.2s ease;
	}

	.book-cover:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.book-cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.book-title {
		margin-top: 0.5rem;
		font-size: 0.9rem;
		font-weight: 500;
		color: #333;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		padding: 0 0.5rem;
	}

	.edit-btn {
		margin-top: 0.5rem;
		padding: 0.3rem 0.8rem;
		border: none;
		border-radius: 4px;
		background-color: #ffd67f;
		color: #333;
		cursor: pointer;
		font-size: 0.8rem;
		transition: background-color 0.2s ease;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
	}

	.edit-btn:hover {
		background-color: #ffca54;
	}

	:global(.dark) .book-title {
		color: #e7e9ea;
	}

	:global(.dark) .book-cover {
		background: #2f3336;
	}

	:global(.dark) .edit-btn {
		background-color: #f2613f;
		color: #fff;
	}

	:global(.dark) .edit-btn:hover {
		background-color: #d94e2f;
	}

	@media (max-width: 768px) {
		.book-item {
			width: 100px;
		}

		.book-cover {
			height: 150px;
		}

		.book-title {
			font-size: 0.8rem;
		}

		.edit-btn {
			padding: 0.25rem 0.6rem;
			font-size: 0.7rem;
		}
	}
</style>
