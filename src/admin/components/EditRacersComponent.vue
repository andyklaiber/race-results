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
      filterKey:""
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
    }
  },
  computed: {
    loaded() {
      if (!this.data) {
        return false;
      }
      return true;
    },
    filteredRacers(){
      const filterKey = this.filterKey && this.filterKey.toLowerCase()
      let data = this.data.registeredRacers;
      if (filterKey.length) {
            data = data.filter((row) => {
              return Object.keys(row).some((key) => {
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

    <div v-if="loaded" class="container">


      <!-- <Grid
        :data="data.registeredRacers"
        :columns="gridColumns"
        :filter-key="searchQuery"
        editIdColumn="paymentId">
      </Grid> -->
      <FormKit
                  type="text"
                  name="search"
                  label="Search:"
                  help=""
                  :delay="500"
                  v-model="filterKey"
                />
      <div class="table-responsive">
        <table class="table table-striped table-hover table-sm">
          <thead>
            <tr>
              <th scope="col">First Name</th>
              <th scope="col">Last Name</th>
              <th scope="col">Category</th>
              <th scope="col">Bib Number</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(racer, idx) in filteredRacers" :key="idx">
              <td>{{racer.first_name}}</td>
              <td>{{racer.last_name}}</td>
              <td>{{racer.category}}</td>
              <td>{{racer.bibNumber}}</td>
              <td>
                <div class='btn btn-sm btn-outline-secondary' @click="editRacer(racer.paymentId)">edit</div>
              </td>
            </tr>

          </tbody>
        </table>
        <pre>
            {{data}}
          </pre>
        <Teleport to="body">
          <!-- use the modal component, pass in the prop -->
          <modal-component :show="showModal" @close="showModal = false">
            <template #header>
              <h3>Edit Racer Data</h3>
            </template>
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
