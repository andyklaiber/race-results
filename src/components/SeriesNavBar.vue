<script>
import dropdown from "bootstrap/js/dist/dropdown";
import { RouterLink } from "vue-router";



export default {
  props:['series'],
  data() {
    return {
      count: 0,
      seriesData:{}
    };
  },
  created() {
    this.$watch(()=>this.series, function () {
      if(!this.series){
        return;
      }
    let dataUrl = `/api/series/${this.series}/races`
if(import.meta.env.DEV){
    dataUrl = "http://localhost:3000"+dataUrl;
}
    fetch(dataUrl)
      .then((response) => response.json())
      .then((data) => {
        this.seriesData = data;
      });
  })
  },
  computed: {
    isPcrs(){
      return this.series && this.series.indexOf('pcrs') > -1;
    }
  },
};
</script>

<template>
  <nav id="top" class="navbar navbar-light bg-light">
    <div class="container-fluid">
      <div class="navbar-brand" href="#">{{seriesData.displayName}}</div>

      <div class="nav-item" v-if='seriesData.homepage'>
        <a
          class="nav-link active"
          aria-current="page"
          :href="seriesData.homepage.url"
          >{{seriesData.homepage.linkString}}</a
        >
      </div>
    </div>
  </nav>
  <p class="mt-3">View Weekly lap times:</p>
  <ul class="nav nav-tabs mt-1 justify-content-center">
    <li v-for="race in seriesData.races" :key="race.raceid" class="nav-item">
      <RouterLink
        class="nav-link"
        :class="{ active: $route.params.raceid === race.raceid }"
        :to="`/race/${race.raceid}`"
        >{{ race.displayName + ` - ${race.formattedStartDate}` }}</RouterLink
      >
    </li>
    <li class="nav-item" v-if='isPcrs'>
      <RouterLink
        class="nav-link"
        :class="{ active: $route.path == '/series/pcrs_2022' }"
        :to="`/series/pcrs_2022`"
        >Series Standings</RouterLink
      >
    </li>
    <li class="nav-item" v-if='isPcrs'>
      <RouterLink
        class="nav-link"
        :class="{ active: $route.path == '/series/grom/pcrs_2022' }"
        :to="`/series/grom/pcrs_2022`"
        >Grom Series Standings</RouterLink
      >
    </li>
    <li class="nav-item" v-if='isPcrs'>
      <RouterLink
        class="nav-link"
        :class="{ active: $route.path == '/teamcomp/pcrs_2022' }"
        :to="`/teamcomp/pcrs_2022`"
        >Team Competition</RouterLink
      >
    </li>
  </ul>
</template>