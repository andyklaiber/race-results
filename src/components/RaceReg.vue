<script>
import _ from "lodash";
import axios from "axios";
import EventDetailsComponent from './EventDetailsComponent.vue';

let request;
if (import.meta.env.DEV) {
  request = axios.create({ baseURL: "http://localhost:3000" });
} else {
  request = axios;
}

const getRegFee = (amt) => 100; //+ amt * 100 * 0.04;
const dollas = (amt) =>
  amt.toLocaleString("en-US", { style: "currency", currency: "USD" });
const formatCents = (cents) => {
  return dollas(cents / 100);
};
export default {
  components: {
    EventDetailsComponent
  },
  data() {
    return {
      categories: {},
      loading: false,
      error: null,
      formError: [],
      inputData: {},
      payment: "",
      submitted: false,
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
      if (this.$route.params.seriesid) {
        let dataUrl = `/api/series/${this.$route.params.seriesid}`;
        request(dataUrl)
          .then((response) => {
            this.seriesData = response.data;
            this.loading = false;
            this.payment = this.seriesData.paymentOptions[0].type;
          })
          .catch((err) => {
            this.loading = false;
            this.error = err.toString();
            console.error(err);

          });
      }
    },
    submitForm(clickEvent){
      clickEvent.preventDefault();
      this.$formkit.submit('race-registration');
    },
    async submit(data) {
      console.log(data);
      await request
        .post(
          `/api/payments/create-checkout-session?series=${this.seriesData.series}`,
          data
        )
        .then((response) => {
          if (response.data) {
            this.submitted = true;
            console.log(response.data);
            return new Promise((resolve) =>
              setTimeout(() => {
                window.location.href = response.data;
                resolve();
              }, 2500)
            );
          }
        })
        .catch((error) => {
          this.formError = ["Error submitting request"];
          console.log(error);
        });
    },
  },
  computed: {
    sortedCats() {
      let cats = {};
      _.forEach(
        _.orderBy(this.seriesData.regCategories, "disporder"),
        (element) => {
          cats[element.id] = element.catdispname;
        }
      );

      return cats;
    },
    loaded() {
      if (!this.seriesData) {
        return false;
      }
      return true;
    },
    paymentOptions() {
      let options = {};
      _.forEach(this.seriesData.paymentOptions, (element) => {
        options[element.type] = element.name;
      });
      return options;
    },
    paymentCostDets() {
      const payOpt = _.find(
        this.seriesData?.paymentOptions,
        (el) => el.type === this.payment
      );
      if (!payOpt) return null;
      const amt = parseFloat(payOpt.amount);
      let dets = {
        name: payOpt.name,
        cost: dollas(amt),
        regFee: formatCents(getRegFee(payOpt.amount)),
        tot: dollas(
          parseFloat(payOpt.amount) + parseFloat(getRegFee(payOpt.amount) / 100)
        ),
      };
      return dets;
    },
    
  },
};
</script>

<template>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="loaded">
      <EventDetailsComponent :details="seriesData.eventDetails" />
        <FormKit
            type="form"
            id="race-registration"
            :form-class="submitted ? 'hide' : 'show'"
            :errors="formError"
            :actions="false"
           @submit="submit"
          >
      <div class="row">
        <div class="col-md-6 order-md-1">
          <h4 class="d-flex justify-content-between align-items-center mb-3">
            <span class="text-muted">Registration Info</span>
            <span class="badge badge-secondary badge-pill">3</span>
          </h4>
          
            <div class="col">
              <div class="row">
                <FormKit
                  type="text"
                  name="first_name"
                  label="First name"
                  help="What is your first name"
                  validation="required"
                />
                <FormKit
                  type="text"
                  name="last_name"
                  label="Last name"
                  help="What is your last name"
                  validation="required"
                />
              </div>
            </div>
            <div class="form-group pt-3">
              <FormKit
                type="email"
                name="email"
                label="Your email"
                help="Enter an email address"
                validation="required|email"
              />
            </div>

            <div class="form-group pt-3">
              <FormKit
                type="select"
                label="Select your Race Category:"
                placeholder="Select a category"
                name="category"
                :options="sortedCats"
                validation="required"
                validation-visibility="dirty"
                :validation-messages="{
                  is: 'You must select a race category',
                }"
              />
            </div>
          
        </div>
        <div class="col-md-5 order-md-2 mb-4" v-if="paymentCostDets">
          <h4 class="d-flex justify-content-between align-items-center mb-3">
            <span class="text-muted">Payment Detail</span>
            <span class="badge badge-secondary badge-pill">3</span>
          </h4>
          <fieldset class="list-group mb-3">
          
            <div>
              <FormKit
                type="radio"
                name="paytype"
                label="Payment option"
                help="How many races would you like to pay for"
                :options="paymentOptions"
                validation="required"
                v-model="payment"
              />
            
          </div>
        </fieldset>
          <ul class="list-group mb-3 formkit-fieldset">
            <li class="list-group-item d-flex justify-content-between lh-condensed">
              <div>
                <h6 class="my-0">Race Entry:</h6>
                <small class="text-muted">{{ paymentCostDets.name }}</small>
              </div>
              <span class="text-muted">{{ paymentCostDets.cost }}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between lh-condensed">
              <div>
                <h6 class="my-0">Online Registration Fee:</h6>
                <small class="text-muted">Online Registration and Live results</small>
              </div>
              <span class="text-muted">{{ paymentCostDets.regFee }}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between">
              <span>Total (USD)</span>
              <strong>{{ paymentCostDets.tot }}</strong>
            </li>
          </ul>
          <FormKit
      type="submit"
      label="Go To Payment"
        @click="submitForm"
    />
        </div>
      </div>
        </FormKit>
      <div v-if="submitted">
        <h2>Submission successful, redirecting to payment</h2>
      </div>
    </div>
    <div v-else>
      <div class="text-center">
        <h2 class="mt-5">Series not available for registration...</h2>
      </div>
    </div>
  </div>
</template>

<style>
table.table {
  --bs-table-hover-bg: #76c8ff;
}
</style>
