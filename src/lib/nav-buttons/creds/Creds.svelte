<script>
	import Api from '$lib/api/api';
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/user';
	import { theme } from '$lib/stores/main';

	let username;
	let email;
	let password;
	let confirmPassword;
	export let hidePopUp;

	const authenticate = async (verb) => {
		let response;
		if (verb === 'signIn') {
			response = await Api.post('/users/sign_in.json', {
				login: username,
				password: password
			});
		}

		if (verb === 'signUp') {
			response = await Api.post('/users/sign_up.json', {
				user: {
					username: username,
					email: email,
					password: password,
					password_confirmation: confirmPassword
				}
			});
		}
		console.log(response);
		if (response['id']) {
			user.set(response);
			if (hidePopUp) {
				hidePopUp();
			}
		}
	};

	let view = 'select'; // 'select', 'signIn', or 'signUp'
</script>

<picture class="logo">
	<img src="/logo-light.png" alt="harpoonium Logo" />
</picture>
<div class="cta-header {$theme}">
	<h1>Slow down. Read together.</h1>
	<!-- <p>
		In a world of endless scrolls and fleeting content, we’re losing the art of slowing down and
		truly absorbing stories. EmberBind was created as a gentle rebellion — a cozy space where
		reading becomes social without becoming rushed. Here, you move at the pace of a chapter, not a
		trend. You sit with a sentence, not just skim a caption. And you’re surrounded by fellow readers
		who aren’t racing to the end, but enjoying the journey with you. We need EmberBind because deep
		stories deserve deep attention — and so do you.
	</p> -->
	<p>a gentle rebellion — a cozy space where reading becomes social without becoming rushed</p>
</div>

