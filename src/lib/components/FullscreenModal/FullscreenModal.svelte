<script>
	import { onMount, onDestroy } from 'svelte';
	import { theme } from '$lib/stores/main';
	import { user } from '$lib/stores/user';
	import Api from '$lib/api/api.js';

	export let isOpen = false;
	export let cardSet = null;
	export let title = '';
	export let onClose = () => {};
	export let onNextChapter = null; // New prop for next chapter functionality
	export let bookData = null; // New prop for book data with current and siblings
	export let currentChapter = null; // New prop for current chapter

	// Debug logging
	$: console.log('FullscreenModal props changed:', { isOpen, cardSet, title });
	$: console.log('Template render check:', {
		isOpen,
		cardSet,
		shouldRender: isOpen && cardSet
	});
	$: console.log('Next chapter button conditions:', {
		isLastCard: currentCardIndex === cardSet?.cards?.length - 1,
		hasNextChapter: !!onNextChapter,
		onNextChapterType: typeof onNextChapter,
		shouldShowNextChapter: currentCardIndex === cardSet?.cards?.length - 1 && onNextChapter
	});

	let currentCardIndex = 0;
	let touchStartY = 0;
	let touchEndY = 0;
	let showChapterDropdown = false;
	let currentUser = null;
	let saveCursorTimer = null; // Timer for debouncing cursor saves
	let isRecapLoading = false;
	let recapData = null;
	let showRecapModal = false;

	// Subscribe to user store
	user.subscribe((value) => {
		currentUser = value;
	});

	// Save user cursor position with debouncing
	const saveUserCursor = async () => {
		console.log('Saving user cursor:', {
			currentUser,
			currentChapter,
			cardSet,
			currentCardIndex
		});
		if (!currentUser || !currentChapter || !cardSet?.cards) {
			return;
		}

		const currentCard = cardSet.cards[currentCardIndex];
		if (!currentCard) {
			return;
		}

		// Clear existing timer
		if (saveCursorTimer) {
			clearTimeout(saveCursorTimer);
		}

		// Set new timer - save cursor after 500ms of no navigation
		saveCursorTimer = setTimeout(async () => {
			try {
				await Api.post('/cards/update_cursor', {
					user_id: currentUser.id,
					chapter_id: currentChapter.id,
					card_id: currentCard.id
				});
				console.log('User cursor saved:', {
					user_id: currentUser.id,
					chapter_id: currentChapter.id,
					card_id: currentCard.id,
					card_index: currentCardIndex
				});
			} catch (error) {
				console.error('Failed to save user cursor:', error);
			}
		}, 1000); // 500ms delay
	};

	// Force save cursor immediately (for chapter switching and modal close)
	const saveUserCursorImmediate = async () => {
		if (!currentUser || !currentChapter || !cardSet?.cards) {
			return;
		}

		const currentCard = cardSet.cards[currentCardIndex];
		if (!currentCard) {
			return;
		}

		// Clear any pending timer
		if (saveCursorTimer) {
			clearTimeout(saveCursorTimer);
			saveCursorTimer = null;
		}

		try {
			await Api.post('/cards/update_cursor', {
				user_id: currentUser.id,
				chapter_id: currentChapter.id,
				card_id: currentCard.id
			});
			console.log('User cursor saved immediately:', {
				user_id: currentUser.id,
				chapter_id: currentChapter.id,
				card_id: currentCard.id,
				card_index: currentCardIndex
			});
		} catch (error) {
			console.error('Failed to save user cursor:', error);
		}
	};

	// Navigate to next card
	const nextCard = async () => {
		if (cardSet?.cards && currentCardIndex < cardSet.cards.length - 1) {
			currentCardIndex++;
			await saveUserCursor();
		}
	};

	// Navigate to previous card
	const prevCard = async () => {
		if (currentCardIndex > 0) {
			currentCardIndex--;
			await saveUserCursor();
		}
	};

	// Handle next chapter
	const handleNextChapter = async () => {
		if (onNextChapter && typeof onNextChapter === 'function') {
			// await saveUserCursorImmediate(); // Save current position before moving to next chapter
			onNextChapter();
		}
	};

	// Toggle chapter dropdown
	const toggleChapterDropdown = () => {
		showChapterDropdown = !showChapterDropdown;
	};

	// Switch to a different chapter
	const switchToChapter = async (chapterData) => {
		if (!bookData || !chapterData) return;

		try {
			// Save current position before switching
			await saveUserCursorImmediate();

			// Update the current chapter and card set
			currentChapter = chapterData.chapter;
			cardSet = chapterData.card_set;
			currentCardIndex = 0;
			showChapterDropdown = false;

			// Save new position
			await saveUserCursorImmediate();
		} catch (error) {
			console.error('Failed to switch chapter:', error);
		}
	};

	// Handle keyboard navigation
	const handleKeydown = async (event) => {
		if (!isOpen) return;

		if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'ArrowDown') {
			event.preventDefault();
			await nextCard();
		} else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
			event.preventDefault();
			await prevCard();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			onClose();
		}
	};

	// Handle touch/swipe navigation
	const handleTouchStart = (event) => {
		event.preventDefault();
		touchStartY = event.touches[0].clientY;
	};

	const handleTouchMove = (event) => {
		event.preventDefault();
	};

	const handleTouchEnd = (event) => {
		event.preventDefault();
		touchEndY = event.changedTouches[0].clientY;
		handleSwipe();
	};

	const handleSwipe = async () => {
		const swipeThreshold = 50;
		const swipeDistance = touchStartY - touchEndY;

		if (Math.abs(swipeDistance) > swipeThreshold) {
			if (swipeDistance > 0) {
				// Swipe up - next card
				await nextCard();
			} else {
				// Swipe down - previous card
				await prevCard();
			}
		}
	};

	// Handle mouse click navigation
	const handleCardClick = async (event) => {
		if (!isOpen) return;

		const cardElement = event.currentTarget;
		const rect = cardElement.getBoundingClientRect();
		const clickY = event.clientY;
		const cardCenterY = rect.top + rect.height / 2;

		if (clickY < cardCenterY) {
			// Click in upper half - previous card
			await prevCard();
		} else {
			// Click in lower half - next card
			await nextCard();
		}
	};

	// Load user's saved cursor position when modal opens
	const loadUserCursor = async () => {
		if (!currentUser || !currentChapter || !bookData) {
			return;
		}

		try {
			const response = await Api.get(
				`/users/${currentUser.id}/cursor/${bookData?.current?.chapter?.id}`
			);
			if (response && response.card_id) {
				// Find the card index for the saved card
				const savedCardIndex = cardSet?.cards?.findIndex((card) => card.id === response.card_id);
				if (savedCardIndex !== -1) {
					currentCardIndex = savedCardIndex;
					console.log('Loaded user cursor position:', {
						card_id: response.card_id,
						card_index: currentCardIndex
					});
				}
			}
		} catch (error) {
			// If no cursor found, start from beginning (error 404 is expected)
			if (error.response?.status !== 404) {
				console.error('Failed to load user cursor:', error);
			}
		}
	};

	// Reset card index when modal opens
	$: if (isOpen && cardSet?.cards && typeof document !== 'undefined') {
		document.body.style.overflow = 'hidden';
		// Load user's saved position
		loadUserCursor();
	} else if (!isOpen && typeof document !== 'undefined') {
		document.body.style.overflow = '';
	}

	// Add keyboard event listener
	$: if (isOpen && typeof document !== 'undefined') {
		document.addEventListener('keydown', handleKeydown);
	} else if (typeof document !== 'undefined') {
		document.removeEventListener('keydown', handleKeydown);
	}

	// Handle click outside dropdown
	const handleClickOutside = (event) => {
		if (showChapterDropdown && !event.target.closest('.chapter-dropdown')) {
			showChapterDropdown = false;
		}
	};

	// Handle touch events on dropdown to prevent closing when scrolling
	const handleDropdownTouch = (event) => {
		// Prevent the touch event from bubbling up and closing the dropdown
		event.stopPropagation();
	};

	// Add click outside listener
	$: if (isOpen && typeof document !== 'undefined') {
		document.addEventListener('click', handleClickOutside);
	} else if (typeof document !== 'undefined') {
		document.removeEventListener('click', handleClickOutside);
	}

	// Save cursor when modal closes
	const handleClose = async () => {
		await saveUserCursorImmediate(); // Use immediate save for modal close
		onClose();
	};

	// Load recap for current card
	const loadRecap = async () => {
		if (!cardSet?.cards || !cardSet.cards[currentCardIndex]) {
			return;
		}

		const currentCard = cardSet.cards[currentCardIndex];
		isRecapLoading = true;
		recapData = null;

		try {
			const response = await Api.get(`/cards/${currentCard.id}/recap`);
			if (response.error) {
				throw new Error(response.error);
			}
			recapData = response;
			showRecapModal = true;
		} catch (error) {
			console.error('Failed to load recap:', error);
			alert('Failed to load recap. Please try again.');
		} finally {
			isRecapLoading = false;
		}
	};

	// Close recap modal
	const closeRecapModal = () => {
		showRecapModal = false;
		recapData = null;
	};

	// Cleanup on component destroy
	onDestroy(() => {
		if (typeof document !== 'undefined') {
			document.removeEventListener('keydown', handleKeydown);
			document.removeEventListener('click', handleClickOutside);
			document.body.style.overflow = '';
		}

		// Clear any pending cursor save timer
		if (saveCursorTimer) {
			clearTimeout(saveCursorTimer);
			saveCursorTimer = null;
		}
	});
