<script>
import _ from "lodash";
import request from "@/lib/ApiClient";
import dayjs from 'dayjs/esm/index.js';
import ModalComponent from './ModalComponent.vue';
import CloneRaceComponent from './CloneRaceComponent.vue';
import { RouterLink } from 'vue-router';
import { Check, Copy, Pencil } from 'lucide-vue-next';

export default {
  components: {
    RouterLink,
    Check,
    Copy,
    Pencil,
    ModalComponent,
    CloneRaceComponent
  },
  data() {
    return {
      loading: false,
      modalMode:null,
      showModal:false,
      raceToClone:{},
      error: null,
      seriesList: [],
    };
  },
  created() {
    this.fetchSeriesList();
    this.$watch(
      () => [this.$route.params, this.$route.query],
      () => {
        this.fetchData();
      },
      // fetch the data when the view is created and the data is
      // already being observed
      { immediate: true }
    );
  },
  methods: {
    async fetchSeriesList() {
      try {
        const response = await request('/api/series/');
        this.seriesList = response.data;
      } catch (err) {
        console.error('Error fetching series list:', err);
      }
    },
    
    fetchData() {
      this.error = null;
      this.loading = true;
      if (this.$route) {
        let options = {};
        const params = {};
        
        if(this.$route.query.archived == "true"){
          params.archived = true;
        }
        
        // Add date range parameters from URL query
        if (this.$route.query.startDate) {
          params.startDate = this.$route.query.startDate;
        }
        if (this.$route.query.endDate) {
          params.endDate = this.$route.query.endDate;
        }
        
        if (Object.keys(params).length > 0) {
          options.params = params;
        }
        
       return request(`/api/races/`,options)
          .then((response) => {
            this.raceData = response.data;
            this.loading = false;
            
          })
          .catch((err) => {
            this.loading = false;
            this.error = err.toString();
            console.error(err);
          });
      }
    },
    createRaceClone(race){
      this.showModal = true;
      this.modalMode = 'clone'
      this.raceToClone = race;
    },
    async cloneRace(raceData){
      console.log("race to clone");
      console.log(this.raceToClone.raceid)
      console.log(raceData.raceid);
      await request.post(
        `/api/races/clone/${this.raceToClone.raceid}`,
        raceData
      ).then((response) => {
        if (response.data) {
          console.log(raceData);
          this.closeModal();
          console.log(response.data);
          return this.fetchData()
        }
      })
        .catch((error) => {
          this.formError = ["Error submitting request"];
          console.log(error);
        });
      
    },
    closeModal(){
      this.showModal = false;
      this.modalMode = null;
    },
    
    getSeriesName(seriesId) {
      if (!seriesId) return '—';
      const series = this.seriesList.find(s => 
        (s.seriesId === seriesId) || (s.series === seriesId)
      );
      return series ? (series.displayName || series.name) : seriesId;
    },
  },
  computed: {
    loaded() {
      if (!this.raceData) {
        return false;
      }
      return true;
    },
    currentPeriod() {
      if (this.$route.query.startDate && this.$route.query.endDate) {
        return `${this.$route.query.startDate} to ${this.$route.query.endDate}`;
      }
      return 'Recent & Upcoming';
    },
    filteredRaceData() {
      if (!this.raceData) return [];
      
      // Filter by series if query param is present
      if (this.$route.query.series) {
        return this.raceData.filter(race => race.series === this.$route.query.series);
      }
      
      return this.raceData;
    },
    currentSeriesName() {
      if (!this.$route.query.series) return null;
      const series = this.seriesList.find(s => 
        (s.seriesId === this.$route.query.series) || (s.series === this.$route.query.series)
      );
      return series ? (series.displayName || series.name) : this.$route.query.series;
    },
    yearLinks() {
      const currentYear = dayjs().year();
      const links = [];
      
      // Generate links for current year and previous 3 years
      for (let i = 0; i < 4; i++) {
        const year = currentYear - i;
        links.push({
          year: year,
          label: year.toString(),
          startDate: `${year}-01-01`,
          endDate: `${year}-12-31`
        });
      }
      
      return links;
    }
  },
};
</script>

