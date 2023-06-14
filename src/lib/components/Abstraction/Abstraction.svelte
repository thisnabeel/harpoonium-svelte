<script>
	import Api from '$lib/api/api';
	import { openModal } from 'svelte-modals';
	import ChapterModal from '$lib/modals/videos/chapter.svelte';

	export let user;
	export let abstraction;
	export let refresh = () => {};
	export let chapter;

	const destroy = async () => {
		const response = await Api.delete('/abstractions/' + abstraction.id + '.json');
		refresh();
	};

	let input;
	let html;
	let timer;

	function openChapterVideo(chapter, abstraction) {
		openModal(ChapterModal, { chapter: chapter, abstraction: abstraction });
	}

	const debounce = (v) => {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			const response = await Api.put('/abstractions/' + abstraction.id + '.json', {
				body: v,
				method: '_post'
			});
			// let response = await Api.get("/abstractions/"+abstraction.id+".json")
			console.log('response', response);
		}, 1000);
	};
</script>

<li class:has_video={abstraction && abstraction.preview}>
	{#if user && user.admin === true}
		<span contenteditable on:keyup={(e) => debounce(event.target.innerHTML)}
			>{abstraction.body}</span
		>
		<span class="fa fa-trash" on:click={destroy} />
	{:else}
		<span>{abstraction.body}</span>
	{/if}
	<div
		class:hidden={!abstraction.preview}
		class="abstra-play"
		on:click={openChapterVideo(chapter, abstraction)}
	>
		<img class="abstra-preview" src={abstraction.preview} />
	</div>
</li>

<style>
	.hidden {
		display: none;
	}

	li {
		padding: 30px;
		position: relative;
	}

	.fa-trash {
		position: absolute;
		left: -7%;
		top: 39%;
	}

	.abstra-play {
		position: absolute;
		right: -122px;
		top: 14%;
		cursor: pointer;
		width: 130px;
		background: #ffd67f;
		padding: 50px;
		border-radius: 10px;
	}

	/* .abstra-play img {
        max-width: 100%;
    } */

	.abstra-preview {
		position: absolute;
		top: 12%;
		left: -6%;
		border-radius: 10px;
		max-width: 100%;
		z-index: 100;
	}

	@media (max-width: 480px) {
		.abstra-play {
			position: absolute;
			right: 0;
			left: 0;
			margin: 0 auto;
			top: -83px;
			cursor: pointer;
			padding: 55px;
			width: 7.5em;
		}

		.abstra-preview {
			position: absolute;
			top: 9px;
			left: 5px;
			border-radius: 10px;
			/* max-width: 100%; */
			max-width: 170px;
		}

		.abstractions {
			width: 100%;
		}

		.abstractions .has_video {
			padding-top: 55px;
		}
	}
</style>
