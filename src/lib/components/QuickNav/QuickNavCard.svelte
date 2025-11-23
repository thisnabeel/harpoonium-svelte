<script>
	import { onMount } from 'svelte';
	import { user } from '$lib/stores/user';
	import Api from '$lib/api/api.js';
	import { openFullscreenModal } from '$lib/stores/fullscreenModal';

	export let cursorData;

	// Progress bar state
	let cardSet = null;
	let allCardTags = {};
	let currentCardIndex = 0;
	let isLoadingProgress = false;

	// Reactive variable to control card border radius
	$: hasProgressBar = cardSet && cardSet.cards && cardSet.cards.length > 0 && !isLoadingProgress;

	// Color mapping for tag types (same as FullscreenModal)
	const tagColors = {
		'Description / Worldbuilding': '#5dade2',
		'Character Thoughts & Feelings': '#e74c3c',
		'Social Commentary / Philosophy': '#9b59b6',
		'Plot Movement': '#2ecc71',
		'Tension Build-Up': '#f39c12',
		'Action / Drama': '#e67e22',
		'Reveals & Twists': '#c0392b',
		Dialogue: '#3498db',
		'Atmospheric / Mood Setting': '#8e44ad',
		'Transitional Passage': '#95a5a6',
		'Symbolic / Metaphorical Passage': '#1abc9c',
		'Reflection / Moral Lesson': '#27ae60'
	};
	const defaultTagColor = '#bdc3c7';

	// Get color for a specific card
	const getCardColor = (cardId) => {
		const tag = allCardTags[cardId];
		if (tag && tag.name) {
			return tagColors[tag.name] || defaultTagColor;
		}
		return defaultTagColor;
	};

	// Load card set and tags for progress bar
	async function loadProgressData() {
		if (!cursorData || !cursorData.chapter || !cursorData.cursor) return;

		isLoadingProgress = true;
		try {
			// Get the card to find its card_set
			const currentCardId = cursorData.cursor.card_id;
			if (!currentCardId) {
				isLoadingProgress = false;
				return;
			}

			// Fetch the card to get its card_set_id
			const cardResponse = await Api.get(`/cards/${currentCardId}`);
			const cardSetId = cardResponse.card_set_id || cardResponse.card_set?.id;

			if (cardSetId) {
				// Fetch the card set with all cards
				const cardSetResponse = await Api.get(`/card_sets/${cardSetId}`);
				if (cardSetResponse.cards && cardSetResponse.cards.length > 0) {
					cardSet = cardSetResponse;

					// Find current card index
					currentCardIndex = cardSet.cards.findIndex((card) => card.id === currentCardId);
					if (currentCardIndex === -1) currentCardIndex = 0;

					// Fetch all card tags for this card set
					try {
						const tagsResponse = await Api.get(`/card_sets/${cardSetId}/card_tags`);
						if (tagsResponse.tags) {
							allCardTags = tagsResponse.tags;
						}
					} catch (error) {
						console.error('Failed to load card tags:', error);
						allCardTags = {};
					}
				}
			}
		} catch (error) {
			console.error('Failed to load progress data:', error);
		} finally {
			isLoadingProgress = false;
		}
	}

	// Generate progress bar segments
	$: progressSegments = (() => {
		if (!cardSet?.cards || cardSet.cards.length === 0) {
			return [];
		}

		const segments = [];
		const totalCards = cardSet.cards.length;
		const segmentWidth = 100 / totalCards;

		cardSet.cards.forEach((card, index) => {
			const tag = allCardTags[card.id];
			const hasTag = tag && tag.name;
			const color = getCardColor(card.id);
			segments.push({
				index,
				width: segmentWidth,
				left: (index / totalCards) * 100,
				color,
				cardId: card.id,
				hasTag
			});
		});

		return segments;
	})();

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

	onMount(() => {
		loadProgressData();
	});
</script>

