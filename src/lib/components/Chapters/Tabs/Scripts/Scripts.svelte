<script>
	import Api from '$lib/api/api';
	import { theme } from '$lib/stores/main';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	export let chapter;

	let scripts = [];
	let suggestedTitles = [];
	let isLoading = false;
	let isGeneratingTitles = false;
	let error = null;
	let generatingScriptFor = null;
	let isDeletingScript = null;
	let showOpenerFor = null;
	let openerText = '';

	onMount(async () => {
		await fetchScripts();
	});

	async function fetchScripts() {
		isLoading = true;
		try {
			const response = await Api.get(`/chapters/${chapter.id}/scripts`);
			scripts = response;
		} catch (err) {
			error = 'Failed to load scripts. Please try again.';
			console.error('Error loading scripts:', err);
		} finally {
			isLoading = false;
		}
	}

	async function generateTitles() {
		isGeneratingTitles = true;
		error = null;
		try {
			const response = await Api.get(`/chapters/${chapter.id}/video_titles`);
			suggestedTitles = response.video_titles;
		} catch (err) {
			error = 'Failed to generate title suggestions. Please try again.';
			console.error('Error generating titles:', err);
		} finally {
			isGeneratingTitles = false;
		}
	}

	async function generateScript(scriptId, title, mode) {
		if (generatingScriptFor === scriptId) return;

		generatingScriptFor = scriptId;
		try {
			const params = {
				title: title,
				mode: mode
			};
			if (mode === 'starter' && openerText.length > 2) {
				params.opener = openerText;
			}
			const response = await Api.post(`/chapters/${chapter.id}/generate_script`, params);
			scripts = scripts.map((script) =>
				script.id === scriptId ? { ...script, body: response.script } : script
			);
			showOpenerFor = null;
			openerText = '';
		} catch (err) {
			error = 'Failed to generate script. Please try again.';
			console.error('Error generating script:', err);
		} finally {
			generatingScriptFor = null;
		}
	}

	function toggleOpenerForm(scriptId) {
		if (showOpenerFor === scriptId) {
			showOpenerFor = null;
			openerText = '';
		} else {
			showOpenerFor = scriptId;
		}
	}

	async function deleteScript(scriptId) {
		if (!confirm('Are you sure you want to delete this script?')) return;

		isDeletingScript = scriptId;
		try {
			await Api.delete(`/chapters/${chapter.id}/scripts/${scriptId}`);
			scripts = scripts.filter((script) => script.id !== scriptId);
		} catch (err) {
			error = 'Failed to delete script. Please try again.';
			console.error('Error deleting script:', err);
		} finally {
			isDeletingScript = null;
		}
	}

	function removeSuggestedTitle(title) {
		if (!confirm('Remove this suggestion?')) return;
		suggestedTitles = suggestedTitles.filter((t) => t !== title);
	}
</script>

