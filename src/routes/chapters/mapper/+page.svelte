<script>
	import Mapper from '$lib/components/Chapters/Mapper/Mapper.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	/** @type {string | number | null} */
	let chapterId = null;

	onMount(() => {
		// Get chapterId from URL query parameters
		const urlParams = new URLSearchParams(window.location.search);
		const id = urlParams.get('chapterId');

		if (id) {
			chapterId = id;
		} else {
			// If no chapterId provided, redirect to home or show error
			alert('No chapter ID provided. Please navigate to a chapter first.');
			goto('/');
		}
	});
</script>

{#if chapterId}
	<Mapper {chapterId} />
{:else}
	<div class="loading">
		<div class="spinner" />
		<span>Loading mapper...</span>
	</div>
{/if}

<style>
	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		color: #536471;
	}

	.spinner {
		width: 30px;
		height: 30px;
		border: 3px solid #1d9bf0;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
