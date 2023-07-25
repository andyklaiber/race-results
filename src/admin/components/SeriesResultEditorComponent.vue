<script>
import _ from "lodash";
import request from "@/lib/ApiClient";
import dayjs from '@/lib/dayjs';
import ModalComponent from './ModalComponent.vue';
import TeamRacerFormComponent from './TeamRacerFormComponent.vue'

export default {
  components: {
    ModalComponent,
    TeamRacerFormComponent,
  },
  data() {
    return {
      
      loading: false,
      error: null,
      final:false,
      filterKey:"",
      formError: [],
      formInputData: {},
      teamRacerToAdd:{},
      data: {},
      showModal:false,
    };
  },
  created() {
    this.$watch(
      () => this.$route.params,
      () => {
        this.fetchData();
        this.fetchTeamCompRacers();
      },
      // fetch the data when the view is created and the data is
      // already being observed
      { immediate: true }
    );
  },
  methods: {
    dollas(amt) {
      if(typeof amt === 'string'){
        amt = parseInt(amt);
      }
      return amt.toLocaleString("en-US", { style: "currency", currency: "USD" });
    },
    fetchData() {
      this.error = null;
      this.loading = true;
      if (this.$route.params.series) {
        return request(`/api/results/series/${this.$route.params.series}`)
          .then((response) => {
            this.data = response.data;
            this.final = response.data.final;
            this.loading = false;
          })
          .catch((err) => {
            this.loading = false;
            this.error = err.toString();
            console.error(err);
          });
      }
    },
    fetchTeamCompRacers(){
      return request(`/api/team-comp/racers/?series=${this.$route.params.series}`)
          .then((response) => {
            this.teamRacers= response.data;
          })
          .catch((err) => {
            this.loading = false;
            this.error = err.toString();
            console.error(err);
          });
    },
    async updateTeamCompRacer(data){
      console.log(data)
      this.teamRacerToAdd = data;
      this.showModal =true;
    },
    teamRacerUpdated(){
      this.teamRacerToAdd = {};
      this.closeModal();
    },
    closeModal(){
      this.showModal = false
    },
    async saveRaceData(formData) {
      // console.log("formData")
      // console.log(formData)
      await request.patch(
        `/api/results/series/${this.data._id}`,
        formData
      ).then((response) => {
        if (response.data) {
          
          console.log(response.data);
          return this.fetchData()
        }
      })
        .catch((error) => {
          this.formError = ["Error submitting request"];
          console.log(error);
        });
    }
  },
  computed: {
    loaded() {
      if (!this.raceData) {
        return false;
      }
      return true;
    },
    hasTeamComp(){
      return this.data?.teamCompDates?.length > 1;
    },
    teamCompRacers(){
      if(this.hasTeamComp){
        let returnAry = [];
        Object.keys(this.data?.categories).forEach((catName)=>{
          let catObj = this.data.categories[catName];
          let catDispName = catObj.catdispname;
          catObj.results.forEach((resultRow)=>{
            let RacerRow = {
              Name: resultRow.Name,
              Bib: resultRow.Bib,
              Cat: catDispName,
              Sponsor: resultRow.Sponsor
            }
            returnAry.push(RacerRow)
          })
        })
        if(this.filterKey){
          returnAry = returnAry.filter((elem)=>{
            if(elem.Name.toLowerCase().indexOf(this.filterKey.toLowerCase()) > -1){
              return true;
            }
            if(elem.Bib == parseInt(this.filterKey)){
              return true;
            }
            return false;
          })
        }
        return returnAry
      }
    }
  },
};
</script>

<template>
  <div class="container">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else>
      <div v-if="error" class="error">{{ error }}</div>

      <!-- "eventDetails": {
    "logoUrl": "/Folsom-Rodeocross-Logo-300x300.jpg",
    "name": "RodeoCross 2022",
    "tagline": "Cyclocross's gateway drug. Sept 28th, Oct 5th, 12th, 19th, and 26th",
    "homepageUrl": -->


      <div v-if="this.data?.series">
        <div class="my-3">
          <a :href="`/#/result/series/${data.series}`" target="_blank">view series points</a>
          </div>
          <div class="row">
        <div class="col-md-6">
          <FormKit type="form" :errors="formError" id="season-pts-form" @submit="saveRaceData" submit-label="Save" v-model="formInputData">
            <FormKit :value="data?.eventName" type="text" name="eventName" label="Event Name" />
            <FormKit :value="data?.gromRaceDates" type="text" name="gromRaceDates" label="Grom Race Dates" />
            <FormKit :value="data?.teamCompDates" type="text" name="teamCompDates" label="Team Competition Race Dates" />
         
            <FormKit :value="final" type="checkbox" label="Finalized - don't allow updates" name="final" />
            <FormKit :value="data?.published" type="checkbox" label="Published - will show on main index" name="published" />
          </FormKit>
        </div>
        <div v-if="hasTeamComp" class="col-md-6">
          <h5>Racers</h5><div><div class="btn-toolbar mb-2 mb-md-0">
          <FormKit id='racerFilterTxtInput' type="text" name="search" label="Search:" help="search in first, last, bib" :delay="300"
            v-model="filterKey" />
          </div></div>
          <div>
              <div class="row" v-for="thing in teamCompRacers"><div class="col"><div class="btn btn-sm btn-primary" @click="updateTeamCompRacer(thing)">Add</div></div><div class="col">{{ thing.Name }}</div><div class="col">{{ thing.Bib }}</div><div class="col">{{ thing.Sponsor }}</div></div>
          </div>
        </div>
      </div>
        <!-- <pre>{{raceData}}
      </pre> -->
      <Teleport to="body">
          <!-- use the modal component, pass in the prop -->
          <modal-component :show="showModal" @close="closeModal">
            <template #body>
              <TeamRacerFormComponent @saved="teamRacerUpdated" :racerData="teamRacerToAdd" :series="data.series"></TeamRacerFormComponent>
            </template>
          </modal-component>
        </Teleport>
      </div>
      <div v-else>
        <div class="text-center">
          <h2 class="mt-5">Series Points record not found...</h2>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
table.table {
  --bs-table-hover-bg: #76c8ff;
}
</style>
