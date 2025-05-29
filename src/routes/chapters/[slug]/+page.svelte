<script>
	import { onMount, beforeUpdate } from 'svelte';

	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	import Api from '$lib/api/api.js';

	import Chapter from '$lib/components/Chapters/Show.svelte';
	import { mapShown, selectChapter, selectWonder, selectedChapter } from '$lib/stores/main';
	// import { navigating } from '$app/stores';

	let chapter;
	let changedSlug;

	onMount(async function () {
		chapter = await Api.get('/chapters/' + $page.params.slug + '.json');
		console.log('SKILL FIND', chapter);
	});

	afterNavigate(async function () {
		fetchChapter($page.params.slug);
	});

	const fetchChapter = async (slug) => {
		chapter = await Api.get('/chapters/' + slug + '.json');
		mapShown.set(false);
		selectChapter(chapter);
		console.log('gotten', chapter);
	};
</script>

{#if chapter}
	<div class="chapter-container">
		<Chapter {chapter} />
	</div>
{/if}

<style>
	.chapter-container {
		width: 70%;
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
	}

	@media (max-width: 768px) {
		.chapter-container {
			width: 90%;
			padding: 10px;
		}
	}
</style>
