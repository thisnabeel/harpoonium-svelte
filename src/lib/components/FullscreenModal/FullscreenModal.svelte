<script>
	import { onMount, onDestroy } from 'svelte';
	import { theme } from '$lib/stores/main';
	import { user } from '$lib/stores/user';
	import Api from '$lib/api/api.js';

	export let isOpen = false;
	export let cardSet = null;
	export let title = '';
	export let onClose = () => {};
	export let onNextChapter = null; // New prop for next chapter functionality
	export let bookData = null; // New prop for book data with current and siblings
	export let currentChapter = null; // New prop for current chapter

	// Debug logging
	$: console.log('FullscreenModal props changed:', { isOpen, cardSet, title });
	$: console.log('Template render check:', {
		isOpen,
		cardSet,
		shouldRender: isOpen && cardSet
	});
	$: console.log('Next chapter button conditions:', {
		isLastCard: currentCardIndex === cardSet?.cards?.length - 1,
		hasNextChapter: !!onNextChapter,
		onNextChapterType: typeof onNextChapter,
		shouldShowNextChapter: currentCardIndex === cardSet?.cards?.length - 1 && onNextChapter
	});

	let currentCardIndex = 0;
	let touchStartY = 0;
	let touchEndY = 0;
	let showChapterDropdown = false;
	let currentUser = null;
	let saveCursorTimer = null; // Timer for debouncing cursor saves
	let loadTagsTimer = null; // Timer for debouncing tag loads
	let lastNavigationTime = 0; // Track last navigation time for throttling
	let isRecapLoading = false;
	let recapData = null;
	let showRecapModal = false;

	// Tag management
	let showTagModal = false;
	let availableTags = [];
	let currentCardTags = [];
	let selectedTagId = null;
	let isLoadingTags = false;
	let isSavingTag = false;
	let tagLoadError = null;
	let isLoadingCardTags = false; // Flag to prevent multiple simultaneous tag loads
	let allCardTags = {}; // Map of card_id -> tag for the entire card set
	let isLoadingAllTags = false;
	let loadedCardSetId = null; // Track which cardSet we've loaded tags for

	// Color mapping for tag types (enhanced color scheme for better contrast and visual appeal)
	const tagColors = {
		'Description / Worldbuilding': '#5dade2', // Vibrant Sky Blue
		'Character Thoughts & Feelings': '#e74c3c', // Bright Red
		'Social Commentary / Philosophy': '#9b59b6', // Rich Purple
		'Plot Movement': '#2ecc71', // Fresh Green
		'Tension Build-Up': '#f39c12', // Energetic Orange
		'Action / Drama': '#e67e22', // Deep Orange
		'Reveals & Twists': '#c0392b', // Intense Red
		Dialogue: '#3498db', // Clear Blue
		'Atmospheric / Mood Setting': '#8e44ad', // Deep Purple
		'Transitional Passage': '#95a5a6', // Neutral Gray
		'Symbolic / Metaphorical Passage': '#1abc9c', // Bright Teal
		'Reflection / Moral Lesson': '#27ae60' // Forest Green
	};

	// Default color for untagged cards
	const defaultTagColor = '#bdc3c7'; // Light gray

	// Subscribe to user store
	user.subscribe((value) => {
		currentUser = value;
	});

	// Save user cursor position with debouncing
	const saveUserCursor = async () => {
		console.log('Saving user cursor:', {
			currentUser,
			currentChapter,
			cardSet,
			currentCardIndex
		});
		if (!currentUser || !currentChapter || !cardSet?.cards) {
			return;
		}

		const currentCard = cardSet.cards[currentCardIndex];
		if (!currentCard) {
			return;
		}

		// Clear existing timer
		if (saveCursorTimer) {
			clearTimeout(saveCursorTimer);
		}

		// Set new timer - save cursor after 2 seconds of no navigation (allows fast navigation)
		saveCursorTimer = setTimeout(async () => {
			try {
				await Api.post('/cards/update_cursor', {
					user_id: currentUser.id,
					chapter_id: currentChapter.id,
					card_id: currentCard.id
				});
				console.log('User cursor saved:', {
					user_id: currentUser.id,
					chapter_id: currentChapter.id,
					card_id: currentCard.id,
					card_index: currentCardIndex
				});
			} catch (error) {
				console.error('Failed to save user cursor:', error);
			}
		}, 2000); // 2 second delay to allow fast navigation
	};

	// Force save cursor immediately (for chapter switching and modal close)
	const saveUserCursorImmediate = async () => {
		if (!currentUser || !currentChapter || !cardSet?.cards) {
			return;
		}

		const currentCard = cardSet.cards[currentCardIndex];
		if (!currentCard) {
			return;
		}

		// Clear any pending timer
		if (saveCursorTimer) {
			clearTimeout(saveCursorTimer);
			saveCursorTimer = null;
		}

		try {
			await Api.post('/cards/update_cursor', {
				user_id: currentUser.id,
				chapter_id: currentChapter.id,
				card_id: currentCard.id
			});
			console.log('User cursor saved immediately:', {
				user_id: currentUser.id,
				chapter_id: currentChapter.id,
				card_id: currentCard.id,
				card_index: currentCardIndex
			});
		} catch (error) {
			console.error('Failed to save user cursor:', error);
		}
	};

	// Navigate to next card (with throttling to prevent rapid clicks)
	const nextCard = () => {
		const now = Date.now();
		// Throttle navigation to max once per 100ms to prevent glitches
		if (now - lastNavigationTime < 100) {
			return;
		}
		lastNavigationTime = now;

		if (cardSet?.cards && currentCardIndex < cardSet.cards.length - 1) {
			currentCardIndex++;
			saveUserCursor(); // Don't await - let it debounce in background
		}
	};

	// Navigate to previous card (with throttling to prevent rapid clicks)
	const prevCard = () => {
		const now = Date.now();
		// Throttle navigation to max once per 100ms to prevent glitches
		if (now - lastNavigationTime < 100) {
			return;
		}
		lastNavigationTime = now;

		if (currentCardIndex > 0) {
			currentCardIndex--;
			saveUserCursor(); // Don't await - let it debounce in background
		}
	};

	// Navigate to a specific card by index
	const navigateToCard = (targetIndex) => {
		if (!cardSet?.cards || targetIndex < 0 || targetIndex >= cardSet.cards.length) {
			return;
		}

		const now = Date.now();
		// Throttle navigation to max once per 100ms to prevent glitches
		if (now - lastNavigationTime < 100) {
			return;
		}
		lastNavigationTime = now;

		currentCardIndex = targetIndex;
		saveUserCursor(); // Don't await - let it debounce in background
	};

	// Handle next chapter
	const handleNextChapter = async () => {
		if (onNextChapter && typeof onNextChapter === 'function') {
			// await saveUserCursorImmediate(); // Save current position before moving to next chapter
			onNextChapter();
		}
	};

	// Toggle chapter dropdown
	const toggleChapterDropdown = () => {
		showChapterDropdown = !showChapterDropdown;
	};

	// Switch to a different chapter
	const switchToChapter = async (chapterData) => {
		if (!bookData || !chapterData) return;

		try {
			// Save current position before switching
			await saveUserCursorImmediate();

			// Update the current chapter and card set
			currentChapter = chapterData.chapter;
			cardSet = chapterData.card_set;
			currentCardIndex = 0;
			showChapterDropdown = false;

			// Save new position
			await saveUserCursorImmediate();
		} catch (error) {
			console.error('Failed to switch chapter:', error);
		}
	};

	// Handle keyboard navigation
	const handleKeydown = (event) => {
		if (!isOpen) return;

		if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'ArrowDown') {
			event.preventDefault();
			nextCard(); // Don't await - allow fast navigation
		} else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
			event.preventDefault();
			prevCard(); // Don't await - allow fast navigation
		} else if (event.key === 'Escape') {
			event.preventDefault();
			onClose();
		}
	};

	// Handle touch/swipe navigation
	const handleTouchStart = (event) => {
		event.preventDefault();
		touchStartY = event.touches[0].clientY;
	};

	const handleTouchMove = (event) => {
		event.preventDefault();
	};

	const handleTouchEnd = (event) => {
		event.preventDefault();
		touchEndY = event.changedTouches[0].clientY;
		handleSwipe();
	};

	const handleSwipe = () => {
		const swipeThreshold = 50;
		const swipeDistance = touchStartY - touchEndY;

		if (Math.abs(swipeDistance) > swipeThreshold) {
			if (swipeDistance > 0) {
				// Swipe up - next card
				nextCard(); // Don't await - allow fast navigation
			} else {
				// Swipe down - previous card
				prevCard(); // Don't await - allow fast navigation
			}
		}
	};

	// Handle mouse click navigation
	const handleCardClick = (event) => {
		if (!isOpen) return;

		const cardElement = event.currentTarget;
		const rect = cardElement.getBoundingClientRect();
		const clickY = event.clientY;
		const cardCenterY = rect.top + rect.height / 2;

		if (clickY < cardCenterY) {
			// Click in upper half - previous card
			prevCard(); // Don't await - allow fast navigation
		} else {
			// Click in lower half - next card
			nextCard(); // Don't await - allow fast navigation
		}
	};

	// Load user's saved cursor position when modal opens
	const loadUserCursor = async () => {
		if (!currentUser || !currentChapter || !bookData) {
			return;
		}

		try {
			const response = await Api.get(
				`/users/${currentUser.id}/cursor/${bookData?.current?.chapter?.id}`
			);
			if (response && response.card_id) {
				// Find the card index for the saved card
				const savedCardIndex = cardSet?.cards?.findIndex((card) => card.id === response.card_id);
				if (savedCardIndex !== -1) {
					currentCardIndex = savedCardIndex;
					console.log('Loaded user cursor position:', {
						card_id: response.card_id,
						card_index: currentCardIndex
					});
				}
			}
		} catch (error) {
			// If no cursor found, start from beginning (error 404 is expected)
			if (error.response?.status !== 404) {
				console.error('Failed to load user cursor:', error);
			}
		}
	};

	// Reset card index when modal opens
	$: if (isOpen && cardSet?.cards && typeof document !== 'undefined') {
		document.body.style.overflow = 'hidden';
		// Load user's saved position
		loadUserCursor();

		// Only load tags if we haven't loaded them for this cardSet yet
		const currentCardSetId = cardSet.id || cardSet.cards[0]?.id;
		if (currentCardSetId !== loadedCardSetId) {
			loadedCardSetId = currentCardSetId;
			// Load all card tags for progress bar coloring (only once per cardSet)
			loadAllCardTags();
		}
	} else if (!isOpen && typeof document !== 'undefined') {
		document.body.style.overflow = '';
		// Clear tag map and loaded cardSet ID when modal closes
		allCardTags = {};
		loadedCardSetId = null;
	}

	// Add keyboard event listener
	$: if (isOpen && typeof document !== 'undefined') {
		document.addEventListener('keydown', handleKeydown);
	} else if (typeof document !== 'undefined') {
		document.removeEventListener('keydown', handleKeydown);
	}

	// Handle click outside dropdown
	const handleClickOutside = (event) => {
		if (showChapterDropdown && !event.target.closest('.chapter-dropdown')) {
			showChapterDropdown = false;
		}
	};

	// Handle touch events on dropdown to prevent closing when scrolling
	const handleDropdownTouch = (event) => {
		// Prevent the touch event from bubbling up and closing the dropdown
		event.stopPropagation();
	};

	// Add click outside listener
	$: if (isOpen && typeof document !== 'undefined') {
		document.addEventListener('click', handleClickOutside);
	} else if (typeof document !== 'undefined') {
		document.removeEventListener('click', handleClickOutside);
	}

	// Save cursor when modal closes
	const handleClose = async () => {
		await saveUserCursorImmediate(); // Use immediate save for modal close
		onClose();
	};

	// Load recap for current card
	const loadRecap = async () => {
		if (!cardSet?.cards || !cardSet.cards[currentCardIndex]) {
			return;
		}

		const currentCard = cardSet.cards[currentCardIndex];
		isRecapLoading = true;
		recapData = null;

		try {
			const response = await Api.get(`/cards/${currentCard.id}/recap`);
			if (response.error) {
				throw new Error(response.error);
			}
			recapData = response;
			showRecapModal = true;
		} catch (error) {
			console.error('Failed to load recap:', error);
			alert('Failed to load recap. Please try again.');
		} finally {
			isRecapLoading = false;
		}
	};

	// Close recap modal
	const closeRecapModal = () => {
		showRecapModal = false;
		recapData = null;
	};

	// Load available tags
	const loadAvailableTags = async () => {
		try {
			isLoadingTags = true;
			tagLoadError = null;
			const response = await Api.get('/tags?tag_type=passage_type');
			console.log('Tags API response:', response);
			// Handle both array response and object with data property
			if (Array.isArray(response)) {
				availableTags = response;
			} else if (response && Array.isArray(response.data)) {
				availableTags = response.data;
			} else if (response && response.tags) {
				availableTags = response.tags;
			} else {
				availableTags = [];
			}
			console.log('Available tags set to:', availableTags);
			if (availableTags.length === 0) {
				tagLoadError = 'No tags found. Make sure tags are seeded in the database.';
			}
		} catch (error) {
			console.error('Failed to load tags:', error);
			console.error('Error details:', error.response || error.message);
			availableTags = [];
			tagLoadError =
				error.response?.data?.error ||
				error.message ||
				'Failed to load categories. Please try again.';
		} finally {
			isLoadingTags = false;
		}
	};

	// Load current card tags (with debouncing to prevent rapid calls)
	const loadCurrentCardTags = async () => {
		if (!cardSet?.cards || !cardSet.cards[currentCardIndex]) {
			currentCardTags = [];
			selectedTagId = null;
			return;
		}

		// Prevent multiple simultaneous loads
		if (isLoadingCardTags) {
			return;
		}

		const currentCard = cardSet.cards[currentCardIndex];

		// If card already has tags in cardSet, use those instead of fetching
		if (currentCard.tags && currentCard.tags.length > 0) {
			currentCardTags = currentCard.tags;
			const passageTypeTag = currentCardTags.find((tag) => tag.tag_type === 'passage_type');
			selectedTagId = passageTypeTag ? passageTypeTag.id : null;

			// Update allCardTags for progress bar if not already there
			if (passageTypeTag && !allCardTags[currentCard.id]) {
				allCardTags[currentCard.id] = passageTypeTag;
			}
			return;
		}

		// Only fetch if card doesn't have tags loaded
		isLoadingCardTags = true;

		try {
			// Fetch the card with tags
			const cardResponse = await Api.get(`/cards/${currentCard.id}`);
			currentCardTags = cardResponse.tags || [];
			// Update the card in cardSet with tags
			cardSet.cards[currentCardIndex] = cardResponse;
			// Update the tag in allCardTags for progress bar
			const passageTypeTag = currentCardTags.find((tag) => tag.tag_type === 'passage_type');
			if (passageTypeTag) {
				allCardTags[currentCard.id] = passageTypeTag;
			} else {
				delete allCardTags[currentCard.id];
			}
			selectedTagId = passageTypeTag ? passageTypeTag.id : null;
		} catch (error) {
			console.error('Failed to load card tags:', error);
			currentCardTags = [];
			selectedTagId = null;
		} finally {
			isLoadingCardTags = false;
		}
	};

	// Debounced version of loadCurrentCardTags for reactive statements
	const loadCurrentCardTagsDebounced = () => {
		// Clear existing timer
		if (loadTagsTimer) {
			clearTimeout(loadTagsTimer);
		}

		// Set new timer - load tags after 300ms of no navigation
		loadTagsTimer = setTimeout(() => {
			loadCurrentCardTags();
		}, 300);
	};

	// Load all card tags for the entire card set (for progress bar coloring)
	const loadAllCardTags = async () => {
		if (!cardSet?.cards || cardSet.cards.length === 0 || isLoadingAllTags) {
			return;
		}

		// Double-check we haven't already loaded tags for this cardSet
		const currentCardSetId = cardSet.id || cardSet.cards[0]?.id;
		if (currentCardSetId === loadedCardSetId && Object.keys(allCardTags).length > 0) {
			console.log('Tags already loaded for this cardSet, skipping...');
			return;
		}

		isLoadingAllTags = true;

		// Load in background without blocking UI
		setTimeout(async () => {
			try {
				// First, check if cards already have tags loaded
				const tagMap = {};
				let needsLoading = false;

				cardSet.cards.forEach((card) => {
					if (card.tags && card.tags.length > 0) {
						const passageTypeTag = card.tags.find((tag) => tag.tag_type === 'passage_type');
						if (passageTypeTag) {
							tagMap[card.id] = passageTypeTag;
						}
					} else {
						needsLoading = true;
					}
				});

				// If some cards don't have tags, use bulk endpoint to load them all at once
				if (needsLoading && cardSet.id) {
					try {
						// Use bulk endpoint to get all tags in one request
						const response = await Api.get(`/card_sets/${cardSet.id}/card_tags`);
						if (response && response.tags) {
							// Merge bulk-loaded tags with any already-loaded tags
							Object.assign(tagMap, response.tags);
							console.log(
								'Loaded tags via bulk endpoint:',
								Object.keys(response.tags).length,
								'tags'
							);
						}
					} catch (error) {
						console.error(
							'Failed to load tags via bulk endpoint, falling back to individual requests:',
							error
						);
						// Fallback to individual requests if bulk endpoint fails
						const cardIds = cardSet.cards
							.filter((card) => !card.tags || card.tags.length === 0)
							.map((card) => card.id);

						// Process in smaller batches as fallback
						const batchSize = 10;
						for (let i = 0; i < cardIds.length; i += batchSize) {
							const batch = cardIds.slice(i, i + batchSize);
							const batchPromises = batch.map(async (cardId) => {
								try {
									const cardResponse = await Api.get(`/cards/${cardId}`);
									return { cardId, tags: cardResponse.tags || [] };
								} catch (error) {
									console.error(`Failed to load tags for card ${cardId}:`, error);
									return { cardId, tags: [] };
								}
							});

							const batchResults = await Promise.all(batchPromises);
							batchResults.forEach(({ cardId, tags }) => {
								const passageTypeTag = tags.find((tag) => tag.tag_type === 'passage_type');
								if (passageTypeTag) {
									tagMap[cardId] = passageTypeTag;
								}
							});
						}
					}
				}

				allCardTags = tagMap;
				console.log('Loaded all card tags:', Object.keys(allCardTags).length, 'tags');
			} catch (error) {
				console.error('Failed to load all card tags:', error);
			} finally {
				isLoadingAllTags = false;
			}
		}, 100); // Small delay to let UI render first
	};

	// Get color for a specific card
	const getCardColor = (cardId) => {
		const tag = allCardTags[cardId];
		if (tag && tag.name) {
			return tagColors[tag.name] || defaultTagColor;
		}
		return defaultTagColor;
	};

	// Helper function to adjust color brightness for gradients
	const adjustColorBrightness = (hex, percent) => {
		if (!hex) return '#000000';

		// Remove # if present
		hex = hex.replace('#', '');

		// Convert to RGB
		const r = parseInt(hex.substr(0, 2), 16);
		const g = parseInt(hex.substr(2, 2), 16);
		const b = parseInt(hex.substr(4, 2), 16);

		// Adjust brightness (percent can be negative to darken)
		const newR = Math.max(0, Math.min(255, Math.round(r + (r * percent) / 100)));
		const newG = Math.max(0, Math.min(255, Math.round(g + (g * percent) / 100)));
		const newB = Math.max(0, Math.min(255, Math.round(b + (b * percent) / 100)));

		// Convert back to hex
		const toHex = (n) => {
			const hex = n.toString(16);
			return hex.length === 1 ? '0' + hex : hex;
		};

		return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
	};

	// Generate progress bar segments
	$: progressSegments = (() => {
		if (!cardSet?.cards || cardSet.cards.length === 0) {
			return [];
		}

		const segments = [];
		const totalCards = cardSet.cards.length;
		const segmentWidth = 100 / totalCards;

		cardSet.cards.forEach((card, index) => {
			const tag = allCardTags[card.id];
			const hasTag = tag && tag.name;
			const color = getCardColor(card.id);
			segments.push({
				index,
				width: segmentWidth,
				left: (index / totalCards) * 100,
				color,
				cardId: card.id,
				hasTag
			});
		});

		return segments;
	})();

	// Open tag modal
	const openTagModal = async () => {
		showTagModal = true;
		tagLoadError = null;
		availableTags = [];
		await loadAvailableTags();
		await loadCurrentCardTags();
	};

	// Close tag modal
	const closeTagModal = () => {
		showTagModal = false;
		selectedTagId = null;
	};

	// Save tag
	const saveTag = async () => {
		if (!cardSet?.cards || !cardSet.cards[currentCardIndex]) {
			return;
		}

		const currentCard = cardSet.cards[currentCardIndex];
		isSavingTag = true;

		try {
			await Api.post(`/cards/${currentCard.id}/update_tag`, {
				tag_id: selectedTagId
			});

			// Reload the card to get updated tags
			await loadCurrentCardTags();

			// Update the card in the cardSet
			const updatedCard = await Api.get(`/cards/${currentCard.id}`);
			cardSet.cards[currentCardIndex] = updatedCard;

			// Update the tag in allCardTags for progress bar
			const passageTypeTag = updatedCard.tags?.find((tag) => tag.tag_type === 'passage_type');
			if (passageTypeTag) {
				allCardTags[currentCard.id] = passageTypeTag;
			} else {
				delete allCardTags[currentCard.id];
			}

			closeTagModal();
		} catch (error) {
			console.error('Failed to save tag:', error);
			alert('Failed to save tag. Please try again.');
		} finally {
			isSavingTag = false;
		}
	};

	// Get current card's tag name
	$: currentTagName = (() => {
		if (!cardSet?.cards || !cardSet.cards[currentCardIndex]) return null;
		const card = cardSet.cards[currentCardIndex];
		if (card.tags && card.tags.length > 0) {
			const passageTypeTag = card.tags.find((tag) => tag.tag_type === 'passage_type');
			return passageTypeTag ? passageTypeTag.name : null;
		}
		return null;
	})();

	// Get current card's tag color
	$: currentTagColor = (() => {
		if (!cardSet?.cards || !cardSet.cards[currentCardIndex]) return null;
		const card = cardSet.cards[currentCardIndex];
		const cardId = card.id;
		const tag = allCardTags[cardId];
		if (tag && tag.name && tagColors[tag.name]) {
			return tagColors[tag.name];
		}
		return null;
	})();

	// Reload card tags when card changes (with debouncing)
	let lastCardId = null;
	$: if (cardSet?.cards && cardSet.cards[currentCardIndex] && isOpen) {
		const currentCardId = cardSet.cards[currentCardIndex]?.id;
		if (currentCardId && currentCardId !== lastCardId) {
			lastCardId = currentCardId;
			// Only load if card doesn't already have tags - use cached data when available
			const currentCard = cardSet.cards[currentCardIndex];
			if (!currentCard.tags || currentCard.tags.length === 0) {
				// Use debounced version to prevent rapid calls during fast navigation
				loadCurrentCardTagsDebounced();
			} else {
				// Use cached tags
				currentCardTags = currentCard.tags;
				const passageTypeTag = currentCardTags.find((tag) => tag.tag_type === 'passage_type');
				selectedTagId = passageTypeTag ? passageTypeTag.id : null;
			}
		}
	}

	// Cleanup on component destroy
	onDestroy(() => {
		if (typeof document !== 'undefined') {
			document.removeEventListener('keydown', handleKeydown);
			document.removeEventListener('click', handleClickOutside);
			document.body.style.overflow = '';
		}

		// Clear any pending timers
		if (saveCursorTimer) {
			clearTimeout(saveCursorTimer);
			saveCursorTimer = null;
		}
		if (loadTagsTimer) {
			clearTimeout(loadTagsTimer);
			loadTagsTimer = null;
		}
	});
