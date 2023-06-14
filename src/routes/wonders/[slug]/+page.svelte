<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api.js';
	import { each } from 'svelte/internal';
	import { wonders } from '$lib/stores/main';

	import { page } from '$app/stores';

	let wonder;

	let chapters = [];
	let examples;

	$: slug = $page.params.slug;
	$: {
		wonder = $wonders.filter((item) => item.slug === slug)[0];
		if (wonder) {
			fetchWonder();
		}
	}

	const fetchWonder = async () => {
		chapters = [];
		const response = await Api.get('/wonders/' + wonder.slug + '.json');
		let data = response;

		examples = data.examples;

		chapters = data.wonder_items.filter((item) => item.wonderable_type == 'Chapter');
		console.log('chapters', chapters);
		// wonders = data.wonder_items.filter(item => item.wonderable_type == "Wonder");
	};

	const ext = (filename) => {
		return filename.split('.')[filename.split('.').length - 1];
	};

	// https://harpoonium.com/wonder_items/60.json
</script>

<section class="wrapper">
	{#if wonder}
		<h1 class="wonder-title">{wonder.title}</h1>

		{#if examples}
			<ul class="examples">
				{#each examples as example}
					<li>
						{#if ['jpg', 'jpeg', 'png'].indexOf(ext(example.source)) >= 0}
							<img src={example.source} alt="" />
						{:else if ['mp4', 'mov'].indexOf(ext(example.source)) >= 0}
							<video controls src={example.source} alt="" />
						{/if}
					</li>
				{/each}
			</ul>
		{/if}

		<section class="nested">
			<ul class="chapters">
				<div class="nested-head">Chapters</div>

				{#each chapters as chapter}
					<li>
						<div class="title">{chapter.wonderable.title}</div>
						{#each chapter.abstractions as applied}
							<div class="abstraction">{applied.body}</div>
						{/each}
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</section>

<style>
	.wonder-title {
		padding: 40px 0px;
		padding-bottom: 25px;
	}
	.wrapper {
		background: #fff;
		padding: 30px;
		border-radius: 10px;
	}

	.nested {
		max-width: 350px;
		margin: 0 auto;
	}

	.nested .title {
		font-size: 32px;
	}

	.nested .abstraction {
		padding: 30px;
		border: 10px solid #e9ecef;
		position: relative;
	}

	.nested-head {
		color: #ff78db;
		padding-bottom: 10px;
		border-bottom: 8px solid #fff1fb;
		text-align: center;
		font-size: 1.75rem;
	}

	.abstractions {
		background-color: #ffd67f;
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

	.nested > ul {
		list-style: none;
	}
	.abstractions > li {
		padding: 30px;
	}

	.examples {
		overflow-y: hidden;
		width: max-content;
		margin: 0 auto;
		padding: 0;
		display: block;
		white-space: nowrap;
		margin-bottom: 20px;
	}

	@media (max-width: 480px) {
		.examples {
			width: 100%;
		}
	}

	.examples > li {
		list-style: none;
		padding: 0;
		/* width: max-content; */
		display: inline;
		width: auto;
		overflow-x: hidden;
		height: 200px;
		/* margin-right: 10px; */
	}

	.examples img,
	.examples video {
		width: auto;
		height: 250px;
	}
</style>
