<script>
	import { theme } from '$lib/stores/main';
	import { user } from '$lib/stores/user';
	import Api from '$lib/api/api.js';

	export let chapter;

	let currentCardIndex = 0;
	let cards = [];
	let isLoading = false;
	let isFullscreen = false;
	let touchStartY = 0;
	let touchEndY = 0;
	let isEditing = false;
	let editingCardIndex = -1;
	let editingContent = '';

	// Split chapter body into sentence-based cards
	const createReadingCards = async () => {
		if (!chapter?.id) {
			cards = [];
			return;
		}

		try {
			const response = await Api.get(`/chapters/${chapter.id}/chapter_body`);
			const content = response.body;

			if (!content || content === '<p>Start writing your chapter...</p>') {
				cards = [];
				return;
			}

			// Split by sentences (periods, exclamation marks, question marks)
			// Also handle common abbreviations and multiple punctuation
			const sentences = content
				.replace(/([.!?])\s*(?=[A-Z])/g, '$1|') // Split on sentence endings followed by capital letters
				.split('|')
				.map((sentence) => sentence.trim())
				.filter((sentence) => sentence.length > 10) // Filter out very short fragments
				.map((sentence, index) => ({
					id: index,
					content: sentence,
					position: index + 1
				}));

			cards = sentences;
		} catch (error) {
			console.error('Failed to fetch chapter body:', error);
			cards = [];
		}
	};

	// Navigation functions
	const goToNext = () => {
		if (currentCardIndex < cards.length - 1) {
			currentCardIndex++;
		}
	};

	const goToPrevious = () => {
		if (currentCardIndex > 0) {
			currentCardIndex--;
		}
	};

	const goToCard = (index) => {
		if (index >= 0 && index < cards.length) {
			currentCardIndex = index;
		}
	};

	// Touch/swipe navigation for fullscreen mode
	const handleTouchStart = (event) => {
		event.preventDefault();
		touchStartY = event.touches[0].clientY;
	};

	const handleTouchEnd = (event) => {
		event.preventDefault();
		touchEndY = event.changedTouches[0].clientY;
		const diffY = touchStartY - touchEndY;
		const minSwipeDistance = 50;

		if (Math.abs(diffY) > minSwipeDistance) {
			if (diffY > 0) {
				// Swipe up - next card
				goToNext();
			} else {
				// Swipe down - previous card
				goToPrevious();
			}
		}
	};

	const handleTouchMove = (event) => {
		event.preventDefault();
	};

	const toggleFullscreen = () => {
		isFullscreen = !isFullscreen;
	};

	// Text editing functions
	const startEditing = (index) => {
		if (!user?.admin) return;
		editingCardIndex = index;
		editingContent = cards[index].content;
		isEditing = true;
	};

	const saveEdit = () => {
		if (editingCardIndex === -1) return;

		const newContent = editingContent.trim();
		if (newContent) {
			cards[editingCardIndex].content = newContent;
		}

		stopEditing();
	};

	const stopEditing = () => {
		isEditing = false;
		editingCardIndex = -1;
		editingContent = '';
	};

	const handleKeydown = (event) => {
		if (isEditing) {
			if (event.key === 'Enter') {
				event.preventDefault();
				splitCard();
			} else if (event.key === 'Backspace' && editingContent === '') {
				event.preventDefault();
				joinWithPrevious();
			} else if (event.key === 'Escape') {
				event.preventDefault();
				stopEditing();
			}
		} else {
			if (event.key === 'ArrowRight' || event.key === ' ') {
				event.preventDefault();
				goToNext();
			} else if (event.key === 'ArrowLeft') {
				event.preventDefault();
				goToPrevious();
			} else if (event.key === 'Escape' && isFullscreen) {
				event.preventDefault();
				isFullscreen = false;
			}
		}
	};

	const splitCard = () => {
		if (editingCardIndex === -1) return;

		const selection = window.getSelection();
		if (!selection.rangeCount) {
			saveEdit();
			return;
		}

		const range = selection.getRangeAt(0);
		const currentContent = editingContent.trim();

		// Get cursor position in the contenteditable div
		const cursorPosition = range.startOffset;
		const textContent = range.startContainer.textContent || '';

		if (cursorPosition === 0 || cursorPosition === textContent.length) {
			// Cursor at start or end, just save
			saveEdit();
			return;
		}

		const beforeCursor = textContent.substring(0, cursorPosition).trim();
		const afterCursor = textContent.substring(cursorPosition).trim();

		if (!beforeCursor || !afterCursor) {
			// Not enough content to split
			saveEdit();
			return;
		}

		// Update current card
		cards[editingCardIndex].content = beforeCursor;

		// Insert new card after current
		const newCard = {
			id: Date.now(), // Temporary ID
			content: afterCursor,
			position: cards[editingCardIndex].position + 1
		};

		// Update positions for all cards after the split
		for (let i = editingCardIndex + 1; i < cards.length; i++) {
			cards[i].position += 1;
		}

		cards.splice(editingCardIndex + 1, 0, newCard);

		// Move to the new card
		currentCardIndex = editingCardIndex + 1;
		stopEditing();
	};

	const joinWithPrevious = () => {
		if (editingCardIndex <= 0) return;

		const previousCard = cards[editingCardIndex - 1];
		const currentCard = cards[editingCardIndex];

		// Join content
		previousCard.content = previousCard.content + ' ' + currentCard.content;

		// Remove current card
		cards.splice(editingCardIndex, 1);

		// Update positions for remaining cards
		for (let i = editingCardIndex; i < cards.length; i++) {
			cards[i].position -= 1;
		}

		// Move to previous card
		currentCardIndex = editingCardIndex - 1;
		stopEditing();
	};

	// Initialize cards when chapter changes
	$: if (chapter?.id) {
		createReadingCards();
		currentCardIndex = 0;
	}

	// Add keyboard listener
	import { onMount, onDestroy } from 'svelte';

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeydown);
	});
