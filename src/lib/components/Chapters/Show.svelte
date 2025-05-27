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

	export let chapter;

	let dragOver = false;
	let uploading = false;
	let fileInput;

	const fetchChapter = async (slug) => {
		chapter = await Api.get('/chapters/' + slug + '.json');
		console.log('gotten', chapter);
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
		fetchChapter(chapter.id);
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
		const file = event.target?.files[0];
		if (file) handleImageUpload(file);
	}

	let tabs = ['Concepts', 'Research', 'Mapper', 'Writer'];
	let activeTab = 'Concepts';
</script>

<section class={'wrapper ' + $theme}>
	<div
		class="drop-zone"
		class:drag-over={dragOver}
		class:has-image={chapter.image_url}
		on:dragover={handleDragOver}
		on:dragleave={handleDragLeave}
		on:drop={handleDrop}
		on:click={() => fileInput.click()}
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

	<h1 class="title">{chapter.title}</h1>

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
						refresh={() => fetchChapter(chapter.id)}
						{abstraction}
					/>
				</li>
			{/each}
		</ul>
	{/if}

	{#if activeTab === 'Concepts'}
		<Quizzes {chapter} user={$user} />
	{/if}

	{#if activeTab === 'Research'}
		<Research {chapter} user={$user} />
	{/if}

	{#if activeTab === 'Mapper'}
		<Mapper parentId={chapter.id} />
	{/if}
</section>

<style>
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

	.title {
		padding: 40px 0px;
	}
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
</style>
