<script>
import _ from "lodash";
import request from "@/lib/ApiClient";
import SeriesResultRow from "./SeriesResultRow.vue";
import SeriesNavBar from "./SeriesResultNavComponent.vue";

export default {
  components: {
    SeriesResultRow,
    SeriesNavBar,
  },
  data() {
    return {
      categories: {},
      loading: false,
      error: null,
      displayName: "",
      series: null
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
      if(!this.$route.params.seriesid){
        return;
      }
      this.error = null;
      this.loading = true;
      let dataUrl = `/api/series/results/${this.$route.params.seriesid}`;
      request(dataUrl)
        .then(({data}) => {
          this.loading = false;
          this.categories = data.categories;
          this.displayName = data.eventName;
          this.series = this.$route.params.seriesid;
          let temp = _.map(data.categories, (cat)=>_.omit(cat, ['results','columns']))
          // console.log('temp:', _.orderBy(temp, 'disporder'))
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
    isPCRS(){
      return _.isString(this.series) && this.series.indexOf('pcrs') > -1;
    }
  },
};
</script>

<template>
  <SeriesNavBar :series="series" :displayName="displayName"/>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>
     <div class="container-fluid text-center mt-5">
    <h3>Series Standings</h3>
    <p>Glossary of terms below:</p>
    <p v-if="isPCRS">1/50 = 1st Place/50 Points &nbsp&nbsp-/- = Did not race</p>
    <p v-else>1/100 = 1st Place/100 Points &nbsp&nbsp-/- = Did not race</p>
  </div>
    <div v-if="haveResults">
      <div class="container-fluid text-center mt-5">
          <ul class="list-inline">
          <template v-for="(cat) in sortedCats" :key="cat.id">
            <li class="list-inline-item  mx-2">
              <a role="button" @click="scrollMeTo(cat.id)" class="link-primary">{{ cat.catdispname }}</a>
            </li>
          </template>
        </ul>
      </div>
      <div class="container-fluid">
        <div v-for="(cat) in sortedCats" :key="cat.id" class="mt-5">
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
                <SeriesResultRow :Pos="idx" :data="racer" />
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

table.table {
--bs-table-hover-bg: #76c8ff;
}

</style>
