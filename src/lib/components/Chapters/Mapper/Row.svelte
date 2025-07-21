<script>
	export let item;
	export let remove;
	import { goto } from '$app/navigation';
	import { selectedChapter } from '$lib/stores/chapters/mapper';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	// $: console.log('newItem', item);

	// Sync with URL changes
	$: if ($page.url.pathname.includes('/chapters/') && item) {
		const urlChapterId = $page.url.pathname.split('/chapters/')[1]?.split('/')[0];
		if (urlChapterId === item.id?.toString() && $selectedChapter?.id !== item.id) {
			selectedChapter.set(item);
		}
	}

	function handleChapterClick() {
		if ($selectedChapter && $selectedChapter.id === item.id) {
			selectedChapter.set(null);
		} else {
			selectedChapter.set(item);
		}
	}

	let showSettings = false;
</script>

<li class="chapter" class:selected={$selectedChapter && item.id === $selectedChapter.id}>
	<span class="title" on:click={handleChapterClick}>{item.title} </span>
	<i class="fa fa-cog settings-btn" on:click={() => (showSettings = !showSettings)} />
	<i
		class="fa fa-link link-btn"
		on:click={() => {
			goto('/chapters/' + item.slug);
		}}
	/>
	<!-- <div class="settings-hover" /> -->
	{#if showSettings && $selectedChapter && item.id === $selectedChapter.id}
		<div class="settings">
			<div class="btn btn-danger" on:click={() => remove(item)}><div class="fa fa-trash" /></div>
		</div>
	{/if}

	{#each item.chapters || [] as chapter}
		<svelte:self item={chapter} {remove} type="chapter" />
	{/each}
</li>

<style>
	.settings {
		padding: 20px;
		background: aliceblue;
		border: 2px solid #c7c7ff;
	}

	.settings-btn {
		display: none;
		color: #ccc;
	}

	.link-btn {
		display: none;
		color: #ccc;
	}

	.link-btn:hover {
		color: rgb(221, 255, 128);
	}

	.selected > .settings-btn {
		display: inline;
		position: absolute;
		top: 10px;
		left: -105px;
		font-size: 46px;
	}

	.selected > .link-btn {
		display: inline;
		position: absolute;
		top: 10px;
		left: -55px;
		font-size: 46px;
	}
	.chapter {
		position: relative;
	}
	/* .settings-hover {
		background: #fff2002e;
		width: 34px;
		height: 100%;
		position: absolute;
		right: 0;
		top: 0;
	} */
	.title {
		width: 100%;
		padding: 14px;
		display: block;
		font-size: 28px;
	}
	.selected > .title {
		background: rgb(199, 199, 255);
	}

	.chapter :global(.chapter) {
		margin-left: 24px;
		border-left: 1px solid #ccc;
	}
</style>
