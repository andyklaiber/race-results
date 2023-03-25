<script>
import dropdown from "bootstrap/js/dist/dropdown";
import { RouterLink } from "vue-router";
import request from "@/lib/ApiClient";


export default {
  props:['series','displayName'],
  data() {
    return {
      count: 0,
      seriesData:{},
      races:[]
    };
  },
  created() {
    this.$watch(()=>this.series, function () {
      if(!this.series){
        return;
      }
    let dataUrl = `/api/results/?series=${this.series}`
    request(dataUrl)
      .then(({data}) => {
        this.races = data;
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
      <div class="navbar-brand h2" href="#">{{displayName}}</div>

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
  <p class="mt-3">View Individual Event Times:</p>
  <ul class="nav nav-tabs mt-1 justify-content-center">
    <li v-for="race in races" :key="race.raceid" class="nav-item">
      <RouterLink
        class="nav-link"
        :class="{ active: $route.params.raceid === race.raceid }"
        :to="`/result/${race.raceid}`"
        >{{ race.eventName + ` - ${race.formattedStartDate}` }}</RouterLink
      >
    </li>
  </ul>
</template>