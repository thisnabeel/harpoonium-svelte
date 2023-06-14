<script>
	import Header from '$lib/header/Header.svelte';
	import '../app.css';
	import { Modals, closeModal } from 'svelte-modals';
	import { fade } from 'svelte/transition';
	import NavButtons from '$lib/nav-buttons/NavButtons.svelte';
	import { onMount } from 'svelte';
	import Api from '$lib/api/api.js';
	import { csrf_token } from '$lib/stores/api.js';
	import { user } from '$lib/stores/user';

	import GaragePopUp from '$lib/pop-ups/Garage.svelte';

	import Creds from '$lib/nav-buttons/creds/Creds.svelte';

	let user_signed_in;

	let csrf;
	onMount(async function () {
		// const csrfToken = document.querySelector('meta[name=csrf-token]').content;
		// console.log(csrfToken)
		csrf = await Api.get('/generate_csrf');
		csrf_token.set(csrf);
		user.subscribe((value) => (user_signed_in = value));
		// console.log(csrf_token)
	});
</script>

<svelte:head>
	<meta name="csrf-token" content={csrf} />
</svelte:head>

<main>
	{#if $user}
		<NavButtons />
		<Header />
		<slot />
	{:else}
		<div class="creds-wrapper">
			<Creds />
		</div>
	{/if}
</main>

<Modals>
	<div slot="backdrop" class="backdrop" transition:fade on:click={closeModal} />
</Modals>

<GaragePopUp />

<!-- <footer>
	<p>visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to learn SvelteKit</p>
</footer> -->
<style>
	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		/* padding: 1rem; */
		width: 100%;
		max-width: 1024px;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 40px;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 40px 0;
		}
	}
</style>
