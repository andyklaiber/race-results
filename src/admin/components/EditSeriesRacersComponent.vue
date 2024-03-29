<script>
import _ from "lodash";
import Grid from './GridComponent.vue'
import ModalComponent from './ModalComponent.vue';
import RacerFormComponent from './RacerFormComponent.vue'
import request from "@/lib/ApiClient";

import dayjs from 'dayjs/esm/index.js';

export default {
  components: {
    ModalComponent,
    RacerFormComponent,
    Grid,
  },
  data() {
    return {
      categories: {},
      loading: false,
      error: null,
      formError: [],
      formInputData: {},
      data: {},
      racerToEdit:null,
      showModal:false,
      filterKey:"",
      filterUnpaid:false,
      filterNoBib:false,
      filterCats:"all",
      filterSimilar:true,
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
    dollas(amt) {
      return amt.toLocaleString("en-US", { style: "currency", currency: "USD" });
    },
    fetchData() {
      this.error = null;
      this.loading = true;
      if (this.$route.params.raceid) {
        if(this.$route.params.series){
          request(`/api/racers/series/${this.$route.params.series}`)
          .then(({data}) => {
            console.log(data);
            // let allRacers = []
            // _.reduce(data.filteredRaces, (allRacers, race, idx )=>{
            //   _.filter(race, {paytype: 'cash'})
            // })
            this.data = {registeredRacers: data.racers, regCategories: data.regCategories, races: data.races};
            this.loading = false;
            this.error = '';
          })
          .catch((err) => {
            this.loading = false;
            this.error = err.toString();
            console.error(err);
          });
        }
      }
      this.error = 'invalid URL'
    },
    catName(cat_id) {
      let catObj = _.find(this.data.regCategories, { id: cat_id })
      if(catObj){
        return catObj.catdispname
      }
      return ''
    },
    createReg(){
      this.racerToEdit = {
        paytype:'cash',
        status: 'unpaid',
        raceid: this.$route.params.raceid
      };
        this.showModal=true;
    },
    editRacer(paymentId){
      let racer = _.clone(_.find(this.data.registeredRacers, {paymentId}));
      if(racer){
        this.racerToEdit = racer;
        this.showModal=true;
      }else{
        alert('no payment id found for racer')
      }
    },
    racerUpdated(){
      this.racerToEdit = null;
      this.showModal=false;
      this.fetchData()
    },
    capitalize(txt){
      return _.capitalize(txt);
    },
    closeModal(){
      this.showModal = false
      _.defer(()=>{
            let searchNode = document.querySelector('#racerFilterTxtInput');
            searchNode.focus();
        });
    },
    resetFilters(){
      this.filterKey="",
      this.filterUnpaid=false,
      this.filterNoBib=false,
      this.filterCats="all";
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
      let data = this.data.registeredRacers;
      if (this.filterSimilar) {
        let returnList = [];
        _.forEach(this.data.races, (raceid, raceIdIndex) => {
          console.log(raceid);
          let raceRacers = _.filter(data, { raceid });
          _.forEach(raceRacers, (racer, racerIndex) => {
            _.forEach(_.filter(data, { raceid: this.data.races[raceIdIndex + 1] }), (racerCompare) => {
              if (racer.first_name.toLowerCase() === racerCompare.first_name.toLowerCase() || racer.last_name.toLowerCase() === racerCompare.last_name.toLowerCase()) {
                  if (!_.includes(returnList, racer)) {
                    returnList.push(racer);
                  }
                  if (!_.includes(returnList, racerCompare)) {
                    returnList.push(racerCompare);
                  }
              }
            })
          })
        })
        return _.sortBy(returnList, [function(o) { return o.last_name.toLowerCase(); }]);
      }

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
      <div class="racer-controls d-flex flex-row justify-content-between flex-wrap align-items-top pt-3 pb-2 mb-3 p-2 border-bottom">
        <div class='p-2'>
          <FormKit id='racerFilterTxtInput' type="text" name="search" label="Search:" help="search in first, last or bib number" :delay="300"
            v-model="filterKey" />
            
        </div>
        <div class='flex-grow-1 p-2'><FormKit type="select" name="categories" label="Filter by Category" :options="sortedCats" v-model="filterCats" />
          <div class="d-flex flex-row search-checks">
            <FormKit type="checkbox" name="unpaid" label="Unpaid Only" v-model="filterUnpaid" />
          <FormKit type="checkbox" name="noBib" label="No Bib Only" v-model="filterNoBib" />
          <FormKit type="checkbox" name="duplicates" label="Duplicates" v-model="filterSimilar" />
        </div>
        </div>
        <div class="d-flex flex-grow-1 justify-content-between pt-4">
          <a class="btn btn-primary align-self-start" @click="resetFilters">Reset Filters</a>
          <!-- <div class='btn btn-md btn-success  align-self-start' @click="createReg()">Add New Registration</div> -->
        </div>
      </div>
      <div class="table-responsive">
        <table class="table table-striped table-sm">
          <thead>
            <tr>
              <th scope="col">First Name</th>
              <th scope="col">Last Name</th>
              <th scope="col">Email</th>
              <th scope="col">Category</th>
              <th scope="col">Bib Number</th>
              <th scope="col">Paytype</th>
              <th scope="col">EventName</th>
              <th scope="col"><strong>{{filteredRacers.length}} Found</strong></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(racer, idx) in filteredRacers" :key="idx">
              <td>{{racer.first_name}}</td>
              <td>{{racer.last_name}}</td>
              <td>{{racer.email}}</td>
              <td>{{catName(racer.category)}}</td>
              <td>{{racer.bibNumber}}</td>
              <td>{{racer.paytype}}</td>
              <td>{{racer.eventDisplayName}}</td>
              <!-- <td :class="{'text-success':racer.status !== 'unpaid', 'text-danger':racer.status === 'unpaid'}">{{capitalize(racer.status)}}</td> -->
              <td>
                <div class='btn btn-sm btn-outline-secondary' @click="editRacer(racer.paymentId)">{{'edit'}}</div>
              </td>
            </tr>

          </tbody>
        </table>
        <!-- <pre>
            {{data}}
          </pre> -->
        <Teleport to="body">
          <!-- use the modal component, pass in the prop -->
          <modal-component :show="showModal" @close="closeModal">
            <template #body>
              <RacerFormComponent @saved="racerUpdated" :racerData="racerToEdit" :categories="data.regCategories" :payments="data.paymentOptions" formMode="edit" :series="data.series"></RacerFormComponent>
            </template>
          </modal-component>
        </Teleport>
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
