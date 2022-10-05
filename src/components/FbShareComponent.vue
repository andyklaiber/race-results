<script>
export default {
    props: ['url'],
    created(){
        (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v15.0";
        fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    },
    mounted () {
        if(window.FB){
            FB.XFBML.parse()
        }
    }
}
</script>

<template>
    <div id="1">
        <div id="fb-root"></div>
        <div class="fb-share-button" 
                :data-href="this.url"
                data-layout="button" 
                data-size="large"
                >
        </div>
    </div>    
</template>