<script>
import _ from "lodash";
import request from "@/lib/ApiClient";
import ResultRow from "./TeamCompDetailRow.vue";
import SeriesNavBar from "./SeriesResultNavComponent.vue";

export default {
  components: {
    ResultRow,
    SeriesNavBar,
  },
  data() {
    return {
      teamResults: {},
      teamDates:[],
      loading: false,
      error: null,
      series: null,
    };
  },
  created() {
    this.$watch(
      () => this.$route.params,
      () => {
        this.fetchData();
      },
      // fetch the data when the view is created and the data is
      // already being observed
      { immediate: true }
    );
  },
  methods: {
    scrollMeTo(refName) {
      var element = document.querySelector(`#${refName}`);
      element.scrollIntoView({ behavior: "smooth" });
    },
    fetchData() {
      if (!this.$route.params.seriesid) {
        return;
      }
      this.error = null;
      this.loading = true;
        let dataUrl = `/api/team-comp?series=${this.$route.params.seriesid}`;
        request(dataUrl)
          .then(({data}) => {
            this.loading = false;
            this.series = this.$route.params.seriesid;
            this.teamResults = data;
            this.teamDates = data.teamCompDates;


          })
          .catch((err) => {
            console.error(err);
            this.teamResults = {};
            this.error = err.toString();
          });
      
    },
  },
  computed: {
    dates: () => {},
    fivePlusTeams(){
      return _.filter(this.teamResults?.result, (res)=>{ return res.count > 4})
    },
    threeFourTeams(){
      return _.filter(this.teamResults?.result, (res)=>{ return res.count < 5})
    },
    sortedResults(){
      return _.sortBy(this.teamResults.result, "teamName");
    }
  },
};
</script>

<template>
<SeriesNavBar :series="series" />
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>
        <h2 class="mt-5"> 5+ Team Standings</h2>
         <div class="container-fluid  mt-5">
          <table class="table table-striped table-hover">
            <thead>
              <tr>
                  <th>Position</th>
                <th>Team</th>
                <th>Total Score</th>
              </tr>
            </thead>
            <tbody>
                
              <tr v-for="(team, key) in fivePlusTeams" :key="key">
            <td>{{key+1}}</td>
            <td>{{team.teamName}}</td>
            <td>{{team.totalScore}}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <h2 class="mt-5"> 3 Person Team Standings</h2>
          <div class="container-fluid  mt-5">
          <table class="table table-striped table-hover">
            <thead>
              <tr>
                  <th>Position</th>
                <th>Team</th>
                <th>Total Score</th>
              </tr>
            </thead>
            <tbody>
                
              <tr v-for="(team, key) in threeFourTeams" :key="key">
            <td>{{key+1}}</td>
            <td>{{team.teamName}}</td>
            <td>{{team.totalScore}}</td>
              </tr>
            </tbody>
          </table>
      </div>
      <h2 class="mt-5">Team Results</h2>
    <div class="mt-5" v-for="(team, key) in sortedResults" :key="key">
           <h3> {{team.teamName}}</h3>
        
      <div class="container-fluid">
          <table class="table table-striped table-hover">
            <thead>
              <tr>
                <th style="width: 25%">Racer Name</th>
                <th style="width: 25%">Class</th>
                <th v-for="date in teamDates" >{{date}}</th>
              </tr>
            </thead>
            <tbody>
                
              <tr v-for="(racer, idx) in teamResults.teamDets[team.teamName]" :key="idx">
                <ResultRow :data="racer" :dates="teamDates"/>
              </tr>    
              <tr>
                <td colspan="2" style="text-align:right">Score (Avg of individual results):</td>
                <td v-for="date in teamDates" >{{team.results[date] ? team.results[date].avg : '-'}}</td>
              </tr>
            </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style>
table.table {
  --bs-table-hover-bg: #76c8ff;
}
</style>
