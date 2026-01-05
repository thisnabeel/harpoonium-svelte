<script>
	import Header from '$lib/components/Header/Header.svelte';
	import '../app.css';
	import { Modals, closeModal } from 'svelte-modals';
	import { fade } from 'svelte/transition';
	import NavButtons from '$lib/nav-buttons/NavButtons.svelte';
	import { onMount } from 'svelte';
	import Api from '$lib/api/api.js';
	import { csrf_token } from '$lib/stores/api.js';
	import { user } from '$lib/stores/user';
	import { page } from '$app/stores';
	import { theme } from '$lib/stores/main';
	import '@fortawesome/fontawesome-free/css/all.min.css';

	import GaragePopUp from '$lib/pop-ups/Garage.svelte';
	import FullscreenModal from '$lib/components/FullscreenModal/FullscreenModal.svelte';
	import { fullscreenModal, closeFullscreenModal } from '$lib/stores/fullscreenModal';
	import { browser } from '$app/environment';

	import Creds from '$lib/nav-buttons/creds/Creds.svelte';

	let user_signed_in;
	user.subscribe((value) => (user_signed_in = value));

	let csrf;
	let pageLoaded = false;

	// Handle next chapter navigation
	const handleNextChapter = async () => {
		const modalData = $fullscreenModal;
		console.log('handleNextChapter called with modal data:', modalData);

		if (!modalData.currentChapter?.id) {
			console.log('Missing current chapter ID');
			return;
		}

		try {
			// Call the next chapter API endpoint
			console.log({ modalData });
			const response = await Api.get(`/chapters/${modalData.currentChapter.id}/next_chapter`);
			console.log('Next chapter API response:', response);

			if (response.error) {
				console.log('Next chapter API error:', response.error);
				return;
			}

			// Create the card set from the API response
			const nextCardSet = {
				id: response.first_card_set.id,
				title: response.first_card_set.title,
				position: response.first_card_set.position,
				cards: response.cards
			};

			// Create the next chapter object
			const nextChapter = {
				id: response.next_chapter.id,
				title: response.next_chapter.title,
				position: response.next_chapter.position,
				slug: response.next_chapter.slug
			};

			console.log('Next chapter data:', { nextChapter, nextCardSet });

			// Update the modal with the next chapter data
			import('$lib/stores/fullscreenModal').then(({ openFullscreenModal }) => {
				// Keep the same bookId from the current modal
				openFullscreenModal(
					nextCardSet,
					`${modalData.title.split(' - ')[0]} - ${nextChapter.title}`,
					modalData.bookData, // Keep the same book data
					nextChapter,
					0, // Always start at first card (index 0) when navigating to next chapter
					modalData.bookId // Keep the same bookId
				);
			});
		} catch (error) {
			console.error('Failed to navigate to next chapter:', error);
		}
	};

	onMount(async function () {
		// const csrfToken = document.querySelector('meta[name=csrf-token]').content;
		// console.log(csrfToken)
		pageLoaded = true;
		// csrf = await Api.get('/generate_csrf');
		// csrf_token.set(csrf);
		// console.log(csrf_token)
	});
</script>

<svelte:head>
	<meta name="csrf-token" content={csrf} />
	{#if $theme === 'default'}
		<style>
			body {
				background: #fce3bf !important;
			}
		</style>
	{:else if $theme === 'dark'}
		<style>
			body {
				background: #0c0c0c !important;
			}
		</style>
	{/if}
</svelte:head>

<div class="app {$theme}">
	<main>
		{#if !pageLoaded}
			<picture class="logo">
				<img src="/logo-light.png" alt="harpoonium Logo" />
			</picture>
		{:else if $user}
			<NavButtons />
			<Header />

			<slot />
		{:else}
			<div class="creds-wrapper">
				<Creds hidePopUp={true} />
			</div>
		{/if}
	</main>
</div>

<Modals>
	<div slot="backdrop" class="backdrop" transition:fade on:click={closeModal} />
</Modals>

<GaragePopUp />

{#if browser}
	<FullscreenModal
		isOpen={$fullscreenModal.isOpen}
		cardSet={$fullscreenModal.cardSet}
		title={$fullscreenModal.title}
		bookData={$fullscreenModal.bookData}
		currentChapter={$fullscreenModal.currentChapter}
		initialCardIndex={$fullscreenModal.initialCardIndex}
		bookId={$fullscreenModal.bookId}
		onClose={closeFullscreenModal}
		onNextChapter={handleNextChapter}
	/>
{/if}

<!-- <footer>
	<p>visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to learn SvelteKit</p>
</footer> -->
<style>
	.app {
		min-height: 100vh;
		background-image: url('/cabin-bg.png');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		background-attachment: fixed;
		position: relative;
	}

	.app::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.3);
		z-index: 1;
	}

	.app.dark::before {
		background-color: rgba(0, 0, 0, 0.7);
	}

	main {
		position: relative;
		z-index: 2;
		min-height: 100vh;
	}

	.dark {
		color-scheme: dark;
	}

	@media (max-width: 768px) {
		.app {
			background-attachment: scroll;
		}
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

	.logo img {
		margin: 0 auto;
		margin-top: 30px;
		display: block;
		max-width: 200px;
	}

	@media (min-width: 480px) {
		footer {
			padding: 40px 0;
		}
	}
</style>
