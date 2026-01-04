<script>
	import { theme } from '$lib/stores/main';
	import { user } from '$lib/stores/user';
	import Api from '$lib/api/api.js';
	import { openFullscreenModal } from '$lib/stores/fullscreenModal';
	import { browser } from '$app/environment';

	export let chapter;

	let currentCardIndex = 0;
	let cards = [];
	let isLoading = false;

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

	const toggleFullscreen = () => {
		if (browser && cards.length > 0) {
			// Convert cards to the format expected by the fullscreen modal
			const cardSet = {
				id: chapter?.id || 'reader',
				title: chapter?.title || 'Reader',
				cards: cards.map((card) => ({
					id: card.id,
					body: card.content,
					position: card.position
				}))
			};
			// Try to get book_id from chapter (if it's root) or pass null to use fallback
			const bookId = chapter?.chapter_id ? null : chapter?.id;
			openFullscreenModal(cardSet, chapter?.title || 'Reader', null, chapter, null, bookId);
		}
	};

	// Text editing functions
	const saveEdit = (index, newContent) => {
		const trimmedContent = newContent.trim();
		if (trimmedContent) {
			cards[index].content = trimmedContent;
		}
	};

	const handleKeydown = (event, cardIndex) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			const selection = window.getSelection();
			if (selection?.rangeCount) {
				const range = selection.getRangeAt(0);
				const textContent = range.startContainer.textContent || '';
				const cursorPosition = range.startOffset;
				const afterCursor = textContent.substring(cursorPosition);
				console.log('🔍 ENTER - Text after cursor:', `"${afterCursor}"`);
				if (afterCursor.length > 0) {
					console.log('✅ New Cardable');
				}
			}
			splitCard(cardIndex);
		} else if (event.key === 'Backspace') {
			const selection = window.getSelection();
			if (selection?.rangeCount) {
				const range = selection.getRangeAt(0);
				const textContent = range.startContainer.textContent || '';
				const cursorPosition = range.startOffset;

				// Check if cursor is at the beginning and there's no text before it
				if (cursorPosition === 0) {
					// Get the contenteditable element to check full text before cursor
					const contentEditable = selection.anchorNode?.parentElement?.closest('[contenteditable]');
					if (contentEditable) {
						const fullText = contentEditable.textContent || '';

						// Calculate actual cursor position in full text
						let actualCursorPosition = 0;
						const textNodes = [];
						const walker = document.createTreeWalker(
							contentEditable,
							NodeFilter.SHOW_TEXT,
							null,
							false
						);

						let textNode;
						while ((textNode = walker.nextNode())) {
							textNodes.push(textNode);
						}

						// Find which text node we're in and calculate position
						for (let i = 0; i < textNodes.length; i++) {
							if (textNodes[i] === selection.anchorNode) {
								// Add up all the text before this node
								for (let j = 0; j < i; j++) {
									actualCursorPosition += textNodes[j].textContent?.length || 0;
								}
								// Add the offset within this node
								actualCursorPosition += selection.anchorOffset;
								break;
							}
						}

						const textBeforeCursor = fullText.substring(0, actualCursorPosition).trim();
						console.log('🔍 BACKSPACE - Text before cursor:', `"${textBeforeCursor}"`);

						// If there's no text before cursor, join with previous card
						if (textBeforeCursor === '') {
							event.preventDefault();
							console.log('✅ Joining with previous card');
							joinWithPrevious(cardIndex);
						}
					}
				}
			}
		}
	};

	const splitCard = (cardIndex) => {
		const selection = window.getSelection();
		if (!selection?.rangeCount) return;

		// Get the contenteditable element
		const contentEditable = selection.anchorNode?.parentElement?.closest('[contenteditable]');
		if (!contentEditable) return;

		// Get the full text content
		const fullText = contentEditable.textContent || '';

		// Debug: Log the selection details
		console.log('Selection debug:', {
			anchorNode: selection.anchorNode,
			anchorOffset: selection.anchorOffset,
			anchorNodeText: selection.anchorNode?.textContent,
			contentEditable: contentEditable,
			fullText: fullText
		});

		// Try a simpler approach - use the anchorOffset directly
		let cursorPosition = selection.anchorOffset;

		// If we're not at the start, try to find the actual position
		if (cursorPosition === 0 && fullText.length > 0) {
			// The cursor might be at the beginning of a text node that's not the first one
			// Let's try to find the actual position by looking at the text node's position
			const textNodes = [];
			const walker = document.createTreeWalker(contentEditable, NodeFilter.SHOW_TEXT, null, false);

			let textNode;
			while ((textNode = walker.nextNode())) {
				textNodes.push(textNode);
			}

			// Find which text node we're in and calculate position
			for (let i = 0; i < textNodes.length; i++) {
				if (textNodes[i] === selection.anchorNode) {
					// Add up all the text before this node
					for (let j = 0; j < i; j++) {
						cursorPosition += textNodes[j].textContent?.length || 0;
					}
					// Add the offset within this node
					cursorPosition += selection.anchorOffset;
					break;
				}
			}
		}

		const beforeCursor = fullText.substring(0, cursorPosition).trim();
		const afterCursor = fullText.substring(cursorPosition).trim();
		console.log({ beforeCursor, afterCursor, cursorPosition, fullText });

		// Check if there's content after cursor to create a new card
		if (afterCursor.length > 0) {
			console.log('✅ Creating new card with content:', `"${afterCursor}"`);
			console.log('🔍 Before cursor content:', `"${beforeCursor}"`);

			// Update current card with content before cursor
			cards[cardIndex].content = beforeCursor;

			// Create new card with content after cursor
			const newCard = {
				id: Date.now(), // Temporary ID
				content: afterCursor,
				position: cards[cardIndex].position + 1
			};

			// Update positions for all cards after the split
			for (let i = cardIndex + 1; i < cards.length; i++) {
				cards[i].position += 1;
			}

			// Insert new card right after current card
			cards.splice(cardIndex + 1, 0, newCard);

			// Move to the new card
			currentCardIndex = cardIndex + 1;
			console.log('✅ Moved to new card at position:', currentCardIndex + 1);
		}
	};

	const joinWithPrevious = (cardIndex) => {
		if (cardIndex <= 0) return;

		const previousCard = cards[cardIndex - 1];
		const currentCard = cards[cardIndex];

		// Join content
		previousCard.content = previousCard.content + ' ' + currentCard.content;

		// Remove current card
		cards.splice(cardIndex, 1);

		// Update positions for remaining cards
		for (let i = cardIndex; i < cards.length; i++) {
			cards[i].position -= 1;
		}

		// Move to previous card
		currentCardIndex = cardIndex - 1;
	};

	// Initialize cards when chapter changes
	$: if (chapter?.id) {
		createReadingCards();
		currentCardIndex = 0;
	}
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
					<div class="card-content">
						<div
							class="edit-content"
							contenteditable="true"
							bind:innerHTML={cards[currentCardIndex].content}
							on:blur={(e) => saveEdit(currentCardIndex, e.target.innerHTML)}
							on:keydown={(e) => handleKeydown(e, currentCardIndex)}
							placeholder="Edit card content..."
						/>
					</div>
					<div class="card-footer">
						<span class="card-number">{cards[currentCardIndex].position}</span>
						<div class="edit-hint">Press Enter to split • Backspace at start to join</div>
					</div>
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

<style>
	.reader-container {
		padding: 1rem;
		max-width: 800px;
		margin: 0 auto;
		position: relative;
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
			max-width: 100%;
		}

		.reader-header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
			margin-bottom: 1rem;
		}

		.reader-header h2 {
			font-size: 1.2rem;
		}

		.progress-info {
			font-size: 1rem;
		}

		.reading-card {
			padding: 1.5rem;
			margin: 0;
			border-radius: 8px;
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
			padding: 0.75rem;
		}

		.card-thumbnails {
			gap: 0.25rem;
			justify-content: center;
		}

		.thumbnail-button {
			width: 35px;
			height: 35px;
			font-size: 0.8rem;
		}

		.card-navigation {
			margin-top: 1rem;
		}

		.nav-hint {
			font-size: 0.8rem;
		}
	}
</style>
