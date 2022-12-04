<script>
import _ from "lodash";
import request from "@/lib/ApiClient";

import dayjs from 'dayjs/esm/index.js';

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
      newEventDetails: {},
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
      if (this.$route.params.raceid) {
        return request(`/api/races/${this.$route.params.raceid}`)
          .then((response) => {
            this.raceData = response.data;
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
        `/api/races/${this.$route.params.raceid}`,
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
    sortedCats() {
      
        return _.orderBy(this.raceData.regCategories, "disporder")
    },
    loaded() {
      if (!this.raceData) {
        return false;
      }
      return true;
    },
    eventDate() {
      return dayjs(this.raceData.eventDate).format('YYYY-MM-DDTHH:mm');
    },
    paymentOptions() {
      let options = {};
      _.forEach(this.raceData.paymentOptions, (element) => {
        options[element.type] = element.name;
      });
      return options;
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


      <div v-if="true">
        <div class="my-3">
            <a :href="`/#/register/${raceData.raceid}`">View Reg Form</a>
          </div>
          <div class="my-3">
            <a :href="`/#/roster/${raceData.raceid}`">View Roster</a>
          </div>
          <div class="row">
        <div class="col-md-6">
          <FormKit type="form" :errors="formError" id="race-settings" @submit="saveRaceData" submit-label="Save" v-model="formInputData">
            <FormKit :value="raceData?.displayName" type="text" name="displayName" label="Event Name" />
            <FormKit :value="eventDate" type="datetime-local" name="eventDate" label="Date" />
            <FormKit :value="raceData?.series" type="text" name="series" label="Event Series Name" />
            <FormKit type="group" name="eventDetails">
              <FormKit :value="raceData?.eventDetails?.name" type="text" name="name" label="Header Event Name" />
              <FormKit :value="raceData?.eventDetails?.tagline" type="text" name="tagline"
                label="Header tagline text" />
              <FormKit :value="raceData?.eventDetails?.logoUrl" type="text" name="logoUrl" label="Logo URL" />
              <FormKit :value="raceData?.eventDetails?.homepageUrl" type="text" name="homepageUrl"
                label="Home Page URL" />
              <FormKit type="group" name="facebookShare">
                <FormKit :value="raceData?.eventDetails?.facebookShare?.url" type="text" name="url"
                  label="FB Share URL" />
              </FormKit>
            </FormKit>
            <FormKit :value="raceData?.showPaytypeOnRoster" type="checkbox"
              label="Show Payment Type as stages on roster" name="showPaytypeOnRoster" />
            <FormKit :value="raceData.isTestData" type="checkbox" label="Use Test payment integrations"
              name="isTestData" />
            <FormKit :value="raceData.couponsEnabled" type="checkbox" label="Enable Coupons" name="couponsEnabled" />
            <FormKit :value="raceData?.cashPaymentsEnabled" type="checkbox"
              label="Enable Cash payments on race day" name="cashPaymentsEnabled" />
            <FormKit type="group" name="stripeMeta">
              <FormKit :value="raceData?.stripeMeta?.accountId" type="text" name="accountId" label="Stripe Integration Account ID" />
            </FormKit>
            <FormKit :value="raceData.archived" type="checkbox" label="Archive Race (will not be visible in admin race list)" name="archived" />
          </FormKit>
        </div>
        <div class="col-md-6">
            <div class="col-md mb-3">
              <h5>Categories</h5>
              <div class="row g-2 px-4 gx-4 border bg-light">
                <div v-for="cat in sortedCats" class="my-1">
                  {{cat.catdispname}} <strong v-if="cat.sponsored">Sponsored</strong>
                </div>
              </div>
            </div>
            <FormKit type="button" @click="editCategories">
              Edit Categories
            </FormKit>
            <div class="col-md mb-3">
              <h5>Payment Options</h5>
              <div class="row g-2 px-4 gx-4 border bg-light">
                <div v-for="payOpt in raceData.paymentOptions" class="my-1">
                  {{payOpt.name}}:{{`  ${dollas(payOpt.amount)}`}}
                </div>
              </div>
            </div>
              
            <FormKit type="button" @click="editPaytypes">
                Edit Paytypes
              </FormKit>
          
          
        </div>
      </div>
        <!-- <pre>{{raceData}}
      </pre> -->
      </div>
      <div v-else>
        <div class="text-center">
          <h2 class="mt-5">Race not available for registration...</h2>
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
