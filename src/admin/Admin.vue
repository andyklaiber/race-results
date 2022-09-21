<script>
import _ from 'lodash';
import { RouterView } from 'vue-router'
import Manage from '../Manage.vue';

export default {
  components: {
    RouterView,
    Manage,
  },
  data() {
    return {
  	races: [],
    }
  },
  mounted: function(){
   
	},
  computed : {
      
  }
}
</script>

<template>
    <Manage></Manage>
    <RouterView />
</template>

<style>
@import "@/assets/base.css";


</style>
