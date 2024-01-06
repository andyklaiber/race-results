<script>
import _ from "lodash";
import request from "@/lib/ApiClient";
import dayjs from 'dayjs/esm/index.js';
import { RouterLink } from 'vue-router';
import { Check } from 'lucide-vue-next';

export default {
  components: {
    RouterLink,
    Check
  },
  data() {
    return {
      seriesOptions:false,
      loading: false,
      error: null,
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
    getSeriesResult(seriesId){
    let result = _.find(this.results, {series: seriesId});
    return result;
    },
    fetchData() {
      this.error = null;
      this.loading = true;
      if (this.$route) {
       return request(`/api/results/series/`)
          .then((response) => {
            this.results = response.data;
            this.loading = false;
            return this.getRaceResults();
          })
          .catch((err) => {
            this.loading = false;
            this.error = err.toString();
            console.error(err);
          });
      }
    },
    getRaceResults(){
      return request(`/api/results/`)
          .then((response) => {
            let seriesList = {};
            response.data.forEach((result)=>{
              if(result.series){
                if(!this.getSeriesResult(result.series)){
                  if(!seriesList[result.series]){
                    seriesList[result.series] = 1;
                  }else{
                    
                    seriesList[result.series] += 1;
                  }
                }
              }
            })
            this.seriesOptions = seriesList;
          })
          .catch((err) => {
            
            console.error(err);
          });
    },
    async generateSeriesPoints(seriesId){
      await request.post(
        `/api/results/series/${seriesId}/generate`,
    
      ).then((response) => {
        if (response.data) {
          
          console.log(response.data);
          return this.fetchData()
        }
      })
    }
  },
  computed: {
    
    loaded() {
      if (!this.seriesOptions) {
        return false;
      }
      return true;
    },

  },
};
</script>

<template>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="loaded">
      <div
          class="
            d-flex
            justify-content-between
            flex-wrap flex-md-nowrap
            align-items-center
            pt-3
            pb-2
            mb-3
            border-bottom
          "
        >
        <h2>Series Points Listings</h2>
          <div class="btn-toolbar mb-2 mb-md-0">
            <!-- <div class="btn-group me-2">
              <button type="button" class="btn btn-sm btn-primary" @click="createSeries()">
                + Generate New Series Points
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary">
                Export
              </button>
            </div> -->
            <!-- <button
              type="button"
              class="btn btn-sm btn-outline-secondary dropdown-toggle"
            >
              <span data-feather="calendar" class="align-text-bottom"></span>
              This week
            </button> -->
          </div>
        </div>
        <div class="table-responsive" v-if="Object.keys(results).length">
          <table class="table table-striped table-hover table-sm">
            <thead>
              <tr>
                <th scope="col">series ID</th>
                <th scope="col">Display Name</th>
                <th scope="col">Published</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(seriesData, idx) in results">
                
                
                <td>{{seriesData.series}}</td>
                <td>{{seriesData.eventName}}</td>
                <td><Check v-if="seriesData.published" color="green" ></Check></td>
                <td><RouterLink :to="{ name: 'edit-series-result', params: { series: seriesData._id }}" >Edit</RouterLink></td>
                <td><a :href="`/#/result/series/${seriesData.series}`" target="_blank">view series points</a></td>
                <td><button v-if="!seriesData.final" type="button" class="btn btn-sm btn-primary" @click="generateSeriesPoints(seriesData.series)">
                Update Series Points
              </button></td>
                <!--<td><Check v-if="race.isTestData" color="orange" ></Check></td>
                <td><a :href="`/#/register/${race.raceid}`">Goto Reg Form</a></td>
                <td>
                  <RouterLink v-if="!!race.series" class='btn btn-sm mx-1 btn-secondary' :to="{ name: 'edit-series-racers', params: { raceid: race.raceid, series: race.series }}" >Series Single Entries</RouterLink>
                  <a class="btn btn-sm btn-secondary mx-1" :href="`/api/racers/race/${race.raceid}/export-contact`">Contact List</a>
                  <a class="btn btn-sm btn-secondary mx-1" :href="`/api/racers/race/${race.raceid}/export`">export</a>
                </td> -->
              </tr>

            </tbody>
          </table>
          <!-- <pre>
            {{raceData}}
          </pre> -->
        </div><div v-else>
          <h4>No series points calculations found</h4>
        </div>
        <h4>Races without points Listings</h4>
        <div class="table-responsive" v-if="Object.keys(seriesOptions).length">
          <table class="table table-striped table-hover table-sm">
            <thead>
              <tr>
                <th scope="col">series ID</th>
                <th scope="col">number of results</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(numRaces, seriesid) in seriesOptions">
                
                
                <td>{{seriesid}}</td>
                <td>{{ numRaces }}</td>
                <td><button type="button" class="btn btn-sm btn-primary" @click="generateSeriesPoints(seriesid)">
                Create Series Points
              </button>
                  </td>
                <!--<td><Check v-if="race.isTestData" color="orange" ></Check></td>
                <td><a :href="`/#/register/${race.raceid}`">Goto Reg Form</a></td>
                <td>
                  <RouterLink v-if="!!race.series" class='btn btn-sm mx-1 btn-secondary' :to="{ name: 'edit-series-racers', params: { raceid: race.raceid, series: race.series }}" >Series Single Entries</RouterLink>
                  <a class="btn btn-sm btn-secondary mx-1" :href="`/api/racers/race/${race.raceid}/export-contact`">Contact List</a>
                  <a class="btn btn-sm btn-secondary mx-1" :href="`/api/racers/race/${race.raceid}/export`">export</a>
                </td> -->
              </tr>

            </tbody>
          </table>
          <!-- <pre>
            {{raceData}}
          </pre> -->
        </div>
    </div>
    <div v-else>
      <div class="text-center">
        <h2 class="mt-5">Error loading results...</h2>
      </div>
    </div>
  </div>
</template>

<style>
table.table {
  --bs-table-hover-bg: #76c8ff;
}
</style>
