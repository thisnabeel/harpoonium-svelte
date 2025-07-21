<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api';
	import { theme } from '$lib/stores/main';
	import { goto } from '$app/navigation';
	import { selectedChapter } from '$lib/stores/chapters/mapper';
	import { page } from '$app/stores';

	export let chapterId;
	let isLoading = true;
	let error = null;
	let book = null;
	let currentChapter = null;
	let tableOfContents = [];

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

	function getIndentLevel(position) {
		return position > 1 ? 1 : 0; // Simple indentation for now
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
			<!-- Book title -->
			<div class="book-title">
				<h3>{book.title}</h3>
			</div>

			<!-- Table of Contents -->
			{#each tableOfContents as chapter}
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

	.book-title {
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e1e8ed;
	}

	.dark .book-title {
		border-bottom-color: #3f4447;
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
		gap: 0.5rem;
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

		.chapter {
			padding: 0.5rem;
		}

		.visit-btn {
			opacity: 1;
		}
	}
</style>
