<script>
import _ from "lodash";
import request from "@/lib/ApiClient";
import dayjs from '@/lib/dayjs';

export default {
  components: {

  },
  data() {
    return {
      categories: {},
      loading: false,
      error: null,
      formError: [],
      formInputData: {},
      raceData: {},
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
    dollas(amt) {
      if(typeof amt === 'string'){
        amt = parseInt(amt);
      }
      return amt.toLocaleString("en-US", { style: "currency", currency: "USD" });
    },
    fetchData() {
      this.error = null;
      this.loading = true;
      if (this.$route.params.resultid) {
        return request(`/api/results/${this.$route.params.resultid}`)
          .then((response) => {
            this.raceData = response.data;
            this.loading = false;
          })
          .catch((err) => {
            this.raceData = {};
            this.loading = false;
            this.error = err.toString();
            console.error(err);
          });
      }
    },
    editCategories() {
      // go to edit 
    },
    editPaytypes() {

    },
    async saveRaceData(formData) {
      await request.patch(
        `/api/results/${this.raceData._id}`,
        this.formInputData
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


      <div v-if="raceData.raceid">
        <div class="my-3">
            <a :href="`/#/result/${raceData.raceid}`">View Result</a>
          </div>
          <div class="row">
        <div class="col-md-6">
          <FormKit type="form" :errors="formError" id="race-settings" @submit="saveRaceData" submit-label="Save" v-model="formInputData">
            <FormKit :value="raceData?.eventName" type="text" name="eventName" label="Event Name" />
            <FormKit :value="raceData?.shortName" type="text" name="shortName" label="Short Name for series points column header" />
            <FormKit :value="raceData?.formattedStartDate" type="text" name="formattedStartDate" label="Display Date" />
            <FormKit :value="raceData?.series" type="text" name="series" label="series" />
            <FormKit :value="raceData?.showMillis" type="checkbox" label="Show milliseconds on times" name="showMillis" />
            <FormKit :value="raceData?.final" type="checkbox" label="Finalized - results cannot be updated via upload" name="final" />
          </FormKit>
        </div>
      </div>
        <!-- <pre>{{raceData}}
      </pre> -->
      </div>
      <div v-else>
        <div class="text-center">
          <h2 class="mt-5">Result upload not found...</h2>
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
