<script>
	import { theme } from '$lib/stores/main';

	export let card;
	export let user;
	export let onDelete;
	export let onUpdate;
	export let onKeydown;
	export let onSaveContent;

	// Handle delete
	const handleDelete = () => {
		if (confirm('Are you sure you want to delete this card?')) {
			onDelete();
		}
	};
</script>

<div class="card {$theme}">
	<div class="card-content">
		<div class="card-body">
			<div
				class="edit-content"
				contenteditable="true"
				bind:innerHTML={card.body}
				on:blur={(e) => onSaveContent && onSaveContent(card.id, e.target.innerHTML)}
				on:keydown={(e) => onKeydown && onKeydown(e, card)}
				placeholder="Edit card content..."
			/>
		</div>
		{#if user?.admin}
			<div class="card-actions">
				<button class="delete-button" on:click={handleDelete}>
					<i class="fas fa-trash" />
				</button>
			</div>
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

	.edit-content {
		width: 100%;
		min-height: 60px;
		background: transparent;
		border: none;
		outline: none;
		font-size: 0.95rem;
		line-height: 1.5;
		color: var(--text-color);
		font-family: inherit;
		word-wrap: break-word;
		overflow-wrap: break-word;
		resize: vertical;
		padding: 0.5rem;
		border-radius: 4px;
		transition: background-color 0.2s ease;
	}

	.edit-content:focus {
		background: rgba(0, 123, 255, 0.05);
	}

	.dark .edit-content:focus {
		background: rgba(29, 155, 240, 0.1);
	}

	.edit-content:empty:before {
		content: attr(placeholder);
		color: rgba(108, 117, 125, 0.5);
		pointer-events: none;
	}

	.dark .edit-content:empty:before {
		color: rgba(113, 118, 123, 0.5);
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
