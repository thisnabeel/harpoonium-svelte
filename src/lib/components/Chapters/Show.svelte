<script>
	import { openModal } from 'svelte-modals';
	import ChapterModal from '$lib/modals/videos/chapter.svelte';
	import { chapters, theme } from '$lib/stores/main';
	import { page } from '$app/stores';
	import { navigating, updated } from '$app/stores';
	import Api from '$lib/api/api.js';
	import { user } from '$lib/stores/user';
	import Abstraction from '$lib/components/Abstraction/Abstraction.svelte';
	import Quizzes from './Tabs/Quiz/Quizzes.svelte';
	import Mapper from './Mapper/Mapper.svelte';
	import ChapterBody from './Tabs/Body/ChapterBody.svelte';
	import Scripts from './Tabs/Scripts/Scripts.svelte';
	import Inquiries from './Tabs/Research/Inquiries.svelte';
	import Cards from './Tabs/Cards/Cards.svelte';
	import Reader from './Tabs/Reader/Reader.svelte';
	import { openFullscreenModal } from '$lib/stores/fullscreenModal';

	export let chapter;

	let dragOver = false;
	let uploading = false;
	let fileInput = null;
	let isEditing = false;
	let isSaving = false;
	let editedTitle = '';
	let editedDescription = '';
	let cardSets = [];
	let isLoadingCardSets = false;
	let isGenerating = false;

	const fetchChapter = async (slug) => {
		chapter = await Api.get('/chapters/' + slug + '.json');
		console.log('gotten', chapter);
	};

	// Fetch card sets for this chapter
	const fetchCardSets = async () => {
		if (!chapter?.id) return;

		isLoadingCardSets = true;
		try {
			const response = await Api.get(`/chapters/${chapter.id}/card_sets`);
			cardSets = response || [];
		} catch (err) {
			console.error('Error fetching card sets:', err);
			cardSets = [];
		} finally {
			isLoadingCardSets = false;
		}
	};

	// Generate card set from chapter body using sentence splitting
	const generateCardSet = async () => {
		if (!chapter?.id) return;

		isGenerating = true;
		try {
			const response = await Api.post(`/chapters/${chapter.id}/generate_cards_set_from_sentences`);
			
			// Add the new card set to the list
			cardSets = [...cardSets, response];
			
			// Show success message
			alert('Card set generated successfully!');
		} catch (err) {
			console.error('Error generating card set:', err);
			const errorMessage = err.response?.data?.error || err.message || 'Failed to generate card set';
			alert(errorMessage);
		} finally {
			isGenerating = false;
		}
	};

	// Open first card set in fullscreen
	const openFirstCardSet = () => {
		if (cardSets.length > 0 && cardSets[0]) {
			// Try to get book_id from chapter (if it's root) or pass null to use fallback
			const bookId = chapter?.chapter_id ? null : chapter?.id;
			openFullscreenModal(cardSets[0], cardSets[0].title, null, chapter, null, bookId);
		}
	};

	function openChapterVideo(chapter, abstraction) {
		openModal(ChapterModal, { chapter: chapter, abstraction: abstraction });
	}

	const addAbstraction = async () => {
		const response = await Api.post('/abstractions.json', {
			abstractable_id: chapter.id,
			abstractable_type: 'Chapter'
		});
		console.log(response);
		console.log('fetch chapter', chapter);
		fetchChapter(chapter.slug || '');
	};

	async function handleImageUpload(file) {
		if (!file || !file.type.startsWith('image/')) {
			alert('Please upload an image file');
			return;
		}

		uploading = true;
		const formData = new FormData();
		formData.append('image', file);

		try {
			const response = await Api.post(`/chapters/${chapter.id}/upload_image`, formData);
			if (response.message === 'Image uploaded successfully') {
				chapter = response.chapter;
			} else {
				throw new Error(response.error || 'Upload failed');
			}
		} catch (error) {
			alert(error.message || 'Failed to upload image');
		} finally {
			uploading = false;
			dragOver = false;
		}
	}

	function handleDrop(event) {
		event.preventDefault();
		const file = event.dataTransfer?.files[0];
		if (file) handleImageUpload(file);
	}

	function handleDragOver(event) {
		event.preventDefault();
		dragOver = true;
	}

	function handleDragLeave() {
		dragOver = false;
	}

	function handleFileSelect(event) {
		const target = event.target;
		const file = target?.files?.[0];
		if (file) handleImageUpload(file);
	}

	let tabs = ['Body', 'Concepts', 'Research', 'Mapper', 'Writer', 'Scripts', 'Cards', 'Reader'];
	let activeTab = null;

	// Auto-activate Mapper tab if chapter body is empty or contains default text
	$: if (
		chapter &&
		(!chapter.body || chapter.body === '' || chapter.body === 'Start writing your chapter...')
	) {
		activeTab = 'Mapper';
	}

	// Load card sets when chapter changes
	$: if (chapter?.id) {
		fetchCardSets();
	}

	function startEditing() {
		editedTitle = chapter.title;
		editedDescription = chapter.description || '';
		isEditing = true;
	}

	async function saveChanges() {
		if (!editedTitle.trim()) return;

		isSaving = true;
		try {
			const response = await Api.put(`/chapters/${chapter.id}`, {
				title: editedTitle.trim(),
				description: editedDescription.trim()
			});
			chapter = response;
			isEditing = false;
		} catch (error) {
			console.error('Failed to update chapter:', error);
			alert('Failed to save changes. Please try again.');
		}
		isSaving = false;
	}
