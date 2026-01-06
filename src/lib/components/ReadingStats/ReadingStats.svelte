<script>
	import { onMount } from 'svelte';
	import { user } from '$lib/stores/user';
	import Api from '$lib/api/api.js';

	let stats = null;
	let isLoading = true;
	let error = null;

	async function loadStats() {
		if (!$user) return;

		isLoading = true;
		error = null;

		try {
			const response = await Api.get(`/users/${$user.id}/reading_stats`);
			stats = response;
		} catch (err) {
			console.error('Failed to load reading stats:', err);
			error = 'Failed to load reading statistics';
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadStats();
	});

	function formatMinutes(minutes) {
		if (minutes < 60) {
			return `${Math.round(minutes)} min`;
		}
		const hours = Math.floor(minutes / 60);
		const mins = Math.round(minutes % 60);
		return `${hours}h ${mins}m`;
	}
</script>

<div class="reading-stats">
	<div class="stats-header">
		<h3>Reading Statistics</h3>
		<button class="refresh-btn" on:click={loadStats} disabled={isLoading}>
			<i class="fas fa-sync-alt" class:spinning={isLoading} />
		</button>
	</div>

	{#if isLoading}
		<div class="stats-loading">
			<div class="spinner-small" />
			<span>Loading stats...</span>
		</div>
	{:else if error}
		<div class="stats-error">
			<div class="error-icon">⚠️</div>
			<div class="error-message">{error}</div>
			<button class="retry-button" on:click={loadStats}>Retry</button>
		</div>
	{:else if stats}
		<div class="stats-grid">
			<div class="stat-card">
				<div class="stat-label">Total Reading Time</div>
				<div class="stat-value">{formatMinutes(stats.total_time_minutes || 0)}</div>
			</div>

			<div class="stat-card">
				<div class="stat-label">Total Sessions</div>
				<div class="stat-value">{stats.total_sessions || 0}</div>
			</div>

			<div class="stat-card">
				<div class="stat-label">Average Session</div>
				<div class="stat-value">{formatMinutes(stats.average_session_minutes || 0)}</div>
			</div>

			<div class="stat-card">
				<div class="stat-label">Today</div>
				<div class="stat-value">{formatMinutes(stats.today_minutes || 0)}</div>
			</div>

			<div class="stat-card">
				<div class="stat-label">This Week</div>
				<div class="stat-value">{formatMinutes(stats.week_minutes || 0)}</div>
			</div>

			<div class="stat-card">
				<div class="stat-label">Reading Streak</div>
				<div class="stat-value streak">
					{stats.streak_days || 0} {stats.streak_days === 1 ? 'day' : 'days'}
					{#if (stats.streak_days || 0) > 0}
						<span class="streak-icon">🔥</span>
					{/if}
				</div>
			</div>
		</div>

		{#if stats.books_by_time && stats.books_by_time.length > 0}
			<div class="books-section">
				<h4>Books Read</h4>
				<div class="books-list">
					{#each stats.books_by_time as book}
						<div class="book-item">
							<div class="book-info">
								<div class="book-title">{book.book_title}</div>
								<div class="book-meta">
									<span class="book-time">{formatMinutes(book.minutes)}</span>
									<span class="book-sessions">{book.sessions} {book.sessions === 1 ? 'session' : 'sessions'}</span>
								</div>
							</div>
							<div class="book-progress-bar">
							<div
								class="book-progress-fill"
								style="width: {(() => {
									const maxMinutes = Math.max(...stats.books_by_time.map(b => b.minutes));
									return maxMinutes > 0 ? (book.minutes / maxMinutes) * 100 : 0;
								})()}%"
							/>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if stats.sessions_by_date && stats.sessions_by_date.length > 0}
			<div class="stats-chart">
				<h4>Recent Activity (Last 30 Days)</h4>
				<div class="chart-container">
					{#each stats.sessions_by_date as day}
						<div class="chart-bar-wrapper">
							<div
								class="chart-bar"
								style="height: {Math.max(5, (day.minutes / Math.max(...stats.sessions_by_date.map(d => d.minutes))) * 100)}%"
								title="{day.date}: {formatMinutes(day.minutes)}"
							/>
							<div class="chart-label">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.reading-stats {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		margin: 1.5rem 0;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.stats-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.stats-header h3 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.refresh-btn {
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		color: #536471;
		transition: color 0.2s, transform 0.2s;
	}

	.refresh-btn:hover {
		color: #1d9bf0;
		transform: rotate(90deg);
	}

	.refresh-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.refresh-btn .spinning {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.stats-loading,
	.stats-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		gap: 1rem;
	}

	.stats-error {
		color: #e74c3c;
	}

	.error-icon {
		font-size: 2rem;
	}

	.error-message {
		font-size: 1rem;
		text-align: center;
	}

	.retry-button {
		background: #1d9bf0;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: background 0.2s;
	}

	.retry-button:hover {
		background: #1a8cd8;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: #f8f9fa;
		border-radius: 8px;
		padding: 1rem;
		text-align: center;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.stat-label {
		font-size: 0.875rem;
		color: #536471;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.stat-value.streak {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.streak-icon {
		font-size: 1.25rem;
	}

	.books-section {
		margin-top: 2rem;
		margin-bottom: 2rem;
	}

	.books-section h4 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.books-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.book-item {
		background: #f8f9fa;
		border-radius: 8px;
		padding: 1rem;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.book-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.book-info {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.75rem;
	}

	.book-title {
		font-size: 1rem;
		font-weight: 600;
		color: #1a1a1a;
		flex: 1;
		margin-right: 1rem;
	}

	.book-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.25rem;
	}

	.book-time {
		font-size: 1rem;
		font-weight: 600;
		color: #1d9bf0;
	}

	.book-sessions {
		font-size: 0.875rem;
		color: #536471;
	}

	.book-progress-bar {
		width: 100%;
		height: 6px;
		background: #e1e5e9;
		border-radius: 3px;
		overflow: hidden;
	}

	.book-progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #1d9bf0, #1a8cd8);
		border-radius: 3px;
		transition: width 0.3s ease;
	}

	.stats-chart {
		margin-top: 2rem;
	}

	.stats-chart h4 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.chart-container {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		height: 200px;
		padding: 1rem 0;
		border-bottom: 2px solid #e1e5e9;
	}

	.chart-bar-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
		justify-content: flex-end;
	}

	.chart-bar {
		width: 100%;
		background: linear-gradient(180deg, #1d9bf0, #1a8cd8);
		border-radius: 4px 4px 0 0;
		min-height: 5px;
		transition: opacity 0.2s;
		cursor: pointer;
	}

	.chart-bar:hover {
		opacity: 0.8;
	}

	.chart-label {
		font-size: 0.75rem;
		color: #536471;
		margin-top: 0.5rem;
		text-align: center;
		transform: rotate(-45deg);
		transform-origin: center;
		white-space: nowrap;
	}

	:global(.dark) .reading-stats {
		background: #15202b;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	:global(.dark) .stats-header h3 {
		color: #e7e9ea;
	}

	:global(.dark) .stat-card {
		background: #1a1d21;
	}

	:global(.dark) .stat-label {
		color: #71767b;
	}

	:global(.dark) .stat-value {
		color: #e7e9ea;
	}

	:global(.dark) .books-section h4 {
		color: #e7e9ea;
	}

	:global(.dark) .book-item {
		background: #1a1d21;
	}

	:global(.dark) .book-title {
		color: #e7e9ea;
	}

	:global(.dark) .book-time {
		color: #1d9bf0;
	}

	:global(.dark) .book-sessions {
		color: #71767b;
	}

	:global(.dark) .book-progress-bar {
		background: #2d3238;
	}

	:global(.dark) .stats-chart h4 {
		color: #e7e9ea;
	}

	:global(.dark) .chart-container {
		border-bottom-color: #2d3238;
	}

	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.chart-label {
			font-size: 0.65rem;
		}
	}
</style>