<div class="scripts-container {$theme}">
	<div class="header">
		<h2>Video Scripts</h2>
		<button class="generate-btn" on:click={generateTitles} disabled={isGeneratingTitles}>
			<i class="fas fa-bolt" />
			{isGeneratingTitles ? 'Generating...' : 'Generate New Ideas'}
		</button>
	</div>

	{#if error}
		<div class="error-message">{error}</div>
	{/if}

	{#if isGeneratingTitles}
		<div class="loading">
			<div class="spinner" />
			<span>Generating new title ideas...</span>
		</div>
	{/if}

	{#if suggestedTitles.length > 0}
		<div class="section-header">
			<h3>New Title Suggestions</h3>
			<span class="hint">Click a title's lightning bolt to create a new script</span>
		</div>
		<div class="titles-grid">
			{#each suggestedTitles as title}
				<div class="title-card suggested">
					<div class="title-content">
						<p>{title}</p>
						<div class="actions">
							<button class="action-btn" on:click={() => navigator.clipboard.writeText(title)}>
								<i class="fas fa-copy" />
							</button>
							<button
								class="action-btn"
								on:click={async () => {
									const response = await Api.post(`/chapters/${chapter.id}/scripts`, { title });
									scripts = [...scripts, response];
									suggestedTitles = suggestedTitles.filter((t) => t !== title);
								}}
							>
								<i class="fas fa-plus" />
							</button>
							<button class="action-btn delete" on:click={() => removeSuggestedTitle(title)}>
								<i class="fas fa-times" />
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if isLoading}
		<div class="loading">
			<div class="spinner" />
			<span>Loading scripts...</span>
		</div>
	{:else if scripts.length > 0}
		<div class="section-header">
			<h3>Existing Scripts</h3>
		</div>
		<div class="titles-grid">
			{#each scripts as script (script.id)}
				<div class="title-card">
					<div class="title-content">
						<div class="title-header">
							<span class="position">#{script.position}</span>
							<p>{script.title}</p>
						</div>
						<div class="actions">
							<button
								class="action-btn"
								on:click={() => navigator.clipboard.writeText(script.title)}
							>
								<i class="fas fa-copy" />
							</button>
							{#if script.body === null}
								<button
									class="action-btn"
									on:click={() => toggleOpenerForm(script.id)}
									class:active={showOpenerFor === script.id}
									disabled={generatingScriptFor === script.id}
								>
									<i class="fas fa-bolt" />
								</button>
							{/if}
							<button
								class="action-btn delete"
								on:click={() => deleteScript(script.id)}
								disabled={isDeletingScript === script.id}
							>
								<i class="fas fa-trash" />
							</button>
						</div>
					</div>
					{#if showOpenerFor === script.id}
						<div class="opener-form" transition:slide>
							<div class="input-container">
								<textarea
									bind:value={openerText}
									placeholder="Enter first line..."
									class="opener-input"
									rows="1"
									on:input={(e) => {
										e.target.style.height = 'auto';
										e.target.style.height = e.target.scrollHeight + 'px';
									}}
								/>
							</div>
							<div class="button-group">
								<button
									class="generate-btn small blue"
									on:click={() => generateScript(script.id, script.title, 'starter')}
								>
									<i class="fas fa-bolt" />
									Starter
								</button>
								<button
									class="generate-btn small green"
									on:click={() => generateScript(script.id, script.title, 'concept')}
								>
									<i class="fas fa-bolt" />
									Concept
								</button>
							</div>
						</div>
					{/if}
					{#if generatingScriptFor === script.id}
						<div class="script-loading">
							<div class="spinner small" />
							<span>Generating script...</span>
						</div>
					{/if}
					{#if script.body}
						<div class="script-content">
							{@html script.body}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty-state">
			<p>No scripts available for this chapter yet. Generate some new ideas to get started!</p>
		</div>
	{/if}
</div>

<style>
	.scripts-container {
		padding: 20px 0;
		--text-color: #000;
	}

	.scripts-container.dark {
		--text-color: #fff;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
	}

	.header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: var(--text-color);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin: 32px 0 16px;
	}

	.section-header h3 {
		margin: 0;
		font-size: 1.2rem;
		color: var(--text-color);
	}

	.hint {
		font-size: 0.9rem;
		color: #536471;
	}

	.generate-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		background-color: #1d9bf0;
		color: white;
		border: none;
		border-radius: 9999px;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.generate-btn:hover:not(:disabled) {
		background-color: #1a8cd8;
	}

	.generate-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		padding: 40px 0;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #1d9bf0;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.spinner.small {
		width: 20px;
		height: 20px;
		border-width: 2px;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.titles-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 16px;
	}

	.title-card {
		background: var(--background-color, #fff);
		border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
		border-radius: 12px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.title-card.suggested {
		background-color: rgba(29, 155, 240, 0.1);
	}

	.title-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.title-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
	}

	.title-header {
		display: flex;
		align-items: baseline;
		gap: 8px;
		flex: 1;
	}

	.position {
		font-size: 0.9rem;
		color: #536471;
		font-weight: 500;
	}

	.title-content p {
		margin: 0;
		font-size: 1rem;
		line-height: 1.5;
		color: var(--text-color);
		flex: 1;
	}

	.actions {
		display: flex;
		gap: 8px;
	}

	.action-btn {
		background: none;
		border: none;
		color: #536471;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.action-btn:hover:not(:disabled) {
		background-color: rgba(0, 0, 0, 0.05);
		color: #1d9bf0;
	}

	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.script-loading {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #536471;
		font-size: 0.9rem;
	}

	.script-content {
		margin-top: 8px;
		padding-top: 12px;
		border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
		font-size: 0.9rem;
		line-height: 1.6;
		color: var(--text-color);
	}

	.error-message {
		color: #f4212e;
		text-align: center;
		padding: 16px;
		background-color: rgba(244, 33, 46, 0.1);
		border-radius: 8px;
		margin-bottom: 16px;
	}

	.empty-state {
		text-align: center;
		color: #536471;
		padding: 40px 0;
	}

	.dark .title-card {
		background: var(--background-color, #15202b);
		border-color: rgba(239, 243, 244, 0.1);
	}

	.dark .title-card.suggested {
		background-color: rgba(29, 155, 240, 0.2);
	}

	.dark .action-btn:hover:not(:disabled) {
		background-color: rgba(239, 243, 244, 0.1);
	}

	.dark .script-content {
		border-color: rgba(239, 243, 244, 0.1);
	}

	.action-btn.delete {
		color: #f4212e;
	}

	.action-btn.delete:hover:not(:disabled) {
		background-color: rgba(244, 33, 46, 0.1);
		color: #f4212e;
	}

	.dark .action-btn.delete:hover:not(:disabled) {
		background-color: rgba(244, 33, 46, 0.2);
	}

	.opener-form {
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.input-container {
		width: 100%;
	}

	.button-group {
		display: flex;
		gap: 8px;
		flex-direction: row;
	}

	.opener-input {
		width: 100%;
		padding: 8px 12px;
		border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
		border-radius: 6px;
		font-size: 0.9rem;
		background: var(--background-color, #fff);
		color: var(--text-color);
		resize: none;
		overflow: hidden;
		min-height: 36px;
		line-height: 1.5;
		font-family: inherit;
	}

	.opener-input:focus {
		outline: none;
		border-color: #1d9bf0;
	}

	.generate-btn.small {
		padding: 8px 16px;
		font-size: 0.9rem;
		height: 36px;
		white-space: nowrap;
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
	}

	.generate-btn.blue {
		background-color: #1d9bf0;
	}

	.generate-btn.green {
		background-color: #17a34a;
	}

	.generate-btn.blue:hover:not(:disabled) {
		background-color: #1a8cd8;
	}

	.generate-btn.green:hover:not(:disabled) {
		background-color: #15803d;
	}

	.action-btn.active {
		background-color: rgba(29, 155, 240, 0.1);
		color: #1d9bf0;
	}

	.dark .opener-input {
		background: var(--background-color, #15202b);
		border-color: rgba(239, 243, 244, 0.1);
	}

	.dark .opener-input:focus {
		border-color: #1d9bf0;
	}

	.dark .action-btn.active {
		background-color: rgba(29, 155, 240, 0.2);
	}
</style>