</script>

<section class={'wrapper ' + $theme}>
	<div
		class="drop-zone"
		class:drag-over={dragOver}
		class:has-image={chapter.image_url}
		on:dragover={handleDragOver}
		on:dragleave={handleDragLeave}
		on:drop={handleDrop}
		on:click={() => fileInput?.click()}
	>
		{#if uploading}
			<div class="upload-overlay">
				<div class="spinner" />
				<span>Uploading...</span>
			</div>
		{:else if chapter.image_url}
			<img src={chapter.image_url} alt={chapter.title} />
			<div class="image-overlay">
				<span>Drop new image or click to change</span>
			</div>
		{:else}
			<div class="upload-prompt">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7" />
					<polyline points="17 8 12 3 7 8" />
					<line x1="12" y1="3" x2="12" y2="15" />
				</svg>
				<span>Drop image here or click to upload</span>
			</div>
		{/if}
	</div>
	<input
		type="file"
		accept="image/*"
		style="display: none"
		bind:this={fileInput}
		on:change={handleFileSelect}
	/>

	<div class="title-section">
		{#if $user?.admin && isEditing}
			<div class="edit-form">
				<input
					type="text"
					bind:value={editedTitle}
					placeholder="Chapter title"
					class="edit-title"
				/>
				<textarea
					bind:value={editedDescription}
					placeholder="Chapter description (optional)"
					class="edit-description"
					rows="3"
				/>
				<div class="edit-actions">
					<button
						class="save-button"
						on:click={saveChanges}
						disabled={isSaving || !editedTitle.trim()}
					>
						{isSaving ? 'Saving...' : 'Save Changes'}
					</button>
					<button class="cancel-button" on:click={() => (isEditing = false)} disabled={isSaving}>
						Cancel
					</button>
				</div>
			</div>
		{:else}
			<h1 class="title">
				{chapter.title}
				{#if $user?.admin}
					<button class="edit-button" on:click={startEditing}>
						<i class="fas fa-pen" />
					</button>
				{/if}
			</h1>
			{#if chapter.description}
				<p class="description">{chapter.description}</p>
			{/if}
		{/if}
	</div>

	<!-- Action buttons -->
	<div class="action-buttons">
		{#if $user?.admin}
			<button
				class="generate-button"
				on:click={generateCardSet}
				disabled={isGenerating}
				title="Generate card set from chapter body"
			>
				{#if isGenerating}
					<div class="spinner-small" />
					Generating...
				{:else}
					<i class="fas fa-bolt" />
					Generate Set
				{/if}
			</button>
		{/if}
		{#if cardSets.length > 0}
			<button class="read-button" on:click={openFirstCardSet}>
				<i class="fas fa-book-open" />
				Read
			</button>
		{/if}
	</div>

	{#if tabs.length > 1}
		<div class="flex">
			{#each tabs as tab}
				<div class="tab" class:active={activeTab === tab} on:click={() => (activeTab = tab)}>
					{tab}
				</div>
			{/each}
		</div>
	{/if}

	{#if activeTab === 'Abstractions'}
		<ul class="abstractions">
			<div class="add-abstraction" on:click={addAbstraction}>+</div>

			{#each chapter.abstractions as abstraction}
				<li>
					<Abstraction
						{chapter}
						user={$user}
						refresh={() => fetchChapter(chapter.slug || '')}
						{abstraction}
					/>
				</li>
			{/each}
		</ul>
	{/if}

	{#if activeTab === 'Body'}
		<ChapterBody {chapter} />
	{:else if activeTab === 'Concepts'}
		<Quizzes {chapter} user={$user} />
	{:else if activeTab === 'Research'}
		<Inquiries {chapter} user={$user} />
	{:else if activeTab === 'Mapper'}
		<Mapper chapterId={chapter.id} />
	{:else if activeTab === 'Scripts'}
		<Scripts {chapter} />
	{:else if activeTab === 'Cards'}
		<Cards {chapter} />
	{:else if activeTab === 'Reader'}
		<Reader {chapter} />
	{/if}
</section>

<style>
	.wrapper {
		background: #fff;
		padding: 30px;
		border-radius: 10px;
		position: relative;
	}

	.dark {
		background: #481e14;
	}

	.dark h1 {
		color: #f2613f;
	}

	.drop-zone {
		width: 100%;
		height: 200px;
		border: 2px dashed #2f3336;
		border-radius: 8px;
		margin-bottom: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		position: relative;
		overflow: hidden;
		transition: all 0.3s ease;
	}

	.tab {
		padding: 14px;
	}

	.dark .tab {
		color: #fff;
	}

	.tab.active {
		background-color: #000;
		color: #fff;
	}

	.flex {
		display: flex;
	}

	.flex > div {
		flex: 1 1 33%;
		text-align: center;
	}

	.title {
		padding: 40px 0px;
	}

	.drop-zone {
		width: 100%;
		height: 200px;
		border: 2px dashed #2f3336;
		border-radius: 8px;
		margin-bottom: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		position: relative;
		overflow: hidden;
		transition: all 0.3s ease;
	}

	.dark .drop-zone {
		border-color: #3f4447;
	}

	.drop-zone.drag-over {
		border-color: #ffd67f;
		background-color: rgba(255, 214, 127, 0.1);
	}

	.drop-zone.has-image {
		border-style: solid;
	}

	.drop-zone img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.upload-prompt {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		color: #666;
	}

	.dark .upload-prompt {
		color: #888;
	}

	.image-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.drop-zone:hover .image-overlay {
		opacity: 1;
	}

	.upload-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: white;
		gap: 1rem;
	}

	.spinner {
		width: 30px;
		height: 30px;
		border: 3px solid #ffd67f;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.add-abstraction {
		font-size: 72px;
		position: absolute;
		right: 50%;
		display: inline;
		height: 0px;
		color: #ffd67f;
		width: 0px;
		bottom: 60px;
	}

	.abstractions {
		font-size: 24px;
		color: #000;
		position: relative;
		margin: 10px;
		text-align: left;
		list-style: none;
		width: 70%;
		margin: 0 auto;
		padding: 20px 0;
	}

	.abstractions > li {
		margin-bottom: 10px;
		background: #ffd67f;
	}
	@media (max-width: 480px) {
		.abstractions {
			width: 100%;
		}

		.abstractions > li {
			padding-top: 55px;
		}
	}

	.title-section {
		margin: 1.5rem 0;
	}

	.flex {
		display: flex;
		width: 100%;
		overflow-x: scroll;
	}

	.title {
		font-size: 2rem;
		font-weight: 700;
		margin: 0;
		color: var(--text-color);
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.description {
		text-align: center;
		color: #536471;
		margin: 1rem 0;
		line-height: 1.5;
	}

	.edit-button {
		background: none;
		border: none;
		color: #536471;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 50%;
		transition: all 0.2s ease;
	}

	.edit-button:hover {
		background: rgba(0, 0, 0, 0.05);
		color: #1d9bf0;
	}

	.edit-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 600px;
		margin: 0 auto;
	}

	.edit-title {
		font-size: 1.5rem;
		padding: 0.75rem;
		border: 2px solid #e1e8ed;
		border-radius: 8px;
		width: 100%;
		font-weight: 600;
	}

	.edit-description {
		padding: 0.75rem;
		border: 2px solid #e1e8ed;
		border-radius: 8px;
		width: 100%;
		resize: vertical;
		font-size: 1rem;
		line-height: 1.5;
	}

	.edit-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	.save-button,
	.cancel-button {
		padding: 0.75rem 1.5rem;
		border-radius: 9999px;
		border: none;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.save-button {
		background: #1d9bf0;
		color: white;
	}

	.save-button:hover:not(:disabled) {
		background: #1a8cd8;
	}

	.cancel-button {
		background: #e1e8ed;
		color: #536471;
	}

	.cancel-button:hover:not(:disabled) {
		background: #d1d9dd;
	}

	.save-button:disabled,
	.cancel-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	:global(.dark) .edit-title,
	:global(.dark) .edit-description {
		background: #1e2732;
		border-color: #3f4447;
		color: #e7e9ea;
	}

	:global(.dark) .description {
		color: #71767b;
	}

	:global(.dark) .edit-button:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	:global(.dark) .cancel-button {
		background: #2f3336;
		color: #e7e9ea;
	}

	:global(.dark) .cancel-button:hover:not(:disabled) {
		background: #3f4447;
	}

	/* Read button styles */
	.action-buttons {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		margin: 1rem 0;
		flex-wrap: wrap;
	}

	.generate-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #ff9800;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.generate-button:hover:not(:disabled) {
		background: #f57c00;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	.generate-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.generate-button i {
		font-size: 1.1rem;
	}

	.dark .generate-button {
		background: #ff6f00;
	}

	.dark .generate-button:hover:not(:disabled) {
		background: #e65100;
	}

	.spinner-small {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.read-section {
		display: flex;
		justify-content: center;
		margin: 1rem 0;
	}

	.read-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #28a745;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.read-button:hover {
		background: #218838;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	.read-button i {
		font-size: 1.1rem;
	}

	.dark .read-button {
		background: #2d5a3d;
	}

	.dark .read-button:hover {
		background: #1e3d2a;
	}

	@media (max-width: 768px) {
		.title {
			font-size: 1.5rem;
		}

		.edit-form {
			padding: 0 1rem;
		}

		.edit-actions {
			flex-direction: column;
		}

		.save-button,
		.cancel-button {
			width: 100%;
		}

		.action-buttons {
			flex-direction: column;
			gap: 0.75rem;
		}

		.generate-button,
		.read-button {
			padding: 0.6rem 1.2rem;
			font-size: 0.9rem;
			width: 100%;
			justify-content: center;
		}
	}
</style>
