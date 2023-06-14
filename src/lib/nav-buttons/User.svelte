<script>
    import {user} from "$lib/stores/user";
    import Button from "./Button.svelte";
    import Api from "$lib/api/api";
    import CredsPopUp from "./creds/Creds.svelte"

    let btn;

    let user_signed_in;
    user.subscribe(value => user_signed_in = value)

    const sign_out = async () => {
        const response = await Api.get("/users/sign_out.json");
        console.log("sign out", response);
        user.set(null);
    }

    let showSettings = false;
    let showLogIn = false;
</script>

<aside class="user">
    {#if user_signed_in}
        <span on:click={() => showSettings = !showSettings}>
            <Button icon="fa-user"></Button>
        </span>

        {#if showSettings}
            <span class="settings" >
                <Button icon="fa-cog" href="/users/settings" bg="#97B1FF"></Button>
            </span>
            
            <span class="sign-out" on:click={sign_out}>
                <Button icon="fa-sign-out" bg="#000"></Button>
            </span>
        {/if}
    {:else}
        <span on:click={() => showLogIn = !showLogIn}>
            <Button icon="fa-user"></Button>
        </span>
        {#if showLogIn}
            <div class="creds-pop">
                <CredsPopUp hidePopUp={() => showLogIn = !showLogIn}></CredsPopUp>
            </div>
        {/if}
    {/if}
</aside>

<style>

    .creds-pop {
        position: absolute;
        width: 240px;
        z-index: 9999;
        cursor: auto;
        right: -120px;
        top: 30px;
    }
    aside {
        cursor: pointer;
        position: absolute;
    }
    .user {
        top: 40px;
        right: 145px;
    }

    .settings {
       left: -66px;
       position: absolute;
    }

    .settings :global(.fa) {
        color: #fff !important;
    }

    .sign-out {
        left: -136px;
        position: absolute;
    }

    .sign-out :global() {
        color: #97B1FF;
    }
    

</style>