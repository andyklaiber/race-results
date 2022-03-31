<script>
import _ from "lodash";
import ResultRow from "./ResultRow.vue";

export default {
  components: {
    ResultRow,
  },
  data() {
    return {
      categories: {},
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
    scrollMeTo(refName) {
        var element = document.querySelector(`#${refName}`)
        element.scrollIntoView({ behavior: 'smooth' })
    },
    fetchData() {
      this.error = null;
      this.loading = true;
      let dataUrl = `/api/races/results/${this.$route.params.raceid}`;
      if (import.meta.env.DEV) {
        dataUrl = "http://localhost:3000" + dataUrl;
      }
      fetch(dataUrl)
        .then((response) => response.json())
        .then((data) => {
          this.loading = false;
          this.categories = data.categories;
        })
        .catch((err) => {
          console.error(err);
          this.categories = {};
          this.error = err.toString();
        });
    },
  },
  computed: {
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
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="haveResults">
      <div class="container text-center mt-5">
        <ul class="list-inline">
          <template v-for="(cat, key) in sortedCats" :key="cat.id">
            <li class="list-inline-item">
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
          <a role="button" @click="scrollMeTo('top')" class="link-primary">Back to Top</a>
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
</style>
