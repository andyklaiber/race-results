<script>
import _ from "lodash";
import request from "../lib/ApiClient";
import EventDetailsComponent from "./EventDetailsComponent.vue";
import EventCategoryScheduleComponent from "./EventCategoryScheduleComponent.vue"
import dayjs from 'dayjs/esm/index.js';

export default {
  components: {
    EventDetailsComponent,
    EventCategoryScheduleComponent,
  },
  data() {
    return {
      categories: {},
      loading: false,
      error: null,
      formError: [],
      formInputData: {},
      raceData:{},
      payment: "",
      birthdate: "",
      submitted: false,
      couponError: [],
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
      return amt.toLocaleString("en-US", { style: "currency", currency: "USD" });
    },
    fetchData() {
      this.error = null;
      this.loading = true;
      if (this.$route.params.raceid) {
        request(`/api/races/${this.$route.params.raceid}`)
          .then((response) => {
            this.raceData = response.data;
            this.loading = false;
            this.payment = this.raceData.paymentOptions[0].type;
          })
          .catch((err) => {
            this.loading = false;
            this.error = err.toString();
            console.error(err);
          });
      }
    },
    getCouponPricing(couponCode){
        request.post(`/api/payments/pricing`,{
          raceid: `${this.$route.params.raceid}`,
          couponCode
        })
          .then(({data}) => {
            this.raceData.paymentOptions = data.paymentOptions;
            
            if(!data.validCoupon){
                this.couponError = ["Invalid Coupon Code"];
              }else{
                this.couponError = [];
              }
            })
        
    },
    onCouponChange(data){
      if(data){
        this.getCouponPricing(data);
      }else{
        this.couponError = [];
      }
    },
    submitForm(clickEvent) {
      clickEvent.preventDefault();
      this.$formkit.submit("race-registration");
    },
    async submit(data) {
      console.log(data);
      data.birthdate = undefined;
      data.racerAge = this.racerAge;
      data.paytype = this.payment;
      await request
        .post(
          `/api/payments/start-registration?race=${this.raceData.raceid}`,
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
              }, 2000)
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
      if(!this.racerAge && this.formInputData.category == undefined){
        return [];
      }
      const filtered = _.filter(this.raceData.regCategories,(cat)=>{
        if(cat.minAge && this.racerAge < cat.minAge){
          return false
        }
        if(cat.maxAge && this.racerAge > cat.maxAge){
          return false
        }
        return true;
      })
      let cats = {};
      _.forEach(
        _.orderBy(filtered, "disporder"),
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
    paymentCostDets() {
      if(this.sponsoredCategorySelected){
        this.payment = "season";
        return {
          cost:this.dollas(0),
          regFee:this.dollas(0),
          tot: this.dollas(0)
          }
      }
      const payOpt = _.find(
        this.raceData?.paymentOptions,
        (el) => el.type === this.payment
      );
      if (!payOpt) return null;
      const amt = parseFloat(payOpt.amount);
      let fees = 0;
      if(amt > 0){
        fees = (payOpt.regFee + payOpt.stripeFee)/ 100;
      }
      const dets = {}
      _.assign(dets, payOpt,{
        name: payOpt.name,
        cost: this.dollas(amt),
        regFee: this.dollas(fees),
        tot: this.dollas(
          parseFloat(payOpt.amount) + parseFloat(fees)
        ),

      });
      return dets;
    },
    showPaymentOption(){
      if(this.sponsoredCategorySelected){
        return false;
      }
      if(this.raceData.paymentOptions && this.raceData.paymentOptions.length<2){
        return false;
      }
      return true;      
    },
    sponsoredCategorySelected(){
      if(this.selectedCategory?.sponsored){
        return true;
      }
      return false;
    },
    selectedCategory(){
      if(this.formInputData && this.formInputData.category){
        return _.find(this.raceData?.regCategories, {"id": this.formInputData?.category});
      }
      return null;
    },
    racerAge(){
      if(this.birthdate){
        //calculate racer age on dec 31
        const dec31 = dayjs();
        const bday = dayjs(this. birthdate);

        return dec31.year()-bday.year();
        
      }
    }
  },
};
</script>

<template>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="loaded">
      <EventDetailsComponent :details="raceData.eventDetails" />
      
      <FormKit
        type="form"
        id="race-registration"
        v-model="formInputData"
        :form-class="submitted ? 'hide' : 'show'"
        :errors="formError"
        :actions="false"
        @submit="submit"
      >
        <div class="row">
          <div class="col-md-6 order-md-1 mb-3">
            <h4 class="d-flex justify-content-between align-items-center mb-3">
              <h5>Registration Info</h5>
              <span class="badge badge-secondary badge-pill">3</span>
            </h4>

            <div class="col">
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

            <div class="form-group pt-3">
              <FormKit
                type="email"
                name="email"
                label="Your email"
                help="Enter an email address"
                validation="required|email"
              />
            </div>
            <FormKit
              type="text"
              name="sponsor"
              label="Your Team or Sponsor"
              help="Enter an optional Team or Sponsor name"
            />
            <FormKit
              type="date"
              value="2001-01-01"
              name="birthdate"
              label="Birthday"
              v-model="birthdate"
              help="Enter your birthday to see Race Categories"
              validation="required|before:2020-01-01"
              validation-visibility="live"
            />
            <!-- <div>Racer Age: {{racerAge}}</div> -->
            <div class="form-group pt-3">
              <FormKit
                type="select"
                id="category"
                label="Race Category:"
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
              <h5>Payment Detail</h5>
              <span class="badge badge-secondary badge-pill">3</span>
            </h4>
            <fieldset class="list-group mb-3">
              <div>
                <FormKit
                  type="text"
                  name="coupon"
                  label="Coupon Code"
                  help=""
                  :delay="1500"
                  @input="onCouponChange"
                  v-if="raceData.couponsEnabled"
                  :errors="couponError"
                />
              </div>
            </fieldset>
            <fieldset class="list-group mb-3">
              <div>
                <FormKit
                  type="radio"
                  name="paytype"
                  label="Payment option"
                  :options="paymentOptions"
                  validation="required"
                  v-model="payment"
                  v-if="showPaymentOption"
                />
              </div>
            </fieldset>
            <ul class="list-group mb-3 formkit-fieldset">
              <li
                class="
                  list-group-item
                  d-flex
                  justify-content-between
                  lh-condensed
                "
              >
                <div>
                  <h6 class="my-0">Race Entry:</h6>
                  <small class="text-muted">{{ paymentCostDets.name }}</small>
                </div>
                <div>
                <span v-if="paymentCostDets.discounted" class="mx-3 text-decoration-line-through text-danger">{{ dollas(paymentCostDets.orig) }}</span>
                <span :class="{'text-success':paymentCostDets.discounted}">{{ paymentCostDets.cost }}</span>
                </div>
              </li>
              <li
                class="
                  list-group-item
                  d-flex
                  justify-content-between
                  lh-condensed
                "
              >
                <div>
                  <h6 class="my-0">Online Processing Fee:</h6>
                  <small class="text-muted"
                    >Credit Card and Online Registration</small
                  >
                </div>
                <span class="text-muted">{{ paymentCostDets.regFee }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <span>Total (USD)</span>
                <strong>{{ paymentCostDets.tot }}</strong>
              </li>
            </ul>
          </div>
        </div>
            <div v-if="sponsoredCategorySelected">
              <h5>Your {{selectedCategory.catdispname}} race entry is sponsored by {{selectedCategory.sponsorName}}</h5>
            <FormKit type="submit" label="Sign Up!" @click="submitForm" />
            </div>
            <FormKit v-if="!sponsoredCategorySelected" type="submit" label="Go To Payment" @click="submitForm" />
      </FormKit>
      <div v-if="submitted">
        <h2>Submission successful, redirecting to payment</h2>
      </div>
      <EventCategoryScheduleComponent :categories="raceData.regCategories" :raceDate="raceData.eventDate"/>
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
