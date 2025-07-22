<script>
	import { user } from '$lib/stores/user';
	import Api from '$lib/api/api.js';
	import { openFullscreenModal } from '$lib/stores/fullscreenModal';

	export let book;
	export let onAction;
	export let actionLabel;
	export let isLoading = false;

	function navigateToEdit() {
		window.location.href = `/chapters/${book.id}`;
	}

	async function read(book) {
		try {
			console.log('Reading book:', book);
			const response = await Api.get(`/books/${book.id}/read`);
			console.log('API response:', response);
			if (response.card_set && response.card_set.cards && response.card_set.cards.length > 0) {
				console.log(
					'Opening fullscreen modal with:',
					response.card_set,
					`${book.title} - ${response.chapter.title}`
				);
				openFullscreenModal(response.card_set, `${book.title} - ${response.chapter.title}`);
			} else {
				console.log('No cards available in response');
				// Fallback to navigation if no cards available
				// window.location.href = `/chapters/${book.id}`;
			}
		} catch (error) {
			console.error('Failed to load book content:', error);
			// Fallback to navigation on error
			// window.location.href = `/chapters/${book.id}`;
		}
	}
</script>

<div class="book-card">
	<div class="image-container">
		<img src={book.image_url} alt={book.title} class="book-image" />
		{#if $user?.admin}
			<button class="edit-button btn-warning" on:click={navigateToEdit}>
				<i class="fas fa-pen" />
			</button>
		{/if}
	</div>
	<h3>{book.title}</h3>
	<p class="description">{book.description}</p>
	<button class="action-button read-button" on:click={() => read(book)}>Read</button>
	<!-- <button
		class="action-button"
		class:subscribe={actionLabel === 'Subscribe'}
		class:unsubscribe={actionLabel === 'Unsubscribe'}
		on:click={() => onAction(book)}
		disabled={isLoading}
	>
		{#if isLoading}
			<div class="spinner" />
		{:else}
			{actionLabel}
		{/if}
	</button> -->
</div>

<style>
	.book-card {
		background: white;
		border-radius: 12px;
		padding: 1rem;
		text-align: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s ease;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.book-card:hover {
		transform: translateY(-4px);
	}

	.image-container {
		position: relative;
		margin-bottom: 1rem;
	}

	.edit-button {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		border: none;
		background-color: #ffc107;
		color: #000;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.edit-button:hover {
		background-color: #ffb300;
		transform: scale(1.1);
	}

	.book-image {
		width: 100%;
		height: 250px;
		object-fit: cover;
		border-radius: 8px;
		margin-bottom: 0;
	}

	h3 {
		font-size: 1.1rem;
		margin: 0 0 0.5rem 0;
		color: #333;
	}

	.description {
		font-size: 0.9rem;
		color: #536471;
		margin: 0 0 1rem 0;
		flex-grow: 1;
	}

	.action-button {
		width: 100%;
		padding: 0.75rem;
		border: none;
		border-radius: 9999px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.action-button.subscribe {
		background-color: #1d9bf0;
		color: white;
	}

	.action-button.unsubscribe {
		background-color: #f4212e;
		color: white;
	}

	.action-button:hover:not(:disabled) {
		opacity: 0.9;
	}

	.action-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top-color: white;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	:global(.dark) .book-card {
		background: #15202b;
	}

	:global(.dark) h3 {
		color: #e7e9ea;
	}

	:global(.dark) .description {
		color: #71767b;
	}
</style>
