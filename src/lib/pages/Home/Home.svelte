<script>
	import { onMount } from 'svelte';
	import { chapters } from '$lib/stores/main.js';
	import { openModal } from 'svelte-modals';
	import ChapterModal from '$lib/modals/videos/chapter.svelte';
	import PopularWonders from './PopularWonders/PopularWonders.svelte';

	let abstractions;
	onMount(async function () {
		chapters.subscribe((value) => {
			abstractions = value.filter(
				(chapter) =>
					chapter.abstractions &&
					chapter.abstractions.filter((a) => a.preview && a.preview.length > 1).length
			);
			const count = 6;
			abstractions = abstractions.sort(() => 0.5 - Math.random()).slice(0, count);
			console.log(abstractions);
		});
	});

	function openChapterVideo(chapter, abstraction) {
		openModal(ChapterModal, { chapter: chapter, abstraction: abstraction });
	}

	function visitChapter(item) {
		window.location = '/chapters/' + item.slug;
	}
</script>

<section class="masonry-container">
	{#if abstractions}
		{#each abstractions as item}
			<div class="masonry-item">
				<article class="chapter">
					<img
						class="preview"
						on:click={openChapterVideo(item, item.abstractions[0])}
						src={item.abstractions[0].preview}
						alt=""
					/>
					<div class="title">
						<a href="/chapters/{item.slug}" class="clean-a">
							{item.title}
						</a>
					</div>
				</article>
			</div>
		{/each}
	{/if}
</section>

<PopularWonders />

<style>
	.masonry-container {
		padding: 30px;
		columns: 2 200px;
		column-gap: 0.5rem;
		width: 100%;
		margin: 0 auto;
	}

	.masonry-item {
		position: relative;
	}

	.masonry-container > div {
		width: 100%;
		padding: 10px;
		margin: 10px;
		margin: 0 1.5rem 1.5rem 0;
		display: inline-block;
		border: solid 2px transparent;
		border-radius: 5px;
		transition: all 0.25s ease-in-out;
	}

	article {
		background: #fff;
		padding: 30px;
		border-radius: 10px;
		text-align: center;
	}

	.preview {
		text-align: center;
		display: block;
		margin: 0 auto;
		width: 100%;
	}

	.title {
		padding-top: 20px;
		font-size: 22px;
	}
</style>
