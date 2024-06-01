<script>
	import { chapters, selectChapter, wonders, selectWonder, theme } from '$lib/stores/main';
	import { goto } from '$app/navigation';

	let input;

	let showResults = false;

	let items;
	let results;
	let query = '';
	let select;

	export let type;

	if (type === 'Chapters') {
		chapters.subscribe((value) => {
			items = value.filter((item) => item.abstractions.length != 0 && item.chapter_id != null);
		});
		select = selectChapter;
	} else if (type === 'Wonders') {
		wonders.subscribe((value) => {
			items = value.filter((item) => item.wonder_items != 0 && item.wonder_id != null);
		});
		select = selectWonder;
	}

	const handleInputClick = () => {
		if (query.length > 0) return;
		if (items.length < 1) return;

		console.log({ items });
		let randomItems = [];
		while (randomItems.length < 6) {
			const randomElement = items[Math.floor(Math.random() * items.length)];
			if (randomItems.indexOf(randomElement) > -1) {
				continue;
			}
			randomItems.push(randomElement);
		}

		showResults = true;
		results = randomItems;
	};

	const search = (query) => {
		if (query.length > 0 && query.length < 2) {
			showResults = false;
		} else if (query.length > 1) {
			showResults = true;
			results = items.filter((item) => item.title.toUpperCase().indexOf(query.toUpperCase()) > -1);
			// if (results.length === 0) results = [{title: "Nothing Found!"}];
		}
	};

	const handleSelect = (item) => {
		goto(`/${type}/${item.slug}.json`);
	};

	$: {
		search(query);
	}
</script>

<div class="wrapper {type} {$theme}">
	<input
		type="text"
		on:click={() => handleInputClick()}
		bind:value={query}
		on:blur={() =>
			setTimeout(function () {
				showResults = false;
			}, 50)}
		placeholder="Search {type}..."
	/>
	{#if results && showResults}
		<!-- <h1>PRESENT!</h1> -->
		<ul>
			{#each results as item}
				<li id={item.id}><a href="/{type.toLowerCase()}/{item.slug}">{item.title}</a></li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.wrapper {
		position: relative;
	}

	ul {
		padding: 10px;
		background: #fff;
		font-size: 22px;
		position: absolute;
		top: 78px;
		width: 100%;
		border: 2px solid #5f4a4a;
		z-index: 999;
		list-style: none;
	}

	@media (max-width: 480px) {
		ul {
			width: 95vw;
		}

		.Wonders ul {
			position: absolute;
			left: -12px;
		}

		.Chapters ul {
			position: absolute;
			right: -12px;
		}
	}

	ul li {
		padding: 10px;
		border-bottom: 1px solid #ccc;
		position: relative;
	}

	ul li:hover {
		background-color: #ffffc7;
	}

	input {
		padding: 20px;
		font-size: 24px;
		border: 1px solid #e9e1e2;
		margin-bottom: 10px;
		background: #efefef;
		width: 100%;
		font-family: 'GreycliffCF-Bold';
	}

	.dark input {
		padding: 20px;
		font-size: 24px;
		border: 1px solid #481e13;
		margin-bottom: 10px;
		background: #481e14;
		width: 100%;
		font-family: 'GreycliffCF-Bold';
	}

	input:hover {
		background: #eaf7ff;
	}

	.dark input:hover {
		background-color: #9b3922;
	}
</style>
