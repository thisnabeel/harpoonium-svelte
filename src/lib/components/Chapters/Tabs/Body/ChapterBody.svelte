<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api';
	import { theme } from '$lib/stores/main';
	import { user } from '$lib/stores/user';
	import StarterKit from '@tiptap/starter-kit';
	import { Editor } from '@tiptap/core';

	export let chapter;
	let editor = null;
	let editorElement = null;
	let isSaving = false;
	let saveTimer = null;
	let isLoading = true;
	let isEditMode = false;
	let initialContent = null;
	let selectionTooltip = null;
	let selectedText = '';
	let showResponsePopup = false;
	let isLoadingResponse = false;
	let currentResponse = null;
	let popupPosition = { x: 0, y: 0 };

	$: if (initialContent?.length > 0 && editorElement) {
		editor = new Editor({
			element: editorElement,
			extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } })],
			content: initialContent,
			editable: false,
			onUpdate: ({ editor }) => {
				debounceSave(editor.getHTML());
			}
		});
	}

	function handleSelectionChange() {
		if (isEditMode) return;

		const selection = window.getSelection();
		if (!selection) return;

		const text = selection.toString().trim();

		// Hide tooltip if no text is selected
		if (!text || text.length === 0) {
			if (selectionTooltip) {
				selectionTooltip.style.display = 'none';
			}
			return;
		}

		// Get the actual editor content element (ProseMirror)
		const editorContent = editorElement?.querySelector('.ProseMirror');
		if (!editorContent) return;

		// Check if selection is within editor content
		const range = selection.getRangeAt(0);
		const isWithinEditor =
			editorContent.contains(range.startContainer) && editorContent.contains(range.endContainer);

		if (!isWithinEditor) {
			if (selectionTooltip) {
				selectionTooltip.style.display = 'none';
			}
			return;
		}

		selectedText = text;
		const rect = range.getBoundingClientRect();
		console.log('Selection rect:', rect); // Debug log

		if (!selectionTooltip) {
			selectionTooltip = document.createElement('div');
			selectionTooltip.className = 'selection-tooltip ' + $theme;
			selectionTooltip.innerHTML = `
				<button class="explain-btn">
					<i class="fas fa-lightbulb"></i>
					Explain
				</button>
				<button class="recap-btn">
					<i class="fas fa-book-open"></i>
					Recap Till Here
				</button>
			`;
			document.body.appendChild(selectionTooltip);

			// Add event listeners
			const explainBtn = selectionTooltip.querySelector('.explain-btn');
			const recapBtn = selectionTooltip.querySelector('.recap-btn');

			if (explainBtn) explainBtn.addEventListener('click', handleExplain);
			if (recapBtn) recapBtn.addEventListener('click', handleStorySoFar);
		}

		// Position tooltip
		const tooltipHeight = selectionTooltip.offsetHeight;
		selectionTooltip.style.top = `${rect.bottom + 10 + window.scrollY}px`;
		selectionTooltip.style.left = `${rect.left + rect.width / 2}px`;
		selectionTooltip.style.display = 'flex';
	}

	function closeResponsePopup() {
		showResponsePopup = false;
		currentResponse = null;
	}

	async function handleExplain() {
		isLoadingResponse = true;
		showResponsePopup = true;

		// Position popup near the selection
		const selection = window.getSelection();
		if (selection && selection.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			const rect = range.getBoundingClientRect();
			popupPosition = {
				x: Math.min(rect.left, window.innerWidth - 320), // 320px is popup width
				y: rect.bottom + window.scrollY + 10
			};
		}

		console.log('Making explain request:', {
			ask_type: 'explain',
			selection: selectedText
		});

		try {
			const response = await Api.post(`/chapters/${chapter.id}/chapter_body/ask`, {
				ask_type: 'explain',
				selection: selectedText
			});
			console.log('Explain response:', response);
			currentResponse = response;
		} catch (error) {
			console.error('Failed to get explanation:', error);
			currentResponse = { error: 'Failed to get explanation. Please try again.' };
		} finally {
			isLoadingResponse = false;
		}
	}

	async function handleStorySoFar() {
		isLoadingResponse = true;
		showResponsePopup = true;

		// Position popup near the selection
		const selection = window.getSelection();
		if (selection && selection.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			const rect = range.getBoundingClientRect();
			popupPosition = {
				x: Math.min(rect.left, window.innerWidth - 320), // 320px is popup width
				y: rect.bottom + window.scrollY + 10
			};
		}

		console.log('Making recap request:', {
			ask_type: 'recap',
			selection: selectedText
		});

		try {
			const response = await Api.post(`/chapters/${chapter.id}/chapter_body/ask`, {
				ask_type: 'recap',
				selection: selectedText
			});
			console.log('Recap response:', response);
			currentResponse = response;
		} catch (error) {
			console.error('Failed to get recap:', error);
			currentResponse = { error: 'Failed to get recap. Please try again.' };
		} finally {
			isLoadingResponse = false;
		}
	}

	onMount(async () => {
		try {
			const response = await Api.get(`/chapters/${chapter.id}/chapter_body`);
			initialContent = response.body || '<p>Start writing your chapter...</p>';

			// Add selection event listeners
			document.addEventListener('mouseup', handleSelectionChange);
			document.addEventListener('selectionchange', handleSelectionChange);
		} catch (error) {
			console.error('Failed to fetch chapter body:', error);
		} finally {
			isLoading = false;
		}

		return () => {
			document.removeEventListener('mouseup', handleSelectionChange);
			document.removeEventListener('selectionchange', handleSelectionChange);
			if (selectionTooltip) {
				selectionTooltip.remove();
			}
			if (editor) {
				editor.destroy();
			}
		};
	});

	function toggleEditMode() {
		isEditMode = !isEditMode;
		if (editor) {
			editor.setEditable(isEditMode && $user?.admin === true);
		}
	}

	function debounceSave(content) {
		if (!$user?.admin || !isEditMode) return;

		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(async () => {
			isSaving = true;
			try {
				const response = await Api.put(`/chapters/${chapter.id}/chapter_body`, {
					body: content
				});
				if (response.error) {
					throw new Error(response.error);
				}
			} catch (error) {
				console.error('Failed to save chapter body:', error);
			} finally {
				isSaving = false;
			}
		}, 1000);
	}
