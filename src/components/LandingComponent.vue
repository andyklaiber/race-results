<script>
import _ from "lodash";
import dropdown from "bootstrap/js/dist/dropdown";
import { RouterLink, RouterView } from "vue-router";
import request from "@/lib/ApiClient";
import EventDetailsComponent from "./EventDetailsComponent.vue";
import MainNav from "@/components/MainNav.vue";
import dayjs from '@/lib/dayjs';

export default {
  emits: ['logout'],
  components: {
    MainNav,
    RouterView,
    EventDetailsComponent
  },
  data() {
    return {
      count: 0,
      races: [],
      loading: true,
    };
  },
  created() {
    this.$watch(
      () => this.$route.query,
      () => {
        this.fetchData();
      },
      // fetch the data when the view is created and the data is
      // already being observed
      { immediate: true }
    );
  },
  methods: {
    fetchData() {
      this.error = null;
      this.loading = true;
      console.log('fetch plz')
      if (this.$route) {
       return request(`/api/races/`)
          .then((response) => {
            this.races = response.data;
            this.loading = false;
            console.log("fetched")
            console.log(this.races);
            
          })
          .catch((err) => {
            this.loading = false;
            this.error = err.toString();
            console.error(err);
          });
      }
    }
  },
  computed: {
    displayRaces(){
      let series = {};
      let filtered = _.filter(this.races, (raceInfo)=>{
        
        // If filtering by series ID from route params, only show races in that series
        if(this.$route.params.seriesid){
          if(raceInfo.series !== this.$route.params.seriesid){
            return false;
          }
        } else {
          // Original logic: hide duplicate series races on main landing page
          if(raceInfo.series && series[raceInfo.series] && !raceInfo.disableSeriesRedirect){
            // console.log("exclude "+raceInfo.series)
            return false;
          }
        }
        
        let isInFuture =  dayjs().isBefore(dayjs(raceInfo.eventDate));
         console.log('isInFuture' + isInFuture + " "+raceInfo.displayName)
        if(raceInfo.isTestData && !this.$route.query.test){
          return false;
        }
        if(!isInFuture && !this.$route.query.past){
          return false;
        }
        // console.log("show "+raceInfo.raceid)
        if(typeof raceInfo.series === 'string' && raceInfo.series.length > 1){
            console.log("set as shown "+raceInfo.raceid)
            series[raceInfo.series] = true;
          }
        return true;
      })
      // return filtered;
      // order by upcoming race date?
      return _.sortBy(filtered, [function(o) { return dayjs(o.eventDate); }]);
    },
    seriesRaceCounts(){
      // Count how many races from each series are visible
      const counts = {};
      this.displayRaces.forEach(race => {
        if(race.series){
          counts[race.series] = (counts[race.series] || 0) + 1;
        }
      });
      return counts;
    },
    loggedIn(){
      return false;
    }
  },
  
};
</script>

<template>
  <MainNav></MainNav>

  <div v-if="loading">
    Plz wait, loading...
  </div>
  <div v-else>
    <div v-for="(race, idx) in displayRaces" :key="idx">
      <EventDetailsComponent :details="race.eventDetails" :raceid="race.raceid" :series="race.series" :series-data="race.seriesData" :series-race-count="seriesRaceCounts[race.series]" compact-mode="true"/>

    </div>
  </div>
</template>
<style scoped>
body {
  font-size: .875rem;
}

.nav-scroller {
  position: relative;
  z-index: 2;
  height: 2.75rem;
  overflow-y: hidden;
}

.nav-scroller .nav {
  display: flex;
  flex-wrap: nowrap;
  padding-bottom: 1rem;
  margin-top: -1px;
  overflow-x: auto;
  text-align: center;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
}

/*
 * Navbar
 */

body {
  min-height: 75rem;
  padding-top: 4.5rem;
}
</style>