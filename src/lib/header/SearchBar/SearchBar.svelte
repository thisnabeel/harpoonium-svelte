<script>
	import Fa from 'svelte-fa';
	import { faMap } from '@fortawesome/free-solid-svg-icons';

	import { onMount } from 'svelte';
	import Api from '$lib/api/api.js';

	import Map from './Map/Map.svelte';

	import { chapters, chaptersMap, wonders, wondersMap, mapShown, theme } from '$lib/stores/main';

	import { Col, Container, Row, Styles } from 'sveltestrap';
	import Input from './Input/Input.svelte';
	import { subscribe } from 'svelte/internal';
	import { user } from '$lib/stores/user';

	let mapToggle;
	mapShown.subscribe((value) => {
		mapToggle = value;
	});

	const toggleMap = () => {
		console.log('ms', mapToggle);
		mapShown.set(!mapToggle);
	};

	onMount(async function () {
		getChapters();
		getWonders();
	});

	const getChapters = async () => {
		const response = await Api.get(`/${$user.id}/chapters.json`);
		console.log('response', response);
		let json = response;
		chapters.set(json);
		console.log('chapters set', chapters);
		let parents = json.filter((obj) => {
			return obj.chapter_id === null;
		});
		parents.map((chapter, index) => {
			// Connect each Child to Parent
			connectChildToParent(chapter);
		});
		function connectChildToParent(chapter) {
			let children = json.filter((obj) => {
				return obj.chapter_id === chapter.id;
			});
			chapter['chapters'] = children;
			chapter['chapters'].map((chapter, index) => {
				// Connect each Child to Parent
				connectChildToParent(chapter);
			});
		}
		console.log('chapters', parents);
		chaptersMap.set(parents);
	};

	const getWonders = async () => {
		const response = await Api.get('/cached_wonders.json');
		console.log('response', response);
		let json = response;
		wonders.set(json);
		let parents = json.filter((obj) => {
			return obj.wonder_id === null;
		});
		console.log('wokring', 3);
		parents.map((wonder, index) => {
			// Connect each Child to Parent
			connectChildToParent(wonder);
		});
		function connectChildToParent(wonder) {
			let children = json.filter((obj) => {
				return obj.wonder_id === wonder.id;
			});
			wonder['wonders'] = children;
			wonder['wonders'].map((wonder, index) => {
				// Connect each Child to Parent
				connectChildToParent(wonder);
			});
		}

		// console.log("wonders", parents.filter(wonder => wonder.wonders.length !== 0))
		// parents.filter(wonder => wonder.wonders.length !== 0)
		wondersMap.set(parents);
	};
</script>

<Styles />

<Container>
	<div class="row {$theme}">
		<div class="big-col">
			<div class="cta-search">
				<u>Applied</u> phenomenons
			</div>
			<Input type="Wonders" />
		</div>

		<div class="mid-col">
			<div
				class:btn-open={mapToggle}
				class="show-whole-map maps-btn hvr-bob-anyways"
				on:click={toggleMap}
			>
				<Fa icon={faMap} />
			</div>
		</div>
		<div class="big-col">
			<div class="cta-search">
				<u>Raw</u> phenomenons
			</div>
			<Input type="Chapters" />
		</div>
	</div>
</Container>

{#if mapToggle}
	<Map />
{/if}

<style>
	.cta-search {
		position: absolute;
		top: -21px;
		/* left: 30px; */
		margin: 0 auto;
		font-size: 14px;
		color: #e54745;
		font-family: 'sf';
	}

	.row {
		display: flex;
		flex-wrap: wrap;
	}

	.row > div {
		position: relative;
	}

	.row .big-col {
		flex: 0 0 auto;
		width: 41.66666667%;
	}
	.row .mid-col {
		flex: 0 0 auto;
		width: 16.66666667%;
	}

	.searcher {
		position: relative;
	}

	.show-whole-map {
		zoom: 1;
		padding: 2px 0px;
		height: 72%;
		margin: 0;
		cursor: pointer;
		border: 1px solid #bbb;
		overflow: visible;
		/* font: bold 13px arial, helvetica, sans-serif; */
		text-decoration: none;
		white-space: nowrap;
		text-align: center;
		font-size: 34px;
		color: #416fff;
		background-color: #ddd;

		background-image: -webkit-linear-gradient(top, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0));
		border-radius: 6px;
		box-shadow: 0 1px 0 rgb(0 0 0 / 30%), 0 2px 2px -1px rgb(0 0 0 / 50%),
			0 1px 0 rgb(255 255 255 / 30%) inset;
		text-shadow: 0 1px 0 rgb(255 255 255 / 90%);

		transition: background-color 0.2s ease-out;
		background-clip: padding-box;
	}
	.show-whole-map:hover {
		background: #fff;
	}

	.dark .show-whole-map {
		border: 0;
		color: #e4927e;
		background-color: #481e13;
		background-image: -webkit-linear-gradient(top, rgb(153 64 41), rgba(255, 255, 255, 0));
		box-shadow: 0 1px 0 rgb(0 0 0 / 30%), 0 2px 2px -1px rgb(0 0 0 / 50%),
			0 1px 0 rgb(255 255 255 / 30%) inset;
	}

	.btn-open {
		background: #416fff;
		color: #fff;
		border-radius: 6px;
	}

	.btn-open:hover {
		background: #4b6ad0;
	}

	/*  */
	.hvr-bob,
	.hvr-bob-anyways {
		-webkit-transform: perspective(1px) translateZ(0);
		transform: perspective(1px) translateZ(0);
		box-shadow: 0 0 1px rgba(0, 0, 0, 0);
	}

	.hvr-bob:hover,
	.hvr-bob:focus,
	.hvr-bob:active,
	.hvr-bob-anyways {
		-webkit-animation-name: hvr-bob-float, hvr-bob;
		animation-name: hvr-bob-float, hvr-bob;
		-webkit-animation-duration: 0.5s, 3.5s;
		animation-duration: 0.5s, 3.5s;
		-webkit-animation-delay: 0s, 0.5s;
		animation-delay: 0s, 0.5s;
		-webkit-animation-timing-function: ease-out, ease-in-out;
		animation-timing-function: ease-out, ease-in-out;
		-webkit-animation-iteration-count: 1, infinite;
		animation-iteration-count: 1, infinite;
		-webkit-animation-fill-mode: forwards;
		animation-fill-mode: forwards;
		-webkit-animation-direction: normal, alternate;
		animation-direction: normal, alternate;
	}

	@media (max-width: 480px) {
		.row .mid-col {
			margin: 0;
			padding: 0;
		}
	}

	/* Bob */
	@-webkit-keyframes hvr-bob {
		0% {
			-webkit-transform: translateY(-8px);
			transform: translateY(-8px);
		}
		50% {
			-webkit-transform: translateY(-4px);
			transform: translateY(-4px);
		}
		100% {
			-webkit-transform: translateY(-8px);
			transform: translateY(-8px);
		}
	}
	@keyframes hvr-bob {
		0% {
			-webkit-transform: translateY(-8px);
			transform: translateY(-8px);
		}
		50% {
			-webkit-transform: translateY(-4px);
			transform: translateY(-4px);
		}
		100% {
			-webkit-transform: translateY(-8px);
			transform: translateY(-8px);
		}
	}
	@-webkit-keyframes hvr-bob-float {
		100% {
			-webkit-transform: translateY(-8px);
			transform: translateY(-8px);
		}
	}

	@keyframes hvr-bob-float {
		100% {
			-webkit-transform: translateY(-8px);
			transform: translateY(-8px);
		}
	}
</style>
