<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api.js';
	import { selectChapter, chaptersMap, wondersMap } from '$lib/stores/main';
	import Row from './Row.svelte';
	import { selectedChapter } from '$lib/stores/chapters/mapper';
	import { listen } from 'svelte/internal';
	import { user } from '$lib/stores/user';

	export let parentId = null;
	let chapters;
	let newChapterTitle = '';
	chaptersMap.subscribe((value) => {
		console.log('chaptersMap', value);

		if (parentId) {
			parent = value.find((c) => c.id === parentId);
			if (parent) {
				chapters = parent.chapters;
			}
			console.log('map', chapters);
		} else {
			chapters = value;
		}
	});

	onMount(() => {
		// Add event listener for arrow key presses
		window.addEventListener('keydown', move);
	});

	const findNode = (root, target) => {
		if (!root) {
			return null;
		}

		if (root.id === target.id) {
			return root;
		}

		for (let chapter of root.chapters) {
			const foundChapter = findNode(chapter, target);
			if (foundChapter) {
				return foundChapter;
			}
		}

		return null;
	};

	const findParentNode = (root, target) => {
		if (!root) {
			return null;
		}
		if (!target) {
			return null;
		}
		if (root.id === target.chapter_id) {
			return root;
		}

		for (let chapter of root.chapters) {
			const foundChapter = findParentNode(chapter, target);
			if (foundChapter) {
				return foundChapter;
			}
		}

		return null;
	};

	async function addChapter() {
		if (newChapterTitle.length > 0) {
			if ($selectedChapter && $selectedChapter.id) {
				const clone = [...chapters];

				const node = findNode(
					{
						id: -1,
						chapters: clone
					},
					$selectedChapter
				);

				const response = await Api.post('/chapters.json', {
					title: newChapterTitle,
					chapter_id: $selectedChapter.id || parentId,
					position: node.chapters.length + 1,
					user_id: $user.id
				});

				node.chapters = [...node.chapters, response];

				console.log(clone);
				chapters = clone;
			} else {
				const response = await Api.post('/chapters.json', {
					title: newChapterTitle,
					position: chapters.length + 1,
					user_id: $user.id,
					chapter_id: parentId
				});
				chapters = [...chapters, response];
			}

			newChapterTitle = '';
		}
	}

	async function move(event) {
		if (!$selectedChapter) {
			return;
		}
		let clone = [...chapters];

		// console.log('chapter', $selectedChapter);

		const node = findNode(
			{
				id: -1,
				chapters: clone
			},
			$selectedChapter
		);

		const parentNode = findParentNode(
			{
				id: -1,
				chapters: clone
			},
			$selectedChapter
		);

		const grandparentNode = findParentNode(
			{
				id: -1,
				chapters: clone
			},
			parentNode
		);
		const index = $selectedChapter.position - 1;
		let newIndex = null;
		let element = null;

		let changed = [];

		switch (event.key) {
			case 'w':
				console.log('up');

				newIndex = index - 1;

				if (parentNode) {
					if (!parentNode.chapters[newIndex]) {
						return;
					}

					element = parentNode.chapters.splice(index, 1)[0];
					parentNode.chapters.splice(newIndex, 0, element);
					changed = [...changed, parentNode];
				} else {
					element = clone.splice(index, 1)[0];
					clone.splice(newIndex, 0, element);
					changed = [...changed, null];
				}
				break;
			case 's':
				console.log('down');

				newIndex = index + 1;

				if (parentNode) {
					if (!parentNode.chapters[newIndex]) {
						return;
					}
					// console.log(index, parentNode.chapters[index]);
					element = parentNode.chapters.splice(index, 1)[0];
					parentNode.chapters.splice(newIndex, 0, element);
					changed = [...changed, parentNode];
				} else {
					element = clone.splice(index, 1)[0];
					clone.splice(newIndex, 0, element);
					changed = [...changed, null];
				}
				break;
			case 'a':
				if (!parentNode) {
					return;
				}

				element = parentNode.chapters.splice(index, 1)[0];

				if (grandparentNode) {
					element.chapter_id = grandparentNode.id;
					grandparentNode.chapters = [...grandparentNode.chapters, element];
					changed = [...changed, grandparentNode];
				} else {
					element.chapter_id = parentId;
					clone = [...clone, element];
					changed = [...changed, parentId];
				}

				// chapters = clone;

				break;
			case 'd':
				// if (clone[index - 1]) {
				// 	return;
				// }
				if (!parentNode) {
					// console.log(index);
					element = clone.splice(index, 1)[0];
					if (!clone[index - 1]) {
						return;
					}
					element.chapter_id = clone[index - 1].id;
					clone[index - 1].chapters = [...clone[index - 1].chapters, element];
					changed = [...changed, null, clone[index - 1]];
					console.log('movedRight', 'First Nest');
				} else {
					element = parentNode.chapters.splice(index, 1)[0];
					if (!parentNode.chapters[index - 1]) {
						return;
					}
					element.chapter_id = parentNode.chapters[index - 1].id;
					parentNode.chapters[index - 1].chapters = [
						...parentNode.chapters[index - 1].chapters,
						element
					];
					changed = [...changed, null, parentNode, parentNode.chapters[index - 1]];
					console.log('movedRight', 'Go Deeper In');
				}

				break;
			default:
				return;
		}

		order(clone, changed);
	}

	async function remove(chapter) {
		if (!$selectedChapter) {
			return;
		}

		await Api.delete(`/chapters/${$selectedChapter.id}.json`);
		const clone = [...chapters];

		// console.log('chapter', $selectedChapter);

		const node = findNode(
			{
				id: -1,
				chapters: clone
			},
			$selectedChapter
		);

		const parentNode = findParentNode(
			{
				id: -1,
				chapters: clone
			},
			$selectedChapter
		);
		const index = $selectedChapter.position - 1;

		if (parentNode) {
			parentNode.chapters.splice(index, 1)[0];
			order(clone, [parentNode]);
		} else {
			clone.splice(index, 1)[0];
			order(clone, null);
		}
	}

	async function order(clone, changed) {
		for (let node of changed) {
			console.log('node', node);
			if (node === null) {
				let i = 0;
				for (let el of clone) {
					el.position = i + 1;
					Api.put(`/chapters/${el.id}.json`, {
						position: el.position,
						chapter_id: el.chapter_id
					});
					i++;
				}
			}
			let i = 0;
			if (!node) {
			} else {
				for (let el of node.chapters) {
					el.position = i + 1;
					Api.put(`/chapters/${el.id}.json`, {
						position: el.position,
						chapter_id: el.chapter_id
					});
					i++;
				}
			}
		}

		chapters = clone;
	}
</script>

<div class="input-group mb-3">
	<input
		type="text"
		class="form-control"
		placeholder="Add Chapter"
		aria-label="Add Chapter"
		aria-describedby="basic-addon2"
		bind:value={newChapterTitle}
	/>
	<div class="input-group-append" on:click={addChapter}>
		<div class="btn btn-info">Add</div>
	</div>
</div>

{#each chapters || [] as chapter}
	<ul class="clean-list">
		<Row item={chapter} {remove} type="chapter" {move} />
	</ul>
{/each}

<style>
</style>
