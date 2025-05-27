<div class="loading-container">
	<div class="book">
		<div class="book-page" />
		<div class="book-page" />
		<div class="book-page" />
	</div>
	<p>Loading literary tweets...</p>
</div>

<style>
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		gap: 1rem;
	}

	.book {
		position: relative;
		width: 60px;
		height: 40px;
		perspective: 1000px;
	}

	.book-page {
		position: absolute;
		width: 100%;
		height: 100%;
		background-color: #f0f0f0;
		border: 1px solid #d0d0d0;
		border-radius: 2px;
		transform-origin: left center;
		animation: flip 1.5s infinite ease-in-out;
	}

	.book-page:nth-child(1) {
		animation-delay: 0s;
	}

	.book-page:nth-child(2) {
		animation-delay: 0.25s;
	}

	.book-page:nth-child(3) {
		animation-delay: 0.5s;
	}

	@keyframes flip {
		0% {
			transform: rotateY(0deg);
		}
		50% {
			transform: rotateY(-180deg);
		}
		100% {
			transform: rotateY(0deg);
		}
	}

	p {
		color: #666;
		font-family: 'Georgia', serif;
		font-style: italic;
	}
</style>
