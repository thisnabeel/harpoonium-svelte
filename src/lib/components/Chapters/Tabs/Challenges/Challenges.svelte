<script>
	export let chapter;
	export let user;
	import Api from '$lib/api/api.js';

	import Challenge from './Challenge.svelte';

	const addChallenge = async () => {
		const response = await Api.post('/challenges.json', {
			challengeable_id: chapter.id,
			challengeable_type: 'Chapter'
		});

		chapter.challenges = [...chapter.challenges, response];
	};

	const destroy = async (id) => {
		const response = await Api.delete('/challenges/' + id + '.json');
		chapter.challenges = chapter.challenges.filter((q) => q.id !== id);
	};
</script>

<div class="challenges">
	<div class="add-challenge" on:click={addChallenge}>+</div>

	{#each chapter.challenges || [] as challenge}
		<Challenge {challenge} {user} {chapter} {destroy} />
	{/each}
</div>

<style>
	.add-challenge {
		font-size: 72px;
		position: absolute;
		right: 50%;
		display: inline;
		height: 0px;
		color: #ffd67f;
		width: 0px;
		bottom: 60px;
	}

	.challenges {
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
</style>
