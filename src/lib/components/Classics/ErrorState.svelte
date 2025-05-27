<script>
	export let message = 'Something went wrong while fetching the literary tweets.';
	export let retryCallback = () => {};
</script>

<div class="error-container">
	<div class="error-icon">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="48"
			height="48"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<circle cx="12" cy="12" r="10" />
			<line x1="12" y1="8" x2="12" y2="12" />
			<line x1="12" y1="16" x2="12.01" y2="16" />
		</svg>
	</div>
	<h3>Alas! An Error Occurred</h3>
	<p>{message}</p>
	<button on:click={retryCallback}>Try Again</button>
</div>

<style>
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
		background-color: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 12px;
		margin: 1rem;
	}

	.error-icon {
		color: #dc3545;
		margin-bottom: 1rem;
	}

	h3 {
		font-family: 'Georgia', serif;
		color: #1a1a1a;
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
	}

	p {
		color: #666;
		margin: 0 0 1.5rem 0;
		font-family: 'Georgia', serif;
		line-height: 1.5;
		max-width: 400px;
	}

	button {
		background-color: #1a1a1a;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 20px;
		cursor: pointer;
		font-family: 'Georgia', serif;
		transition: background-color 0.2s ease;
	}

	button:hover {
		background-color: #333;
	}
</style>
