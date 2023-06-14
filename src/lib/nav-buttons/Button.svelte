<script>
    export let icon;
    export let bg = "#fff";
    export let img = null;
    export let href = null;

    export function handleClick(callback) {
        callback();
    }
</script>

    <a 
        class="nav-circle hvr-grow cursor clean-a" 
        href="{href}" 
        style="background: {bg}">

        {#if icon}
            <div class="fa {icon}" aria-hidden="true"></div>
        {:else if img}
            <img src="{img}" alt="">
        {/if}
    </a>

<style>
    .nav-circle .fa {
        top: 25%;
        left: 30%;
        font-size: 20px;
        color: #97b1ff;
        position: absolute;
    }

    img {
        position: absolute;
    }

    .nav-circle {
        position: fixed;
        border-radius: 100%;
        height: 50px;
        width: 50px;
    }
    
    .hvr-grow {
        -webkit-transform: perspective(1px) translateZ(0);
        transform: perspective(1px) translateZ(0);
                box-shadow: 0 0 1px rgba(0, 0, 0, 0);
        -webkit-transition-duration: 0.3s;
        transition-duration: 0.3s;
        -webkit-transition-property: transform;
        transition-property: transform;
    }
    
    .hvr-grow:hover {
        -webkit-transform: scale(1.1);
        transform: scale(1.1);

    }

</style>