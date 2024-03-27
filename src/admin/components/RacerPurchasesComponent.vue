<script>
import _ from "lodash";
import Grid from './GridComponent.vue'
import request from "@/lib/ApiClient";

import dayjs from 'dayjs/esm/index.js';

export default {
  components: {
    Grid,
  },
  data() {
    return {
      categories: {},
      loading: false,
      error: null,
      data: {},
      showModal:false,
      filterKey:"",
      filterUnpaid:false,
      filterNoBib:false,
      filterCats:"all"
    }
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
      if (this.$route.params.raceid) {
          request(`/api/racers/race/${this.$route.params.raceid}`)
          .then((response) => {
            this.data = response.data;
            this.loading = false;
          })
          .catch((err) => {
            this.loading = false;
            this.error = err.toString();
            console.error(err);
          });
        }
    },

    resetFilters(){
      this.filterKey="",
      this.filterUnpaid=false,
      this.filterNoBib=false,
      this.filterCats="all";
    },

    optionalPurchases(obj){
      if(!obj) return '';
      let returnStr = '';
      let itemDescriptions = [];
      let items = Object.keys(obj).filter(key => key.split('-').length == 1);
      if(items.length){
        items.forEach((key)=>{
          if(obj[key + '-option']){
            return itemDescriptions.push(`${this.capitalize(key)}: ${obj[key + '-option']}`);
          }
          itemDescriptions.push(this.capitalize(key));
        })
      }
      returnStr = itemDescriptions.join(', ');
      // if(obj.tshirt){
      //   returnStr = 'shirt: '+obj["tshirt-option"];
      // }
      // if(obj.bottle) returnStr += " + Bottle"
      // if(obj.socks) returnStr += ` + ${obj["socks-option"]} Socks`
      return returnStr;
    },
    capitalize(txt){
      return _.capitalize(txt);
    },
  },
  computed: {
    loaded() {
      if (!this.data) {
        return false;
      }
      return true;
    },
    sortedCats() {
            let cats = {all:"All Categories"};
            _.forEach(
                _.orderBy(this.data.regCategories, "disporder"),
                (element) => {
                    cats[element.id] = element.catdispname;
                }
            );

            return cats;
        },
    filteredRacers(){
      const filterKey = this.filterKey && this.filterKey.toLowerCase()
      let data = this.data.registeredRacers.filter((row) => {
        return row.optionalPurchases && Object.keys(row.optionalPurchases).length > 0});

      if (filterKey.length || this.filterUnpaid || this.filterCats !== 'all' || this.filterNoBib) {
            data = data.filter((row) => {
              if(this.filterUnpaid){
                if(row.status !== 'unpaid'){
                  return false;
                }
              }
              if(this.filterNoBib){
                if(row.bibNumber){
                  return false;
                }
              }
              if(this.filterCats !='all'){
                if(row.category != this.filterCats){
                  return false;
                }
              }
              return ['first_name','last_name','bibNumber'].some((key) => {
                return String(row[key]).toLowerCase().indexOf(filterKey) > -1
              })
            })
          }
          return _.sortBy(data, [function(o) { return o.last_name.toLowerCase(); }]);
    }
  },
};
</script>

<template>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="loaded" class="container-fluid">
      <!-- <Grid
        :data="data.registeredRacers"
        :columns="gridColumns"
        :filter-key="searchQuery"
        editIdColumn="paymentId">
      </Grid> -->
      <div class="d-flex flex-row justify-content-center">
        <div class="p-2">
          <h3>{{data.displayName}}</h3>
        </div>
      </div>
      <div class="racer-controls d-flex flex-row justify-content-between flex-wrap align-items-top pb-2 mb-3 border-bottom">
        <div class='p-2'>
          <FormKit id='racerFilterTxtInput' type="text" name="search" label="Search:" help="search in first, last or bib number" :delay="300"
            v-model="filterKey" />
            
        </div>
        <div class='flex-grow-1 p-2'><FormKit type="select" name="categories" label="Filter by Category" :options="sortedCats" v-model="filterCats" />
          <div class="d-flex flex-row search-checks">
            <FormKit type="checkbox" name="unpaid" label="Unpaid Only" v-model="filterUnpaid" />
          <FormKit type="checkbox" name="noBib" label="No Bib Only" v-model="filterNoBib" />
        </div>
        </div>
        <div class="d-flex flex-grow-1 justify-content-between p-2 pt-4">
          <a class="btn btn-primary align-self-start" @click="resetFilters">Reset Filters</a>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table table-striped table-sm">
          <thead>
            <tr>
              <th scope="col">First Name</th>
              <th scope="col">Last Name</th>
              <!-- <th scope="col">Race Age</th> -->
              <!-- <th scope="col">Bib Number</th> -->
              <th scope="col">Purchases</th>
              <!-- <th scope="col">keys</th>
              <th scope="col">Paytype</th> -->
              <th scope="col"><strong>{{filteredRacers.length}} Found</strong></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(racer, idx) in filteredRacers" :key="idx">
              <td>{{racer.first_name}}</td>
              <td>{{racer.last_name}}</td>
              <!-- <td>{{racer.racerAge}}</td> -->
              <!-- <td>{{racer.bibNumber}}</td> -->
              <td>{{optionalPurchases(racer.optionalPurchases)}}</td>
              <!-- <td>{{Object.keys(racer.optionalPurchases)}}</td> -->
              <td>{{racer.paytype}}</td>
              </tr>

          </tbody>
        </table>
        <!-- <pre>
            {{data}}
          </pre> -->
      </div>
    </div>
    <div v-else>
      <div class="text-center">
        <h2 class="mt-5">Race not available for registration...</h2>
      </div>
    </div>
  </div>
</template>

<style>
#racerFilterTxtInput {
  width: 320px;
}
.search-checks > .formkit-outer {
   width: 120px;
}
table.table {
  --bs-table-hover-bg: #76c8ff;
}
</style>
