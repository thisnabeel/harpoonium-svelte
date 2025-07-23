<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api';
	import { theme } from '$lib/stores/main';
	import { goto } from '$app/navigation';
	import { selectedChapter } from '$lib/stores/chapters/mapper';
	import { page } from '$app/stores';

	/** @type {string | number} */
	export let chapterId;
	/** @type {boolean} */
	let isLoading = true;
	/** @type {string | null} */
	let error = null;
	/** @type {any} */
	let book = null;
	/** @type {any} */
	let currentChapter = null;
	/** @type {any[]} */
	let tableOfContents = [];
	/** @type {boolean} */
	let isCreatingChapter = false;
	/** @type {boolean} */
	let showBatchMode = false;
	/** @type {any[]} */
	let batchChapters = [];
	/** @type {boolean} */
	let isProcessingBatch = false;
	/** @type {number} */
	let currentBatchIndex = 0;

	onMount(async () => {
		try {
			const response = await Api.get(`/chapters/${chapterId}/nested_chapters`);
			if (response.error) {
				throw new Error(response.error);
			}
			book = response.book;
			currentChapter = response.current_chapter;
			tableOfContents = response.table_of_contents;
		} catch (err) {
			error = 'Failed to load chapter structure';
			console.error('Failed to load chapter structure:', err);
		} finally {
			isLoading = false;
		}
	});

	// Sync selected chapter with current chapter when data loads
	$: if (currentChapter && !isLoading) {
		selectedChapter.set(currentChapter);
	}

	// Update selected chapter when URL changes
	$: if ($page.url.pathname.includes('/chapters/') && currentChapter) {
		const urlChapterId = $page.url.pathname.split('/chapters/')[1]?.split('/')[0];
		if (urlChapterId && urlChapterId !== currentChapter.id?.toString()) {
			// Find the chapter in tableOfContents that matches the URL
			/**
			 * @param {any[]} chapters
			 * @param {string} targetId
			 * @returns {any}
			 */
			const findChapter = (chapters, targetId) => {
				for (const chapter of chapters) {
					if (chapter.id?.toString() === targetId) {
						return chapter;
					}
					if (chapter.chapters) {
						const found = findChapter(chapter.chapters, targetId);
						if (found) return found;
					}
				}
				return null;
			};

			const urlChapter = findChapter(tableOfContents, urlChapterId);
			if (urlChapter) {
				selectedChapter.set(urlChapter);
			}
		}
	}

	/**
	 * @param {number} position
	 * @returns {number}
	 */
	function getIndentLevel(position) {
		return position > 1 ? 1 : 0; // Simple indentation for now
	}

	/**
	 * Create a new chapter with prompt dialog for title
	 */
	async function createNewChapter() {
		const title = prompt('Enter chapter title:');
		if (!title || !title.trim()) {
			return; // User cancelled or entered empty title
		}

		isCreatingChapter = true;
		try {
			// Calculate the next position (auto-increment)
			const nextPosition = tableOfContents.length + 1;

			const response = await Api.post('/chapters', {
				title: title.trim(),
				chapter_id: currentChapter.id,
				position: nextPosition
			});

			if (response.error) {
				throw new Error(response.error);
			}

			// Refresh the chapter structure to show the new chapter
			const refreshResponse = await Api.get(`/chapters/${chapterId}/nested_chapters`);
			if (refreshResponse.error) {
				throw new Error(refreshResponse.error);
			}

			book = refreshResponse.book;
			currentChapter = refreshResponse.current_chapter;
			tableOfContents = refreshResponse.table_of_contents;

			// Navigate to the newly created chapter
			if (response.id) {
				// goto(`/chapters/${response.id}`);
			}
		} catch (err) {
			error = 'Failed to create chapter';
			console.error('Failed to create chapter:', err);
			alert('Failed to create chapter. Please try again.');
		} finally {
			isCreatingChapter = false;
		}
	}

	/**
	 * Create a chapter before an existing chapter
	 * @param {any} targetChapter
	 */
	async function createChapterBefore(targetChapter) {
		const title = prompt('Enter chapter title:');
		if (!title || !title.trim()) {
			return; // User cancelled or entered empty title
		}

		isCreatingChapter = true;
		try {
			const response = await Api.post('/chapters', {
				title: title.trim(),
				chapter_id: currentChapter.id,
				position: targetChapter.position,
				insert_before: true
			});

			if (response.error) {
				throw new Error(response.error);
			}

			// Refresh the chapter structure to show the new chapter
			const refreshResponse = await Api.get(`/chapters/${chapterId}/nested_chapters`);
			if (refreshResponse.error) {
				throw new Error(refreshResponse.error);
			}

			book = refreshResponse.book;
			currentChapter = refreshResponse.current_chapter;
			tableOfContents = refreshResponse.table_of_contents;
		} catch (err) {
			error = 'Failed to create chapter';
			console.error('Failed to create chapter:', err);
			alert('Failed to create chapter. Please try again.');
		} finally {
			isCreatingChapter = false;
		}
	}

	/**
	 * Create a chapter after an existing chapter
	 * @param {any} targetChapter
	 */
	async function createChapterAfter(targetChapter) {
		const title = prompt('Enter chapter title:');
		if (!title || !title.trim()) {
			return; // User cancelled or entered empty title
		}

		isCreatingChapter = true;
		try {
			const response = await Api.post('/chapters', {
				title: title.trim(),
				chapter_id: currentChapter.id,
				position: targetChapter.position + 1,
				insert_after: true
			});

			if (response.error) {
				throw new Error(response.error);
			}

			// Refresh the chapter structure to show the new chapter
			const refreshResponse = await Api.get(`/chapters/${chapterId}/nested_chapters`);
			if (refreshResponse.error) {
				throw new Error(refreshResponse.error);
			}

			book = refreshResponse.book;
			currentChapter = refreshResponse.current_chapter;
			tableOfContents = refreshResponse.table_of_contents;
		} catch (err) {
			error = 'Failed to create chapter';
			console.error('Failed to create chapter:', err);
			alert('Failed to create chapter. Please try again.');
		} finally {
			isCreatingChapter = false;
		}
	}

	/**
	 * Toggle batch mode
	 */
	function toggleBatchMode() {
		showBatchMode = !showBatchMode;
		if (showBatchMode) {
			batchChapters = [];
		}
	}

	/**
	 * Add a new chapter to the batch
	 */
	function addBatchChapter() {
		batchChapters = [...batchChapters, { title: '', position: batchChapters.length + 1 }];
	}

	/**
	 * Remove a chapter from the batch
	 * @param {number} index
	 */
	function removeBatchChapter(index) {
		batchChapters = batchChapters.filter((_, i) => i !== index);
		// Update positions
		batchChapters = batchChapters.map((chapter, i) => ({
			...chapter,
			position: i + 1
		}));
	}

	/**
	 * Handle input event for batch chapter title
	 * @param {number} index
	 * @param {Event} event
	 */
	function handleBatchChapterInput(index, event) {
		const target = event.target;
		if (target && 'value' in target) {
			updateBatchChapterTitle(index, String(target.value) || '');
		}
	}

	/**
	 * Update chapter title in batch
	 * @param {number} index
	 * @param {string} title
	 */
	function updateBatchChapterTitle(index, title) {
		// Check if the input matches the pattern "number-number"
		const rangeRegex = /^(\d+)-(\d+)$/;
		const match = title.trim().match(rangeRegex);

		if (match) {
			const start = parseInt(match[1]);
			const end = parseInt(match[2]);

			if (start < end && end - start <= 50) {
				// Limit to 50 chapters max
				// Remove the current chapter and add multiple chapters
				batchChapters = batchChapters.filter((_, i) => i !== index);

				// Add chapters for the range
				for (let i = start; i <= end; i++) {
					batchChapters = [
						...batchChapters,
						{
							title: `Chapter ${i}`,
							position: batchChapters.length + 1
						}
					];
				}

				// Update positions for all chapters
				batchChapters = batchChapters.map((chapter, i) => ({
					...chapter,
					position: i + 1
				}));
				return;
			}
		}

		// Normal update if not a range
		batchChapters = batchChapters.map((chapter, i) =>
			i === index ? { ...chapter, title } : chapter
		);
	}

	/**
	 * Process all chapters in the batch
	 */
	async function processBatch() {
		if (batchChapters.length === 0) {
			alert('No chapters to create. Please add at least one chapter.');
			return;
		}

		// Validate all chapters have titles
		const invalidChapters = batchChapters.filter((chapter) => !chapter.title.trim());
		if (invalidChapters.length > 0) {
			alert('Please provide titles for all chapters.');
			return;
		}

		isProcessingBatch = true;
		currentBatchIndex = 0;

		try {
			for (let i = 0; i < batchChapters.length; i++) {
				currentBatchIndex = i + 1;
				const chapter = batchChapters[i];

				// Calculate the next position (auto-increment)
				const nextPosition = tableOfContents.length + i + 1;

				const response = await Api.post('/chapters', {
					title: chapter.title.trim(),
					chapter_id: currentChapter.id,
					position: nextPosition
				});

				if (response.error) {
					throw new Error(response.error);
				}
			}

			// Refresh the chapter structure to show all new chapters
			const refreshResponse = await Api.get(`/chapters/${chapterId}/nested_chapters`);
			if (refreshResponse.error) {
				throw new Error(refreshResponse.error);
			}

			book = refreshResponse.book;
			currentChapter = refreshResponse.current_chapter;
			tableOfContents = refreshResponse.table_of_contents;

			// Reset batch mode
			showBatchMode = false;
			batchChapters = [];
			alert(`Successfully created ${batchChapters.length} chapters!`);
		} catch (err) {
			error = 'Failed to create chapters';
			console.error('Failed to create chapters:', err);
			alert(
				`Failed to create chapters. Error occurred at chapter ${currentBatchIndex}. Please try again.`
			);
		} finally {
			isProcessingBatch = false;
			currentBatchIndex = 0;
		}
	}

	/**
	 * Cancel batch mode
	 */
	function cancelBatch() {
		showBatchMode = false;
		batchChapters = [];
	}
