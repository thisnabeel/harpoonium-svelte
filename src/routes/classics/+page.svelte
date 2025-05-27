<script>
	import BooksSidebar from '$lib/components/Classics/BooksSidebar.svelte';
	import { theme } from '$lib/stores/main';

	let selectedBook = null;

	function handleBookSelect(book) {
		selectedBook = book;
		// You can implement filtering by book here if needed
	}
</script>

<div class="classics-container {$theme}">
	<BooksSidebar onBookSelect={handleBookSelect} />
	<main class="main-content" />
</div>

<style>
	.classics-container {
		display: flex;
		min-height: 100vh;
		background-color: transparent;
	}

	.classics-container.dark {
		background-color: transparent;
		color: #e7e9ea;
	}

	.main-content {
		flex: 1;
		padding: 2rem;
		background-color: transparent;
		border-left: 1px solid #2f3336;
	}

	.dark .main-content {
		background-color: transparent;
		border-left-color: #2f3336;
	}

	@media (max-width: 768px) {
		.classics-container {
			flex-direction: column;
		}

		.main-content {
			padding: 1rem;
			border-left: none;
			border-top: 1px solid #2f3336;
		}
	}
</style>
