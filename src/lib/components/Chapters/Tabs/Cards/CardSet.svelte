<script>
	import Api from '$lib/api/api.js';
	import { theme } from '$lib/stores/main';
	import Card from './Card.svelte';
	import { onMount, onDestroy } from 'svelte';

	export let cardSet;
	export let user;
	export let onDelete;
	export let onUpdate;
	export let onRefresh;
	export let chapter;

	// Debug: Log user info
	$: if (user) {
		console.log('User object:', user);
		console.log('User admin property:', user?.admin);
	}

	let isExpanded = false;
	let isEditing = false;
	let editedTitle = cardSet.title;
	let showCreateCardForm = false;
	let newCardBody = '';
	let isLoading = false;

	// Toggle card set expansion
	const toggleExpanded = () => {
		isExpanded = !isExpanded;
	};

	// Start editing card set title
	const startEditing = () => {
		editedTitle = cardSet.title;
		isEditing = true;
	};

	// Save card set changes
	const saveChanges = async () => {
		if (!editedTitle.trim()) return;

		try {
			await onUpdate({ title: editedTitle.trim() });
			isEditing = false;
		} catch (err) {
			console.error('Failed to update card set:', err);
		}
	};

	// Cancel editing
	const cancelEditing = () => {
		editedTitle = cardSet.title;
		isEditing = false;
	};

	// Create new card
	const createCard = async () => {
		if (!newCardBody.trim()) return;

		try {
			const response = await Api.post(`/card_sets/${cardSet.id}/cards`, {
				body: newCardBody.trim(),
				position: cardSet.cards?.length || 0
			});

			// Update local card set with new card
			cardSet.cards = [...(cardSet.cards || []), response];
			newCardBody = '';
			showCreateCardForm = false;
		} catch (err) {
			console.error('Failed to create card:', err);
		}
	};

	// Delete card
	const deleteCard = async (cardId) => {
		try {
			await Api.delete(`/cards/${cardId}`);
			cardSet.cards = cardSet.cards.filter((card) => card.id !== cardId);
		} catch (err) {
			console.error('Failed to delete card:', err);
		}
	};

	// Update card
	const updateCard = async (cardId, updates) => {
		try {
			const response = await Api.put(`/cards/${cardId}`, updates);
			cardSet.cards = cardSet.cards.map((card) =>
				card.id === cardId ? { ...card, ...response } : card
			);
		} catch (err) {
			console.error('Failed to update card:', err);
		}
	};

	// Batch update cards (for Reader-style editing)
	const batchUpdateCards = async (updatedCards) => {
		try {
			await Api.post(`/card_sets/${cardSet.id}/batch_create_cards`, {
				cards: updatedCards.map((card, index) => ({
					body: card.body,
					position: index + 1
				}))
			});

			// Update local cards
			cardSet.cards = updatedCards;
		} catch (err) {
			console.error('Failed to batch update cards:', err);
		}
	};

	// Handle keyboard events for inline editing
	const handleKeydown = (event, cardIndex) => {
		console.log('🔍 CardSet handleKeydown:', event.key, 'cardIndex:', cardIndex);

		if (event.key === 'Enter') {
			if (event.shiftKey) {
				// Shift+Enter: Insert new line (let default behavior happen)
				console.log('✅ Shift+Enter pressed - inserting new line');
				return; // Don't prevent default, let it insert new line
			} else {
				// Enter: Split card
				event.preventDefault();
				console.log('✅ Enter pressed - splitting card at index:', cardIndex);
				splitCard(cardIndex);
			}
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
						const walker = document.createTreeWalker(contentEditable, NodeFilter.SHOW_TEXT);

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

						// If there's no text before cursor, join with previous card
						if (textBeforeCursor === '') {
							event.preventDefault();
							console.log(
								'✅ Backspace at start - joining with previous card at index:',
								cardIndex
							);
							joinWithPrevious(cardIndex);
						}
					}
				}
			}
		}
	};

	// Split card at cursor position
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
			const walker = document.createTreeWalker(contentEditable, NodeFilter.SHOW_TEXT);

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

			// Create updated cards array
			const updatedCards = [...cardSet.cards];

			// Update current card with content before cursor
			updatedCards[cardIndex] = { ...updatedCards[cardIndex], body: beforeCursor };

			// Create new card with content after cursor
			const newCard = {
				id: Date.now(), // Temporary ID
				body: afterCursor,
				position: updatedCards[cardIndex].position + 1
			};

			// Update positions for all cards after the split
			for (let i = cardIndex + 1; i < updatedCards.length; i++) {
				updatedCards[i] = { ...updatedCards[i], position: updatedCards[i].position + 1 };
			}

			// Insert new card right after current card
			updatedCards.splice(cardIndex + 1, 0, newCard);

			// Mark as unsaved instead of immediate API call
			hasUnsavedChanges = true;
			pendingChanges = [];

			// Add all cards to pending changes
			updatedCards.forEach((card, index) => {
				pendingChanges.push({ cardIndex: index, content: card.body });
			});

			// Update local state
			cardSet.cards = updatedCards;
		}
	};

	// Join with previous card
	const joinWithPrevious = (cardIndex) => {
		if (cardIndex <= 0) return;

		const updatedCards = [...cardSet.cards];
		const previousCard = updatedCards[cardIndex - 1];
		const currentCard = updatedCards[cardIndex];

		// Join content
		previousCard.body = previousCard.body + ' ' + currentCard.body;

		// Remove current card
		updatedCards.splice(cardIndex, 1);

		// Update positions for remaining cards
		for (let i = cardIndex; i < updatedCards.length; i++) {
			updatedCards[i] = { ...updatedCards[i], position: updatedCards[i].position - 1 };
		}

		// Mark as unsaved instead of immediate API call
		hasUnsavedChanges = true;
		pendingChanges = [];

		// Add all cards to pending changes
		updatedCards.forEach((card, index) => {
			pendingChanges.push({ cardIndex: index, content: card.body });
		});

		// Update local state
		cardSet.cards = updatedCards;
	};

	// Track unsaved changes
	let hasUnsavedChanges = false;
	let pendingChanges = [];

	// Mark changes as unsaved
	const markAsUnsaved = (cardIndex, newContent) => {
		hasUnsavedChanges = true;
		// Update or add to pending changes
		const existingIndex = pendingChanges.findIndex((change) => change.cardIndex === cardIndex);
		if (existingIndex >= 0) {
			pendingChanges[existingIndex] = { cardIndex, content: newContent };
		} else {
			pendingChanges.push({ cardIndex, content: newContent });
		}
	};

	// Save all pending changes
	const saveAllChanges = async () => {
		if (!hasUnsavedChanges || pendingChanges.length === 0) return;

		try {
			const updatedCards = [...cardSet.cards];

			// Apply all pending changes
			pendingChanges.forEach(({ cardIndex, content }) => {
				updatedCards[cardIndex] = { ...updatedCards[cardIndex], body: content };
			});

			// Send batch update
			await batchUpdateCards(updatedCards);

			// Clear pending changes
			hasUnsavedChanges = false;
			pendingChanges = [];

			console.log('✅ All changes saved successfully');
		} catch (error) {
			console.error('❌ Failed to save changes:', error);
		}
	};

	// Save card content on blur (now just marks as unsaved)
	const saveCardContent = (cardIndex, newContent) => {
		const trimmedContent = newContent.trim();
		if (trimmedContent) {
			markAsUnsaved(cardIndex, trimmedContent);
		}
	};

	// Import fullscreen modal functionality
	import { openFullscreenModal } from '$lib/stores/fullscreenModal';
	import { browser } from '$app/environment';

	// Toggle fullscreen view
		const toggleFullscreen = () => {
		if (browser) {
			// Try to get book_id from chapter (if it's root) or pass null to use fallback
			const bookId = chapter?.chapter_id ? null : chapter?.id;
			openFullscreenModal(cardSet, cardSet.title, null, chapter, null, bookId);
		}
	};

	// Toggle card set selection
	const toggleSelection = async () => {
		try {
			await onUpdate({ selected: !cardSet.selected });
		} catch (err) {
			console.error('Failed to toggle selection:', err);
		}
	};
