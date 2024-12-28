<script>
	import Api from '$lib/api/api';
	import { openModal } from 'svelte-modals';
	import ChapterModal from '$lib/modals/videos/chapter.svelte';
	import { goto } from '$app/navigation';
	import Editor from 'cl-editor/src/Editor.svelte';
	import { theme } from '$lib/stores/main';

	export let user;
	export let refresh = () => {};
	export let chapter;
	export let inquiry;
	export let destroy;
	export let editable = true;
	export let linkable = false;

	let input;
	let html;
	let timer;

	const debounce = (v) => {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			const response = await Api.put('/inquiries/' + inquiry.id + '.json', {
				question: v,
				method: '_post'
			});
			// let response = await Api.get("/inquiries/"+inquiry.id+".json")
			console.log('response', response);
		}, 1000);
	};

	let editor;

	//
</script>

<li class:has_video={inquiry && inquiry.preview} class={$theme}>
	{#if user && user.admin === true}
		<!-- <span contenteditable on:keyup={(e) => debounce(event.target.innerHTML)}
			>{@html inquiry.question}</span
		> -->
		{#if editable}
			<div class="editable">
				<Editor
					bind:this={editor}
					html={inquiry.question}
					height={'max-content'}
					actions={[
						'b',
						'i',
						'u',
						{
							name: 'copy', // required
							icon: '<b>C</b>', // string or html string (ex. <svg>...</svg>)
							title: 'Copy',
							result: () => {
								// copy current selection or whole editor content
								const selection = window.getSelection();
								// if (!selection.toString().length) {
								// 	const range = document.createRange();
								// 	range.selectNodeContents(editor.refs.editor);
								// 	selection.removeAllRanges();
								// 	selection.addRange(range);
								// }
								// editor.exec('copy');

								if (selection.toString().length > 0) {
									// Create a new span element
									var span = document.createElement('span');
									span.className = 'blanked';

									// Wrap the selected text in the span element
									span.appendChild(selection.getRangeAt(0).cloneContents());

									// Replace the selected text with the span element
									selection.getRangeAt(0).deleteContents();
									selection.getRangeAt(0).insertNode(span);

									debounce(editor.getHtml());
								}
							}
						}
					]}
					on:change={(evt) => {
						debounce(evt.detail);
					}}
				/>

				<span class="fa fa-trash" on:click={() => destroy(inquiry.id)} />
			</div>
		{:else}
			<span class="question">{@html inquiry.question}</span>
		{/if}
	{:else}
		<span class="question">{@html inquiry.question}</span>
	{/if}

	<hr />
	{#if inquiry.breadcrumbs}
		<small class="author"
			>- {#each inquiry.breadcrumbs as crumb}
				{crumb.title + ' '}
			{/each}
		</small>
	{/if}
	{#if linkable}
		<span class="fa fa-link link" on:click={() => goto('/chapters/' + inquiry.inquiryable_id)} />
	{/if}
</li>

<style>
	.author {
		color: rgb(126, 126, 126);
		font-style: italic;
		font-size: 16px;
	}
	.link {
		position: absolute;
		left: -40px;
		top: 20px;
	}

	.dark .link {
		color: #ff7e60;
	}
	.hidden {
		display: none;
	}

	li {
		list-style: none;
		padding: 30px;
		position: relative;
		margin-bottom: 10px;
		background: #ffffff;
		border-radius: 8px;
		box-shadow: 1px 1px 5px 3px #ccc;
	}

	li.dark {
		list-style: none;
		padding: 30px;
		position: relative;
		margin-bottom: 10px;
		background: #481e13;
		border-radius: 8px;
		box-shadow: 1px 1px 5px 3px #0c0c0c;
	}

	.dark .question {
		color: #ff7e60;
	}

	.fa-trash {
		position: absolute;
		left: -7%;
		top: 39%;
	}

	.abstra-play {
		position: absolute;
		right: -122px;
		top: 14%;
		cursor: pointer;
		width: 130px;
		background: #ffd67f;
		padding: 50px;
		border-radius: 10px;
	}

	/* .abstra-play img {
        max-width: 100%;
    } */

	.abstra-preview {
		position: absolute;
		top: 12%;
		left: -6%;
		border-radius: 10px;
		max-width: 100%;
		z-index: 100;
	}

	li :global(.blanked) {
		background-color: rgb(0, 0, 0);
	}
	li .editable :global(.blanked) {
		background-color: rgb(233, 233, 233);
	}
	li :global(.blanked:hover) {
		background-color: rgb(233, 233, 233);
	}

	@media (max-width: 480px) {
		.abstra-play {
			position: absolute;
			right: 0;
			left: 0;
			margin: 0 auto;
			top: -83px;
			cursor: pointer;
			padding: 55px;
			width: 7.5em;
		}

		.abstra-preview {
			position: absolute;
			top: 9px;
			left: 5px;
			border-radius: 10px;
			/* max-width: 100%; */
			max-width: 170px;
		}

		.inquiries {
			width: 100%;
		}

		.inquiries .has_video {
			padding-top: 55px;
		}
	}
</style>
