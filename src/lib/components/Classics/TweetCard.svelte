<script>
	import { theme } from '$lib/stores/main';

	export let tweet = {
		body: '',
		book_title: '',
		chapter_title: '',
		username: '',
		position: 1
	};

	function copyLink() {
		const tweetUrl = window.location.href;
		navigator.clipboard.writeText(tweetUrl);
	}

	$: isBlurred = tweet.chapter_position > 1;
</script>

<div class="tweet-card {$theme}">
	<div class="tweet-content">
		<div class="tweet-header">
			<div class="user-info">
				<span class="display-name">{tweet.username}</span>
				<span class="username">@{tweet.username}</span>
				<span class="dot">·</span>
				<span class="timestamp">21h</span>
			</div>
			<div class="more-options">
				<span>•••</span>
			</div>
		</div>
		<p class="tweet-body" class:blurred={isBlurred}>
			{tweet.body}
			{#if isBlurred}
				<div class="blur-overlay">
					<span>Unlock this tweet by reading previous chapters</span>
				</div>
			{/if}
		</p>
		<div class="book-title-container">
			<svg viewBox="0 0 24 24" width="16" height="16" class="book-icon">
				<path
					fill="currentColor"
					d="M19 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h13v16z"
				/>
				<path fill="currentColor" d="M9 6h7v2H9zm0 5h7v2H9zm0 5h7v2H9z" />
			</svg>
			<p class="book-title">{tweet.book_title} - {tweet.chapter_title}</p>
		</div>
		<div class="tweet-actions">
			{#if false}
				<button class="copy-link" on:click={copyLink}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
						<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
					</svg>
					Copy Link
				</button>
			{/if}
		</div>
	</div>
</div>

<style>
	.tweet-card.dark {
		background-color: transparent;
	}
	.tweet-card {
		background-color: #fff;
		border: 1px solid #2f3336;
		/* border-radius: 12px; */
		padding: 1.5rem;
		/* margin-bottom: 1rem; */
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.tweet-card:hover {
		/* transform: translateY(-2px); */
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		border-color: #d0d0d0;
	}

	.tweet-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.75rem;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 4px;
		font-family: TwitterChirp, -apple-system, system-ui, 'Segoe UI', Roboto, Helvetica, Arial,
			sans-serif;
	}

	.display-name {
		color: rgb(231, 233, 234);
		font-weight: 700;
		font-size: 15px;
	}

	.username {
		color: rgb(113, 118, 123);
		font-size: 15px;
	}

	.dot {
		color: rgb(113, 118, 123);
		padding: 0 4px;
	}

	.timestamp {
		color: rgb(113, 118, 123);
		font-size: 15px;
	}

	.more-options {
		color: rgb(113, 118, 123);
		cursor: pointer;
		font-size: 15px;
	}

	.dark .tweet-body {
		color: rgb(231, 233, 234);
	}

	.tweet-body {
		background-color: rgba(0, 0, 0, 0);
		border: 0px solid #000;
		box-sizing: border-box;
		/* color: rgb(231, 233, 234); */
		cursor: pointer;
		display: inline;
		font-family: TwitterChirp, -apple-system, system-ui, 'Segoe UI', Roboto, Helvetica, Arial,
			sans-serif;
		font-feature-settings: normal;
		font-kerning: auto;
		font-optical-sizing: auto;
		font-size: 15px;
		font-stretch: 100%;
		font-style: normal;
		font-variant: normal;
		font-weight: 400;
		line-height: 20px;
		margin: 0;
		min-width: 0;
		overflow-wrap: break-word;
		padding: 0;
		position: relative;
		tab-size: 4;
		text-align: start;
		text-decoration: none;
		text-size-adjust: 100%;
		white-space: pre-wrap;
		width: auto;
		-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
	}

	.tweet-body.blurred {
		filter: blur(5px);
		user-select: none;
		position: relative;
	}

	.blur-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.5);
		color: white;
		font-size: 0.9rem;
		text-align: center;
		padding: 1rem;
		border-radius: 8px;
		backdrop-filter: blur(2px);
		z-index: 1;
	}

	.book-title-container {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 12px;
		padding: 12px;
		border: 1px solid #2f3336;
		border-radius: 16px;
		transition: background-color 0.2s ease;
		max-width: fit-content;
	}

	.book-title-container:hover {
		background-color: rgba(239, 243, 244, 0.1);
	}

	.book-icon {
		color: rgb(113, 118, 123);
	}

	.dark .book-title {
		color: rgb(231, 233, 234);
	}

	.book-title {
		margin: 0;
		font-size: 15px;
		font-family: TwitterChirp, -apple-system, system-ui, 'Segoe UI', Roboto, Helvetica, Arial,
			sans-serif;
		line-height: 20px;
	}

	.tweet-actions {
		margin-top: 1rem;
		display: flex;
		justify-content: flex-end;
	}

	.copy-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: none;
		border: 1px solid #d0d0d0;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		cursor: pointer;
		color: #666;
		transition: all 0.2s ease;
	}

	.copy-link:hover {
		background-color: #f5f5f5;
		color: #1a1a1a;
	}

	@media (max-width: 768px) {
		.tweet-card {
			padding: 1rem;
		}

		.tweet-header {
			flex-direction: row;
			align-items: flex-start;
			gap: 0.25rem;
		}
	}

	@font-face {
		font-family: 'TwitterChirp';
		src: url('https://abs.twimg.com/fonts/v2/chirp-regular-web.woff2') format('woff2');
		font-weight: 400;
		font-style: normal;
	}

	@font-face {
		font-family: 'TwitterChirp';
		src: url('https://abs.twimg.com/fonts/v2/chirp-bold-web.woff2') format('woff2');
		font-weight: 700;
		font-style: normal;
	}
</style>
