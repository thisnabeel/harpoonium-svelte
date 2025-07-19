<script>
	import Api from '$lib/api/api.js';
	import { theme } from '$lib/stores/main';
	import Card from './Card.svelte';

	export let cardSet;
	export let user;
	export let onDelete;
	export let onUpdate;
	export let onRefresh;

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
			{#if user?.admin}
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
					<button class="delete-button" on:click|stopPropagation={onDelete}>
						<i class="fas fa-trash" />
					</button>
				{/if}
			{/if}
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
					{#each cardSet.cards as card (card.id)}
						<Card
							{card}
							{user}
							onDelete={() => deleteCard(card.id)}
							onUpdate={(updates) => updateCard(card.id, updates)}
						/>
					{/each}
				</div>
			{/if}
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
	}

	.delete-button:hover {
		background: rgba(220, 53, 69, 0.1);
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

	@media (max-width: 768px) {
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
