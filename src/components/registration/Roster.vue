<script>
import _ from "lodash";
import request from "@/lib/ApiClient";
import EventDetailsComponent from "@/components/EventDetailsComponent.vue";
import MainNav from "@/components/MainNav.vue";
import dayjs from 'dayjs/esm/index.js'

export default {
  components: {
    EventDetailsComponent,
    MainNav,
  },
  data() {
    return {
      categories: {},
      loading: false,
      error: null,
      formattedStartDate: "",
      series: null,
      stageFilter: 'all',
      racers:[],
      raceData:{},
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
            this.loading=false;
            if(err.response?.status === 404){
              this.error = "Race not found"
              return;
            }
            console.error(err);
            this.categories = {};
            this.error = err.toString();
          });
      }
    },
    replacePlusSymbol(text){
      return text.replace('+', 'Plus');
    },
    payTypeToStage(paytype){
      const payOpt = _.find(this.raceData.paymentOptions, {type: paytype});
      if(payOpt){
        return payOpt.name;
      }
      return '';
    },
  },
  computed: {
    showPaytype() {
      return !!this.raceData?.showPaytypeOnRoster
    },
    filterOptions(){
      let options = { "all":"All Stages"};
      _.forEach(this.raceData.paymentOptions,
        (element) => {
          options[element.type] = element.name;
        }
      );

      return options;
    },
    filteredRacers(){
      if(this.showPaytype && this.stageFilter !== 'all'){
        return _.filter(this.racers, {paytype:this.stageFilter} )
      }else{
        return this.racers
      }
    },
    groupedRacers(){
      return _.groupBy(this.filteredRacers, "category");
    },
    sortedCats() {
      return _.filter(_.orderBy(this.categories, "disporder"),
      (cat)=>_.includes(Object.keys(this.groupedRacers),cat.id));
    },
    raceDate(){
      return dayjs(this.raceData.eventDate).format("ddd, MMM D");
    }
  },
};
</script>

<template>
  <MainNav></MainNav>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-else id="top">
    <EventDetailsComponent :details="raceData.eventDetails" :raceid="raceData.raceid"/>
    <div v-if="Object.keys(racers).length">
      <div class="row">
      <div :class="{'col-md-6':showPaytype}">
        <h4>{{raceData.count}} Registered for {{raceData.displayName}} on {{raceDate}}</h4>
      </div>
      <div v-if="showPaytype" class="col-md-6">
        <FormKit
                type="select"
                label="Show registrations for:"
                name="stageFilter"
                v-model="stageFilter"
                default="all"
                :options="filterOptions"
              />
      </div>
    </div>
      <div class="container text-center mt-5">
       <ul class="list-inline">
          <template v-for="(cat) in sortedCats" :key="cat.id">
            <li class="list-inline-item  mx-2">
              <a role="button" @click="scrollMeTo(replacePlusSymbol(cat.id))" class="link-primary">{{ cat.catdispname }}</a>
            </li>
          </template>
        </ul>
        </div>
      <div class="container-fluid">
        <div v-for="(cat) in sortedCats" :key="cat.id" class="mt-5">
          <h3 :id="replacePlusSymbol(cat.id)">{{ cat.catdispname }}</h3>
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
                <th v-if="showPaytype">
                  Stages
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(racer, idx) in groupedRacers[cat.id]" :key="idx">
                <td>{{racer.first_name}}</td>
                <td>{{racer.last_name}}</td>
                <td>{{racer.sponsor}}</td>
                <td  v-if="showPaytype">{{payTypeToStage(racer.paytype)}}</td>
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
  </div>
</template>

<style>
table.table {
  --bs-table-hover-bg: #76c8ff;
}
body {
  min-height: 75rem;
  padding-top: 4.5rem;
}
</style>
