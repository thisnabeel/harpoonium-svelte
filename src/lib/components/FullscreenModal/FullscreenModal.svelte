<script>
	import { onMount, onDestroy } from 'svelte';
	import { theme } from '$lib/stores/main';

	export let isOpen = false;
	export let cardSet = null;
	export let title = '';
	export let onClose = () => {};
	export let onNextChapter = null; // New prop for next chapter functionality

	// Type definitions for better TypeScript support
	/** @type {any} */
	let typedCardSet = cardSet;
	/** @type {(() => void) | null} */
	let typedOnNextChapter = onNextChapter;

	// Update typed variables when props change
	$: typedCardSet = cardSet;
	$: typedOnNextChapter = onNextChapter;

	// Debug logging
	$: console.log('FullscreenModal props changed:', { isOpen, cardSet, title, typedCardSet });
	$: console.log('Template render check:', {
		isOpen,
		typedCardSet,
		shouldRender: isOpen && typedCardSet
	});

	let currentCardIndex = 0;
	let touchStartY = 0;
	let touchEndY = 0;

	// Navigate to next card
	const nextCard = () => {
		if (typedCardSet?.cards && currentCardIndex < typedCardSet.cards.length - 1) {
			currentCardIndex++;
		}
	};

	// Navigate to previous card
	const prevCard = () => {
		if (currentCardIndex > 0) {
			currentCardIndex--;
		}
	};

	// Handle next chapter
	const handleNextChapter = () => {
		if (typedOnNextChapter) {
			typedOnNextChapter();
		}
	};

	// Handle keyboard navigation
	const handleKeydown = (/** @type {KeyboardEvent} */ event) => {
		if (!isOpen) return;

		if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'ArrowDown') {
			event.preventDefault();
			nextCard();
		} else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
			event.preventDefault();
			prevCard();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			onClose();
		}
	};

	// Handle touch/swipe navigation
	const handleTouchStart = (/** @type {TouchEvent} */ event) => {
		event.preventDefault();
		touchStartY = event.touches[0].clientY;
	};

	const handleTouchMove = (/** @type {TouchEvent} */ event) => {
		event.preventDefault();
	};

	const handleTouchEnd = (/** @type {TouchEvent} */ event) => {
		event.preventDefault();
		touchEndY = event.changedTouches[0].clientY;
		handleSwipe();
	};

	const handleSwipe = () => {
		const swipeThreshold = 50;
		const swipeDistance = touchStartY - touchEndY;

		if (Math.abs(swipeDistance) > swipeThreshold) {
			if (swipeDistance > 0) {
				// Swipe up - next card
				nextCard();
			} else {
				// Swipe down - previous card
				prevCard();
			}
		}
	};

	// Handle mouse click navigation
	const handleCardClick = (/** @type {MouseEvent} */ event) => {
		if (!isOpen) return;

		const cardElement = /** @type {HTMLElement} */ (event.currentTarget);
		const rect = cardElement.getBoundingClientRect();
		const clickY = event.clientY;
		const cardCenterY = rect.top + rect.height / 2;

		if (clickY < cardCenterY) {
			// Click in upper half - previous card
			prevCard();
		} else {
			// Click in lower half - next card
			nextCard();
		}
	};

	// Reset card index when modal opens
	$: if (isOpen && typedCardSet?.cards && typeof document !== 'undefined') {
		currentCardIndex = 0;
		document.body.style.overflow = 'hidden';
	} else if (!isOpen && typeof document !== 'undefined') {
		document.body.style.overflow = '';
	}

	// Add keyboard event listener
	$: if (isOpen && typeof document !== 'undefined') {
		document.addEventListener('keydown', handleKeydown);
	} else if (typeof document !== 'undefined') {
		document.removeEventListener('keydown', handleKeydown);
	}

	// Cleanup on component destroy
	onDestroy(() => {
		if (typeof document !== 'undefined') {
			document.removeEventListener('keydown', handleKeydown);
			document.body.style.overflow = '';
		}
	});
</script>

