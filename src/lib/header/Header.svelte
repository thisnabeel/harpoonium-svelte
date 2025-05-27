<script>
	import SearchBar from './SearchBar/SearchBar.svelte';
</script>

<header>
	<a href="/">
		<picture class="logo">
			<img src="/logo-light.png" alt="harpoonium Logo" />
		</picture>
	</a>

	<div class="hidden">
		<SearchBar />
	</div>
</header>

<style>
	.logo {
		max-width: 200px;
		margin: 0 auto;
		display: block;
		padding: 2em;
	}

	.logo img {
		width: 100%;
		margin-top: 10px;
	}
</style>