{#if view === 'select'}
	<div class="selection-screen {$theme}">
		<div class="options-container">
			<div class="option" on:click={() => (view = 'signIn')} role="button" tabindex="0">
				<img src="/sign-in.png" alt="Sign In" class="option-img" />

				<p>Already have an account? Sign in to continue your journey.</p>
			</div>
			<div class="option" on:click={() => (view = 'signUp')} role="button" tabindex="0">
				<img src="/sign-up.png" alt="Sign Up" class="option-img" />
				<p>New Here? Create an account to start your adventure.</p>
			</div>
		</div>
	</div>
{:else if view === 'signIn'}
	<div class="form {$theme}">
		<div class="form-header">
			<button class="back-btn" on:click={() => (view = 'select')}>←</button>
			<img src="/sign-in.png" alt="" class="creds-header-img" />
		</div>

		<div class="input-group">
			<label>Username or Email:</label>
			<input type="text" bind:value={username} placeholder="Enter your username or email" />
		</div>

		<div class="input-group">
			<label>Password:</label>
			<input type="password" bind:value={password} placeholder="Enter your password" />
		</div>

		<button on:click={() => authenticate('signIn')}>Log In</button>
	</div>
{:else}
	<div class="form {$theme}">
		<div class="form-header">
			<button class="back-btn" on:click={() => (view = 'select')}>←</button>
			<img src="/sign-up.png" alt="" class="creds-header-img" />
		</div>

		<div class="input-group">
			<label>Email:</label>
			<input type="text" bind:value={email} placeholder="Enter your email" />
		</div>

		<div class="input-group">
			<label>Username:</label>
			<input type="text" bind:value={username} placeholder="Choose a username" />
		</div>

		<div class="input-group">
			<label>Password:</label>
			<input type="password" bind:value={password} placeholder="Choose a password" />
		</div>

		<div class="input-group">
			<label>Confirm Password:</label>
			<input type="password" bind:value={confirmPassword} placeholder="Confirm your password" />
		</div>

		<button on:click={() => authenticate('signUp')}>Sign Up</button>
	</div>
{/if}

<style>
	.dark.form,
	.dark.selection-screen {
		background: transparent;
		border: 9px solid #000000;
	}

	.selection-screen {
		max-width: 800px;
		margin: 30px auto;
		background: #fff;
		padding: 30px;
		border-radius: 6px;
		border: 9px solid #f6f8ff;
	}

	.options-container {
		display: flex;
		gap: 2rem;
		justify-content: center;
		align-items: stretch;
	}

	.option {
		flex: 1;
		padding: 2rem;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid #ced4da;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: center;
	}

	.dark .option {
		border-color: #8b1e01;
	}

	.option:hover {
		transform: translateY(-5px);
		border-color: #fffe8b;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
	}

	.dark .option:hover {
		border-color: #f2613f;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
	}

	.option h2 {
		margin: 1rem 0;
		color: #333;
		font-size: 1.5rem;
	}

	.option p {
		color: #666;
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.dark .option h2 {
		color: #fff;
	}

	.dark .option p {
		color: #ccc;
	}

	.option-img {
		width: 100%;
		max-width: 200px;
		height: auto;
		margin-bottom: 1rem;
	}

	.form-header {
		position: relative;
		margin-bottom: 2rem;
	}

	.back-btn {
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		font-size: 1.5rem;
		color: #666;
		cursor: pointer;
		padding: 0.5rem;
		margin: 0;
		width: auto;
	}

	.dark .back-btn {
		color: #fff;
	}

	.back-btn:hover {
		color: #333;
		background: none;
	}

	.dark .back-btn:hover {
		color: #f2613f;
	}

	.dark.form input {
		background: #641601;
		color: #fff;
		border-color: #8b1e01;
	}

	.dark.form input:focus {
		background: #7a1c01;
		border-color: #a32301;
		box-shadow: 0 0 0 2px rgba(163, 35, 1, 0.25);
	}

	.dark.form input::placeholder {
		color: rgba(255, 255, 255, 0.5);
	}

	.dark.form label {
		color: #fff;
	}

	.form {
		max-width: 300px;
		margin: 30px auto;
		background: #fff;
		padding: 30px;
		border-radius: 6px;
		border: 9px solid #f6f8ff;
	}

	img.creds-header-img {
		margin: 10px auto;
		display: block;
		width: 100%;
		max-width: 200px;
	}

	.input-group {
		margin-bottom: 1.25rem;
		width: 90%;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-family: GreyCliffCF-Regular;
		font-size: 0.9rem;
		font-weight: 500;
	}

	input {
		width: 100%;
		font-family: GreyCliffCF-Regular;
		color: rgb(49, 49, 49);
		background-color: #fff;
		border: 2px solid #ced4da;
		border-radius: 6px;
		padding: 0.75rem 1rem;
		font-size: 0.95rem;
		line-height: 1.5;
		transition: all 0.2s ease-in-out;
	}

	input:focus {
		outline: none;
		border-color: #fffe8b;
		box-shadow: 0 0 0 3px rgba(255, 254, 139, 0.25);
	}

	input::placeholder {
		color: #adb5bd;
	}

	button {
		margin-top: 1.5rem;
		background-color: #fffe8b;
		display: block;
		width: 100%;
		padding: 0.75rem 1rem;
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.5;
		color: #495057;
		border: 2px solid #fffe8b;
		border-radius: 6px;
		transition: all 0.2s ease-in-out;
		cursor: pointer;
	}

	button:hover {
		background-color: #fffd6b;
		border-color: #fffd6b;
	}

	.logo img {
		margin: 0 auto;
		margin-top: 30px;
		display: block;
		max-width: 200px;
	}

	@media (max-width: 768px) {
		.selection-screen {
			margin: 20px;
			padding: 20px;
		}

		.options-container {
			flex-direction: column;
			gap: 1rem;
		}

		.option {
			padding: 1.5rem;
		}

		.option-img {
			max-width: 150px;
		}
	}

	.cta-header {
		max-width: 800px;
		margin: 30px auto;
		text-align: center;
		padding: 2rem 1rem;
		background: transparent;
	}

	.cta-header h1 {
		font-family: GreyCliffCF-Regular;
		font-size: 2.5rem;
		font-weight: 700;
		color: #333;
		margin: 0;
		line-height: 1.2;
	}

	.dark h1,
	.dark p {
		color: #fff;
	}

	@media (max-width: 768px) {
		.cta-header h1 {
			font-size: 1.8rem;
		}
	}
</style>
