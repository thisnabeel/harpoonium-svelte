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

	// $: console.log($user);

	let tabs = ['Concepts', 'Research', 'Mapper', 'Writer'];
	let activeTab = 'Concepts';
</script>

<section class={'wrapper ' + $theme}>
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
