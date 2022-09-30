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
    dollas(amt) {
      return amt.toLocaleString("en-US", { style: "currency", currency: "USD" });
    },
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


    submitForm(clickEvent) {
      clickEvent.preventDefault();
      this.$formkit.submit("race-registration");
    },
    async submit(data) {
      console.log(data);
      // await request
      //   .post(
      //     `/api/payments/start-registration?race=${this.raceData.raceid}`,
      //     data
      //   )
      //   .then((response) => {
      //     if (response.data) {
      //       this.submitted = true;
      //       console.log(response.data);
      //       return new Promise((resolve) =>
      //         setTimeout(() => {
      //           window.location.href = response.data;
      //           resolve();
      //         }, 2000)
      //       );
      //     }
      //   })
      //   .catch((error) => {
      //     this.formError = ["Error submitting request"];
      //     console.log(error);
      //   });
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
    }
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

      if (filterKey.length || this.filterUnpaid || this.filterCats !== 'all') {
            data = data.filter((row) => {
              if(this.filterUnpaid){
                if(row.status !== 'unpaid'){
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
          return data;
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
      <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <div class='col-4'>
          <FormKit id='racerFilterTxtInput' type="text" name="search" label="Search:" help="search in first, last or bib number" :delay="300"
            v-model="filterKey" />
        </div>
        <div class='col-4'><FormKit type="select" name="categories" label="Filter by Category" :options="sortedCats" v-model="filterCats" /></div>
        <div><FormKit type="checkbox" name="unpaid" label="Unpaid Only" v-model="filterUnpaid" /></div>
        <div class="btn-toolbar mb-2 mb-md-0">
          <div class='btn btn-md btn-success  ' @click="createReg()">Add New Registration</div>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table table-striped table-sm">
          <thead>
            <tr>
              <th scope="col">First Name</th>
              <th scope="col">Last Name</th>
              <th scope="col">Category</th>
              <th scope="col">Bib Number</th>
              <th scope="col">Paytype</th>
              <th scope="col">Payment Status</th>
              <th scope="col"><strong>{{filteredRacers.length}} Found</strong></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(racer, idx) in filteredRacers" :key="idx">
              <td>{{racer.first_name}}</td>
              <td>{{racer.last_name}}</td>
              <td>{{catName(racer.category)}}</td>
              <td>{{racer.bibNumber}}</td>
              <td>{{racer.paytype}}</td>
              <td :class="{'text-success':racer.status !== 'unpaid', 'text-danger':racer.status === 'unpaid'}">{{capitalize(racer.status)}}</td>
              <td>
                <div class='btn btn-sm btn-outline-secondary' @click="editRacer(racer.paymentId)">{{racer.status === 'unpaid'? 'Register': 'edit'}}</div>
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
              <RacerFormComponent @saved="racerUpdated" :racerData="racerToEdit" :categories="data.regCategories" :payments="data.paymentOptions"></RacerFormComponent>
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
table.table {
  --bs-table-hover-bg: #76c8ff;
}
</style>
