<script>
	import { onMount } from 'svelte';
	import { user } from '$lib/stores/user';
	import Api from '$lib/api/api.js';
	import QuickNavCard from './QuickNavCard.svelte';
	import { showFilter, showExplore } from '$lib/stores/header';

	let recentCursors = [];
	let isLoading = false;

	async function fetchRecentCursors() {
		if (!$user) return;

		isLoading = true;
		try {
			const response = await Api.get(`/users/${$user.id}/recent_cursors`);
			recentCursors = response.cursors || [];
		} catch (error) {
			console.error('Failed to load recent cursors:', error);
			recentCursors = [];
		} finally {
			isLoading = false;
		}
	}

	let lastUserId = null;

	onMount(() => {
		if ($user) {
			lastUserId = $user.id;
			fetchRecentCursors();
		}
	});

	// Refresh when user changes
	$: if ($user && $user.id !== lastUserId) {
		lastUserId = $user.id;
		fetchRecentCursors();
	}
</script>

{#if $user && !$showFilter && !$showExplore && recentCursors.length > 0}
	<div class="quick-nav-container">
		<h3 class="section-title">Continue Reading</h3>
		<div class="quick-nav-row">
			{#if isLoading}
				<div class="loading">Loading...</div>
			{:else}
				{#each recentCursors as cursorData (cursorData.cursor.id)}
					<QuickNavCard {cursorData} />
				{/each}
			{/if}
		</div>
	</div>
{/if}

<style>
	.quick-nav-container {
		width: 70%;
		margin: 0 auto;
		padding: 1.5rem 0;
	}

	.section-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0 0 1rem 0;
		padding: 0 1rem;
	}

	.quick-nav-row {
		display: flex;
		gap: 0.875rem;
		padding: 0 1rem;
		overflow-x: auto;
		scrollbar-width: thin;
		scrollbar-color: #c1c1c1 transparent;
		-webkit-overflow-scrolling: touch;
		scroll-snap-type: x mandatory;
		padding-bottom: 0.5rem;
		/* Hide scrollbar on mobile for cleaner look */
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.quick-nav-row::-webkit-scrollbar {
		display: none;
	}

	/* Show scrollbar on desktop only */
	@media (min-width: 769px) {
		.quick-nav-row {
			scrollbar-width: thin;
			scrollbar-color: #c1c1c1 transparent;
		}

		.quick-nav-row::-webkit-scrollbar {
			display: block;
			height: 4px;
		}

		.quick-nav-row::-webkit-scrollbar-track {
			background: transparent;
		}

		.quick-nav-row::-webkit-scrollbar-thumb {
			background: #c1c1c1;
			border-radius: 2px;
		}

		.quick-nav-row::-webkit-scrollbar-thumb:hover {
			background: #a8a8a8;
		}
	}

	.loading {
		padding: 1rem;
		text-align: center;
		color: #536471;
	}

	:global(.dark) .section-title {
		color: #e7e9ea;
	}

	:global(.dark) .loading {
		color: #71767b;
	}

	@media (max-width: 768px) {
		.quick-nav-container {
			width: 100%;
			padding: 1rem 0 0.75rem 0;
		}

		.quick-nav-row {
			padding: 0 1rem;
			gap: 0.75rem;
			padding-bottom: 0.75rem;
		}

		.section-title {
			padding: 0 1rem;
			font-size: 1rem;
			margin-bottom: 0.75rem;
		}
	}

	@media (max-width: 480px) {
		.quick-nav-container {
			padding: 2.75rem 0 0.5rem 0;
		}

		.quick-nav-row {
			padding: 0 0.75rem;
			gap: 0.625rem;
			padding-bottom: 0.625rem;
		}

		.section-title {
			padding: 0 0.75rem;
			font-size: 0.95rem;
			margin-bottom: 0.625rem;
		}
	}
</style>