</script>

<svelte:head>
	<link
		href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="editor-container {$theme}">
	{#if isLoading}
		<div class="loading">
			<div class="spinner" />
			<span>Loading chapter content...</span>
		</div>
	{:else}
		{#if $user?.admin}
			<div class="toolbar">
				{#if isEditMode}
					<button
						on:click={() => editor.chain().focus().toggleBold().run()}
						class:active={editor?.isActive('bold')}
					>
						<i class="fas fa-bold" />
					</button>
					<button
						on:click={() => editor.chain().focus().toggleItalic().run()}
						class:active={editor?.isActive('italic')}
					>
						<i class="fas fa-italic" />
					</button>
					<button
						on:click={() => editor.chain().focus().toggleStrike().run()}
						class:active={editor?.isActive('strike')}
					>
						<i class="fas fa-strikethrough" />
					</button>
					<button
						on:click={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
						class:active={editor?.isActive('heading', { level: 1 })}
					>
						H1
					</button>
					<button
						on:click={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
						class:active={editor?.isActive('heading', { level: 2 })}
					>
						H2
					</button>
					<button
						on:click={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
						class:active={editor?.isActive('heading', { level: 3 })}
					>
						H3
					</button>
					<button
						on:click={() => editor.chain().focus().toggleBulletList().run()}
						class:active={editor?.isActive('bulletList')}
					>
						<i class="fas fa-list-ul" />
					</button>
					<button
						on:click={() => editor.chain().focus().toggleOrderedList().run()}
						class:active={editor?.isActive('orderedList')}
					>
						<i class="fas fa-list-ol" />
					</button>
					<button
						on:click={() => editor.chain().focus().toggleBlockquote().run()}
						class:active={editor?.isActive('blockquote')}
					>
						<i class="fas fa-quote-right" />
					</button>
					{#if isSaving}
						<span class="saving-indicator">Saving...</span>
					{/if}
				{/if}
				<button class="mode-toggle" on:click={toggleEditMode}>
					<i class="fas {isEditMode ? 'fa-eye' : 'fa-pen'}" />
					<span>{isEditMode ? 'View Mode' : 'Edit Mode'}</span>
				</button>
			</div>
		{/if}
		<div bind:this={editorElement} class="editor" class:readonly={!isEditMode || !$user?.admin} />

		{#if showResponsePopup}
			<div
				class="response-popup {$theme}"
				style="left: {popupPosition.x}px; top: {popupPosition.y}px;"
			>
				<div class="response-header">
					<span class="response-title">
						{#if currentResponse?.ask_type === 'explain'}
							Explanation
						{:else}
							Recap
						{/if}
					</span>
					<button class="close-btn" on:click={closeResponsePopup}>
						<i class="fas fa-times" />
					</button>
				</div>
				<div class="response-content">
					{#if isLoadingResponse}
						<div class="loading">
							<div class="spinner" />
							<span>Getting response...</span>
						</div>
					{:else if currentResponse?.error}
						<div class="error">
							{currentResponse.error}
						</div>
					{:else if currentResponse?.response}
						<div class="response-text">
							{currentResponse.response}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.editor-container {
		background: #fff;
		border-radius: 8px;
		overflow: hidden;
		margin-top: 1rem;
	}

	.dark.editor-container {
		background: #1e2732;
	}

	.dark :global(.editor p) {
		color: #fff;
	}

	.toolbar {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem;
		border-bottom: 1px solid #e1e8ed;
		flex-wrap: wrap;
	}

	.dark .toolbar {
		border-bottom-color: #3f4447;
	}

	.toolbar button {
		background: none;
		border: none;
		padding: 0.5rem;
		border-radius: 4px;
		color: #536471;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 1rem;
	}

	.dark .toolbar button {
		color: #8899a6;
	}

	.toolbar button:hover {
		background: rgba(0, 0, 0, 0.05);
		color: #1d9bf0;
	}

	.dark .toolbar button:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #1d9bf0;
	}

	.toolbar button.active {
		color: #1d9bf0;
		background: rgba(29, 155, 240, 0.1);
	}

	.dark .toolbar button.active {
		background: rgba(29, 155, 240, 0.2);
	}

	.editor {
		padding: 1rem;
		min-height: 300px;
		font-family: 'Crimson Text', serif;
		font-size: 1.2rem;
		line-height: 1.6;
	}

	.dark .editor {
		color: #e7e9ea;
	}

	.editor :global(p) {
		margin: 1rem 0;
		line-height: 1.6;
	}

	.editor :global(h1) {
		font-family: 'Crimson Text', serif;
		font-size: 2.5rem;
		font-weight: 700;
		margin: 2rem 0 1.5rem;
		line-height: 1.2;
	}

	.editor :global(h2) {
		font-family: 'Crimson Text', serif;
		font-size: 2rem;
		font-weight: 700;
		margin: 1.75rem 0 1.25rem;
		line-height: 1.2;
	}

	.editor :global(h3) {
		font-family: 'Crimson Text', serif;
		font-size: 1.75rem;
		font-weight: 600;
		margin: 1.5rem 0 1rem;
		line-height: 1.3;
	}

	.editor :global(ul),
	.editor :global(ol) {
		margin: 1rem 0;
		padding-left: 2rem;
	}

	.editor :global(li) {
		margin: 0.5rem 0;
	}

	.editor :global(blockquote) {
		font-family: 'Crimson Text', serif;
		font-style: italic;
		border-left: 3px solid #e1e8ed;
		margin: 1.5rem 0;
		padding: 0.5rem 0 0.5rem 1.5rem;
		color: #536471;
		font-size: 1.25rem;
	}

	.dark .editor :global(blockquote) {
		border-left-color: #3f4447;
		color: #8899a6;
	}

	.editor.readonly :global(*) {
		cursor: default;
	}

	.saving-indicator {
		color: #536471;
		font-size: 0.9rem;
		margin-left: auto;
		display: flex;
		align-items: center;
	}

	.dark .saving-indicator {
		color: #8899a6;
	}

	@media (max-width: 768px) {
		.toolbar {
			padding: 0.5rem;
			gap: 0.25rem;
		}

		.toolbar button {
			padding: 0.4rem;
			font-size: 0.9rem;
		}
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		gap: 1rem;
		color: #536471;
	}

	.dark .loading {
		color: #8899a6;
	}

	.loading .spinner {
		width: 30px;
		height: 30px;
		border: 3px solid #1d9bf0;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.mode-toggle {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #1d9bf0;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		border: none;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.mode-toggle:hover {
		background: #1a8cd8;
	}

	.dark .mode-toggle {
		background: #1d9bf0;
		color: white;
	}

	.dark .mode-toggle:hover {
		background: #1a8cd8;
	}

	:global(.selection-tooltip) {
		position: absolute;
		display: none;
		transform: translateX(-50%);
		background: white;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		padding: 8px;
		gap: 8px;
		z-index: 1000;
		border: 1px solid #e1e8ed;
		animation: fadeIn 0.2s ease;
		min-width: 200px;
		justify-content: center;
	}

	:global(.selection-tooltip.dark) {
		background: #1e2732;
		border-color: #3f4447;
	}

	:global(.selection-tooltip button) {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		font-weight: 500;
		transition: all 0.2s ease;
		color: #1a1a1a;
		background: #f0f2f5;
		width: auto;
		white-space: nowrap;
	}

	:global(.selection-tooltip.dark button) {
		color: #e7e9ea;
		background: #2f3336;
	}

	:global(.selection-tooltip button:hover) {
		background: #e1e8ed;
		transform: translateY(-1px);
	}

	:global(.selection-tooltip.dark button:hover) {
		background: #3f4447;
	}

	:global(.selection-tooltip .explain-btn) {
		color: #1d9bf0;
	}

	:global(.selection-tooltip .recap-btn) {
		color: #794bc4;
	}

	.editor :global(::selection) {
		background: rgba(29, 155, 240, 0.2);
		color: inherit;
	}

	.dark .editor :global(::selection) {
		background: rgba(29, 155, 240, 0.3);
		color: inherit;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.response-popup {
		position: absolute;
		width: 320px;
		max-width: calc(100vw - 40px);
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		border: 1px solid #e1e8ed;
		z-index: 1000;
		animation: popupFadeIn 0.2s ease;
		max-height: 400px;
		display: flex;
		flex-direction: column;
	}

	.dark .response-popup {
		background: #1e2732;
		border-color: #3f4447;
	}

	.response-header {
		padding: 12px 16px;
		border-bottom: 1px solid #e1e8ed;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.dark .response-header {
		border-bottom-color: #3f4447;
	}

	.response-title {
		font-weight: 600;
		color: #1a1a1a;
	}

	.dark .response-title {
		color: #e7e9ea;
	}

	.close-btn {
		background: none;
		border: none;
		padding: 4px;
		cursor: pointer;
		color: #536471;
		border-radius: 50%;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.dark .close-btn {
		color: #8899a6;
	}

	.close-btn:hover {
		background: rgba(0, 0, 0, 0.05);
		color: #1a1a1a;
	}

	.dark .close-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #e7e9ea;
	}

	.response-content {
		padding: 16px;
		overflow-y: auto;
		color: #1a1a1a;
		line-height: 1.5;
		font-size: 0.95rem;
	}

	.dark .response-content {
		color: #e7e9ea;
	}

	.response-content .loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 20px 0;
		color: #536471;
	}

	.dark .response-content .loading {
		color: #8899a6;
	}

	.response-content .error {
		color: #e0245e;
		text-align: center;
		padding: 20px 0;
	}

	.dark .response-content .error {
		color: #ff6b6b;
	}

	.response-text {
		white-space: pre-wrap;
	}

	@keyframes popupFadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 768px) {
		.response-popup {
			position: fixed;
			left: 20px !important;
			right: 20px;
			bottom: 20px;
			top: auto !important;
			width: auto;
			max-height: 60vh;
		}
	}
</style>
