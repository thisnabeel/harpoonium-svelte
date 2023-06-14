
<script>

    import {garage} from "$lib/stores/pop-ups"    

    let garageOpen; 
    garage.subscribe(value => garageOpen = value);

    const closePopUp = () => {
        garage.set(false);
    }
</script>

<aside  class="garagebox" class:hidden={garageOpen === false}>

	<div class="garagebox-header">
		<h3 class="rh-title">
			<img src="/icons/garage.png" class="garage-icon" alt="" />
			Garages</h3>
    </div>
	
	<div class="garagebox-footer">
		<span class="close-garagebox cursor" on:click={closePopUp}>
			<span class="fa fa-times" aria-hidden="true"></span>
		</span>		
	</div>
</aside>

<style>

    .hidden {
        display:none;
    }

    .garagebox-header {
        padding: 20px;
    }
    .rh-title {
        margin-bottom: 10px;
    }
    .garagebox-header img {
        display: inline;
        max-width: 50px;
        position: relative;
        top: -5px;
    }

    .garagebox {
        width: 300px;
        height: 75vh;
        position: fixed;
        left: 0;
        bottom: 0px;
        background: #fff;
        border-radius: 0px 10px 10px 0px;
        z-index: 999999;
        box-shadow: 0px 0px 20px 12px rgb(255 198 198 / 40%);
        background: #e53935;
        background: -webkit-linear-gradient(to right, #e35d5b, #e53935);
        background: linear-gradient(to right, #e35d5b, #e53935);
        color: #fff;
    }

    .garagebox .close-garagebox {
        top: 16px;
        right: 8px;
        position: absolute;
        /* background: #fff; */
        font-size: 30px;
        width: 50px;
        height: 50px;
        border-radius: 100%;
        color: #fff;
        text-align: center;
    }
</style>