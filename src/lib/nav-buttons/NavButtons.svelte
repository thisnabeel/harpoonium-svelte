<script>
	import Button from './Button.svelte';
	import MediaQuery from '$lib/MediaQuery/MediaQuery.svelte';
	import { garage } from '$lib/stores/pop-ups';
	import User from './User.svelte';
	import { theme } from '$lib/stores/main';

	const openGaragePopUp = () => {
		garage.set(true);
	};
</script>

<MediaQuery query="(min-width: 400px)" let:matches>
	{#if matches}
		<aside
			class="light"
			on:click={() => {
				if ($theme === 'default') {
					theme.set('dark');
				} else {
					theme.set('default');
				}
			}}
		>
			<Button icon="fa-lightbulb" />
		</aside>

		<User />
		<!-- 
		<aside class="book">
			<Button icon="fa-book" />
		</aside> -->

		<aside class="news">
			<Button icon="fa-newspaper" />
		</aside>

		<!-- <aside class="garage" on:click={openGaragePopUp}>
			<Button img="/icons/garage.png" href={null} bg="#e53935" />
		</aside> -->
	{/if}
</MediaQuery>

<style>
	aside {
		cursor: pointer;
		position: absolute;
	}

	.light {
		top: 40px;
		right: 115px;
		/* z-index: 9999999; */
	}

	.book {
		top: 40px;
		right: 80px;
	}

	.news {
		top: 40px;
		left: 28px;
		display: none;
	}

	.garage {
		bottom: 80px;
		left: 28px;
	}

	.garage :global(img) {
		width: 30px;
		top: 13px;
		left: 10px;
	}
</style>
