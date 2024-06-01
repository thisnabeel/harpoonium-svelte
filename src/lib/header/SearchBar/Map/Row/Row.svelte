<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api.js';
	import { curry } from 'ramda';
	import {
		mapShown,
		selectChapter,
		selectWonder,
		selectedChapter,
		selectedFeel,
		theme
	} from '$lib/stores/main';

	import Fa from 'svelte-fa';
	import { faCaretSquareRight } from '@fortawesome/free-solid-svg-icons';
	import { goto } from '$app/navigation';

	let select;
	let gold = null;

	export let item;
	export let type;

	if (type === 'chapter') select = selectChapter;
	if (type === 'wonder') select = selectWonder;

	$: {
		if (type === 'wonder') checkGold(item);
	}

	const handleChapterClick = async (id) => {
		const endpoint = '/' + type + 's/' + item.slug;
		const response = await Api.get(endpoint + '.json');
		goto(endpoint);
	};

	function hasChildren(item) {
		return item.wonders.length > 0;
	}

	const Tree = {
		reduce: curry(function reduce(reducerFn, init, node) {
			const acc = reducerFn(init, node);
			if (acc > 0) {
				return acc;
			}
			if (!hasChildren(node)) {
				return acc;
			}
			return node.wonders.reduce(Tree.reduce(reducerFn), acc);
		})
	};

	function sumGold(total, item) {
		return total + item.wonder_items.length;
	}

	const checkGold = (item) => {
		gold = Boolean(Tree.reduce(sumGold, 0, item));
	};

	// $: console.log("origFeel", item.feel )
	// $: console.log("chapterFeel", $selectedFeel )
	$: console.log($selectedFeel + ':' + item.feel, item.feel === $selectedFeel);
</script>

{#if type === 'chapter'}
	<li class="chapter {$theme}">
		<span on:click|once={handleChapterClick(item.id)}>{item.title}</span>

		{#each item.chapters as chapter}
			<svelte:self item={chapter} type="chapter" />
		{/each}
	</li>
{/if}

{#if type === 'wonder'}
	<li class="wonder" abstra-count={item.wonder_items.length} worthy={gold}>
		<span on:click|once={handleChapterClick(item.id)}>
			{item.title}

			{#if gold && item.wonders.length > 0}
				<Fa icon={faCaretSquareRight} />
			{/if}
		</span>
		{#each item.wonders as wonder}
			<svelte:self item={wonder} type="wonder" />
		{/each}
	</li>
{/if}

<style>
	li {
		margin-left: 10px;
		border-left: 6px solid #b6a777;
		font-size: 18px;
		/* border-bottom: 6px solid #f9ecc2; */
		margin-bottom: 0;
		padding-left: 12px;
		cursor: pointer;
	}

	li.dark {
		border-left: 6px solid rgb(228 146 127);
		color: #ffdbd3;
	}

	li:hover {
		border-left: 6px #416fff solid;
	}

	.chapter[abstra-count='0'] {
		color: #ccc;
	}

	.wonder[worthy='false'] > span {
		display: none;
	}
</style>
