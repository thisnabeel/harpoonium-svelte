<script>
	import { closeModal } from 'svelte-modals';
	import Api from '$lib/api/api';

	let isManual = false;
	let title = '';
	let isLoading = false;

	async function handleSubmit() {
		isLoading = true;
		try {
			if (isManual) {
				await Api.post('/classic_books/generate', { title });
				alert('Book created successfully!');
			} else {
				await Api.post('/classic_books/generate');
				alert('Started generating a new book! This may take a few minutes.');
			}
			closeModal();
		} catch (error) {
			console.error('Failed to create book:', error);
			alert('Failed to create book. Please try again.');
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="modal">
	<h2>Create New Book</h2>
	<div class="options">
		<button class:active={!isManual} on:click={() => (isManual = false)} disabled={isLoading}>
			<i class="fas fa-bolt" />
			<span>AI Generated</span>
		</button>
		<button class:active={isManual} on:click={() => (isManual = true)} disabled={isLoading}>
			<i class="fas fa-pen" />
			<span>Manual Creation</span>
		</button>
	</div>

	{#if isManual}
		<div class="form-group">
			<label for="title">Book Title</label>
			<input
				type="text"
				id="title"
				bind:value={title}
				placeholder="Enter book title"
				disabled={isLoading}
			/>
		</div>
	{/if}

	<div class="actions">
		<button class="cancel" on:click={closeModal} disabled={isLoading}>Cancel</button>
		<button
			class="submit"
			on:click={handleSubmit}
			disabled={isLoading || (isManual && !title.trim())}
		>
			{#if isLoading}
				<i class="fas fa-spinner fa-spin" />
			{:else}
				Create Book
			{/if}
		</button>
	</div>
</div>

<style>
	.modal {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		width: 100%;
		max-width: 500px;
	}

	h2 {
		margin: 0 0 1.5rem;
		color: #1d9bf0;
	}

	.options {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.options button {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		border: 2px solid #e8e8e8;
		border-radius: 8px;
		background: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.options button.active {
		border-color: #1d9bf0;
		background: rgba(29, 155, 240, 0.1);
	}

	.options button:hover:not(:disabled) {
		border-color: #1d9bf0;
	}

	.options button i {
		font-size: 1.5rem;
		color: #1d9bf0;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		color: #536471;
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e8e8e8;
		border-radius: 8px;
		font-size: 1rem;
	}

	.form-group input:focus {
		outline: none;
		border-color: #1d9bf0;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
	}

	.actions button {
		padding: 0.75rem 1.5rem;
		border-radius: 20px;
		border: none;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s ease;
	}

	.actions button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.actions .cancel {
		background: #e8e8e8;
		color: #536471;
	}

	.actions .submit {
		background: #1d9bf0;
		color: white;
	}

	.actions .cancel:hover:not(:disabled) {
		background: #d1d1d1;
	}

	.actions .submit:hover:not(:disabled) {
		background: #1a8cd8;
	}

	:global(.dark) .modal {
		background: #15202b;
	}

	:global(.dark) .options button {
		border-color: #2f3336;
		color: #fff;
	}

	:global(.dark) .form-group label {
		color: #71767b;
	}

	:global(.dark) .form-group input {
		background: #273340;
		border-color: #2f3336;
		color: #fff;
	}

	:global(.dark) .actions .cancel {
		background: #273340;
		color: #fff;
	}
</style>