</script>

{#if isOpen && cardSet}
	<div class="fullscreen-overlay dark" on:click={handleClose}>
		<div class="fullscreen-content" on:click|stopPropagation={() => {}}>
			<!-- Header -->
			<div class="fullscreen-header">
				<div class="fullscreen-title-container">
					{#if bookData && bookData.siblings && bookData.siblings.length > 0}
						<div class="chapter-dropdown">
							<button class="chapter-dropdown-toggle" on:click={toggleChapterDropdown}>
								<span class="chapter-title">
									{currentChapter?.title || cardSet.title}
								</span>
								<i class="fas fa-chevron-down" class:rotated={showChapterDropdown} />
							</button>

							{#if showChapterDropdown}
								<div
									class="chapter-dropdown-menu"
									on:touchstart={handleDropdownTouch}
									on:touchmove={handleDropdownTouch}
								>
									{#each bookData.siblings.filter((sibling) => sibling.card_set && sibling.card_set.cards && sibling.card_set.cards.length > 0) as sibling}
										<button
											class="chapter-option"
											class:active={currentChapter?.id === sibling.chapter?.id}
											on:click={() => switchToChapter(sibling)}
										>
											{sibling.chapter?.title || 'Untitled Chapter'}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{:else}
						<div class="fullscreen-title">
							{title || cardSet.title}
						</div>
					{/if}
				</div>
				<button class="fullscreen-close" on:click={handleClose}>
					<i class="fas fa-times" />
				</button>
			</div>

			<!-- Progress bar with color-coded segments -->
			<div class="progress-container">
				<div class="progress-bar">
					{#each progressSegments as segment}
						<div
							class="progress-segment"
							class:passed={segment.index < currentCardIndex}
							class:current={segment.index === currentCardIndex}
							class:untagged={!segment.hasTag}
							style="width: {segment.width}%; left: {segment.left}%; background-color: {segment.color};"
							title={(() => {
								const tag = allCardTags[segment.cardId];
								return tag ? tag.name : 'Untagged';
							})()}
							on:click={() => navigateToCard(segment.index)}
							role="button"
							tabindex="0"
							on:keydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									navigateToCard(segment.index);
								}
							}}
						/>
					{/each}
					<!-- Progress indicator showing how far we've read -->
					<div
						class="progress-indicator"
						style="width: {((currentCardIndex + 1) / cardSet.cards.length) * 100}%"
					/>
				</div>
			</div>

			<!-- Card content -->
			<div
				class="fullscreen-card"
				on:click={handleCardClick}
				on:touchstart={handleTouchStart}
				on:touchmove={handleTouchMove}
				on:touchend={handleTouchEnd}
			>
				<div class="card-content">
					{@html cardSet.cards[currentCardIndex]?.body || 'No content'}
				</div>
			</div>

			<!-- Navigation -->
			<div class="fullscreen-nav">
				<button
					class="nav-button prev"
					on:click={() => prevCard()}
					disabled={currentCardIndex === 0}
				>
					<i class="fas fa-chevron-left" />
				</button>

				<div class="nav-indicator">
					{currentCardIndex + 1} / {cardSet.cards.length}
				</div>

				<button
					class="nav-button category-btn"
					class:has-tag={currentTagColor}
					on:click={openTagModal}
					style={currentTagColor
						? `background: ${currentTagColor}; background: linear-gradient(135deg, ${currentTagColor}, ${adjustColorBrightness(
								currentTagColor,
								-20
						  )});`
						: ''}
				>
					{currentTagName || 'category'}
				</button>

				<button class="nav-button graph-btn" on:click={loadRecap}>
					{#if isRecapLoading}
						<div class="spinner-small" />
					{:else}
						<i class="fas fa-chart-line" />
					{/if}
				</button>

				{#if currentCardIndex === cardSet.cards.length - 1 && onNextChapter}
					<button class="nav-button next-chapter" on:click={() => handleNextChapter()}>
						Next Chapter <i class="fas fa-arrow-right" />
					</button>
				{:else}
					<button
						class="nav-button next"
						on:click={() => nextCard()}
						disabled={currentCardIndex === cardSet.cards.length - 1}
					>
						<i class="fas fa-chevron-right" />
					</button>
				{/if}
			</div>

			<!-- Instructions -->
			<!-- <div class="fullscreen-instructions">
				<p>Click upper/lower half • Swipe up/down • Arrow keys • Spacebar • ESC to exit</p>
			</div> -->
		</div>
	</div>
{/if}

<!-- Recap Modal -->
{#if showRecapModal && recapData}
	<div class="recap-overlay" on:click={closeRecapModal}>
		<div class="recap-modal" on:click|stopPropagation={() => {}}>
			<div class="recap-header">
				<h3>📖 Story Recap</h3>
				<button class="recap-close" on:click={closeRecapModal}>
					<i class="fas fa-times" />
				</button>
			</div>

			<div class="recap-info">
				<div class="recap-meta">
					<span class="book-title">{recapData.book_title}</span>
					<span class="chapter-title">{recapData.chapter_title}</span>
					<span class="card-position"
						>Card {recapData.card_position} of {recapData.total_cards_in_recap}</span
					>
				</div>
			</div>

			<div class="recap-content">
				{recapData.recap}
			</div>
		</div>
	</div>
{/if}

<!-- Tag Selection Modal -->
{#if showTagModal}
	<div class="tag-overlay" on:click={closeTagModal}>
		<div class="tag-modal" on:click|stopPropagation={() => {}}>
			<div class="tag-header">
				<h3>Select Category</h3>
				<button class="tag-close" on:click={closeTagModal}>
					<i class="fas fa-times" />
				</button>
			</div>

			<div class="tag-content">
				{#if isLoadingTags}
					<div class="tag-loading">
						<div class="spinner-small" />
						<span>Loading categories...</span>
					</div>
				{:else if tagLoadError}
					<div class="tag-error">
						<div class="tag-error-icon">⚠️</div>
						<div class="tag-error-message">{tagLoadError}</div>
						<button class="tag-retry-button" on:click={loadAvailableTags}> Retry </button>
					</div>
				{:else if availableTags.length === 0}
					<div class="tag-empty">No categories available</div>
				{:else}
					<div class="tag-list">
						{#each availableTags as tag}
							<button
								class="tag-option"
								class:selected={selectedTagId === tag.id}
								on:click={() => (selectedTagId = tag.id)}
							>
								<div class="tag-name">{tag.name}</div>
								{#if tag.description}
									<div class="tag-description">{tag.description}</div>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<div class="tag-footer">
				<button class="tag-button tag-button-cancel" on:click={closeTagModal}> Cancel </button>
				<button class="tag-button tag-button-save" on:click={saveTag} disabled={isSavingTag}>
					{#if isSavingTag}
						<div class="spinner-small" />
						<span>Saving...</span>
					{:else}
						Save
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Fullscreen modal styles */
	.fullscreen-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.95);
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: fadeIn 0.3s ease;
	}

	.fullscreen-content {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: #ffffff;
		position: relative;
		touch-action: none; /* Prevent browser scrolling */
	}

	.dark .fullscreen-content {
		background: #0f1419;
	}

	.fullscreen-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 2rem;
		background: #ffffff;
		border-bottom: 1px solid #e1e5e9;
	}

	.dark .fullscreen-header {
		background: #1a1d21;
		border-bottom-color: #2d3238;
	}

	.fullscreen-title-container {
		flex: 1;
		display: flex;
		align-items: center;
	}

	.fullscreen-title {
		font-size: 1.2rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.dark .fullscreen-title {
		color: #ffffff;
	}

	/* Chapter dropdown styles */
	.chapter-dropdown {
		position: relative;
		display: inline-block;
	}

	.chapter-dropdown-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: none;
		border: none;
		color: #1a1a1a;
		font-size: 1.2rem;
		font-weight: 600;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.dark .chapter-dropdown-toggle {
		color: #ffffff;
	}

	.chapter-dropdown-toggle:hover {
		background: rgba(26, 26, 26, 0.1);
	}

	.dark .chapter-dropdown-toggle:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.chapter-title {
		max-width: 300px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chapter-dropdown-toggle i {
		transition: transform 0.2s ease;
	}

	.chapter-dropdown-toggle i.rotated {
		transform: rotate(180deg);
	}

	.chapter-dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: #ffffff;
		border: 1px solid #e1e5e9;
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 1000;
		max-height: 300px;
		overflow-y: auto;
		overflow-x: hidden;
		margin-top: 0.5rem;
		-webkit-overflow-scrolling: touch; /* Enable smooth scrolling on iOS */
		scrollbar-width: thin; /* Firefox */
		scrollbar-color: #c1c1c1 transparent; /* Firefox */
	}

	/* Webkit scrollbar styles for Chrome/Safari */
	.chapter-dropdown-menu::-webkit-scrollbar {
		width: 6px;
	}

	.chapter-dropdown-menu::-webkit-scrollbar-track {
		background: transparent;
	}

	.chapter-dropdown-menu::-webkit-scrollbar-thumb {
		background: #c1c1c1;
		border-radius: 3px;
	}

	.chapter-dropdown-menu::-webkit-scrollbar-thumb:hover {
		background: #a8a8a8;
	}

	.dark .chapter-dropdown-menu {
		background: #1a1d21;
		border-color: #2d3238;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.chapter-option {
		display: block;
		width: 100%;
		padding: 0.75rem 1rem;
		background: none;
		border: none;
		text-align: left;
		color: #1a1a1a;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
		border-bottom: 1px solid #f0f0f0;
	}

	.dark .chapter-option {
		color: #ffffff;
		border-bottom-color: #2d3238;
	}

	.chapter-option:last-child {
		border-bottom: none;
	}

	.chapter-option:hover {
		background: #f8f9fa;
	}

	.dark .chapter-option:hover {
		background: #2d3238;
	}

	.chapter-option.active {
		background: #007bff;
		color: white;
		font-weight: 600;
	}

	.dark .chapter-option.active {
		background: #007bff;
	}

	.fullscreen-close {
		background: none;
		border: none;
		color: #1a1a1a;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 4px;
		transition: all 0.2s ease;
		font-size: 1.2rem;
	}

	.fullscreen-close:hover {
		background: rgba(26, 26, 26, 0.1);
		color: #000000;
	}

	.dark .fullscreen-close {
		color: #ffffff;
	}

	.dark .fullscreen-close:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #ffffff;
	}

	/* Progress bar styles */
	.progress-container {
		padding: 0 2rem;
		background: #ffffff;
		border-bottom: 1px solid #e1e5e9;
	}

	.dark .progress-container {
		background: #1a1d21;
		border-bottom-color: #2d3238;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: #e1e5e9;
		border-radius: 4px;
		overflow: visible;
		position: relative;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.dark .progress-bar {
		background: #1a1d21;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
	}

	.progress-segment {
		height: 100%;
		position: absolute;
		top: 0;
		opacity: 0.85;
		transition: all 0.2s ease;
		cursor: pointer;
		border-right: 1px solid rgba(0, 0, 0, 0.15);
		border-left: 1px solid rgba(255, 255, 255, 0.2);
		z-index: 2;
		box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
		user-select: none;
	}

	.progress-segment:active {
		transform: scaleY(0.95);
		opacity: 0.7;
	}

	.dark .progress-segment {
		border-right-color: rgba(255, 255, 255, 0.15);
		border-left-color: rgba(0, 0, 0, 0.3);
		opacity: 0.9;
		box-shadow: 0 0 3px rgba(0, 0, 0, 0.5), inset 0 0 2px rgba(255, 255, 255, 0.1);
	}

	.progress-segment.untagged {
		background-color: rgb(189 195 199 / 50%) !important;
		opacity: 0.5;
	}

	.dark .progress-segment.untagged {
		background-color: rgb(189 195 199 / 40%) !important;
		opacity: 0.4;
	}

	.progress-segment:hover {
		opacity: 1;
		transform: scaleY(1.4);
		z-index: 10;
		box-shadow: 0 0 8px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.dark .progress-segment:hover {
		opacity: 1;
		box-shadow: 0 0 10px rgba(255, 255, 255, 0.3), 0 2px 6px rgba(0, 0, 0, 0.5);
	}

	.progress-segment.passed {
		opacity: 0.95;
		filter: brightness(0.9);
	}

	.dark .progress-segment.passed {
		opacity: 1;
		filter: brightness(0.85);
	}

	.progress-segment.current {
		opacity: 1;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.3),
			inset 0 0 4px rgba(255, 255, 255, 0.4);
		z-index: 5;
		border: 2px solid rgba(255, 255, 255, 0.6);
		transform: scaleY(1.2);
		filter: brightness(1.1);
	}

	.dark .progress-segment.current {
		box-shadow: 0 0 12px rgba(255, 255, 255, 0.4), 0 0 24px rgba(255, 255, 255, 0.2),
			inset 0 0 6px rgba(255, 255, 255, 0.3);
		border-color: rgba(255, 255, 255, 0.7);
		filter: brightness(1.15);
	}

	.progress-indicator {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background: linear-gradient(90deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.1), transparent);
		pointer-events: none;
		z-index: 1;
		transition: width 0.3s ease;
		border-radius: 4px;
		box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.1);
	}

	.dark .progress-indicator {
		background: linear-gradient(
			90deg,
			rgba(255, 255, 255, 0.2),
			rgba(255, 255, 255, 0.1),
			transparent
		);
		box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.1);
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	.fullscreen-card {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		padding: 2rem;
		text-align: left;
		touch-action: none; /* Prevent browser scrolling during touch */
	}

	.card-content {
		max-width: 800px;
		font-size: 1.5rem;
		line-height: 1.6;

		white-space: pre-wrap;
		word-wrap: break-word;
		font-weight: 400;

		white-space: normal;
	}

	.fullscreen-card :global(*) {
		color: #ffffff;
	}

	.fullscreen-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 2rem;
		background: #ffffff;
		border-top: 1px solid #e1e5e9;
	}

	.dark .fullscreen-nav {
		background: #1a1d21;
		border-top-color: #2d3238;
	}

	.nav-button {
		background: #007bff;
		color: white;
		border: none;
		padding: 0.75rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 1rem;
		font-weight: 500;
	}

	.nav-button:hover:not(:disabled) {
		background: #0056b3;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
	}

	.nav-button:disabled {
		background: #6c757d;
		cursor: not-allowed;
		opacity: 0.6;
	}

	.nav-button.next-chapter {
		background: linear-gradient(135deg, #28a745, #20c997);
		font-weight: 600;
		padding: 0.75rem 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.nav-button.next-chapter:hover {
		background: linear-gradient(135deg, #218838, #1ea085);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
	}

	.nav-button.category-btn {
		background: transparent;
		color: white;
		font-weight: 600;
		padding: 0.75rem 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 100px;
		transition: all 0.2s ease;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.nav-button.category-btn.has-tag {
		/* Dynamic color applied via inline style - no additional CSS needed */
		color: white;
		border: none;
	}

	.nav-button.category-btn:hover {
		transform: translateY(-1px);
		background: rgba(255, 255, 255, 0.1);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.nav-button.category-btn.has-tag:hover {
		filter: brightness(1.15);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
	}

	.nav-button.graph-btn {
		background: linear-gradient(135deg, #6f42c1, #8e44ad);
		font-weight: 600;
		padding: 0.75rem 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.nav-button.graph-btn:hover {
		background: linear-gradient(135deg, #5a32a3, #7d3c98);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(111, 66, 193, 0.4);
	}

	.nav-indicator {
		font-size: 1rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.dark .nav-indicator {
		color: #ffffff;
	}

	.fullscreen-instructions {
		text-align: center;
		padding: 0.5rem 2rem;
		background: #ffffff;
		border-top: 1px solid #e1e5e9;
	}

	.dark .fullscreen-instructions {
		background: #1a1d21;
		border-top-color: #2d3238;
	}

	.fullscreen-instructions p {
		margin: 0;
		font-size: 0.9rem;
		color: #1a1a1a;
		font-weight: 500;
	}

	.dark .fullscreen-instructions p {
		color: #ffffff;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@media (max-width: 768px) {
		.fullscreen-header {
			padding: 1rem;
		}

		.fullscreen-title {
			font-size: 1rem;
		}

		.chapter-dropdown-toggle {
			font-size: 1rem;
			padding: 0.4rem;
		}

		.chapter-title {
			max-width: 200px;
		}

		.chapter-dropdown-menu {
			left: -1rem;
			right: -1rem;
			max-height: 250px;
			-webkit-overflow-scrolling: touch;
			overscroll-behavior: contain; /* Prevent scroll chaining */
		}

		.chapter-option {
			padding: 0.6rem 0.8rem;
			font-size: 0.9rem;
		}

		.progress-container {
			padding: 0 1rem;
		}

		.fullscreen-card {
			padding: 1rem;
		}

		.card-content {
			font-size: 1.2rem;
			white-space: normal;
		}

		.fullscreen-nav {
			padding: 1rem;
		}

		.nav-button {
			padding: 0.5rem 0.75rem;
			font-size: 0.9rem;
		}

		.fullscreen-instructions {
			padding: 0.5rem 1rem;
		}

		.fullscreen-instructions p {
			font-size: 0.8rem;
		}

		/* Recap Modal Mobile Styles */
		.recap-modal {
			max-width: 95%;
			max-height: 90vh;
			border-radius: 8px;
		}

		.recap-header {
			padding: 1rem 1.5rem;
		}

		.recap-header h3 {
			font-size: 1.1rem;
		}

		.recap-info {
			padding: 0.8rem 1.5rem;
		}

		.recap-meta {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.recap-content {
			padding: 1.5rem;
			font-size: 0.9rem;
		}
	}

	/* Recap Modal Styles */
	.recap-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		z-index: 3000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		animation: fadeIn 0.3s ease;
	}

	.recap-modal {
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
		max-width: 800px;
		width: 100%;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.dark .recap-modal {
		background: #1a1d21;
		border: 1px solid #2d3238;
	}

	.recap-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 2rem;
		border-bottom: 1px solid #e1e5e9;
		background: #f8f9fa;
	}

	.dark .recap-header {
		background: #2d3238;
		border-bottom-color: #3f4447;
	}

	.recap-header h3 {
		margin: 0;
		color: #1a1a1a;
		font-size: 1.3rem;
		font-weight: 600;
	}

	.dark .recap-header h3 {
		color: #ffffff;
	}

	.recap-close {
		background: none;
		border: none;
		color: #6c757d;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 4px;
		transition: all 0.2s ease;
		font-size: 1.2rem;
	}

	.recap-close:hover {
		background: rgba(108, 117, 125, 0.1);
		color: #495057;
	}

	.dark .recap-close {
		color: #8899a6;
	}

	.dark .recap-close:hover {
		background: rgba(136, 153, 166, 0.1);
		color: #e7e9ea;
	}

	.recap-info {
		padding: 1rem 2rem;
		background: #ffffff;
		border-bottom: 1px solid #e1e5e9;
	}

	.dark .recap-info {
		background: #1a1d21;
		border-bottom-color: #2d3238;
	}

	.recap-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: center;
	}

	.book-title {
		font-weight: 600;
		color: #1d9bf0;
		font-size: 1rem;
	}

	.dark .book-title {
		color: #1d9bf0;
	}

	.chapter-title {
		font-weight: 500;
		color: #495057;
		font-size: 0.95rem;
	}

	.dark .chapter-title {
		color: #e7e9ea;
	}

	.card-position {
		background: #e9ecef;
		color: #495057;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.dark .card-position {
		background: #3f4447;
		color: #e7e9ea;
	}

	.recap-content {
		flex: 1;
		padding: 2rem;
		overflow-y: auto;
		line-height: 1.7;
		font-size: 1rem;
		color: #1a1a1a;
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.dark .recap-content {
		color: #e7e9ea;
		background: #1a1d21;
	}

	/* Scrollbar styles for recap content */
	.recap-content::-webkit-scrollbar {
		width: 8px;
	}

	.recap-content::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 4px;
	}

	.dark .recap-content::-webkit-scrollbar-track {
		background: #2d3238;
	}

	.recap-content::-webkit-scrollbar-thumb {
		background: #c1c1c1;
		border-radius: 4px;
	}

	.dark .recap-content::-webkit-scrollbar-thumb {
		background: #5a6268;
	}

	.recap-content::-webkit-scrollbar-thumb:hover {
		background: #a8a8a8;
	}

	.dark .recap-content::-webkit-scrollbar-thumb:hover {
		background: #6c757d;
	}

	@media (max-width: 768px) {
		.recap-modal {
			max-width: 90%;
			max-height: 90%;
			border-radius: 8px;
			box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
		}

		.recap-header {
			padding: 1rem 1.5rem;
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.recap-header h3 {
			font-size: 1.1rem;
		}

		.recap-close {
			align-self: flex-end;
		}

		.recap-info {
			padding: 0.8rem 1.5rem;
		}

		.recap-meta {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.book-title {
			font-size: 0.9rem;
		}

		.chapter-title {
			font-size: 0.85rem;
		}

		.card-position {
			font-size: 0.75rem;
		}

		.recap-content {
			padding: 1.5rem;
			font-size: 0.9rem;
		}

		.recap-content::-webkit-scrollbar {
			width: 6px;
		}

		.recap-content::-webkit-scrollbar-track {
			background: #f1f1f1;
		}

		.dark .recap-content::-webkit-scrollbar-track {
			background: #2d3238;
		}

		.recap-content::-webkit-scrollbar-thumb {
			background: #c1c1c1;
		}

		.dark .recap-content::-webkit-scrollbar-thumb {
			background: #5a6268;
		}

		.recap-content::-webkit-scrollbar-thumb:hover {
			background: #a8a8a8;
		}

		.dark .recap-content::-webkit-scrollbar-thumb:hover {
			background: #6c757d;
		}
	}

	/* Tag Modal Styles */
	.tag-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		z-index: 3000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		animation: fadeIn 0.3s ease;
	}

	.tag-modal {
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
		max-width: 600px;
		width: 100%;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.dark .tag-modal {
		background: #1a1d21;
		border: 1px solid #2d3238;
	}

	.tag-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 2rem;
		border-bottom: 1px solid #e1e5e9;
		background: #f8f9fa;
	}

	.dark .tag-header {
		background: #2d3238;
		border-bottom-color: #3f4447;
	}

	.tag-header h3 {
		margin: 0;
		color: #1a1a1a;
		font-size: 1.3rem;
		font-weight: 600;
	}

	.dark .tag-header h3 {
		color: #ffffff;
	}

	.tag-close {
		background: none;
		border: none;
		color: #6c757d;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 4px;
		transition: all 0.2s ease;
		font-size: 1.2rem;
	}

	.tag-close:hover {
		background: rgba(108, 117, 125, 0.1);
		color: #495057;
	}

	.dark .tag-close {
		color: #8899a6;
	}

	.dark .tag-close:hover {
		background: rgba(136, 153, 166, 0.1);
		color: #e7e9ea;
	}

	.tag-content {
		flex: 1;
		padding: 1.5rem 2rem;
		overflow-y: auto;
	}

	.dark .tag-content {
		background: #1a1d21;
	}

	.tag-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		gap: 1rem;
		color: #6c757d;
	}

	.dark .tag-loading {
		color: #8899a6;
	}

	.tag-empty {
		text-align: center;
		padding: 2rem;
		color: #6c757d;
	}

	.dark .tag-empty {
		color: #8899a6;
	}

	.tag-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
		gap: 1rem;
	}

	.tag-error-icon {
		font-size: 2rem;
	}

	.tag-error-message {
		color: #dc3545;
		font-size: 0.95rem;
		line-height: 1.5;
	}

	.dark .tag-error-message {
		color: #ff6b6b;
	}

	.tag-retry-button {
		margin-top: 0.5rem;
		padding: 0.5rem 1rem;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.tag-retry-button:hover {
		background: #0056b3;
		transform: translateY(-1px);
	}

	.tag-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.tag-option {
		background: #f8f9fa;
		border: 2px solid #e1e5e9;
		border-radius: 8px;
		padding: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		width: 100%;
	}

	.dark .tag-option {
		background: #2d3238;
		border-color: #3f4447;
	}

	.tag-option:hover {
		background: #e9ecef;
		border-color: #007bff;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
	}

	.dark .tag-option:hover {
		background: #3f4447;
		border-color: #007bff;
	}

	.tag-option.selected {
		background: #007bff;
		border-color: #007bff;
		color: white;
	}

	.dark .tag-option.selected {
		background: #007bff;
		border-color: #007bff;
	}

	.tag-name {
		font-weight: 600;
		font-size: 1rem;
		margin-bottom: 0.25rem;
		color: #1a1a1a;
	}

	.dark .tag-name {
		color: #ffffff;
	}

	.tag-option.selected .tag-name {
		color: white;
	}

	.tag-description {
		font-size: 0.85rem;
		color: #6c757d;
		line-height: 1.4;
	}

	.dark .tag-description {
		color: #8899a6;
	}

	.tag-option.selected .tag-description {
		color: rgba(255, 255, 255, 0.9);
	}

	.tag-footer {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding: 1.5rem 2rem;
		border-top: 1px solid #e1e5e9;
		background: #f8f9fa;
	}

	.dark .tag-footer {
		background: #2d3238;
		border-top-color: #3f4447;
	}

	.tag-button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.tag-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.tag-button-cancel {
		background: #6c757d;
		color: white;
	}

	.tag-button-cancel:hover:not(:disabled) {
		background: #5a6268;
	}

	.tag-button-save {
		background: #28a745;
		color: white;
	}

	.tag-button-save:hover:not(:disabled) {
		background: #218838;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
	}

	.spinner-small {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Scrollbar styles for tag content */
	.tag-content::-webkit-scrollbar {
		width: 8px;
	}

	.tag-content::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 4px;
	}

	.dark .tag-content::-webkit-scrollbar-track {
		background: #2d3238;
	}

	.tag-content::-webkit-scrollbar-thumb {
		background: #c1c1c1;
		border-radius: 4px;
	}

	.dark .tag-content::-webkit-scrollbar-thumb {
		background: #5a6268;
	}

	.tag-content::-webkit-scrollbar-thumb:hover {
		background: #a8a8a8;
	}

	.dark .tag-content::-webkit-scrollbar-thumb:hover {
		background: #6c757d;
	}

	@media (max-width: 768px) {
		.tag-modal {
			max-width: 95%;
			max-height: 90vh;
		}

		.tag-header {
			padding: 1rem 1.5rem;
		}

		.tag-header h3 {
			font-size: 1.1rem;
		}

		.tag-content {
			padding: 1rem 1.5rem;
		}

		.tag-footer {
			padding: 1rem 1.5rem;
			flex-direction: column;
		}

		.tag-button {
			width: 100%;
			justify-content: center;
		}

		.nav-button.category-btn {
			min-width: 80px;
			padding: 0.5rem 0.75rem;
			font-size: 0.85rem;
		}
	}
</style>
