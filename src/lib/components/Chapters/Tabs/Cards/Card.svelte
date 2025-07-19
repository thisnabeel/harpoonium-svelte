<script>
	import { theme } from '$lib/stores/main';

	export let card;
	export let user;
	export let onDelete;
	export let onUpdate;

	let isEditing = false;
	let editedBody = card.body;

	// Start editing card
	const startEditing = () => {
		editedBody = card.body;
		isEditing = true;
	};

	// Save card changes
	const saveChanges = async () => {
		if (!editedBody.trim()) return;

		try {
			await onUpdate({ body: editedBody.trim() });
			isEditing = false;
		} catch (err) {
			console.error('Failed to update card:', err);
		}
	};

	// Cancel editing
	const cancelEditing = () => {
		editedBody = card.body;
		isEditing = false;
	};

	// Handle delete
	const handleDelete = () => {
		if (confirm('Are you sure you want to delete this card?')) {
			onDelete();
		}
	};
</script>

<div class="card {$theme}">
	<div class="card-content">
		{#if isEditing && user?.admin}
			<textarea
				bind:value={editedBody}
				class="body-input"
				rows="3"
				placeholder="Enter card content..."
			/>
			<div class="edit-actions">
				<button class="save-button" on:click={saveChanges} disabled={!editedBody.trim()}>
					<i class="fas fa-save" />
					Save
				</button>
				<button class="cancel-button" on:click={cancelEditing}>
					<i class="fas fa-times" />
					Cancel
				</button>
			</div>
		{:else}
			<div class="card-body">
				{card.body}
			</div>
			{#if user?.admin}
				<div class="card-actions">
					<button class="edit-button" on:click={startEditing}>
						<i class="fas fa-edit" />
					</button>
					<button class="delete-button" on:click={handleDelete}>
						<i class="fas fa-trash" />
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.card {
		border: 1px solid #e9ecef;
		border-radius: 6px;
		background: white;
		padding: 1rem;
		transition: all 0.2s ease;
	}

	.dark .card {
		background: #1e2732;
		border-color: #3f4447;
	}

	.card:hover {
		border-color: #007bff;
		box-shadow: 0 2px 4px rgba(0, 123, 255, 0.1);
	}

	.dark .card:hover {
		border-color: #1d9bf0;
		box-shadow: 0 2px 4px rgba(29, 155, 240, 0.1);
	}

	.card-content {
		position: relative;
	}

	.card-body {
		font-size: 0.95rem;
		line-height: 1.5;
		color: var(--text-color);
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.body-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ced4da;
		border-radius: 4px;
		font-size: 0.95rem;
		line-height: 1.5;
		resize: vertical;
		margin-bottom: 0.75rem;
	}

	.dark .body-input {
		background: #2f3336;
		border-color: #3f4447;
		color: #e7e9ea;
	}

	.edit-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		margin-top: 0.75rem;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.card:hover .card-actions {
		opacity: 1;
	}

	.edit-button,
	.delete-button,
	.save-button,
	.cancel-button {
		background: none;
		border: none;
		padding: 0.4rem 0.6rem;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.85rem;
		display: flex;
		align-items: center;
		gap: 0.25rem;
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

	@media (max-width: 768px) {
		.card {
			padding: 0.75rem;
		}

		.card-actions {
			opacity: 1;
			margin-top: 0.5rem;
		}

		.edit-button,
		.delete-button,
		.save-button,
		.cancel-button {
			padding: 0.5rem 0.75rem;
			font-size: 0.9rem;
		}

		.edit-actions {
			flex-direction: column;
		}
	}
</style>
