<script>
import _ from "lodash";
import ResultRow from "./TeamCompDetailRow.vue";
import SeriesNavBar from "./SeriesNavBar.vue";

export default {
  components: {
    ResultRow,
    SeriesNavBar,
  },
  data() {
    return {
      teamResults: {},
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
        if (import.meta.env.DEV) {
          dataUrl = "http://localhost:3000" + dataUrl;
        }
        fetch(dataUrl)
          .then((response) => response.json())
          .then((data) => {
            this.loading = false;
            this.series = this.$route.params.seriesid;
            this.teamResults = data;

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
  },
};
</script>

<template>
<SeriesNavBar :series="series" />
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>
        <h2 class="mt-5">Team Standings</h2>
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
                
              <tr v-for="(team, key) in teamResults.result" :key="key">
            <td>{{key+1}}</td>
            <td>{{team.teamName}}</td>
            <td>{{team.totalScore}}</td>
              </tr>
            </tbody>
          </table>
      </div>
      <h2 class="mt-5">Team Results</h2>
    <div class="mt-5" v-for="(team, key) in teamResults.result" :key="key">
           <h3> {{team.teamName}}</h3>
        
      <div class="container-fluid">
          <table class="table table-striped table-hover">
            <thead>
              <tr>
                <th style="width: 25%">Racer Name</th>
                <th style="width: 25%">Class</th>
                <th style="width: 12.5%">5/4</th>
                <th style="width: 12.5%">5/11</th>
                <th style="width: 12.5%">5/18</th>
                <th style="width: 12.5%">5/25</th>
              </tr>
            </thead>
            <tbody>
                
              <tr v-for="(racer, idx) in teamResults.teamDets[team.teamName]" :key="idx">
                <ResultRow :data="racer" />
              </tr>
            </tbody>
          </table>
          <table class="table table-striped table-hover">
            <thead>
              <tr>
                <th style="width: 50%; text-align:right">Score (Avg of individual results):</th>
                <th style="width: 12.5%">{{team.results['5/4'] ? team.results['5/4'].avg : '-'}}</th>
            <th style="width: 12.5%">{{team.results['5/11'] ? team.results['5/11'].avg : '-'}}</th>
            <th style="width: 12.5%">{{team.results['5/18'] ? team.results['5/18'].avg : '-'}}</th>
            <th style="width: 12.5%">{{team.results['5/25'] ? team.results['5/25'].avg : "-"}}</th>
              </tr>
            </thead>
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