</script>

<div class="mapper {$theme}">
	{#if isLoading}
		<div class="loading">
			<div class="spinner" />
			<span>Loading chapter structure...</span>
		</div>
	{:else if error}
		<div class="error">
			{error}
		</div>
	{:else}
		<div class="chapter-tree">
			<!-- Book title and create buttons -->
			<div class="book-header">
				<div class="book-title">
					<h3>{book.title}</h3>
				</div>
				<div class="create-buttons">
					{#if !showBatchMode}
						<button
							class="btn btn-primary create-chapter-btn"
							on:click={createNewChapter}
							disabled={isCreatingChapter}
						>
							{#if isCreatingChapter}
								<div class="spinner-small" />
							{:else}
								<i class="fas fa-plus" />
							{/if}
							New Chapter
						</button>
						<button class="btn btn-secondary batch-btn" on:click={toggleBatchMode}>
							<i class="fas fa-list" />
							Batch Create
						</button>
					{:else}
						<button
							class="btn btn-success save-batch-btn"
							on:click={processBatch}
							disabled={isProcessingBatch || batchChapters.length === 0}
						>
							{#if isProcessingBatch}
								<div class="spinner-small" />
								Creating {currentBatchIndex}/{batchChapters.length}...
							{:else}
								<i class="fas fa-save" />
								Save All ({batchChapters.length})
							{/if}
						</button>
						<button
							class="btn btn-danger cancel-batch-btn"
							on:click={cancelBatch}
							disabled={isProcessingBatch}
						>
							<i class="fas fa-times" />
							Cancel
						</button>
					{/if}
				</div>
			</div>

			<!-- Batch creation interface -->
			{#if showBatchMode}
				<div class="batch-interface">
					<div class="batch-header">
						<h4>Batch Chapter Creation</h4>
						<button
							class="btn btn-outline-primary add-chapter-btn"
							on:click={addBatchChapter}
							disabled={isProcessingBatch}
						>
							<i class="fas fa-plus" />
							Add Chapter
						</button>
					</div>

					{#if batchChapters.length === 0}
						<div class="empty-batch">
							<p>No chapters added yet. Click "Add Chapter" to get started.</p>
						</div>
					{:else}
						<div class="batch-list">
							{#each batchChapters as chapter, index}
								<div class="batch-chapter-item">
									<div class="chapter-number">#{chapter.position}</div>
									<input
										type="text"
										class="chapter-title-input"
										placeholder="Enter title or range (e.g., 2-10)"
										value={chapter.title}
										on:input={(e) => handleBatchChapterInput(index, e)}
										disabled={isProcessingBatch}
									/>
									<button
										class="btn btn-outline-danger remove-btn"
										on:click={() => removeBatchChapter(index)}
										disabled={isProcessingBatch}
									>
										<i class="fas fa-trash" />
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Table of Contents -->
			{#each tableOfContents as chapter, index}
				<div class="chapter-container">
					<!-- Plus icon above chapter (except for first chapter) -->
					{#if index > 0}
						<button
							class="add-chapter-above-btn"
							on:click={() => createChapterBefore(chapter)}
							disabled={isCreatingChapter}
							title="Add chapter before this one"
						>
							<i class="fas fa-plus" />
						</button>
					{/if}

					<!-- Chapter item -->
					<div
						class="chapter {chapter.id === currentChapter.id ? 'current' : ''}"
						style="padding-left: {getIndentLevel(chapter.position) * 20}px"
					>
						<div class="chapter-info">
							<span class="position">Chapter {chapter.position}</span>
							<span class="title">{chapter.title}</span>
						</div>
						<button
							class="btn btn-warning visit-btn"
							on:click={() => goto(`/chapters/${chapter.id}`)}
						>
							<i class="fas fa-link" />
						</button>
					</div>

					<!-- Plus icon below chapter (always show) -->
					<button
						class="add-chapter-below-btn"
						on:click={() => createChapterAfter(chapter)}
						disabled={isCreatingChapter}
						title="Add chapter after this one"
					>
						<i class="fas fa-plus" />
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.mapper {
		padding: 1rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.dark.mapper {
		background: #1e2732;
	}

	.book-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e1e8ed;
	}

	.dark .book-header {
		border-bottom-color: #3f4447;
	}

	.book-title {
		margin: 0;
	}

	.book-title h3 {
		margin: 0;
		color: #1a1a1a;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.dark .book-title h3 {
		color: #e7e9ea;
	}

	.create-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.create-chapter-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
		font-weight: 500;
		background-color: #1d9bf0;
		border-color: #1d9bf0;
		color: white;
		border-radius: 6px;
		transition: all 0.2s ease;
	}

	.create-chapter-btn:hover:not(:disabled) {
		background-color: #1a8cd8;
		border-color: #1a8cd8;
	}

	.create-chapter-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.batch-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
		font-weight: 500;
		background-color: #6c757d;
		border-color: #6c757d;
		color: white;
		border-radius: 6px;
		transition: all 0.2s ease;
	}

	.batch-btn:hover {
		background-color: #5a6268;
		border-color: #545b62;
	}

	.save-batch-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
		font-weight: 500;
		background-color: #28a745;
		border-color: #28a745;
		color: white;
		border-radius: 6px;
		transition: all 0.2s ease;
	}

	.save-batch-btn:hover:not(:disabled) {
		background-color: #218838;
		border-color: #1e7e34;
	}

	.save-batch-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.cancel-batch-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
		font-weight: 500;
		background-color: #dc3545;
		border-color: #dc3545;
		color: white;
		border-radius: 6px;
		transition: all 0.2s ease;
	}

	.cancel-batch-btn:hover:not(:disabled) {
		background-color: #c82333;
		border-color: #bd2130;
	}

	.cancel-batch-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.dark .create-chapter-btn,
	.dark .batch-btn,
	.dark .save-batch-btn,
	.dark .cancel-batch-btn {
		color: white;
	}

	.spinner-small {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.batch-interface {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 6px;
		border: 1px solid #e9ecef;
	}

	.dark .batch-interface {
		background: #2f3336;
		border-color: #3f4447;
	}

	.batch-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.batch-header h4 {
		margin: 0;
		color: #495057;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.dark .batch-header h4 {
		color: #e7e9ea;
	}

	.add-chapter-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.8rem;
		font-size: 0.85rem;
		background-color: transparent;
		border-color: #1d9bf0;
		color: #1d9bf0;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.add-chapter-btn:hover:not(:disabled) {
		background-color: #1d9bf0;
		color: white;
	}

	.add-chapter-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.empty-batch {
		text-align: center;
		padding: 2rem;
		color: #6c757d;
	}

	.dark .empty-batch {
		color: #8899a6;
	}

	.batch-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.batch-chapter-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: white;
		border-radius: 4px;
		border: 1px solid #dee2e6;
		transition: all 0.2s ease;
	}

	.dark .batch-chapter-item {
		background: #1e2732;
		border-color: #3f4447;
	}

	.batch-chapter-item:hover {
		border-color: #1d9bf0;
		box-shadow: 0 1px 3px rgba(29, 155, 240, 0.1);
	}

	.chapter-number {
		font-weight: 600;
		color: #1d9bf0;
		min-width: 30px;
		text-align: center;
	}

	.chapter-title-input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #ced4da;
		border-radius: 4px;
		font-size: 0.9rem;
		background: white;
		color: #495057;
		transition: border-color 0.2s ease;
	}

	.dark .chapter-title-input {
		background: #2f3336;
		border-color: #3f4447;
		color: #e7e9ea;
	}

	.chapter-title-input:focus {
		outline: none;
		border-color: #1d9bf0;
		box-shadow: 0 0 0 2px rgba(29, 155, 240, 0.25);
	}

	.chapter-title-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.remove-btn {
		padding: 0.4rem 0.6rem;
		background-color: transparent;
		border-color: #dc3545;
		color: #dc3545;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.remove-btn:hover:not(:disabled) {
		background-color: #dc3545;
		color: white;
	}

	.remove-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		color: #536471;
	}

	.dark .loading {
		color: #8899a6;
	}

	.spinner {
		width: 30px;
		height: 30px;
		border: 3px solid #1d9bf0;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.error {
		color: #e0245e;
		text-align: center;
		padding: 1rem;
	}

	.dark .error {
		color: #ff6b6b;
	}

	.chapter-tree {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.chapter-container {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.add-chapter-above-btn,
	.add-chapter-below-btn {
		position: absolute;
		top: 39px;
		width: 24px;
		height: 24px;
		border: none;
		background: #1d9bf0;
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.7rem;
		cursor: pointer;
		opacity: 0;
		transition: all 0.2s ease;
		z-index: 10;
		margin: 0.25rem 0;
	}

	.add-chapter-above-btn:hover,
	.add-chapter-below-btn:hover {
		background: #1a8cd8;
		transform: scale(1.1);
	}

	.add-chapter-above-btn:disabled,
	.add-chapter-below-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
		transform: none;
	}

	.chapter-container:hover .add-chapter-above-btn,
	.chapter-container:hover .add-chapter-below-btn {
		opacity: 1;
	}

	.chapter {
		position: relative;
		padding: 0.75rem;
		border-radius: 6px;
		background: #f7f9f9;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		width: 100%;
	}

	.chapter.current {
		background: #e8f5fd;
		border-left: 4px solid #1d9bf0;
	}

	.dark .chapter.current {
		background: rgba(29, 155, 240, 0.1);
	}

	.dark .chapter {
		background: #2f3336;
	}

	.chapter:hover {
		background: #eff3f4;
	}

	.dark .chapter:hover {
		background: #3f4447;
	}

	.chapter-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.position {
		color: #536471;
		font-size: 0.9rem;
	}

	.dark .position {
		color: #8899a6;
	}

	.title {
		font-weight: 500;
		color: #0f1419;
	}

	.dark .title {
		color: #e7e9ea;
	}

	.visit-btn {
		padding: 0.4rem 0.6rem;
		font-size: 0.9rem;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.chapter:hover .visit-btn {
		opacity: 1;
	}

	.dark .visit-btn {
		background-color: #ffc107;
		border-color: #ffc107;
		color: #000;
	}

	.dark .visit-btn:hover {
		background-color: #ffca2c;
		border-color: #ffc720;
		color: #000;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.mapper {
			padding: 0.5rem;
		}

		.book-header {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		.create-buttons {
			width: 100%;
			flex-direction: column;
		}

		.create-chapter-btn,
		.batch-btn,
		.save-batch-btn,
		.cancel-batch-btn {
			width: 100%;
			justify-content: center;
		}

		.batch-header {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		.add-chapter-btn {
			width: 100%;
			justify-content: center;
		}

		.batch-chapter-item {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
		}

		.chapter-number {
			align-self: flex-start;
		}

		.remove-btn {
			align-self: flex-end;
		}

		.chapter {
			padding: 0.5rem;
		}

		.visit-btn {
			opacity: 1;
		}

		.add-chapter-above-btn,
		.add-chapter-below-btn {
			opacity: 1;
		}
	}
</style>
