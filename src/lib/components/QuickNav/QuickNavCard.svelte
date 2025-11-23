<script>
	import { user } from '$lib/stores/user';
	import Api from '$lib/api/api.js';
	import { openFullscreenModal } from '$lib/stores/fullscreenModal';

	export let cursorData;

	async function openReader() {
		if (!cursorData || !cursorData.book) return;

		try {
			const response = await Api.get(`/books/${cursorData.book.id}/read?user_id=${$user.id}`);

			if (
				response.current &&
				response.current.card_set &&
				response.current.card_set.cards &&
				response.current.card_set.cards.length > 0
			) {
				openFullscreenModal(
					response.current.card_set,
					`${cursorData.book.title} - ${cursorData.chapter.title}`,
					response,
					response.current.chapter
				);
			}
		} catch (error) {
			console.error('Failed to load book content:', error);
		}
	}
</script>

<button class="quick-nav-card" on:click={openReader}>
	<div class="card-content">
		<div class="book-info">
			<h4 class="book-title">{cursorData.book.title}</h4>
			<p class="chapter-title">{cursorData.chapter.title}</p>
		</div>
		<div class="continue-icon">
			<i class="fas fa-arrow-right" />
		</div>
	</div>
</button>

<style>
	.quick-nav-card {
		background: white;
		border: 1px solid #e1e5e9;
		border-radius: 10px;
		padding: 0.875rem 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		width: 100%;
		min-width: 200px;
		max-width: 280px;
		flex-shrink: 0;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		scroll-snap-align: start;
	}

	.quick-nav-card:hover {
		background: #f8f9fa;
		border-color: #1d9bf0;
		transform: translateX(4px);
		box-shadow: 0 4px 12px rgba(29, 155, 240, 0.25);
	}

	.quick-nav-card:active {
		transform: translateX(2px) scale(0.98);
	}

	.card-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.book-info {
		flex: 1;
		min-width: 0;
	}

	.book-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0 0 0.25rem 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1.3;
	}

	.chapter-title {
		font-size: 0.8rem;
		color: #536471;
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1.3;
	}

	.continue-icon {
		color: #1d9bf0;
		font-size: 1rem;
		flex-shrink: 0;
		transition: transform 0.2s ease;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.quick-nav-card:hover .continue-icon {
		transform: translateX(4px);
	}

	@media (max-width: 768px) {
		.quick-nav-card {
			min-width: calc(85vw - 2rem);
			max-width: calc(85vw - 2rem);
			padding: 0.875rem 1rem;
			border-radius: 10px;
		}

		.book-title {
			font-size: 0.95rem;
		}

		.chapter-title {
			font-size: 0.8rem;
		}

		.continue-icon {
			font-size: 1rem;
			width: 24px;
			height: 24px;
		}

		.card-content {
			gap: 0.75rem;
		}
	}

	@media (max-width: 480px) {
		.quick-nav-card {
			min-width: calc(80vw - 1.5rem);
			max-width: calc(80vw - 1.5rem);
			padding: 0.75rem 0.875rem;
		}

		.book-title {
			font-size: 0.9rem;
			margin-bottom: 0.25rem;
		}

		.chapter-title {
			font-size: 0.75rem;
		}

		.continue-icon {
			font-size: 0.95rem;
			width: 22px;
			height: 22px;
		}
	}

	:global(.dark) .quick-nav-card {
		background: #15202b;
		border-color: #2d3238;
	}

	:global(.dark) .quick-nav-card:hover {
		background: #1a1d21;
		border-color: #1d9bf0;
	}

	:global(.dark) .book-title {
		color: #e7e9ea;
	}

	:global(.dark) .chapter-title {
		color: #71767b;
	}
</style>
