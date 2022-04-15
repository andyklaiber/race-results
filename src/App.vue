<script>
import _ from 'lodash';
import NavBar from './components/NavBar.vue'
import { RouterView } from 'vue-router'

let dataUrl = '/api/races/'
if(import.meta.env.DEV){
    dataUrl = "http://localhost:3000"+dataUrl;
}

export default {
  components: {
    RouterView,
    NavBar
  },
  data() {
    return {
  	races: [],
    }
  },
  mounted: function(){
    fetch(dataUrl)
        .then(response => response.json())
        .then(data => {
            this.races = data;
            if(window.location.hash.indexOf('race/') == -1){
                this.$router.push(`/series/pcrs_2022`)
            }
        })
	},
  computed : {
      raceMeta() {
          return this.races.find((obj)=>obj.raceid === this.$route.params.raceid);
      }
  }
}
</script>

<template>
    <NavBar :races="races" />
    <div v-if="raceMeta" class="text-center">
        <h2 class="mt-5">Race Results - {{raceMeta?.formattedStartDate}}</h2>
    </div>
    <RouterView />
</template>

<style>
@import "./assets/base.css";

#app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;

  font-weight: normal;
}
</style>
