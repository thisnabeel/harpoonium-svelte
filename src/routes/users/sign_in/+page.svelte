<script>
    import Api from "$lib/api/api";
    import { goto } from '$app/navigation';
    import { user } from "$lib/stores/user"

    let username;
    let password;

    $: console.log(username);

    const authenticate = async () => {
        const response = await Api.post("/users/sign_in.json", {
            login: username,
            password: password
        });
        console.log(response)
        if (response["id"]) {
            user.set(response);
            goto(`/`);
        }
    }
    
</script>

    <div class="form">
        <img src="/sign-in.png" alt="" class="sign-up-img creds-header-img">
        
        <label>Username or Email:</label>
        <input type="text" bind:value={username}>

        <label>Password:</label>
        <input type="password" bind:value={password}>

        <button on:click={authenticate}>Log In</button>
    </div>

  <style>
    .form {
        max-width: 300px;
        margin: 30px auto;
        background: #fff;
        padding: 30px;
        /* box-shadow: 10px 10px 5px 0px rgb(198 212 255 / 50%); */
        border-radius: 6px;
    }

    img.creds-header-img {
        margin: 60px auto;
        display: block;
        width: 100%;
    }

    input {
        width: 100%;
    }

    button {
        background-color: #FFFE8B;
        display: block;
        width: 100%;
        height: calc(1.5em + 0.75rem + 2px);
        padding: 0.375rem 0.75rem;
        font-size: 1rem;
        font-weight: 400;
        line-height: 1.5;
        color: #495057;
        background-clip: padding-box;
        border: 1px solid #ced4da;
        border-radius: 0.25rem;
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }
  </style>