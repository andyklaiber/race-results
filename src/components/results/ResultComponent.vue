<script>
import _ from "lodash";
import ResultRow from "./ResultRow.vue";
import SeriesNavBar from "./SeriesResultNavComponent.vue";
import request from "@/lib/ApiClient";



export default {
  components: {
    ResultRow,
    SeriesNavBar,
  },
  data() {
    return {
      resultData:{},
      categories: {},
      loading: false,
      error: null,
      formattedStartDate:"",
      series:null,
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
      this.error = null;
      this.loading = true;
      if (this.$route.params.id) {
        let dataUrl = `/api/results/${this.$route.params.id}`;
        request(dataUrl)
          .then(({data}) => {
            this.formattedStartDate = data.formattedStartDate;
            this.series = data.series;
            this.resultData = data;
            this.loading = false;
            this.categories = data.categories;
          })
          .catch((err) => {
            console.error(err);
            this.categories = {};
            if(err.response.status == 404){
              this.error = '';

            }else{

              this.error = err.toString();
            }
            this.loading = false;
          });
      }
      else{
        this.$router.push('');
      }
    },
    metaColumns(cols) {
      return cols.slice(0,4)
    },
    lapColumns(firstRacerLaps) {
      let headers = [];
      for(let i = 1; i<=firstRacerLaps.length; i++){
        headers.push(`Lap ${i}`);
      }
      if(this.fastestLapScoring){
        headers.push(`Fastest Lap:`);
      }else{
        headers.push(`Total`);
      }
      headers.push(`Time Behind Leader`);
      
      return headers
    },
  },
  computed: {
    fastestLapScoring(){
      return this.resultData.scoringType == 'fastestlap';
    },
    sortedCats() {
      return _.orderBy(this.categories, "disporder");
    },
    haveResults() {
      if (!this.categories) {
        return false;
      }
      return Object.keys(this.categories).length > 0;
    },
  },
};
</script>

<template>
<SeriesNavBar :series="series"/>
    <div v-if="resultData.eventName" class="text-center">
        <h2 class="mt-5">Race Results - {{resultData.eventName}}</h2>
    </div>
    <div v-if="formattedStartDate" class="text-center">
        <h2 class="mt-5">{{formattedStartDate}}</h2>
    </div>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="haveResults">
      <div id="top" class="container text-center mt-5">
        <ul class="list-inline">
          <template v-for="(cat, key) in sortedCats" :key="cat.id">
            <li class="list-inline-item  mx-2">
              <a role="button" @click="scrollMeTo(cat.id)" class="link-primary">{{ cat.catdispname }}</a>
            </li>
          </template>
        </ul>
      </div>
      <div class="container-fluid">
        <div v-for="(cat, key) in sortedCats" :key="cat.id" class="mt-5">
          <h3 :id="cat.id">{{ cat.catdispname }}</h3>
          <table class="table table-striped table-hover">
            <thead>
              <tr>
                <th
                  v-for="(columnName, index) in metaColumns(cat.columns)"
                  scope="col"
                  :key="index"
                >
                  {{ columnName }}
                </th>
                <th
                  v-for="(columnName, index) in lapColumns(cat.results[0].laps)"
                  scope="col"
                  :key="index"
                >
                  {{ columnName }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(racer, idx) in cat.results" :key="idx">
                <ResultRow :totLaps="cat.results[0].laps.length" :Pos="idx" :data="racer" :showMillis="resultData.showMillis || fastestLapScoring" />
              </tr>
            </tbody>
          </table>
          <a role="button" @click="scrollMeTo('top')" class="link-primary"
            >Back to Top</a
          >
        </div>
      </div>
    </div>
    <div v-else>
      <div class="text-center">
        <h2 class="mt-5">No results yet...</h2>
      </div>
    </div>
  </div>
</template>

<style>

table.table {
--bs-table-hover-bg: #76c8ff;
}
</style>