</script>

<div class="reader-container {$theme}">
	<div class="reader-header">
		<h2>Reader</h2>
		{#if cards.length > 0}
			<div class="header-controls">
				<div class="progress-info">
					<span class="current-position">{currentCardIndex + 1}</span>
					<span class="separator">/</span>
					<span class="total-cards">{cards.length}</span>
				</div>
				<button class="fullscreen-button" on:click={toggleFullscreen}>
					<i class="fas fa-expand" />
				</button>
			</div>
		{/if}
	</div>

	{#if !chapter?.id}
		<div class="empty-state">
			<p>No chapter selected</p>
			<p class="subtitle">Please select a chapter to read.</p>
		</div>
	{:else if cards.length === 0}
		<div class="empty-state">
			<p>No readable content found</p>
			<p class="subtitle">The chapter content couldn't be split into readable cards.</p>
		</div>
	{:else}
		<div class="reader-content">
			<div class="card-container">
				<div class="reading-card">
					{#if isEditing && editingCardIndex === currentCardIndex}
						<div class="card-content editing">
							<div
								class="edit-content"
								contenteditable="true"
								bind:innerHTML={editingContent}
								on:blur={saveEdit}
								on:keydown={handleKeydown}
								placeholder="Edit card content..."
								autofocus
							/>
						</div>
						<div class="card-footer">
							<span class="card-number">{cards[currentCardIndex].position}</span>
							<div class="edit-hint">
								Press Enter to split • Backspace at start to join • Escape to cancel
							</div>
						</div>
					{:else}
						<div class="card-content clickable" on:click={() => startEditing(currentCardIndex)}>
							{@html cards[currentCardIndex].content}
						</div>
						<div class="card-footer">
							<span class="card-number">{cards[currentCardIndex].position}</span>
						</div>
					{/if}
				</div>
			</div>

			<div class="navigation-controls">
				<button
					class="nav-button prev-button"
					on:click={goToPrevious}
					disabled={currentCardIndex === 0}
				>
					<i class="fas fa-chevron-left" />
					Previous
				</button>

				<div class="progress-bar">
					<div
						class="progress-fill"
						style="width: {((currentCardIndex + 1) / cards.length) * 100}%"
					/>
				</div>

				<button
					class="nav-button next-button"
					on:click={goToNext}
					disabled={currentCardIndex === cards.length - 1}
				>
					Next
					<i class="fas fa-chevron-right" />
				</button>
			</div>

			<div class="card-navigation">
				<div class="nav-hint">
					<i class="fas fa-keyboard" />
					Use arrow keys or spacebar to navigate
				</div>

				<div class="card-thumbnails">
					{#each cards as card, index}
						<button
							class="thumbnail-button"
							class:active={index === currentCardIndex}
							on:click={() => goToCard(index)}
						>
							{card.position}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Fullscreen Modal -->
{#if isFullscreen && cards.length > 0}
	<div
		class="fullscreen-modal"
		on:touchstart={handleTouchStart}
		on:touchmove={handleTouchMove}
		on:touchend={handleTouchEnd}
	>
		<div class="fullscreen-header">
			<button class="close-button" on:click={toggleFullscreen}>
				<i class="fas fa-times" />
			</button>
		</div>

		<div class="fullscreen-content">
			<div class="fullscreen-card">
				<div class="card-text">
					{@html cards[currentCardIndex].content}
				</div>
			</div>
		</div>

		<div class="fullscreen-footer">
			<div class="fullscreen-progress">
				<div class="progress-dots">
					{#each cards as card, index}
						<div
							class="progress-dot"
							class:active={index === currentCardIndex}
							on:click={() => goToCard(index)}
						/>
					{/each}
				</div>
				<div class="progress-text">
					{currentCardIndex + 1} / {cards.length}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.reader-container {
		padding: 1rem;
		max-width: 800px;
		margin: 0 auto;
	}

	.reader-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e9ecef;
	}

	.dark .reader-header {
		border-bottom-color: #3f4447;
	}

	.reader-header h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-color);
	}

	.header-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.progress-info {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--text-color);
	}

	.fullscreen-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: #1d9bf0;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.fullscreen-button:hover {
		background: #1a8cd8;
		transform: scale(1.05);
	}

	.current-position {
		color: #1d9bf0;
	}

	.separator {
		color: #6c757d;
	}

	.total-cards {
		color: #6c757d;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 2rem;
	}

	.empty-state p {
		font-size: 1.2rem;
		color: #6c757d;
		margin: 0;
	}

	.dark .empty-state p {
		color: #71767b;
	}

	.empty-state .subtitle {
		font-size: 1rem;
		color: #adb5bd;
		margin-top: 0.5rem;
	}

	.dark .empty-state .subtitle {
		color: #536471;
	}

	.reader-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.card-container {
		display: flex;
		justify-content: center;
		min-height: 300px;
	}

	.reading-card {
		background: white;
		border: 1px solid #e9ecef;
		border-radius: 12px;
		padding: 2rem;
		max-width: 600px;
		width: 100%;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		position: relative;
		transition: all 0.3s ease;
	}

	.dark .reading-card {
		background: #1e2732;
		border-color: #3f4447;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.reading-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
	}

	.dark .reading-card:hover {
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	}

	.card-content {
		font-size: 1.2rem;
		line-height: 1.6;
		/* color: var(--text-color); */
		color: #fff;
		margin-bottom: 1rem;
		text-align: justify;
	}

	.card-content :global(*) {
		color: #fff !important;
	}

	.card-content.clickable {
		cursor: text;
		user-select: text;
	}

	.card-content.clickable:hover {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
	}

	.card-content.editing {
		cursor: text;
	}

	.edit-content {
		width: 100%;
		min-height: 200px;
		background: transparent;
		border: none;
		outline: none;
		font-size: 1.2rem;
		line-height: 1.6;
		color: #fff;
		font-family: inherit;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	.edit-content:empty:before {
		content: attr(placeholder);
		color: rgba(255, 255, 255, 0.5);
		pointer-events: none;
	}

	.edit-hint {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
		margin-top: 0.5rem;
		text-align: center;
	}

	.card-footer {
		display: flex;
		justify-content: flex-end;
		padding-top: 1rem;
		border-top: 1px solid #e9ecef;
	}

	.dark .card-footer {
		border-top-color: #3f4447;
	}

	.card-number {
		background: #f8f9fa;
		color: #6c757d;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.dark .card-number {
		background: #2f3336;
		color: #71767b;
	}

	.navigation-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0 1rem;
	}

	.nav-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #1d9bf0;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 120px;
		justify-content: center;
	}

	.nav-button:hover:not(:disabled) {
		background: #1a8cd8;
		transform: translateY(-1px);
	}

	.nav-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.progress-bar {
		flex: 1;
		height: 8px;
		background: #e9ecef;
		border-radius: 4px;
		overflow: hidden;
	}

	.dark .progress-bar {
		background: #3f4447;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #1d9bf0, #1a8cd8);
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.card-navigation {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}

	.nav-hint {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #6c757d;
		font-size: 0.9rem;
	}

	.dark .nav-hint {
		color: #71767b;
	}

	.card-thumbnails {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		justify-content: center;
		max-width: 100%;
	}

	.thumbnail-button {
		width: 40px;
		height: 40px;
		border: 1px solid #e9ecef;
		background: white;
		color: #6c757d;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.9rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.dark .thumbnail-button {
		background: #1e2732;
		border-color: #3f4447;
		color: #71767b;
	}

	.thumbnail-button:hover {
		background: #f8f9fa;
		border-color: #1d9bf0;
		color: #1d9bf0;
	}

	.dark .thumbnail-button:hover {
		background: #2f3336;
		border-color: #1d9bf0;
		color: #1d9bf0;
	}

	.thumbnail-button.active {
		background: #1d9bf0;
		border-color: #1d9bf0;
		color: white;
	}

	@media (max-width: 768px) {
		.reader-container {
			padding: 0.5rem;
		}

		.reader-header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.reading-card {
			padding: 1.5rem;
			margin: 0 0.5rem;
		}

		.card-content {
			font-size: 1.1rem;
		}

		.navigation-controls {
			flex-direction: column;
			gap: 1rem;
		}

		.nav-button {
			width: 100%;
			min-width: auto;
		}

		.card-thumbnails {
			gap: 0.25rem;
		}

		.thumbnail-button {
			width: 35px;
			height: 35px;
			font-size: 0.8rem;
		}
	}

	/* Fullscreen Modal Styles */
	.fullscreen-modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: #000;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		touch-action: none;
		-webkit-overflow-scrolling: touch;
	}

	.fullscreen-header {
		position: absolute;
		top: 0;
		right: 0;
		z-index: 10;
		padding: 1rem;
	}

	.close-button {
		width: 50px;
		height: 50px;
		background: rgba(0, 0, 0, 0.5);
		color: white;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
		transition: all 0.2s ease;
	}

	.close-button:hover {
		background: rgba(0, 0, 0, 0.7);
		transform: scale(1.1);
	}

	.fullscreen-content {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.fullscreen-card {
		max-width: 90vw;
		max-height: 80vh;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 20px;
		padding: 3rem;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: flex-start;
		justify-content: flex-start;
		text-align: left;
	}

	.card-text {
		font-size: 2rem;
		line-height: 1.4;
		color: white;
		font-weight: 300;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.card-text :global(*) {
		color: white !important;
	}

	.fullscreen-footer {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 2rem;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
	}

	.fullscreen-progress {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.progress-dots {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
		max-width: 100%;
	}

	.progress-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.progress-dot:hover {
		background: rgba(255, 255, 255, 0.5);
		transform: scale(1.2);
	}

	.progress-dot.active {
		background: #1d9bf0;
		transform: scale(1.3);
	}

	.progress-text {
		color: white;
		font-size: 1.1rem;
		font-weight: 500;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}

	@media (max-width: 768px) {
		.fullscreen-content {
			padding: 1rem;
		}

		.fullscreen-card {
			padding: 2rem;
		}

		.card-text {
			font-size: 1.5rem;
		}

		.fullscreen-footer {
			padding: 1.5rem;
		}

		.progress-dot {
			width: 10px;
			height: 10px;
		}
	}
</style>
