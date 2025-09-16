<script>
	import Api from '$lib/api/api.js';
	import { user } from '$lib/stores/user';
	import { theme } from '$lib/stores/main';
	import CardSet from './CardSet.svelte';

	export let chapter;

	/** @type {Array<any>} */
	let cardSets = [];
	let isLoading = false;
	/** @type {string | null} */
	let error = null;
	let showCreateForm = false;
	let newCardSetTitle = '';

	// Fetch card sets for this chapter
	const fetchCardSets = async () => {
		if (!chapter?.id) return;

		isLoading = true;
		error = null;

		try {
			const response = await Api.get(`/chapters/${chapter.id}/card_sets`);
			cardSets = response || [];
		} catch (err) {
			error = 'Failed to load card sets';
			console.error('Error fetching card sets:', err);
		} finally {
			isLoading = false;
		}
	};

	// Create new card set
	const createCardSet = async () => {
		if (!newCardSetTitle.trim()) return;

		try {
			const response = await Api.post('/card_sets', {
				title: newCardSetTitle.trim(),
				chapter_body_id: chapter.chapter_body?.id
			});

			cardSets = [...cardSets, response];
			newCardSetTitle = '';
			showCreateForm = false;
		} catch (err) {
			error = 'Failed to create card set';
			console.error('Error creating card set:', err);
		}
	};

	// Delete card set
	/**
	 * @param {string | number} cardSetId
	 */
	const deleteCardSet = async (cardSetId) => {
		if (
			!confirm(
				'Are you sure you want to delete this card set? This will also delete all cards in it.'
			)
		) {
			return;
		}

		try {
			await Api.delete(`/card_sets/${cardSetId}`);
			cardSets = cardSets.filter((set) => set.id !== cardSetId);
		} catch (err) {
			error = 'Failed to delete card set';
			console.error('Error deleting card set:', err);
		}
	};

	// Update card set
	/**
	 * @param {string | number} cardSetId
	 * @param {any} updates
	 */
	const updateCardSet = async (cardSetId, updates) => {
		try {
			const response = await Api.put(`/card_sets/${cardSetId}`, updates);
			cardSets = cardSets.map((set) => (set.id === cardSetId ? { ...set, ...response } : set));
		} catch (err) {
			error = 'Failed to update card set';
			console.error('Error updating card set:', err);
		}
	};

	// Sentence segmentation tuned for book prose
	function splitIntoSentences(content) {
		const ABBRS = [
			'Mr',
			'Mrs',
			'Ms',
			'Mx',
			'Dr',
			'Prof',
			'Sr',
			'Jr',
			'St',
			'Mt',
			'Messrs',
			'Mmes',
			'Rev',
			'Hon',
			'Pres',
			'Gov',
			'Sen',
			'Rep',
			'Gen',
			'Adm',
			'Capt',
			'Sgt',
			'Col',
			'Maj',
			'Lt',
			'Br',
			'Fr',
			'Ave',
			'Blvd',
			'Rd',
			'No',
			'Dept',
			'Est',
			'Fig',
			'Vol',
			'Ch',
			'pp',
			'p',
			'vs',
			'etc',
			'e.g',
			'i.e',
			'U.S',
			'U.K',
			'U.N'
		];

		const DOT = '§§DOT§§',
			ELLIP = '§§ELLIP§§',
			PARA = '§§PARA§§';

		// --- normalize & join soft wraps (keep paragraph breaks) ---
		let t = (content || '').replace(/\r\n?/g, '\n');
		t = t
			.replace(/\n{2,}/g, PARA)
			.replace(/\n/g, ' ')
			.replace(new RegExp(PARA, 'g'), '\n\n');

		// --- protect non-terminal periods ---
		t = t
			.replace(/\.\.\./g, ELLIP)
			.replace(/\b([A-Z]\.){2,}(?=\W|$)/g, (m) => m.replaceAll('.', DOT))
			.replace(/\b([A-Z])\.(?=\s+[A-Z][a-z])/g, `$1${DOT}`)
			.replace(
				new RegExp(`\\b(?:${ABBRS.map((a) => a.replace(/\./g, '\\.')).join('|')})\\.`, 'g'),
				(m) => m.replace('.', DOT)
			)
			.replace(/(\d)\.(\d)/g, `$1${DOT}$2`);

		// --- sentence boundaries ---
		t = t
			.replace(/\n{2,}/g, '\n\n|') // paragraph = hard boundary
			.replace(/([.!?]|§§ELLIP§§)([”"'\)\]]*)\s+(?=(?:[“"'(\[]*[A-Z0-9]))/g, '$1$2|');

		// --- split & restore ---
		const sentences = t
			.split('|')
			.map((s) => s.replaceAll(DOT, '.').replaceAll(ELLIP, '...').trim())
			.filter((s) => s.length > 0);

		// ---- helper: is a full quoted sentence? ----
		const OPEN = `“"‘'`;
		const CLOSE = `”"’'`;
		const isQuoted = (s) => {
			if (!s) return false;
			const start = s.trim()[0];
			const end = s.trim().slice(-1);
			return OPEN.includes(start) && (CLOSE.includes(end) || /[.!?][”"’']$/.test(s.trim()));
		};

		// --- merge pattern: quoted → narration → quoted ---
		const merged = [];
		for (let i = 0; i < sentences.length; i++) {
			const a = sentences[i];
			const b = sentences[i + 1];
			const c = sentences[i + 2];

			if (isQuoted(a) && b && !isQuoted(b) && c && isQuoted(c)) {
				const combo = `${a} ${b} ${c}`.replace(/\s+/g, ' ').trim();
				merged.push(combo);
				i += 2; // skip b & c (consumed)
			} else {
				merged.push(a);
			}
		}

		// --- shape cards (preserve short quoted replies; no min length) ---
		return merged.map((body, idx) => ({ body, position: idx + 1 }));
	}

	// Generate card set from chapter body (like Reader)
	const generateCardSet = async () => {
		if (!chapter?.id) return;

		isLoading = true;
		error = null;

		try {
			// First, get the chapter body content
			const bodyResponse = await Api.get(`/chapters/${chapter.id}/chapter_body`);
			const content = bodyResponse.body;

			if (!content || content === '<p>Start writing your chapter...</p>') {
				error = 'No chapter content found to generate cards from';
				return;
			}

			// Split by sentences (like Reader does)
			const sentences = splitIntoSentences(content);

			// Create a new card set
			const cardSetResponse = await Api.post('/card_sets', {
				title: `Generated from Chapter ${chapter.id}`,
				chapter_body_id: bodyResponse.id
			});

			// Create all the cards in the set
			await Api.post(`/card_sets/${cardSetResponse.id}/batch_create_cards`, {
				cards: sentences
			});

			// Refresh to get the updated card set with cards
			await fetchCardSets();
		} catch (err) {
			error = 'Failed to generate card set from chapter body';
			console.error('Error generating card set:', err);
		} finally {
			isLoading = false;
		}
	};

	// Refresh card sets after any changes
	const refreshCardSets = () => {
		fetchCardSets();
	};

	// Initialize on mount
	$: if (chapter?.id) {
		fetchCardSets();
	}
</script>

<div class="cards-container {$theme}">
	<div class="header">
		<h2>Cards</h2>
		{#if $user?.admin}
			<div class="header-buttons">
				<button class="generate-button" on:click={generateCardSet} disabled={isLoading}>
					<i class="fas fa-bolt" />
					Generate Set
				</button>
				<button class="create-button" on:click={() => (showCreateForm = !showCreateForm)}>
					<i class="fas fa-plus" />
					New Card Set
				</button>
			</div>
		{/if}
	</div>

	{#if error}
		<div class="error-message">
			{error}
			<button on:click={() => (error = null)}>×</button>
		</div>
	{/if}

	{#if showCreateForm && $user?.admin}
		<div class="create-form">
			<input
				type="text"
				bind:value={newCardSetTitle}
				placeholder="Enter card set title..."
				class="title-input"
			/>
			<div class="form-actions">
				<button class="save-button" on:click={createCardSet} disabled={!newCardSetTitle.trim()}>
					Create
				</button>
				<button
					class="cancel-button"
					on:click={() => {
						showCreateForm = false;
						newCardSetTitle = '';
					}}
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}

	{#if isLoading}
		<div class="loading-state">
			<div class="spinner" />
			<p>Loading card sets...</p>
		</div>
	{:else if cardSets.length === 0}
		<div class="empty-state">
			<p>No card sets yet</p>
			{#if $user?.admin}
				<p class="subtitle">Create your first card set to get started!</p>
			{/if}
		</div>
	{:else}
		<div class="card-sets">
			{#each cardSets as cardSet (cardSet.id)}
				<CardSet
					{chapter}
					{cardSet}
					{user}
					onDelete={() => deleteCardSet(cardSet.id)}
					onUpdate={(/** @type {any} */ updates) => updateCardSet(cardSet.id, updates)}
					onRefresh={refreshCardSets}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.cards-container {
		padding: 1rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.header h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-color);
	}

	.header-buttons {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.generate-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: #ff6b35;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.generate-button:hover:not(:disabled) {
		background: #e55a2b;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(255, 107, 53, 0.3);
	}

	.generate-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.create-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: #1d9bf0;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.create-button:hover {
		background: #1a8cd8;
	}

	.error-message {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		background: #fee;
		border: 1px solid #fcc;
		border-radius: 8px;
		color: #c33;
		margin-bottom: 1rem;
	}

	.error-message button {
		background: none;
		border: none;
		color: #c33;
		font-size: 1.2rem;
		cursor: pointer;
		padding: 0;
		width: 20px;
		height: 20px;
	}

	.create-form {
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.title-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ced4da;
		border-radius: 4px;
		font-size: 1rem;
		margin-bottom: 1rem;
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
	}

	.save-button,
	.cancel-button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.save-button {
		background: #28a745;
		color: white;
	}

	.save-button:hover:not(:disabled) {
		background: #218838;
	}

	.save-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.cancel-button {
		background: #6c757d;
		color: white;
	}

	.cancel-button:hover {
		background: #5a6268;
	}

	.loading-state,
	.empty-state {
		text-align: center;
		padding: 3rem 2rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #1d9bf0;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.empty-state p {
		font-size: 1.2rem;
		color: #6c757d;
		margin: 0;
	}

	.empty-state .subtitle {
		font-size: 1rem;
		color: #adb5bd;
		margin-top: 0.5rem;
	}

	.card-sets {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Dark theme styles */
	.dark .create-form {
		background: #2f3336;
		border-color: #3f4447;
	}

	.dark .title-input {
		background: #1e2732;
		border-color: #3f4447;
		color: #e7e9ea;
	}

	.dark .empty-state p {
		color: #71767b;
	}

	.dark .empty-state .subtitle {
		color: #536471;
	}

	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.header-buttons {
			flex-direction: column;
			gap: 0.5rem;
		}

		.generate-button,
		.create-button {
			justify-content: center;
		}

		.form-actions {
			flex-direction: column;
		}
	}
</style>
