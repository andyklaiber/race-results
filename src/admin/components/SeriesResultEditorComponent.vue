<script>
import _ from "lodash";
import request from "@/lib/ApiClient";
import dayjs from '@/lib/dayjs';

export default {
  components: {

  },
  data() {
    return {
      
      loading: false,
      error: null,
      formError: [],
      formInputData: {},
      data: {},
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
      if (this.$route.params.series) {
        return request(`/api/results/series/${this.$route.params.series}`)
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
    editCategories() {
      // go to edit 
    },
    editPaytypes() {

    },
    async saveRaceData(formData) {
      await request.patch(
        `/api/results/series/${this.data._id}`,
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


      <div v-if="this.data?.series">
        <div class="my-3">
          <a :href="`/#/result/series/${data.series}`" target="_blank">view series points</a>
          </div>
          <div class="row">
        <div class="col-md-6">
          <FormKit type="form" :errors="formError" id="season-pts-form" @submit="saveRaceData" submit-label="Save" v-model="formInputData">
            <FormKit :value="data?.eventName" type="text" name="eventName" label="Event Name" />
         
            <FormKit :value="data?.published" type="checkbox" label="Published - will show on main index" name="published" />
          </FormKit>
        </div>
      </div>
        <!-- <pre>{{raceData}}
      </pre> -->
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
