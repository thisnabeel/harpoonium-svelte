<script>
	import Home from '$lib/pages/Home/Home.svelte';

	import Api from '$lib/api/api.js';
	import { popularWonders } from '$lib/stores/main.js';
	import { onMount } from 'svelte';

	import Quiz from '$lib/components/Chapters/Tabs/Quiz/Quiz.svelte';
	import TweetList from '$lib/components/Classics/TweetList.svelte';
	import BookScroller from '$lib/components/Classics/BookScroller.svelte';

	const fetchPopularWonders = async () => {
		const response = await Api.get('/museum.json');
		let json = response;
		popularWonders.set(json);
	};

	let quizzes = [];
	const fetchQuestions = async () => {
		quizzes = await Api.get('/quizzes.json');
	};

	onMount(async function () {
		fetchQuestions();
	});

	let selectedBook = null;

	function handleBookSelect(event) {
		selectedBook = event.detail;
	}
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="harpoonium" />
</svelte:head>

<div class="quizzes">
	<BookScroller on:bookSelect={handleBookSelect} />
	<TweetList {selectedBook} />
</div>

<!-- <Home /> -->
<style>
	.quizzes {
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
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 1;
	}

	h1 {
		width: 100%;
	}

	.welcome {
		display: block;
		position: relative;
		width: 100%;
		height: 0;
		padding: 0 0 calc(100% * 495 / 2048) 0;
	}

	.welcome img {
		/* position: absolute; */
		margin: 0 auto;
		max-width: 350px;
		top: 0;
		display: block;
	}

	@media (max-width: 480px) {
		.quizzes {
			margin: 0;
			width: 100%;
		}
	}
</style>
