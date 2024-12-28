<script>
	export let chapter;
	export let user;
	import Api from '$lib/api/api.js';

	import Inquiry from './Inquiry.svelte';

	const addInquiry = async () => {
		const response = await Api.post('/inquiries.json', {
			inquirable_id: chapter.id,
			inquirable_type: 'Chapter'
		});

		chapter.inquiries = [...chapter.inquiries, response];
	};

	const destroy = async (id) => {
		const response = await Api.delete('/inquiries/' + id + '.json');
		chapter.inquiries = chapter.inquiries.filter((q) => q.id !== id);
	};
</script>

<div class="inquiries">
	<div class="add-inquiry" on:click={addInquiry}>+</div>

	{#each chapter.inquiries || [] as inquiry}
		<Inquiry {inquiry} {user} {chapter} {destroy} />
	{/each}
</div>

<style>
	.add-inquiry {
		font-size: 72px;
		position: absolute;
		right: 50%;
		display: inline;
		height: 0px;
		color: #ffd67f;
		width: 0px;
		bottom: 60px;
	}

	.inquiries {
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