</script>

{#if isOpen && cardSet}
	<div class="fullscreen-overlay dark" on:click={handleClose}>
		<div class="fullscreen-content" on:click|stopPropagation={() => {}}>
			<!-- Header -->
			<div class="fullscreen-header">
				<div class="fullscreen-title-container">
					{#if bookData && bookData.siblings && bookData.siblings.length > 0}
						<div class="chapter-dropdown">
							<button class="chapter-dropdown-toggle" on:click={toggleChapterDropdown}>
								<span class="chapter-title">
									{currentChapter?.title || cardSet.title}
								</span>
								<i class="fas fa-chevron-down" class:rotated={showChapterDropdown} />
							</button>

							{#if showChapterDropdown}
								<div
									class="chapter-dropdown-menu"
									on:touchstart={handleDropdownTouch}
									on:touchmove={handleDropdownTouch}
								>
									{#each bookData.siblings.filter((sibling) => sibling.card_set && sibling.card_set.cards && sibling.card_set.cards.length > 0) as sibling}
										<button
											class="chapter-option"
											class:active={currentChapter?.id === sibling.chapter?.id}
											on:click={() => switchToChapter(sibling)}
										>
											{sibling.chapter?.title || 'Untitled Chapter'}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{:else}
						<div class="fullscreen-title">
							{title || cardSet.title}
						</div>
					{/if}
				</div>
				<button class="fullscreen-close" on:click={handleClose}>
					<i class="fas fa-times" />
				</button>
			</div>

			<!-- Progress bar -->
			<div class="progress-container">
				<div class="progress-bar">
					<div
						class="progress-fill"
						style="width: {((currentCardIndex + 1) / cardSet.cards.length) * 100}%"
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
					{@html cardSet.cards[currentCardIndex]?.body || 'No content'}
				</div>
			</div>

			<!-- Navigation -->
			<div class="fullscreen-nav">
				<button
					class="nav-button prev"
					on:click={() => prevCard()}
					disabled={currentCardIndex === 0}
				>
					<i class="fas fa-chevron-left" />
				</button>

				<div class="nav-indicator">
					{currentCardIndex + 1} / {cardSet.cards.length}
				</div>

				<button class="nav-button graph-btn" on:click={loadRecap}>
					{#if isRecapLoading}
						<div class="spinner-small" />
					{:else}
						<i class="fas fa-chart-line" />
					{/if}
				</button>

				{#if currentCardIndex === cardSet.cards.length - 1 && onNextChapter}
					<button class="nav-button next-chapter" on:click={() => handleNextChapter()}>
						Next Chapter <i class="fas fa-arrow-right" />
					</button>
				{:else}
					<button
						class="nav-button next"
						on:click={() => nextCard()}
						disabled={currentCardIndex === cardSet.cards.length - 1}
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

<!-- Recap Modal -->
{#if showRecapModal && recapData}
	<div class="recap-overlay" on:click={closeRecapModal}>
		<div class="recap-modal" on:click|stopPropagation={() => {}}>
			<div class="recap-header">
				<h3>📖 Story Recap</h3>
				<button class="recap-close" on:click={closeRecapModal}>
					<i class="fas fa-times" />
				</button>
			</div>

			<div class="recap-info">
				<div class="recap-meta">
					<span class="book-title">{recapData.book_title}</span>
					<span class="chapter-title">{recapData.chapter_title}</span>
					<span class="card-position"
						>Card {recapData.card_position} of {recapData.total_cards_in_recap}</span
					>
				</div>
			</div>

			<div class="recap-content">
				{recapData.recap}
			</div>
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

	.fullscreen-title-container {
		flex: 1;
		display: flex;
		align-items: center;
	}

	.fullscreen-title {
		font-size: 1.2rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.dark .fullscreen-title {
		color: #ffffff;
	}

	/* Chapter dropdown styles */
	.chapter-dropdown {
		position: relative;
		display: inline-block;
	}

	.chapter-dropdown-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: none;
		border: none;
		color: #1a1a1a;
		font-size: 1.2rem;
		font-weight: 600;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.dark .chapter-dropdown-toggle {
		color: #ffffff;
	}

	.chapter-dropdown-toggle:hover {
		background: rgba(26, 26, 26, 0.1);
	}

	.dark .chapter-dropdown-toggle:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.chapter-title {
		max-width: 300px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chapter-dropdown-toggle i {
		transition: transform 0.2s ease;
	}

	.chapter-dropdown-toggle i.rotated {
		transform: rotate(180deg);
	}

	.chapter-dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: #ffffff;
		border: 1px solid #e1e5e9;
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 1000;
		max-height: 300px;
		overflow-y: auto;
		overflow-x: hidden;
		margin-top: 0.5rem;
		-webkit-overflow-scrolling: touch; /* Enable smooth scrolling on iOS */
		scrollbar-width: thin; /* Firefox */
		scrollbar-color: #c1c1c1 transparent; /* Firefox */
	}

	/* Webkit scrollbar styles for Chrome/Safari */
	.chapter-dropdown-menu::-webkit-scrollbar {
		width: 6px;
	}

	.chapter-dropdown-menu::-webkit-scrollbar-track {
		background: transparent;
	}

	.chapter-dropdown-menu::-webkit-scrollbar-thumb {
		background: #c1c1c1;
		border-radius: 3px;
	}

	.chapter-dropdown-menu::-webkit-scrollbar-thumb:hover {
		background: #a8a8a8;
	}

	.dark .chapter-dropdown-menu {
		background: #1a1d21;
		border-color: #2d3238;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.chapter-option {
		display: block;
		width: 100%;
		padding: 0.75rem 1rem;
		background: none;
		border: none;
		text-align: left;
		color: #1a1a1a;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
		border-bottom: 1px solid #f0f0f0;
	}

	.dark .chapter-option {
		color: #ffffff;
		border-bottom-color: #2d3238;
	}

	.chapter-option:last-child {
		border-bottom: none;
	}

	.chapter-option:hover {
		background: #f8f9fa;
	}

	.dark .chapter-option:hover {
		background: #2d3238;
	}

	.chapter-option.active {
		background: #007bff;
		color: white;
		font-weight: 600;
	}

	.dark .chapter-option.active {
		background: #007bff;
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

		white-space: normal;
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

	.nav-button.graph-btn {
		background: linear-gradient(135deg, #6f42c1, #8e44ad);
		font-weight: 600;
		padding: 0.75rem 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.nav-button.graph-btn:hover {
		background: linear-gradient(135deg, #5a32a3, #7d3c98);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(111, 66, 193, 0.4);
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

		.chapter-dropdown-toggle {
			font-size: 1rem;
			padding: 0.4rem;
		}

		.chapter-title {
			max-width: 200px;
		}

		.chapter-dropdown-menu {
			left: -1rem;
			right: -1rem;
			max-height: 250px;
			-webkit-overflow-scrolling: touch;
			overscroll-behavior: contain; /* Prevent scroll chaining */
		}

		.chapter-option {
			padding: 0.6rem 0.8rem;
			font-size: 0.9rem;
		}

		.progress-container {
			padding: 0 1rem;
		}

		.fullscreen-card {
			padding: 1rem;
		}

		.card-content {
			font-size: 1.2rem;
			white-space: normal;
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

		/* Recap Modal Mobile Styles */
		.recap-modal {
			max-width: 95%;
			max-height: 90vh;
			border-radius: 8px;
		}

		.recap-header {
			padding: 1rem 1.5rem;
		}

		.recap-header h3 {
			font-size: 1.1rem;
		}

		.recap-info {
			padding: 0.8rem 1.5rem;
		}

		.recap-meta {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.recap-content {
			padding: 1.5rem;
			font-size: 0.9rem;
		}
	}

	/* Recap Modal Styles */
	.recap-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		z-index: 3000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		animation: fadeIn 0.3s ease;
	}

	.recap-modal {
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
		max-width: 800px;
		width: 100%;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.dark .recap-modal {
		background: #1a1d21;
		border: 1px solid #2d3238;
	}

	.recap-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 2rem;
		border-bottom: 1px solid #e1e5e9;
		background: #f8f9fa;
	}

	.dark .recap-header {
		background: #2d3238;
		border-bottom-color: #3f4447;
	}

	.recap-header h3 {
		margin: 0;
		color: #1a1a1a;
		font-size: 1.3rem;
		font-weight: 600;
	}

	.dark .recap-header h3 {
		color: #ffffff;
	}

	.recap-close {
		background: none;
		border: none;
		color: #6c757d;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 4px;
		transition: all 0.2s ease;
		font-size: 1.2rem;
	}

	.recap-close:hover {
		background: rgba(108, 117, 125, 0.1);
		color: #495057;
	}

	.dark .recap-close {
		color: #8899a6;
	}

	.dark .recap-close:hover {
		background: rgba(136, 153, 166, 0.1);
		color: #e7e9ea;
	}

	.recap-info {
		padding: 1rem 2rem;
		background: #ffffff;
		border-bottom: 1px solid #e1e5e9;
	}

	.dark .recap-info {
		background: #1a1d21;
		border-bottom-color: #2d3238;
	}

	.recap-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: center;
	}

	.book-title {
		font-weight: 600;
		color: #1d9bf0;
		font-size: 1rem;
	}

	.dark .book-title {
		color: #1d9bf0;
	}

	.chapter-title {
		font-weight: 500;
		color: #495057;
		font-size: 0.95rem;
	}

	.dark .chapter-title {
		color: #e7e9ea;
	}

	.card-position {
		background: #e9ecef;
		color: #495057;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.dark .card-position {
		background: #3f4447;
		color: #e7e9ea;
	}

	.recap-content {
		flex: 1;
		padding: 2rem;
		overflow-y: auto;
		line-height: 1.7;
		font-size: 1rem;
		color: #1a1a1a;
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.dark .recap-content {
		color: #e7e9ea;
		background: #1a1d21;
	}

	/* Scrollbar styles for recap content */
	.recap-content::-webkit-scrollbar {
		width: 8px;
	}

	.recap-content::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 4px;
	}

	.dark .recap-content::-webkit-scrollbar-track {
		background: #2d3238;
	}

	.recap-content::-webkit-scrollbar-thumb {
		background: #c1c1c1;
		border-radius: 4px;
	}

	.dark .recap-content::-webkit-scrollbar-thumb {
		background: #5a6268;
	}

	.recap-content::-webkit-scrollbar-thumb:hover {
		background: #a8a8a8;
	}

	.dark .recap-content::-webkit-scrollbar-thumb:hover {
		background: #6c757d;
	}

	@media (max-width: 768px) {
		.recap-modal {
			max-width: 90%;
			max-height: 90%;
			border-radius: 8px;
			box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
		}

		.recap-header {
			padding: 1rem 1.5rem;
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.recap-header h3 {
			font-size: 1.1rem;
		}

		.recap-close {
			align-self: flex-end;
		}

		.recap-info {
			padding: 0.8rem 1.5rem;
		}

		.recap-meta {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.book-title {
			font-size: 0.9rem;
		}

		.chapter-title {
			font-size: 0.85rem;
		}

		.card-position {
			font-size: 0.75rem;
		}

		.recap-content {
			padding: 1.5rem;
			font-size: 0.9rem;
		}

		.recap-content::-webkit-scrollbar {
			width: 6px;
		}

		.recap-content::-webkit-scrollbar-track {
			background: #f1f1f1;
		}

		.dark .recap-content::-webkit-scrollbar-track {
			background: #2d3238;
		}

		.recap-content::-webkit-scrollbar-thumb {
			background: #c1c1c1;
		}

		.dark .recap-content::-webkit-scrollbar-thumb {
			background: #5a6268;
		}

		.recap-content::-webkit-scrollbar-thumb:hover {
			background: #a8a8a8;
		}

		.dark .recap-content::-webkit-scrollbar-thumb:hover {
			background: #6c757d;
		}
	}
</style>
