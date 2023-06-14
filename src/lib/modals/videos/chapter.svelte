<script>
	import { closeModal } from 'svelte-modals';
	import OutClick from 'svelte-outclick';
	import { onMount } from 'svelte';
	import { onBeforeClose } from 'svelte-modals';

	// provided by <Modals />
	export let isOpen;

	export let chapter;
	export let abstraction;

	onMount(async function () {
		document.body.style['overflow-y'] = 'hidden';
	});

	onBeforeClose(() => {
		document.body.style['overflow-y'] = 'initial';
	});

	const handleOutsideClick = () => {
		closeModal();
	};
</script>

{#if isOpen}
	<div role="dialog" class="modal" on:click|stopPropagation>
		<div class="barrier" on:click|stopPropagation>
			<OutClick on:outclick={handleOutsideClick}>
				<div class="contents">
					<video
						src={abstraction.source_url}
						controls
						autoplay
						oncontextmenu="return false;"
						controlsList="nodownload"
						playsinline
					>
						<track kind="captions" />
					</video>
					<footer>
						<div class="title">
							{chapter.title}
						</div>
						<div class="body">
							{abstraction.body}
						</div>
					</footer>
				</div>
			</OutClick>
		</div>
	</div>
{/if}

<style>
	[role='dialog'] {
		background: rgba(0, 0, 0, 0.5);
	}

	.modal {
		position: fixed;
		top: 0;
		bottom: 0;
		right: 0;
		left: 0;
		display: flex;
		justify-content: center;
		align-items: center;

		/* allow click-through to backdrop */
		/* pointer-events: none; */
	}

	.contents {
		min-width: 240px;
		/* padding: 16px; */
		max-width: 500px;
		background: white;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		pointer-events: auto;
	}

	h2 {
		text-align: center;
		font-size: 24px;
	}

	p {
		text-align: center;
		margin-top: 16px;
	}

	.actions {
		margin-top: 32px;
		display: flex;
		justify-content: flex-end;
	}

	.title {
		background: #003eff;
		color: #fff;
		padding: 20px 30px;
		font-size: 30px;
	}

	.body {
		background-color: #041447;
		padding: 26px;
		border: 4px solid #013eff;
		font-size: 24px;
		font-family: 'GreyCliffCf-Medium';
		color: #fff;
		position: relative;
		text-align: left;
	}

	video {
		width: 100%;
		margin-bottom: -6px;
	}
</style>
