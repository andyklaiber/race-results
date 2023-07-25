<script>
import _ from "lodash";
import EventDetailsComponent from "@/components/EventDetailsComponent.vue";
import MainNav from "@/components/MainNav.vue";

import request from "@/lib/ApiClient";

const dollas = (amt) =>
  amt.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default {
  components: { EventDetailsComponent, MainNav },
  data() {
    return {
      categories: {},
      loading: false,
      error: null,
      raceData: {},
      regData: {},
      payment: "",
      payStatus: false,
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
    fetchData() {
      this.error = null;
      this.loading = true;
      if (this.$route.params.raceid && this.$route.params.payment_id) {
        request(`/api/races/${this.$route.params.raceid}`)
          .then((response) => {
            this.raceData = response.data;
            return request(
              `/api/payments/status?payment_id=${this.$route.params.payment_id}`
            ).then((response) => {
              this.loading = false;
              this.payStatus = response.data.status;
              this.paymentUrl = response.data.stripePayment?.url;
              this.regData = response.data.regData;
              this.payment = response.data.regData.paytype;
            });
          })
          .catch((err) => {
            this.error = "Failed to load race " + this.$route.params.raceid;
            console.error(err);
          });
      }
    },
  },
  computed: {
    sortedCats() {
      let cats = {};
      _.forEach(
        _.orderBy(this.raceData.regCategories, "disporder"),
        (element) => {
          cats[element.id] = element.catdispname;
        }
      );

      return cats;
    },
    loaded() {
      if (!this.raceData) {
        return false;
      }
      return true;
    },
    paymentOptions() {
      let options = {};
      _.forEach(this.raceData.paymentOptions, (element) => {
        options[element.type] = element.name;
      });
      return options;
    },
    pendingPayment() {
      if(this.regData.raceid != this.$route.params.raceid){
        return true;
      }
      if (this.payStatus && this.payStatus != "paid") {
        return true;
      }
      return false;
    },
    sponsoredCategorySelected() {
      if (this.selectedCategory?.sponsored) {
        return true;
      }
      return false;
    },
    selectedCategory() {
      return _.find(this.raceData.regCategories, { id: this.regData.category });
    },
  },
};
</script>

<template>
  <MainNav></MainNav>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="loaded">
      <EventDetailsComponent :details="raceData.eventDetails" :raceid="raceData.raceid"/>
      <FormKit
        type="form"
        id="race-registration"
        disabled
        :actions="false"
        v-model="regData"
      >
        <div class="row">
          <div class="col-md-6 order-md-1">
            <div v-if="!pendingPayment">
              <div
                class="d-flex justify-content-between align-items-center mb-3"
              >
                <h4>Your Registration is Confirmed</h4>
              </div>
            </div>

            <div v-if="pendingPayment" class="mb-5">
              <div
                class="d-flex justify-content-between align-items-center mb-3 text-danger"
              >
                <h4>Your Registration is Incomplete</h4>
              </div>
              <div v-if="payment === 'cash'" >
                <p class="text-danger h5">Please make your cash payment at the event to complete your registration.</p>
                <p>Your name will not show up on the "Who is signed up" list until payment is completed.</p>
              </div>
              <div v-else>
                <a :href="paymentUrl">Complete your payment</a>
              </div>
            </div>
            <div class="col">
              <div class="row">
                <FormKit type="text" name="first_name" label="First name" />
                <FormKit type="text" name="last_name" label="Last name" />
              </div>
            </div>
            <div class="form-group pt-3">
              <FormKit type="email" name="email" label="Email" />
            </div>

            <div class="form-group pt-3">
              <FormKit
                type="text"
                name="sponsor"
                label="Your Team or Sponsor"
              />
              <FormKit
                type="select"
                label="Race Category:"
                name="category"
                :options="sortedCats"
              />
            </div>
            <div v-if="sponsoredCategorySelected">
              <h5>
                Your {{ selectedCategory.catdispname }} race entry is sponsored
                by {{ selectedCategory.sponsorName }}
              </h5>
            </div>
          </div>
        </div>
      </FormKit>
      Please send any corrections or questions to
      <div v-if="raceData.contactEmail">
        <a :href="`mailto:${raceData.contactEmail}`">{{raceData.contactEmail}}</a>
      </div>
      <div v-else>
        <a href="mailto:support@signup.bike">support@signup.bike</a>
      </div>
    </div>
    <div v-else>
      <div class="text-center">
        <h2 class="mt-5">
          Unable to load requested information
          {{ $route.params.raceid }} payment: {{ $route.params.payment_id }}
        </h2>
      </div>
    </div>
  </div>
</template>

<style>
table.table {
  --bs-table-hover-bg: #76c8ff;
}
</style>
