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
        return request(`api/results/series/?series=${this.series}`)
      })
      .then(({data})=>{
        this.seriesData = data;
      })
  })
  },
  computed: {
    isPcrs(){
      return this.series && this.series.indexOf('pcrs') > -1;
    },
    hasTeamComp(){
      return this.seriesData?.teamCompDates?.length > 1;
    },
    headerName(){
      return this.displayName || this.seriesData?.eventName
    },
    isSeriesResultPage(){
      return this.$route.name =='seriesResults'
    },
  },
};
</script>

<template>
  <nav v-if="headerName" id="top" class="navbar navbar-light bg-light">
    <div class="container-fluid">
      <div class="navbar-brand h2" href="#">{{headerName}}</div>

      <!-- <div class="nav-item" v-if='seriesData.homepage'>
        <a
          class="nav-link active"
          aria-current="page"
          :href="seriesData.homepage.url"
          >{{seriesData.homepage.linkString}}</a
        >
      </div> -->
    </div>
  </nav>
  <div v-if="races.length > 1">
  <p class="mt-3">View Individual Event Times:</p>
  <ul class="nav nav-tabs mt-1 justify-content-center">
    <li v-for="race in races" :key="race.raceid" class="nav-item">
      <RouterLink
        class="nav-link"
        :class="{ active: $route.params.id === race.raceid && $route.name =='raceResult' }"
        :to="`/result/${race.raceid}`"
        >{{ race.eventName + ` - ${race.formattedStartDate}` }}</RouterLink
      >
    </li>
    <li v-if="!isSeriesResultPage">
      <RouterLink
        class="nav-link"
        :class="{ active: $route.name == 'seriesResults' }"
        :to="{ name: 'seriesResults', params: { seriesid: series }}"
        >Overall Standings</RouterLink
      ></li>
    <li v-if="hasTeamComp">
      <RouterLink
        class="nav-link"
        :class="{ active: $route.name == 'teamCompResults' }"
        :to="{ name: 'teamCompResults', params: { seriesid: series }}"
        >Team Competition Standings</RouterLink
      ></li>
  </ul>
</div>
</template>