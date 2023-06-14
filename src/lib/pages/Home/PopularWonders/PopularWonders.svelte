<script>
	import { popularWonders } from '$lib/stores/main.js';

	let wonders;
	popularWonders.subscribe((value) => {
		wonders = value;
		const count = 6;
		wonders = wonders
			.filter((wonder) => wonder.home)
			.sort(() => 0.5 - Math.random())
			.slice(0, count);
		console.log(wonders);
	});

	const randomizer = (arr) => {
		return arr.sort(() => 0.5 - Math.random()).slice(0, 1);
	};

	// function visitWonder(item){
	//     window.location = "/wonders/"+item.slug;
	// }
</script>

<h1 class="sas"><i>(Some)</i> <span>Applied Chapters</span> in Wonders:</h1>

<div class="masonry-container">
	{#each wonders as wonder}
		<div class="masonry-item">
			<img src={wonder.example.source} alt="" />
			<a class="wonder-title" href="/wonders/{wonder.home.slug}">{wonder.home.title}</a>
			<span><img src="/uploads/feels/TraceFeel.svg" alt="" class="feels-logo" />Value</span>
			<article class="body">{wonder.body}</article>
			<!-- <div class="example-challenge" slug-alert="challenges">Create a drawing in Bryan Konietzko's style.</div> -->
		</div>
	{/each}
</div>

<style>
	.sas {
		padding-top: 40px;
		text-align: center;
	}

	.sas span {
		background: #ffeaa7;
		padding: 10px;
		border-radius: 10px;
	}

	.wonder-title {
		padding: 20px 0;
		display: block;
		font-size: 30px;
		line-height: 30px;
	}

	.example-item {
		display: inline-block;
		background: #ffeaa7;
		padding: 6px 10px;
		border-radius: 10px;
	}

	.masonry-container {
		columns: 3 200px;
		padding: 30px;
		column-gap: 0.5rem;
		width: 100%;
		margin: 0 auto;
	}

	.masonry-container > .masonry-item {
		width: 100%;
		padding: 10px;
		margin: 10px;
		margin: 0 1.5rem 1.5rem 0;
		display: inline-block;
		border: solid 2px transparent;
		border-radius: 5px;
		transition: all 0.25s ease-in-out;
		position: relative;
	}

	.masonry-item img {
		width: 100%;
		height: auto;
		-webkit-filter: grayscale(100%);
		filter: grayscale(100%);
		border-radius: 5px;
		transition: all 0.25s ease-in-out;
	}

	.body {
		padding: 6px 10px;
		font-family: 'GreyCliffCF-Regular';
	}
</style>
