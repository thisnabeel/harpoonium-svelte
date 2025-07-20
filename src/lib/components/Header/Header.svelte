<script>
	import { user } from '$lib/stores/user';
	import { activeButton, showFilter, showExplore, setActiveButton } from '$lib/stores/header';
	import {
		subscribedBooks,
		allBooks,
		isLoadingSubscribed,
		isSubscribing,
		fetchSubscribedBooks,
		fetchAllBooks,
		handleSubscribe,
		handleUnsubscribe
	} from '$lib/stores/books';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import BookCard from '../Classics/BookCard.svelte';
	import { goto } from '$app/navigation';
	import { openModal } from 'svelte-modals';
	import Api from '$lib/api/api';
	import CreateBookModal from '$lib/modals/books/create.svelte';
	// import AddBookModal from '$lib/modals/books/add.svelte';

	async function handleFilter() {
		if ($activeButton !== 'filter') {
			setActiveButton('filter');
			await fetchSubscribedBooks($user.id);
		} else {
			setActiveButton(null);
		}
	}

	async function handleExplore() {
		if ($activeButton !== 'explore') {
			setActiveButton('explore');
			if ($allBooks.length === 0) {
				await fetchAllBooks();
			}
		} else {
			setActiveButton(null);
		}
	}

	async function handleGenerateBook() {
		openModal(CreateBookModal);
	}

	$: exploreBooks = $allBooks.filter(
		(book) => !$subscribedBooks.some((subBook) => subBook.id === book.id)
	);

	onMount(async () => {
		if ($user) {
			await fetchSubscribedBooks($user.id);
		}
	});
</script>

{#if $user}
	<div class="header">
		<a href="/" class="logo-link">
			<img src="/logo-light.png" alt="Logo" class="logo" />
		</a>
		<div class="button-container">
			<div class="filter-button-container">
				<img
					src="/library-out.png"
					alt="Filter"
					class="button-icon filter-out"
					class:hidden={$showFilter}
					on:click={handleFilter}
				/>
				<img
					src="/library-in.png"
					alt="Filter"
					class="button-icon filter-in"
					class:hidden={!$showFilter}
					on:click={handleFilter}
				/>
			</div>
			<div class="filter-button-container">
				<img
					src="/explore.png"
					alt="Explore"
					class="button-icon explore-out"
					class:hidden={$showExplore}
					on:click={handleExplore}
				/>
				<img
					src="/explore-in.png"
					alt="Explore"
					class="button-icon explore-in"
					class:hidden={!$showExplore}
					on:click={handleExplore}
				/>
			</div>
		</div>
	</div>

	{#if $showFilter}
		<div class="filter-container" transition:slide>
			{#if $isLoadingSubscribed}
				<div class="loading-state">
					<div class="spinner" />
					<p>Loading your subscribed books...</p>
				</div>
			{:else if $subscribedBooks.length === 0}
				<div class="empty-state">
					<p>You haven't subscribed to any books yet.</p>
					<p class="subtitle">Click Explore to discover new books!</p>
				</div>
			{:else}
				<div class="books-grid">
					{#each $subscribedBooks as book (book.id)}
						<BookCard
							{book}
							actionLabel="Unsubscribe"
							onAction={() => handleUnsubscribe(book, $user.id)}
							isLoading={$isSubscribing}
						/>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	{#if $showExplore}
		<div class="explore-container" transition:slide>
			<div class="books-grid">
				{#if $user?.admin}
					<div class="book-card add-book-card" on:click={handleGenerateBook}>
						<div class="add-book-content">
							<i class="fas fa-bolt" />
							<span>Add New Book</span>
						</div>
					</div>
				{/if}
				{#if exploreBooks.length === 0}
					<div class="empty-state">
						<p>No more books to explore!</p>
						<p class="subtitle">You've subscribed to all available books.</p>
					</div>
				{:else}
					{#each exploreBooks as book (book.id)}
						<BookCard
							{book}
							actionLabel="Subscribe"
							onAction={() => handleSubscribe(book, $user.id)}
							isLoading={$isSubscribing}
						/>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
{/if}

<style>
	.header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;

		width: 70%;
		margin: 0 auto;
	}

	.logo-link {
		text-decoration: none;
		display: block;
	}

	.logo {
		max-width: 100px;
		object-fit: contain;
		position: relative;
		transition: transform 0.2s ease;
	}

	.logo-link:hover .logo {
		transform: scale(1.05);
	}

	.button-container {
		display: flex;
		gap: 1rem;
	}

	.filter-button-container {
		position: relative;
		width: 135px;
		height: 48px;
	}

	.button-container img {
		max-width: 135px;
		cursor: pointer;
		transition: opacity 0.2s ease;
	}

	.filter-button-container img {
		position: absolute;
		top: 0;
		left: 0;
		opacity: 1;
		pointer-events: auto;
	}

	.filter-button-container img.hidden {
		opacity: 0;
		pointer-events: none;
	}

	.filter-container,
	.explore-container {
		width: 70%;
		margin: 0 auto;
		padding: 1rem;
	}

	.books-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.loading-state,
	.empty-state {
		text-align: center;
		padding: 3rem 2rem;
		background: rgba(29, 155, 240, 0.05);
		border-radius: 1rem;
		border: 1px solid rgba(29, 155, 240, 0.1);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.empty-state p {
		font-size: 1.2rem;
		font-weight: 500;
		color: #1d9bf0;
		margin: 0;
	}

	.empty-state .subtitle {
		font-size: 1rem;
		font-weight: normal;
		color: #536471;
		margin-top: 0.25rem;
	}

	.spinner {
		width: 30px;
		height: 30px;
		border: 3px solid rgba(29, 155, 240, 0.3);
		border-radius: 50%;
		border-top-color: #1d9bf0;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	:global(.dark) .loading-state,
	:global(.dark) .empty-state {
		background: rgba(29, 155, 240, 0.2);
		color: #fff;
	}

	:global(.dark) .empty-state .subtitle {
		color: #71767b;
	}

	@media (max-width: 640px) {
		.header {
			flex-direction: column;
			width: 100%;
		}

		.logo {
			max-width: 100px;
			top: -20px;
		}

		.button-container {
			width: 100%;
			justify-content: center;
		}

		.filter-container,
		.explore-container {
			width: 90%;
		}

		.books-grid {
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
			gap: 1rem;
		}
	}

	.add-book-card {
		background: rgba(29, 155, 240, 0.1);
		border: 2px dashed #1d9bf0;
		border-radius: 12px;
		padding: 2rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 250px;
	}

	.add-book-card:hover {
		background: rgba(29, 155, 240, 0.15);
		transform: translateY(-4px);
	}

	.add-book-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		color: #1d9bf0;
	}

	.add-book-content i {
		font-size: 2rem;
	}

	.add-book-content span {
		font-size: 1.2rem;
		font-weight: 600;
	}

	:global(.dark) .add-book-card {
		background: rgba(29, 155, 240, 0.15);
		border-color: rgba(29, 155, 240, 0.3);
	}

	:global(.dark) .add-book-card:hover {
		background: rgba(29, 155, 240, 0.2);
	}
</style>
