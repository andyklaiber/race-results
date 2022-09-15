<script>
import _ from "lodash";
import ResultRow from "./ResultRow.vue";
import SeriesNavBar from "./SeriesNavBar.vue";
import request from "../lib/ApiClient";

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
        let dataUrl = `/api/races/results/${this.$route.params.raceid}`;
        request(dataUrl)
          .then(({data}) => {
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
    expertCats(){
        return _.filter(this.sortedCats, {laps:4});
    },
    sportCats(){
        return _.filter(this.sortedCats, {laps:3});
    },
    beginnerCats(){
        return _.filter(this.sortedCats, {laps:2});
    },
    gromCats(){
          return _.filter(this.categories, (cat)=>cat.id.indexOf('grom')>-1);
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
<SeriesNavBar :series="series" />
    <div v-if="formattedStartDate" class="text-center">
        <h2 class="mt-5">Race Results - {{formattedStartDate}}</h2>
    </div>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="haveResults">
      <div class="container text-center mt-5">
       <ul class="list-inline">
          <template v-for="(cat, key) in expertCats" :key="cat.id">
            <li class="list-inline-item  mx-2">
              <a role="button" @click="scrollMeTo(cat.id)" class="link-primary">{{ cat.catdispname }}</a>
            </li>
          </template>
        </ul>
        <ul class="list-inline">
          <template v-for="(cat, key) in sportCats" :key="cat.id">
            <li class="list-inline-item  mx-2">
              <a role="button" @click="scrollMeTo(cat.id)" class="link-primary">{{ cat.catdispname }}</a>
            </li>
          </template>
        </ul>
        <ul class="list-inline">
          <template v-for="(cat, key) in beginnerCats" :key="cat.id">
            <li class="list-inline-item  mx-2">
              <a role="button" @click="scrollMeTo(cat.id)" class="link-primary">{{ cat.catdispname }}</a>
            </li>
          </template>
        </ul>
        <ul class="list-inline">
          <template v-for="(cat, key) in gromCats" :key="cat.id">
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
                  v-for="(columnName, index) in cat.columns"
                  scope="col"
                  :key="index"
                >
                  {{ columnName }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(racer, idx) in cat.results" :key="idx">
                <ResultRow :totLaps="cat.laps" :Pos="idx" :data="racer" />
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
