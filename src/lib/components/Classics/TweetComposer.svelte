<script>
	import { user } from '$lib/stores/user';
	import Api from '$lib/api/api';

	export let subscribedBooks = [];

	let isModalOpen = false;
	let step = 'book'; // 'book' | 'chapter' | 'compose'
	let selectedBookId = null;
	let selectedChapterId = null;
	let tweetBody = '';
	let isSubmitting = false;
	let error = '';
	let requiredLength = 20;
	let bookChapters = {
		book: null,
		subscribed_chapters: [],
		all_chapters: []
	};

	$: selectedBook = subscribedBooks.find((book) => book.id === selectedBookId);
	$: lastSubscribedChapter =
		bookChapters.subscribed_chapters.length > 0
			? bookChapters.subscribed_chapters[bookChapters.subscribed_chapters.length - 1]
			: null;
	$: nextUnsubscribedChapter = lastSubscribedChapter
		? bookChapters.all_chapters.find(
				(ch) => ch.position === (lastSubscribedChapter?.position || 0) + 1
		  )
		: null;
	$: selectedChapter = bookChapters.all_chapters.find((ch) => ch.id === selectedChapterId);
	$: canSubmit =
		tweetBody.length >= requiredLength && selectedChapterId !== null && selectedBookId !== null;

	function openModal() {
		isModalOpen = true;
		step = 'book';
		selectedBookId = null;
		selectedChapterId = null;
		tweetBody = '';
		error = '';
		bookChapters = {
			book: null,
			subscribed_chapters: [],
			all_chapters: []
		};
	}

	function closeModal() {
		isModalOpen = false;
		step = 'book';
	}

	async function handleBookSelect(bookId) {
		selectedBookId = bookId;
		try {
			const response = await Api.get(`/classic_books/${bookId}/subscribed_chapters/${$user.id}`);
			bookChapters = response;
			step = 'chapter';
		} catch (err) {
			error = 'Failed to load chapters. Please try again.';
			console.error('Error loading chapters:', err);
		}
	}

	function isChapterSelectable(chapter) {
		if (!lastSubscribedChapter) return false;
		return (
			chapter.subscription_status === 'active' ||
			chapter.position === lastSubscribedChapter.position + 1
		);
	}

	function handleChapterSelect(chapter) {
		if (!isChapterSelectable(chapter)) return;
		selectedChapterId = chapter.id;
		step = 'compose';
	}

	function goBack() {
		if (step === 'chapter') {
			step = 'book';
			selectedBookId = null;
			bookChapters = {
				book: null,
				subscribed_chapters: [],
				all_chapters: []
			};
		} else if (step === 'compose') {
			step = 'chapter';
			selectedChapterId = null;
			tweetBody = '';
		}
	}

	async function handleSubmit() {
		if (!canSubmit || selectedChapterId === null) return;

		isSubmitting = true;
		error = '';

		try {
			await Api.post('/tweets', {
				body: tweetBody,
				user_id: $user.id,
				chapter_id: selectedChapterId
			});

			closeModal();
		} catch (err) {
			error = 'Failed to post tweet. Please try again.';
			console.error('Error posting tweet:', err);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<!-- Floating Action Button -->
<button class="fab" on:click={openModal}>
	<i class="fas fa-plus" />
</button>

<!-- Modal -->
{#if isModalOpen}
	<div class="modal-overlay" on:click={closeModal}>
		<div class="modal" on:click|stopPropagation>
			<div class="modal-header">
				{#if step !== 'book'}
					<button class="back-button" on:click={goBack}>
						<i class="fas fa-arrow-left" />
					</button>
				{/if}
				<h2>
					{#if step === 'book'}
						Choose a Book
					{:else if step === 'chapter'}
						Choose a Chapter
					{:else}
						New Thought
					{/if}
				</h2>
				<button class="close-button" on:click={closeModal}>
					<i class="fas fa-times" />
				</button>
			</div>

			<div class="modal-content">
				{#if step === 'book'}
					<div class="book-list">
						{#each subscribedBooks as book}
							<button class="book-item" on:click={() => handleBookSelect(book.id)}>
								<img src={book.image_url} alt={book.title} />
								<span>{book.title}</span>
							</button>
						{/each}
					</div>
				{:else if step === 'chapter'}
					<div class="chapter-selection">
						<div class="selected-book">
							<img src={bookChapters.book?.image_url} alt={bookChapters.book?.title} />
							<h3>{bookChapters.book?.title}</h3>
						</div>
						{#if error}
							<div class="error-message">{error}</div>
						{/if}
						<div class="chapter-list">
							{#each bookChapters.all_chapters as chapter}
								{@const isSelectable = isChapterSelectable(chapter)}
								<button
									class="chapter-item"
									class:subscribed={chapter.subscription_status === 'active'}
									class:selectable={isSelectable}
									class:unselectable={!isSelectable}
									on:click={() => handleChapterSelect(chapter)}
									disabled={!isSelectable}
								>
									<div class="chapter-status">
										{#if chapter.subscription_status === 'active'}
											<i class="fas fa-check-circle" />
										{:else if chapter === nextUnsubscribedChapter}
											<i class="fas fa-unlock" />
										{:else}
											<i class="fas fa-lock" />
										{/if}
									</div>
									<div class="chapter-info">
										<span class="chapter-number">Chapter {chapter.position}</span>
										<span class="chapter-title">{chapter.title}</span>
									</div>
								</button>
							{/each}
						</div>
					</div>
				{:else}
					<div class="compose-section">
						<div class="selected-content">
							<div class="book-info">
								<img
									src={bookChapters.book?.image_url}
									alt={bookChapters.book?.title}
									class="book-cover"
								/>
								<span class="book-title">{bookChapters.book?.title}</span>
							</div>
							<div class="chapter-info">
								<span class="chapter-title">
									{#if selectedChapter?.position}
										#{selectedChapter.position}
									{/if}
									{selectedChapter?.title}
								</span>
							</div>
						</div>
						<textarea
							bind:value={tweetBody}
							placeholder="What are you thinking?"
							maxlength="280"
							rows="4"
						/>
						<div class="character-count">
							<span class:warning={tweetBody.length < requiredLength}>
								{tweetBody.length}/280
							</span>
							{#if tweetBody.length < requiredLength}
								<span class="min-chars">
									({requiredLength - tweetBody.length} more characters needed)
								</span>
							{/if}
						</div>
						{#if error}
							<div class="error-message">{error}</div>
						{/if}
						<button
							class="tweet-button"
							disabled={!canSubmit || isSubmitting}
							on:click={handleSubmit}
						>
							{isSubmitting ? 'Posting...' : 'Thought'}
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.fab {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background-color: #1d9bf0;
		color: white;
		border: none;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		transition: transform 0.2s ease;
		z-index: 100;
	}

	.fab:hover {
		transform: scale(1.1);
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: white;
		border-radius: 16px;
		width: 100%;
		max-width: 600px;
		position: fixed;
		top: 10vh;
		left: 0;
		right: 0;
		margin: 0 auto;
		max-height: 80vh;
		overflow-y: auto;
		display: block;
	}

	.modal-header {
		display: flex;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		position: sticky;
		top: 0;
		background: inherit;
		z-index: 1;
	}

	.modal-header h2 {
		flex: 1;
		text-align: center;
		margin: 0;
		font-size: 1.2rem;
	}

	.back-button,
	.close-button {
		background: none;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		color: #536471;
	}

	.modal-content {
		padding: 1rem;
	}

	.book-list,
	.chapter-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.book-item,
	.chapter-item {
		display: flex;
		align-items: center;
		padding: 1rem;
		border: none;
		background: none;
		cursor: pointer;
		transition: all 0.2s ease;
		border-radius: 8px;
		text-align: left;
		width: 100%;
		gap: 1rem;
	}

	.book-item:hover,
	.chapter-item.selectable:hover {
		background-color: rgba(0, 0, 0, 0.05);
	}

	.chapter-item.subscribed {
		background-color: rgba(29, 155, 240, 0.1);
	}

	.chapter-item.unselectable {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.chapter-status {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		flex-shrink: 0;
	}

	.chapter-status i {
		font-size: 1.1rem;
	}

	.fa-check-circle {
		color: #1d9bf0;
	}

	.fa-unlock {
		color: #00ba7c;
	}

	.fa-lock {
		color: #536471;
	}

	.book-item img {
		width: 48px;
		height: 48px;
		border-radius: 4px;
		margin-right: 1rem;
		object-fit: cover;
	}

	.chapter-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.chapter-number {
		font-weight: bold;
		margin-right: 0.5rem;
	}

	.chapter-title {
		color: #536471;
	}

	.compose-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	textarea {
		width: 100%;
		border: none;
		resize: none;
		font-size: 1.2rem;
		padding: 1rem;
		border-radius: 8px;
		background: transparent;
	}

	textarea:focus {
		outline: none;
	}

	.character-count {
		text-align: right;
		color: #536471;
		font-size: 0.9rem;
	}

	.warning {
		color: #f4212e;
	}

	.min-chars {
		color: #f4212e;
		font-size: 0.8rem;
		margin-left: 0.5rem;
	}

	.tweet-button {
		background-color: #1d9bf0;
		color: white;
		border: none;
		border-radius: 9999px;
		padding: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.tweet-button:hover:not(:disabled) {
		background-color: #1a8cd8;
	}

	.tweet-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error-message {
		color: #f4212e;
		font-size: 0.9rem;
	}

	.chapter-selection {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.selected-book {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
		text-align: center;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}

	.selected-book img {
		width: 120px;
		height: 180px;
		object-fit: cover;
		border-radius: 8px;
		margin-bottom: 1rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.selected-book h3 {
		margin: 0;
		font-size: 1.2rem;
		color: #333;
	}

	.selected-content {
		display: flex;
		align-items: stretch;
		gap: 1.5rem;
		padding: 1rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		margin-bottom: 1rem;
	}

	.book-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.book-cover {
		width: 80px;
		height: 120px;
		object-fit: cover;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.book-title {
		font-size: 0.9rem;
		font-weight: 500;
		text-align: center;
		max-width: 100px;
	}

	:global(.dark) .modal {
		background: #15202b;
	}

	:global(.dark) .modal-header {
		background: #15202b;
		border-bottom-color: rgba(239, 243, 244, 0.1);
	}

	:global(.dark) .book-item:hover,
	:global(.dark) .chapter-item.selectable:hover {
		background-color: rgba(239, 243, 244, 0.1);
	}

	:global(.dark) .chapter-item.subscribed {
		background-color: rgba(29, 155, 240, 0.2);
	}

	:global(.dark) textarea {
		color: #e7e9ea;
	}

	:global(.dark) .chapter-title {
		color: #71767b;
	}

	:global(.dark) .selected-book {
		border-bottom-color: rgba(239, 243, 244, 0.1);
	}

	:global(.dark) .selected-book h3 {
		color: #e7e9ea;
	}

	:global(.dark) .selected-content {
		border-bottom-color: rgba(239, 243, 244, 0.1);
	}

	:global(.dark) .fa-lock {
		color: #71767b;
	}

	@media (max-width: 640px) {
		.modal {
			position: fixed;
			top: 0;
			bottom: 0;
			left: 0;
			right: 0;
			width: 100%;
			height: 100vh;
			max-height: 100vh;
			border-radius: 0;
			margin: 0;
			display: flex;
			flex-direction: column;
		}

		.modal-content {
			flex: 1;
			overflow-y: auto;
		}
	}

	@media (max-width: 480px) {
		.selected-content {
			padding: 0.75rem;
			gap: 1rem;
		}

		.book-cover {
			width: 60px;
			height: 90px;
		}

		.chapter-title {
			font-size: 1rem;
		}
	}
</style>
