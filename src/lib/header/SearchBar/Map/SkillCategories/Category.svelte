<script>
	import { selectedChapter, selectedFeel } from '$lib/stores/main';

	export let title;
	export let col;
	export let slug;
</script>

<div
	class="feel selected-feel {col}"
	on:click={() => selectedFeel.set(slug)}
	class:selected={$selectedFeel === slug}
>
	<img src="/uploads/feels/{slug}.svg" alt="" class="feels_header" />
	{title}
</div>

<style>
	.selected {
		background: #ffeaa7;
	}
	.col-lg-12 {
		flex: 0 0 100%;
		max-width: 100%;
	}

	.col-lg-4 {
		flex: 0 0 33.3333333333%;
		max-width: 33.3333333333%;
	}

	.feels > .feel {
		padding: 30px;
	}
	.feels {
		text-align: center;
		margin-bottom: 15px;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		margin-right: -15px;
		margin-left: -15px;
	}

	@media (min-width: 992px) {
		.col-lg-12 {
			flex: 0 0 100%;
			max-width: 100%;
		}

		.feel {
			padding: 30px;
		}
	}
</style>
