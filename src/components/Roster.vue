<script>
import _ from "lodash";
import axios from "axios";
import EventDetailsComponent from "./EventDetailsComponent.vue";

let request;
if (import.meta.env.DEV) {
  request = axios.create({ baseURL: "http://localhost:3000" });
} else {
  request = axios;
}

export default {
  components: {EventDetailsComponent,},
  data() {
    return {
      categories: {},
      loading: false,
      error: null,
      formattedStartDate: "",
      series: null,
      racers:[]
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
      if (this.$route.params.raceid) {
        request(`/api/races/roster/${this.$route.params.raceid}`)
          .then(({data}) => {
            this.raceData = data;
            this.series = data.series;
            this.loading = false;
            this.categories = data.regCategories;
            this.racers = data.registeredRacers;
          })
          .catch((err) => {
            console.error(err);
            this.categories = {};
            this.error = err.toString();
          });
      }
    },
  },
  computed: {
    sortedCats() {
      return _.filter(_.orderBy(this.categories, "disporder"),
      (cat)=>_.includes(Object.keys(this.racers),cat.id));
    },
  },
};
</script>

<template>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>
    <EventDetailsComponent :details="raceData.eventDetails" />
    <div v-if="Object.keys(racers).length">
      <h4>Registered Racers for {{this.raceData.racename}} on {{this.raceData.eventDate}}</h4>
      <div class="container-fluid">
        <div v-for="(cat) in sortedCats" :key="cat.id" class="mt-5">
          <h3 :id="cat.id">{{ cat.catdispname }}</h3>
          <table class="table table-striped table-hover">
            <thead>
              <tr>
                <th>
                  First Name
                </th>
                 <th>
                  Last Name
                </th>
                 <th>
                  Team/Sponsor
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(racer, idx) in racers[cat.id]" :key="idx">
                <td>{{racer.first_name}}</td>
                <td>{{racer.last_name}}</td>
                <td>{{racer.sponsor}}</td>
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
        <h2 class="mt-5">No registrations yet...</h2>
      </div>
    </div>
  </div>
</template>

<style>
table.table {
  --bs-table-hover-bg: #76c8ff;
}
</style>