<template>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="loaded">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2>
            Active Races - {{ currentPeriod }}
            <span v-if="currentSeriesName" class="badge bg-info ms-2">
              {{ currentSeriesName }}
              <RouterLink 
                :to="{ name: 'edit-series', params: { seriesId: $route.query.series } }" 
                class="text-white text-decoration-none ms-2"
                title="Edit series"
              >
                <Pencil :size="16" />
              </RouterLink>
            </span>
          </h2>
        </div>
        
        <div class="mb-3">
          <div class="row">
            <div class="col-md-8">
              <div class="btn-group" role="group">
                <RouterLink 
                  :to="{ name: $route.name, query: {} }" 
                  class="btn btn-sm"
                  :class="!$route.query.startDate ? 'btn-primary' : 'btn-outline-primary'"
                >
                  Recent & Upcoming
                </RouterLink>
                <RouterLink 
                  v-for="link in yearLinks" 
                  :key="link.year"
                  :to="{ name: $route.name, query: { startDate: link.startDate, endDate: link.endDate } }" 
                  class="btn btn-sm"
                  :class="$route.query.startDate === link.startDate ? 'btn-primary' : 'btn-outline-primary'"
                >
                  {{ link.label }}
                </RouterLink>
              </div>
            </div>
            <div class="col-md-4">
              <label for="seriesFilter" class="form-label small text-muted mb-1">Filter by Series:</label>
              <div class="input-group input-group-sm">
                <select 
                  id="seriesFilter"
                  class="form-select form-select-sm" 
                  :value="$route.query.series || ''"
                  @change="$router.push({ name: $route.name, query: { ...$route.query, series: $event.target.value || undefined } })"
                >
                  <option value="">All Races</option>
                  <option 
                    v-for="series in seriesList" 
                    :key="series.seriesId || series.series"
                    :value="series.seriesId || series.series"
                  >
                    {{ series.displayName || series.name }} ({{ series.year }})
                  </option>
                </select>
                <button 
                  v-if="$route.query.series"
                  class="btn btn-outline-secondary" 
                  type="button"
                  @click="$router.push({ name: $route.name, query: { ...$route.query, series: undefined } })"
                  title="Clear filter"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-striped table-hover table-sm">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Series</th>
                <th>Test Payments</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(race, idx) in filteredRaceData" :key="idx">
                <td><RouterLink :to="{ name: 'edit-racers', params: { raceid: race.raceid }}" >{{race.displayName}}</RouterLink></td>
                <td>{{ getSeriesName(race.series) }}</td>
                <td><Check v-if="race.isTestData" color="orange" ></Check></td>
                <td><a :href="`/#/register/${race.raceid}`">Goto Reg Form</a></td>
                <td>
                  <Copy class="mx-3" color="black" @click="createRaceClone(race)" ></Copy>
                  <!-- <RouterLink v-if="!!race.series" class='btn btn-sm mx-1 btn-secondary' :to="{ name: 'edit-series-racers', params: { raceid: race.raceid, series: race.series }}" >Series Single Entries</RouterLink> -->
                  <a class="btn btn-sm btn-secondary mx-1" :href="`/api/racers/race/${race.raceid}/export-contact`">Contact List</a>
                  <a class="btn btn-sm btn-secondary mx-1" :href="`/api/racers/race/${race.raceid}/export`">export</a>
                  <a class="btn btn-sm btn-secondary mx-1" :href="`/api/racers/race/${race.raceid}/export?assignedBibsOnly=true`">webscorer export</a>
                </td>
              </tr>

            </tbody>
          </table>
          <!-- <pre>
            {{raceData}}
          </pre> -->
          <Teleport to="body">
          <!-- use the modal component, pass in the prop -->
          <modal-component v-if="modalMode=='clone'" :show="showModal" @close="closeModal">
            <template #header>
              <h5>
                Clone Race
            </h5>
            </template>
            <template #body >
                <CloneRaceComponent :raceData="raceToClone" @close="closeModal" @save="cloneRace"></CloneRaceComponent>
            </template>
            <template #footer >
              <div></div>
            </template>
          </modal-component>
        </Teleport>
        </div>
    </div>
    <div v-else>
      <div class="text-center">
        <h2 class="mt-5">Error loading races...</h2>
      </div>
    </div>
  </div>
</template>

<style>
table.table {
  --bs-table-hover-bg: #76c8ff;
}
</style>
