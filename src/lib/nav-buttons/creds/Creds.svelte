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

	$: console.log(username);

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
			// goto(`/`);
		}
	};

	let view = 'signIn';
</script>

<picture class="logo">
	<img src="/logo-light.png" alt="harpoonium Logo" />
</picture>

{#if view === 'signIn'}
	<div class="form {$theme}">
		<img src="/sign-in.png" alt="" class="sign-up-img creds-header-img" />

		<div class="input-group">
			<label>Username or Email:</label>
			<input type="text" bind:value={username} placeholder="Enter your username or email" />
		</div>

		<div class="input-group">
			<label>Password:</label>
			<input type="password" bind:value={password} placeholder="Enter your password" />
		</div>

		<button on:click={() => authenticate('signIn')}>Log In</button>
		<hr />
		<div class="text-center" on:click={() => (view = 'signUp')}>
			<span>Sign Up</span>
		</div>
	</div>
{:else}
	<div class="form {$theme}">
		<img src="/sign-up.png" alt="" class="sign-up-img creds-header-img" />

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
		<hr />
		<div class="text-center" on:click={() => (view = 'signIn')}>
			<span>Log In</span>
		</div>
	</div>
{/if}

<style>
	.dark.form {
		background: transparent;
		border: 9px solid #000000;
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

	.text-center {
		text-align: center;
		margin-top: 1rem;
		cursor: pointer;
	}

	.text-center span {
		color: #641601;
		text-decoration: underline;
		font-weight: 500;
	}

	.dark .text-center span {
		color: #fffe8b;
	}

	hr {
		margin: 1.5rem 0;
		border: 0;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
	}

	.dark hr {
		border-top-color: rgba(255, 255, 255, 0.1);
	}

	.logo img {
		margin: 0 auto;
		margin-top: 30px;
		display: block;
		max-width: 200px;
	}
</style>