{#if isOpen && typedCardSet}
	<div class="fullscreen-overlay dark" on:click={onClose}>
		<div class="fullscreen-content" on:click|stopPropagation={() => {}}>
			<!-- Header -->
			<div class="fullscreen-header">
				<div class="fullscreen-title">
					{title || typedCardSet.title} - Card {currentCardIndex + 1} of {typedCardSet.cards.length}
				</div>
				<button class="fullscreen-close" on:click={onClose}>
					<i class="fas fa-times" />
				</button>
			</div>

			<!-- Progress bar -->
			<div class="progress-container">
				<div class="progress-bar">
					<div
						class="progress-fill"
						style="width: {((currentCardIndex + 1) / typedCardSet.cards.length) * 100}%"
					/>
				</div>
			</div>

			<!-- Card content -->
			<div
				class="fullscreen-card"
				on:click={handleCardClick}
				on:touchstart={handleTouchStart}
				on:touchmove={handleTouchMove}
				on:touchend={handleTouchEnd}
			>
				<div class="card-content">
					{@html typedCardSet.cards[currentCardIndex]?.body || 'No content'}
				</div>
			</div>

			<!-- Navigation -->
			<div class="fullscreen-nav">
				<button class="nav-button prev" on:click={prevCard} disabled={currentCardIndex === 0}>
					<i class="fas fa-chevron-left" />
				</button>

				<div class="nav-indicator">
					{currentCardIndex + 1} / {typedCardSet.cards.length}
				</div>

				{#if currentCardIndex === typedCardSet.cards.length - 1 && onNextChapter}
					<button class="nav-button next-chapter" on:click={handleNextChapter}>
						Next Chapter <i class="fas fa-arrow-right" />
					</button>
				{:else}
					<button
						class="nav-button next"
						on:click={nextCard}
						disabled={currentCardIndex === typedCardSet.cards.length - 1}
					>
						<i class="fas fa-chevron-right" />
					</button>
				{/if}
			</div>

			<!-- Instructions -->
			<!-- <div class="fullscreen-instructions">
				<p>Click upper/lower half • Swipe up/down • Arrow keys • Spacebar • ESC to exit</p>
			</div> -->
		</div>
	</div>
{/if}

<style>
	/* Fullscreen modal styles */
	.fullscreen-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.95);
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: fadeIn 0.3s ease;
	}

	.fullscreen-content {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: #ffffff;
		position: relative;
		touch-action: none; /* Prevent browser scrolling */
	}

	.dark .fullscreen-content {
		background: #0f1419;
	}

	.fullscreen-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 2rem;
		background: #ffffff;
		border-bottom: 1px solid #e1e5e9;
	}

	.dark .fullscreen-header {
		background: #1a1d21;
		border-bottom-color: #2d3238;
	}

	.fullscreen-title {
		font-size: 1.2rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.dark .fullscreen-title {
		color: #ffffff;
	}

	.fullscreen-close {
		background: none;
		border: none;
		color: #1a1a1a;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 4px;
		transition: all 0.2s ease;
		font-size: 1.2rem;
	}

	.fullscreen-close:hover {
		background: rgba(26, 26, 26, 0.1);
		color: #000000;
	}

	.dark .fullscreen-close {
		color: #ffffff;
	}

	.dark .fullscreen-close:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #ffffff;
	}

	/* Progress bar styles */
	.progress-container {
		padding: 0 2rem;
		background: #ffffff;
		border-bottom: 1px solid #e1e5e9;
	}

	.dark .progress-container {
		background: #1a1d21;
		border-bottom-color: #2d3238;
	}

	.progress-bar {
		width: 100%;
		height: 4px;
		background: #e1e5e9;
		border-radius: 2px;
		overflow: hidden;
	}

	.dark .progress-bar {
		background: #2d3238;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #007bff, #0056b3);
		border-radius: 2px;
		transition: width 0.3s ease;
		position: relative;
	}

	.progress-fill::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
		animation: shimmer 2s infinite;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	.fullscreen-card {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		padding: 2rem;
		text-align: left;
		touch-action: none; /* Prevent browser scrolling during touch */
	}

	.card-content {
		max-width: 800px;
		font-size: 1.5rem;
		line-height: 1.6;

		white-space: pre-wrap;
		word-wrap: break-word;
		font-weight: 400;
	}

	.fullscreen-card :global(*) {
		color: #ffffff;
	}

	.fullscreen-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 2rem;
		background: #ffffff;
		border-top: 1px solid #e1e5e9;
	}

	.dark .fullscreen-nav {
		background: #1a1d21;
		border-top-color: #2d3238;
	}

	.nav-button {
		background: #007bff;
		color: white;
		border: none;
		padding: 0.75rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 1rem;
		font-weight: 500;
	}

	.nav-button:hover:not(:disabled) {
		background: #0056b3;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
	}

	.nav-button:disabled {
		background: #6c757d;
		cursor: not-allowed;
		opacity: 0.6;
	}

	.nav-button.next-chapter {
		background: linear-gradient(135deg, #28a745, #20c997);
		font-weight: 600;
		padding: 0.75rem 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.nav-button.next-chapter:hover {
		background: linear-gradient(135deg, #218838, #1ea085);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
	}

	.nav-indicator {
		font-size: 1rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.dark .nav-indicator {
		color: #ffffff;
	}

	.fullscreen-instructions {
		text-align: center;
		padding: 0.5rem 2rem;
		background: #ffffff;
		border-top: 1px solid #e1e5e9;
	}

	.dark .fullscreen-instructions {
		background: #1a1d21;
		border-top-color: #2d3238;
	}

	.fullscreen-instructions p {
		margin: 0;
		font-size: 0.9rem;
		color: #1a1a1a;
		font-weight: 500;
	}

	.dark .fullscreen-instructions p {
		color: #ffffff;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@media (max-width: 768px) {
		.fullscreen-header {
			padding: 1rem;
		}

		.fullscreen-title {
			font-size: 1rem;
		}

		.progress-container {
			padding: 0 1rem;
		}

		.fullscreen-card {
			padding: 1rem;
		}

		.card-content {
			font-size: 1.2rem;
		}

		.fullscreen-nav {
			padding: 1rem;
		}

		.nav-button {
			padding: 0.5rem 0.75rem;
			font-size: 0.9rem;
		}

		.fullscreen-instructions {
			padding: 0.5rem 1rem;
		}

		.fullscreen-instructions p {
			font-size: 0.8rem;
		}
	}
</style>
