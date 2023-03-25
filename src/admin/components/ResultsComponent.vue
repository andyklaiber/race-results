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
    fetchData() {
      this.error = null;
      this.loading = true;
      if (this.$route) {
       return request(`/api/results/`)
          .then((response) => {
            this.results = response.data;
            this.loading = false;
            
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
    
    loaded() {
      if (!this.results) {
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
      <!-- <div
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
        > -->
          
          <!-- <div class="btn-toolbar mb-2 mb-md-0">
            <div class="btn-group me-2">
              <button type="button" class="btn btn-sm btn-outline-secondary">
                Share
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary">
                Export
              </button>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary dropdown-toggle"
            >
              <span data-feather="calendar" class="align-text-bottom"></span>
              This week
            </button>
          </div> -->
        <!-- </div> -->

        <h2>Race Result Uploads</h2>
        <div class="table-responsive">
          <table class="table table-striped table-hover table-sm">
            <thead>
              <tr>
                <th scope="col">Event Name</th>
                <th scope="col">Series Points Display Name</th>
                <th scope="col">Formatted Date</th>
                <th scope="col">series ID</th>
                <th scope="col">Finalized</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(resultUpload, idx) in results" :key="idx">
                <!-- <td><RouterLink :to="{ name: 'edit-result', params: { resultid: resultUpload._id }}" >{{resultUpload.displayName}}</RouterLink></td> -->
                <td>{{resultUpload.eventName}}</td>
                <td>{{resultUpload.shortName}}</td>
                <td>{{resultUpload.formattedStartDate}}</td>
                <td>{{resultUpload.series}}</td>
                <td><Check v-if="resultUpload.final" color="red" ></Check></td>
                <td><RouterLink :to="{ name: 'edit-result', params: { resultid: resultUpload.raceid }}" >Edit</RouterLink></td>
                <td><a :href="`/#/result/${resultUpload.raceid}`" target="_blank">View Output</a></td>
                <td>
                  <!-- <RouterLink v-if="!!race.series" class='btn btn-sm mx-1 btn-secondary' :to="{ name: 'edit-series-racers', params: { raceid: race.raceid, series: race.series }}" >Series Single Entries</RouterLink> -->
                </td>
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
