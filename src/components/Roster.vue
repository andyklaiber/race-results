<script>
import _ from "lodash";
import ResultRow from "./ResultRow.vue";
import SeriesNavBar from "./SeriesNavBar.vue";

export default {
  components: {
    ResultRow,
    SeriesNavBar,
  },
  data() {
    return {
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
      if (this.$route.params.raceid) {
        let dataUrl = `/api/races/roster/${this.$route.params.raceid}`;
        if (import.meta.env.DEV) {
          dataUrl = "http://localhost:3000" + dataUrl;
        }
        fetch(dataUrl)
          .then((response) => response.json())
          .then((data) => {
            this.formattedStartDate = data.raceMeta.formattedStartDate;
            this.series = data.series;
            this.loading = false;
            this.categories = data.categories;
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
      return _.orderBy(this.categories, "disporder");
    },
  },
};
</script>

<template>
<SeriesNavBar :series="series" />
    <div v-if="formattedStartDate" class="text-center">
        <h2 class="mt-5">Race Results - {{formattedStartDate}}</h2>
    </div>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>
      <div class="container-fluid">
        <div v-for="(cat, key) in sortedCats" :key="cat.id" class="mt-5">
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
                 <th>
                  Category
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(racer, idx) in cat.results" :key="idx">
                
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