</script>

<div class="card-set {$theme}" class:expanded={isExpanded}>
	<div class="card-set-header" on:click={toggleExpanded}>
		<div class="header-left">
			<button class="expand-button">
				<i class="fas fa-chevron-{isExpanded ? 'down' : 'right'}" />
			</button>

			{#if isEditing && user?.admin}
				<input
					type="text"
					bind:value={editedTitle}
					class="title-input"
					on:click|stopPropagation={() => {}}
				/>
			{:else}
				<h3 class="title">{cardSet.title}</h3>
			{/if}
		</div>

		<div class="header-right">
			{#if true}
				<button
					class="selection-button"
					class:selected={cardSet.selected}
					on:click|stopPropagation={toggleSelection}
					title="Toggle selection"
				>
					<i class="fas fa-check" />
				</button>

				{#if isEditing}
					<button
						class="save-button"
						on:click|stopPropagation={saveChanges}
						disabled={!editedTitle.trim()}
					>
						<i class="fas fa-save" />
					</button>
					<button class="cancel-button" on:click|stopPropagation={cancelEditing}>
						<i class="fas fa-times" />
					</button>
				{:else}
					<button class="edit-button" on:click|stopPropagation={startEditing}>
						<i class="fas fa-edit" />
					</button>
					<button class="delete-button" on:click|stopPropagation={onDelete} title="Delete card set">
						<i class="fas fa-trash" />
					</button>
				{/if}
			{/if}

			<!-- Fullscreen button -->
			<button
				class="fullscreen-button"
				on:click|stopPropagation={toggleFullscreen}
				title="View fullscreen"
			>
				<i class="fas fa-expand" />
			</button>
		</div>
	</div>

	{#if isExpanded}
		<div class="card-set-content">
			<div class="cards-header">
				<h4>Cards ({cardSet.cards?.length || 0})</h4>
				{#if user?.admin}
					<button
						class="add-card-button"
						on:click={() => (showCreateCardForm = !showCreateCardForm)}
					>
						<i class="fas fa-plus" />
						Add Card
					</button>
				{/if}
			</div>

			{#if showCreateCardForm && user?.admin}
				<div class="create-card-form">
					<textarea
						bind:value={newCardBody}
						placeholder="Enter card content..."
						class="card-body-input"
						rows="3"
					/>
					<div class="form-actions">
						<button class="save-button" on:click={createCard} disabled={!newCardBody.trim()}>
							Create
						</button>
						<button
							class="cancel-button"
							on:click={() => {
								showCreateCardForm = false;
								newCardBody = '';
							}}
						>
							Cancel
						</button>
					</div>
				</div>
			{/if}

			{#if cardSet.cards?.length === 0}
				<div class="empty-cards">
					<p>No cards in this set yet</p>
					{#if user?.admin}
						<p class="subtitle">Add your first card to get started!</p>
					{/if}
				</div>
			{:else}
				<div class="cards-list">
					{#each cardSet.cards as card, cardIndex (card.id)}
						<Card
							{card}
							{user}
							onDelete={() => deleteCard(card.id)}
							onUpdate={(updates) => updateCard(card.id, updates)}
							onKeydown={(event) => handleKeydown(event, cardIndex)}
							onSaveContent={(cardId, content) => {
								// Mark as unsaved instead of immediate API call
								markAsUnsaved(cardIndex, content);
							}}
						/>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Save indicator -->
	{#if hasUnsavedChanges}
		<div class="save-indicator">
			<div class="save-indicator-content">
				<span class="save-text">Unsaved changes</span>
				<button class="save-all-button" on:click={saveAllChanges}>
					<i class="fas fa-save" />
					Save All
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.card-set {
		border: 1px solid #e9ecef;
		border-radius: 8px;
		background: white;
		overflow: hidden;
		transition: all 0.2s ease;
	}

	.dark .card-set {
		background: #1e2732;
		border-color: #3f4447;
	}

	.card-set-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		cursor: pointer;
		background: #f8f9fa;
		border-bottom: 1px solid #e9ecef;
		transition: background-color 0.2s ease;
	}

	.dark .card-set-header {
		background: #2f3336;
		border-bottom-color: #3f4447;
	}

	.card-set-header:hover {
		background: #e9ecef;
	}

	.dark .card-set-header:hover {
		background: #3f4447;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
	}

	.expand-button {
		background: none;
		border: none;
		color: #6c757d;
		cursor: pointer;
		padding: 0.25rem;
		transition: color 0.2s ease;
	}

	.expand-button:hover {
		color: #495057;
	}

	.title {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-color);
	}

	.title-input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #ced4da;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 600;
	}

	.dark .title-input {
		background: #1e2732;
		border-color: #3f4447;
		color: #e7e9ea;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.selection-button,
	.edit-button,
	.delete-button,
	.save-button,
	.cancel-button {
		background: none;
		border: none;
		padding: 0.5rem;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.selection-button {
		color: #6c757d;
	}

	.selection-button.selected {
		color: #28a745;
		background: rgba(40, 167, 69, 0.1);
	}

	.selection-button:hover {
		background: rgba(108, 117, 125, 0.1);
	}

	.selection-button.selected:hover {
		background: rgba(40, 167, 69, 0.2);
	}

	.edit-button {
		color: #007bff;
	}

	.edit-button:hover {
		background: rgba(0, 123, 255, 0.1);
	}

	.delete-button {
		color: #dc3545;
		background: rgba(220, 53, 69, 0.05);
		border: 1px solid rgba(220, 53, 69, 0.2);
	}

	.delete-button:hover {
		background: rgba(220, 53, 69, 0.15);
		border-color: rgba(220, 53, 69, 0.4);
		transform: scale(1.05);
	}

	.save-button {
		color: #28a745;
	}

	.save-button:hover:not(:disabled) {
		background: rgba(40, 167, 69, 0.1);
	}

	.save-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.cancel-button {
		color: #6c757d;
	}

	.cancel-button:hover {
		background: rgba(108, 117, 125, 0.1);
	}

	.card-set-content {
		padding: 1rem;
	}

	.cards-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.cards-header h4 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-color);
	}

	.add-card-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.add-card-button:hover {
		background: #0056b3;
	}

	.create-card-form {
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 6px;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.dark .create-card-form {
		background: #2f3336;
		border-color: #3f4447;
	}

	.card-body-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ced4da;
		border-radius: 4px;
		font-size: 0.9rem;
		resize: vertical;
		margin-bottom: 1rem;
	}

	.dark .card-body-input {
		background: #1e2732;
		border-color: #3f4447;
		color: #e7e9ea;
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
	}

	.empty-cards {
		text-align: center;
		padding: 2rem;
		color: #6c757d;
	}

	.dark .empty-cards {
		color: #71767b;
	}

	.empty-cards p {
		margin: 0;
		font-size: 1rem;
	}

	.empty-cards .subtitle {
		font-size: 0.9rem;
		color: #adb5bd;
		margin-top: 0.5rem;
	}

	.dark .empty-cards .subtitle {
		color: #536471;
	}

	.cards-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* Save indicator styles */
	.save-indicator {
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 1000;
		background: #fff;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		padding: 12px 16px;
		animation: slideIn 0.3s ease;
	}

	.dark .save-indicator {
		background: #1e2732;
		border-color: #3f4447;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.save-indicator-content {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.save-text {
		font-size: 0.9rem;
		color: #6c757d;
		font-weight: 500;
	}

	.dark .save-text {
		color: #71767b;
	}

	.save-all-button {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		background: #28a745;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.save-all-button:hover {
		background: #218838;
	}

	/* Fullscreen button styles */
	.fullscreen-button {
		background: none;
		border: none;
		color: #6c757d;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.fullscreen-button:hover {
		background: rgba(108, 117, 125, 0.1);
		color: #495057;
	}

	@keyframes slideIn {
		from {
			transform: translateY(100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@media (max-width: 768px) {
		.save-indicator {
			bottom: 10px;
			right: 10px;
			left: 10px;
			padding: 10px 12px;
		}

		.save-indicator-content {
			justify-content: space-between;
		}

		.save-text {
			font-size: 0.85rem;
		}

		.save-all-button {
			padding: 5px 10px;
			font-size: 0.8rem;
		}

		.card-set-header {
			padding: 0.75rem;
		}

		.header-left {
			gap: 0.5rem;
		}

		.title {
			font-size: 1rem;
		}

		.header-right {
			gap: 0.25rem;
		}

		.selection-button,
		.edit-button,
		.delete-button,
		.save-button,
		.cancel-button {
			padding: 0.4rem;
		}

		.cards-header {
			flex-direction: column;
			gap: 0.75rem;
			align-items: stretch;
		}

		.add-card-button {
			justify-content: center;
		}

		.form-actions {
			flex-direction: column;
		}
	}
</style>
