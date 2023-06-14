<script>
	import Api from '$lib/api/api';
	import { openModal } from 'svelte-modals';
	import ChapterModal from '$lib/modals/videos/chapter.svelte';

	export let user;
	export let refresh = () => {};
	export let chapter;
	export let challenge;
	export let destroy;
	export let editable = false;

	let input;
	let html;
	let timer;

	const debounce = (v) => {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			const response = await Api.put('/challenges/' + challenge.id + '.json', {
				title: v,
				method: '_post'
			});
			// let response = await Api.get("/challenges/"+challenge.id+".json")
			console.log('response', response);
		}, 1000);
	};

	//
</script>

<li class:has_video={challenge && challenge.preview}>
	{#if user && user.admin === true}
		<span contenteditable on:keyup={(e) => debounce(event.target.innerHTML)}>{challenge.title}</span
		>
		{#if !editable}
			<span class="fa fa-trash" on:click={() => destroy(challenge.id)} />
		{/if}
	{:else}
		<span>{challenge.title}</span>
	{/if}
	<div class:hidden={!challenge.preview} class="abstra-play">
		<img class="abstra-preview" src={challenge.preview} />
	</div>
</li>

<style>
	.hidden {
		display: none;
	}

	li {
		list-style: none;
		padding: 30px;
		position: relative;

		margin-bottom: 10px;
		background: #7ff7ff;
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

		.challenges {
			width: 100%;
		}

		.challenges .has_video {
			padding-top: 55px;
		}
	}
</style>