<div class="quick-nav-card-wrapper">
	<button class="quick-nav-card" class:has-progress={hasProgressBar} on:click={openReader}>
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
	{#if hasProgressBar}
		<div class="mini-progress-container">
			<div class="mini-progress-bar">
				{#each progressSegments as segment}
					<div
						class="mini-progress-segment"
						class:passed={segment.index < currentCardIndex}
						class:current={segment.index === currentCardIndex}
						class:untagged={!segment.hasTag}
						style="width: {segment.width}%; left: {segment.left}%; background-color: {segment.color};"
						title={(() => {
							const tag = allCardTags[segment.cardId];
							return tag ? tag.name : 'Untagged';
						})()}
					/>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.quick-nav-card-wrapper {
		display: flex;
		flex-direction: column;
		min-width: 200px;
		max-width: 280px;
		flex-shrink: 0;
		scroll-snap-align: start;
		will-change: transform;
		box-sizing: border-box;
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.quick-nav-card {
		background: white;
		border: 1px solid #e1e5e9;
		border-radius: 10px;
		padding: 0.875rem 1rem;
		cursor: pointer;
		text-align: left;
		width: 100%;
		box-sizing: border-box;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: transform, background-color, border-color;
	}

	.quick-nav-card.has-progress {
		border-radius: 10px 10px 0 0;
		border-bottom: none;
	}

	.quick-nav-card-wrapper:hover {
		transform: translateX(4px);
	}

	.quick-nav-card-wrapper:hover .quick-nav-card {
		background: #f8f9fa;
		border-color: #1d9bf0;
		box-shadow: 0 4px 12px rgba(29, 155, 240, 0.25);
	}

	.quick-nav-card-wrapper:hover .mini-progress-container {
		border-color: #1d9bf0;
		box-shadow: 0 2px 8px rgba(29, 155, 240, 0.2);
		background: #f8f9fa;
	}

	.quick-nav-card-wrapper:active {
		transform: translateX(2px);
	}

	.quick-nav-card-wrapper:active .quick-nav-card {
		transform: scale(0.98);
		transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
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
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		will-change: transform;
	}

	.quick-nav-card-wrapper:hover .continue-icon {
		transform: translateX(4px);
	}

	@media (max-width: 768px) {
		.quick-nav-card-wrapper {
			min-width: calc(85vw - 2rem);
			max-width: calc(85vw - 2rem);
		}

		.quick-nav-card {
			padding: 0.875rem 1rem;
		}

		.quick-nav-card.has-progress {
			border-radius: 10px 10px 0 0;
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
		.quick-nav-card-wrapper {
			min-width: calc(80vw - 1.5rem);
			max-width: calc(80vw - 1.5rem);
		}

		.quick-nav-card {
			padding: 0.75rem 0.875rem;
		}

		.quick-nav-card.has-progress {
			border-radius: 10px 10px 0 0;
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

	:global(.dark) .quick-nav-card-wrapper:hover .quick-nav-card {
		background: #1a1d21;
		border-color: #1d9bf0;
		box-shadow: 0 4px 12px rgba(29, 155, 240, 0.3);
	}

	:global(.dark) .quick-nav-card-wrapper:hover .mini-progress-container {
		border-color: #1d9bf0;
		box-shadow: 0 2px 8px rgba(29, 155, 240, 0.25);
		background: #1a1d21;
	}

	:global(.dark) .book-title {
		color: #e7e9ea;
	}

	:global(.dark) .chapter-title {
		color: #71767b;
	}

	/* Mini Progress Bar Styles */
	.mini-progress-container {
		width: 100%;
		padding: 0 1rem 0.75rem 1rem;
		background: white;
		border: 1px solid #e1e5e9;
		border-top: none;
		border-radius: 0 0 10px 10px;
		box-sizing: border-box;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: border-color, box-shadow;
	}

	.mini-progress-bar {
		position: relative;
		width: 100%;
		height: 4px;
		background: #e1e5e9;
		border-radius: 2px;
		overflow: hidden;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .mini-progress-container {
		background: #15202b;
		border-color: #2d3238;
	}

	:global(.dark) .mini-progress-bar {
		background: #2d3238;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
	}

	.mini-progress-segment {
		height: 100%;
		position: absolute;
		top: 0;
		opacity: 0.8;
		transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		border-right: 1px solid rgba(255, 255, 255, 0.1);
		box-sizing: border-box;
		will-change: opacity, transform, filter;
		transform-origin: center;
	}

	:global(.dark) .mini-progress-segment {
		border-right-color: rgba(255, 255, 255, 0.05);
		opacity: 0.85;
	}

	.mini-progress-segment.passed {
		opacity: 0.6;
		filter: brightness(0.9);
	}

	:global(.dark) .mini-progress-segment.passed {
		opacity: 0.5;
		filter: brightness(0.8);
	}

	.mini-progress-segment.current {
		opacity: 1;
		box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
		z-index: 5;
		border: 1px solid rgba(255, 255, 255, 0.5);
		filter: brightness(1.1);
		transform: scaleY(1.2);
		transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	:global(.dark) .mini-progress-segment.current {
		box-shadow: 0 0 6px rgba(255, 255, 255, 0.3);
		border-color: rgba(255, 255, 255, 0.7);
		filter: brightness(1.2);
	}

	.mini-progress-segment.untagged {
		background-color: rgb(189 195 199 / 50%) !important;
		opacity: 0.4;
	}

	:global(.dark) .mini-progress-segment.untagged {
		background-color: rgb(189 195 199 / 40%) !important;
		opacity: 0.3;
	}

	.quick-nav-card-wrapper:hover .mini-progress-segment {
		opacity: 0.95;
	}

	.quick-nav-card-wrapper:hover .mini-progress-segment.passed {
		opacity: 0.7;
		filter: brightness(0.95);
	}

	.quick-nav-card-wrapper:hover .mini-progress-segment.current {
		opacity: 1;
		filter: brightness(1.2);
		box-shadow: 0 0 8px rgba(29, 155, 240, 0.6);
		transform: scaleY(1.3);
		border-color: rgba(255, 255, 255, 0.8);
	}

	:global(.dark) .quick-nav-card-wrapper:hover .mini-progress-segment.current {
		box-shadow: 0 0 10px rgba(29, 155, 240, 0.5);
		border-color: rgba(255, 255, 255, 0.9);
	}

	@media (max-width: 768px) {
		.quick-nav-card-wrapper {
			min-width: calc(85vw - 2rem);
			max-width: calc(85vw - 2rem);
		}

		.mini-progress-container {
			padding: 0 1rem 0.625rem 1rem;
		}

		.mini-progress-bar {
			height: 3px;
		}
	}

	@media (max-width: 480px) {
		.quick-nav-card-wrapper {
			min-width: calc(80vw - 1.5rem);
			max-width: calc(80vw - 1.5rem);
		}

		.mini-progress-container {
			padding: 0 0.875rem 0.5rem 0.875rem;
		}

		.mini-progress-bar {
			height: 3px;
		}
	}
</style>
