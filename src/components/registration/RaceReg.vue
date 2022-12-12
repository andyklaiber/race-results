<script>
import _ from "lodash";
import request from "@/lib/ApiClient";
import EventDetailsComponent from "@/components/EventDetailsComponent.vue";
import EventCategoryScheduleComponent from "@/components/EventCategoryScheduleComponent.vue"
import dayjs from '@/lib/dayjs';
import MainNav from "@/components/MainNav.vue";

let saveForm =  _.debounce((data, raceid)=>{
  window.localStorage.setItem(`race-reg-form-data-${raceid}`, JSON.stringify(data))
}, 3500);
let getForm = (raceid)=>{
  let data = window.localStorage.getItem(`race-reg-form-data-${raceid}`);
  if(data){
    return JSON.parse(data);
  }
  return null;
}
let clearFormStorage = (raceid)=>{
  window.localStorage.removeItem(`race-reg-form-data-${raceid}`);
}

function getFees(priceInDollars){
    let cents = priceInDollars * 100;

    let onlineFee = cents * .04;
    if(onlineFee > 600){
        onlineFee = 600
    }

    let ccFee = Math.round((cents + onlineFee + 30)/( 1 - .029 ));

    return ccFee - cents;
    // return { stripeFee: ccFee - onlineFee - cents, regFee: onlineFee };
}

export default {
  components: {
    MainNav,
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
      raceData: {},
      payment: "",
      birthdate: "",//"1990-03-05",
      submitted: false,
      couponError: [],
      prevBibError: [],
      seriesRaces:{},
      seriesRaceIdx:0,
      previousReg: false,
      prevAge: null,
    };
  },
  created() {
    this.$watch(
      () => this.$route.params.raceid,
      () => {
        this.fetchData();
      },
      // fetch the data when the view is created and the data is
      // already being observed
      { immediate: true }
    );
  },
  watch: {
    formInputData: {
      handler(newValue, oldValue) {
        if(this.previousReg == false){
          saveForm(newValue, this.$route.params.raceid);
        }
        // Note: `newValue` will be equal to `oldValue` here
        // on nested mutations as long as the object itself
        // hasn't been replaced.
      },
      deep: true
    }
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
          .then(async (response) => {
            this.raceData = response.data;
            let prevFormData = getForm(this.$route.params.raceid);
            if(prevFormData){
              let category = _.find(this.raceData?.regCategories, { "id": prevFormData.category });
              if(!category){
                delete prevFormData.category;
              }
              this.formInputData = prevFormData;
            }
            if(this.raceData.series && this.raceData.toString().length > 1){
              await request(`/api/series/${this.raceData.series}/registration`)
                .then(({data})=>{
                  this.seriesRaces = data;
                  let today = dayjs();
                  this.seriesRaceIdx = 0;
                  _.some(data, ({eventDate,raceid}, idx)=>{
                    if(dayjs(eventDate).add(21,'hour').isBefore(today)){
                      console.log(dayjs(eventDate).add(21,'hour').format())
                      console.log(today.format());
                      return false;
                    }
                    else{
                      this.seriesRaceIdx = idx;
                      this.$router.push(`/register/${raceid}`)
                      return true;
                    }
                    })
                })
            }
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
    findPrevBib(bibNumber) {
      request.post(`/api/racers/bib`, {
        series: `${this.raceData.series}`,
        bibNumber
      })
        .then(({ data }) => {
          console.log('prevbib')
          console.log(data);
          if(data.paytype === 'season'){
            this.prevBibError = ['You are already registered for the whole season']
            return;
          }
          data.prevPaymentId = data.paymentId;
          delete data.paymentId;
          this.formInputData = data;
          this.prevAge = data.racerAge
        })
        .catch(({response})=>{
          console.dir(response)
          if(response.status== 404){
            this.prevBibError=[response.data.message]
          }
        })

    },
    onPrevBibChange(data){
      if (data) {
        this.findPrevBib(data);
      } else {
        this.prevBibError = [];
        this.prevAge = null;
      }
    },
    getCouponPricing(couponCode) {
      request.post(`/api/payments/pricing`, {
        raceid: `${this.$route.params.raceid}`,
        couponCode
      })
        .then(({ data }) => {
          this.raceData.paymentOptions = data.paymentOptions;

          if (!data.validCoupon) {
            this.couponError = ["Invalid Coupon Code"];
          } else {
            this.couponError = [];
          }
        })

    },
    onCouponChange(data) {
      if (data) {
        this.getCouponPricing(data);
      } else {
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
      data.timestamp = dayjs().format();
      await request
        .post(
          `/api/payments/start-registration?race=${this.raceData.raceid}`,
          data
        )
        .then((response) => {
          if (response.data) {
            this.submitted = true;
            clearFormStorage(this.$route.params.raceid);
            console.log("response data");
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
          if(error.response?.data?.message){
            return this.formError = [error.response.data.message];
          }
          this.formError = ["Error submitting request"];
        });
    },
    getEventTimeObj(startTime) {
      return dayjs(`${dayjs(this.raceData.eventDate).format("YYYY-MM-DD")} ${startTime}`)
    }
  },
  computed: {
    startTimes() {
      if (this.hasStartTimes) {
        return _.map(_.uniqBy(this.raceData.regCategories, 'startTime'), 'startTime');
      }
      return null;
    },
    hasStartTimes() {
      return !!_.some(this.raceData.regCategories, 'startTime')
    },
    currentTime() {
      return dayjs().local().format();
    },
    firstRaceTime() {
      if (this.hasStartTimes) {
        return dayjs.min(_.map(this.startTimes, (time) => dayjs(`${this.eventDateFormatted} ${time}`)));
      }
      return null;
    },
    lastRaceTime() {
      if (this.hasStartTimes) {
        return dayjs.max(_.map(this.startTimes, (time) => dayjs(`${this.eventDateFormatted} ${time}`)));
      }
      return null;
    },
    sortedCats() {
      const filtered = _.filter(this.raceData.regCategories, (cat) => {
        // if (cat.startTime && dayjs().isAfter(this.getEventTimeObj(cat.startTime).subtract(20, 'minute'))) {
        //   return false;
        // }

        // if (cat.minAge && this.racerAge < cat.minAge) {
        //   return false
        // }
        // if (cat.maxAge && this.racerAge > cat.maxAge) {
        //   return false
        // }
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
    submitLabel() {
      if (this.payment == 'cash') {
        return "Sign Up!"
      }
      return "Go to Payment"
    },
    cashEnabled() {
      if(!this.raceData.cashPaymentsEnabled || !this.lastRaceTime){
        return false;
      }
      return dayjs().isAfter(this.firstRaceTime.subtract(6, 'hour'));
    },
    eventDateFormatted() {
      return dayjs(this.raceData.eventDate).format('YYYY-MM-DD');
    },
    regDisabled() {
      if(!this.lastRaceTime){
        return false;
      }
      return dayjs().isAfter(this.lastRaceTime.subtract(5, 'minute'))
    },
    paymentOptions() {
      let options = {};
      _.forEach(this.raceData.paymentOptions, (element) => {
        options[element.type] = element.name;
      });
      if (this.cashEnabled) {
        options['cash'] = 'Cash Payment (Today\'s Race)';
      }
      return options;
    },
    paymentCostDets() {
      if (this.sponsoredCategorySelected) {
        this.payment = "season";
        return {
          cost: this.dollas(0),
          regFee: this.dollas(0),
          tot: this.dollas(0)
        }
      }
      let altPaytype;
      if (this.payment === 'cash') {
        altPaytype = 'single';
      } else {
        altPaytype = this.payment;
      }
      const payOpt = _.find(this.raceData?.paymentOptions,
        (el) => el.type === altPaytype
      );
      if (!payOpt) return null;
      const amt = parseFloat(payOpt.amount);
      let fees = 0;
      if (amt > 0 && this.payment !== 'cash') {
        fees = (payOpt.regFee + payOpt.stripeFee) / 100;
      }
      const dets = {}
      _.assign(dets, payOpt, {
        name: payOpt.name,
        cost: this.dollas(amt),
        regFee: this.dollas(fees),
        tot: this.dollas(
          parseFloat(payOpt.amount) + parseFloat(fees)
        ),

      });
      if (this.raceData?.optionalPurchases && this.formInputData.optionalPurchases) {
        let newTot = amt;
        this.raceData.optionalPurchases.forEach(({ id, label, description, amount }) => {
          if (this.formInputData.optionalPurchases[id]) {
            if (!dets.options) {
              dets.options = [];
            }
            dets.options.push({ description,label, id, amount:this.dollas(parseFloat(amount)) })
            newTot += parseFloat(amount);
          }
        })
        fees = getFees(newTot)/100
        dets.regFee = this.dollas(fees);
        dets.tot = this.dollas(newTot + fees)

      }
      return dets;
    },
    showPaymentOption() {
      if (this.sponsoredCategorySelected) {
        return false;
      }
      if(this.cashEnabled){
        return true;
      }
      if (this.raceData.paymentOptions && this.raceData.paymentOptions.length < 2) {
        return false;
      }
      return true;
    },
    sponsoredCategorySelected() {
      if (this.selectedCategory?.sponsored) {
        return true;
      }
      return false;
    },
    selectedCategory() {
      if (this.formInputData && this.formInputData.category) {
        return _.find(this.raceData?.regCategories, { "id": this.formInputData?.category });
      }
      return null;
    },
    racerAge() {
      if(this.prevAge){
        return this.prevAge;
      }
      if (this.birthdate) {
        //calculate racer age on dec 31
        const dec31 = dayjs();
        const bday = dayjs(this.birthdate);

        return dec31.year() - bday.year();

      }
    }
  },
};
</script>

<template>
   <MainNav></MainNav>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="loaded">
      <EventDetailsComponent :details="raceData.eventDetails" :raceid="raceData.raceid" />
      <div v-if="regDisabled">
        <h3>Registration is closed.</h3>
      </div>
      <div v-else class="mb-5">
        <div v-if="seriesRaceIdx > 0">
          
          <FormKit label-class="text-danger fw-bold fs-5" type="checkbox" name="prevBibLookup" label="I have a bib number!" help="Look up your information from a previous race" v-model="previousReg" />
          <FormKit v-if="previousReg" 
                  type="number" name="bibNumber" 
                  label="Bib Number:" 
                  help="Enter your Bib Number from your previous race to pre-fill your info" 
                  :delay="1500" 
                  @input="onPrevBibChange"
                  :errors="prevBibError"
                  validation="required" />  
        </div>
        <FormKit type="form" id="race-registration" v-model="formInputData" :form-class="submitted ? 'hide' : 'show'"
          :errors="formError" :actions="false" @submit="submit">
          <div class="row">
            <div class="col-md-6 order-md-1 mb-3">
              <h4 class="d-flex justify-content-between align-items-center mb-3">
                <h5>Registration Info</h5>
                <span class="badge badge-secondary badge-pill">3</span>
              </h4>
              
                <FormKit type="text" name="first_name" label="First name" help="What is your first name"
                  validation="required" />
                <FormKit type="text" name="last_name" label="Last name" help="What is your last name"
                  validation="required" />
              <div class="form-group pt-3">
                <FormKit v-if="!previousReg" type="email" name="email" label="Your email" help="Enter an email address"
                  validation="required|email" />
              </div>
              <FormKit type="text" name="sponsor" label="Your Team or Sponsor"
                help="Enter an optional Team or Sponsor name" />
              <FormKit v-if="!previousReg" type="date" value="2001-01-01" name="birthdate" label="Birthday" v-model="birthdate"
                help="Enter your birthdate" validation="required|before:2020-01-01"
                validation-visibility="live" />
              <div>Racer Age: {{racerAge}}</div>
              <div class="form-group pt-3">
                <FormKit type="select" id="category" label="Race Category:" placeholder="Select a category"
                  name="category" :options="sortedCats" validation="required" validation-visibility="dirty"
                  help="Select the Category you would like to race in"
                  :validation-messages="{
                    is: 'You must select a race category',
                  }" />
              </div>
            </div>
            <div class="col-md-5 order-md-2 mb-4" v-if="paymentCostDets">
              <h4 class="d-flex justify-content-between align-items-center mb-3">
                <h5>Payment Detail</h5>
              </h4>
              <fieldset class="list-group mb-3">
                <div>
                  <FormKit type="text" name="coupon" label="Coupon Code" help="" :delay="1000" @input="onCouponChange"
                    v-if="raceData.couponsEnabled" :errors="couponError" />
                </div>
              </fieldset>
              <fieldset class="list-group mb-3">
                <div>
                  <FormKit type="radio" name="paytype" label="Payment option" :options="paymentOptions"
                    validation="required" v-model="payment" v-if="showPaymentOption" />
                </div>
              </fieldset>
              <div v-if="raceData.optionalPurchases">
                <FormKit type="group" name="optionalPurchases">
                <div v-for="(item, idx) in raceData.optionalPurchases">
                  <h6>{{item.description}}</h6>
                  <FormKit type="checkbox" :label="`${item.label} - ${dollas(parseFloat(item.amount))}`" :name="item.id" />
                  <FormKit v-if="formInputData.optionalPurchases && formInputData.optionalPurchases[item.id]" type="select" :options="item.options" :label="item.optionsLabel" :name="`${item.id}-option`"></FormKit>
                </div>
                </FormKit>
              </div>
              <ul class="list-group mb-3 formkit-fieldset">
                <li class="
                  list-group-item
                  d-flex
                  justify-content-between
                  lh-condensed
                ">
                  <div>
                    <h6 class="my-0">Race Entry:</h6>
                    <small class="text-muted">{{ paymentCostDets.name }}</small>
                  </div>
                  <div>
                    <span v-if="paymentCostDets.discounted" class="mx-3 text-decoration-line-through text-danger">{{
                    dollas(paymentCostDets.orig) }}</span>
                    <span :class="{'text-success':paymentCostDets.discounted}">{{ paymentCostDets.cost }}</span>
                  </div>
                </li>
                <li  v-if="paymentCostDets.options" v-for="(item, id) in paymentCostDets.options" class="
                  list-group-item
                  d-flex
                  justify-content-between
                  lh-condensed
                ">
                  <div>
                    <h6 class="my-0">{{item.label}}</h6>
                    <small v-if="item.option" class="text-muted">{{ item.option }}</small>
                  </div>             
                  <div>
                    <span>{{ item.amount }}</span>      
                  </div>
                </li>
                <li class="
                  list-group-item
                  d-flex
                  justify-content-between
                  lh-condensed
                ">
                  <div>
                    <h6 class="my-0">Online Processing Fee:</h6>
                    <small class="text-muted">Credit Card Processing and Online Registration</small>
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
          <div v-if="payment ==='cash'">
            <h2 class="text-danger">Your registration will not be active until payment is received at the event</h2>
          </div>
          <div v-if="raceData.waiver">
            <h5>{{raceData.waiver.header}}</h5>
            <p>{{raceData.waiver.text}}</p>
          <FormKit  
          type="checkbox"
          label="I HAVE READ AND UNDERSTAND THIS WAIVER"
          help="I acknowledge that I have read, understand, and accepted the above release of liability."
          name="waiverAccepted" 
          validation="accepted"
          :validation-messages="{
            accepted: 'You must agree to the terms of the liability release above'
          }"
          validation-visibility="dirty"
          />
          </div>
          <div v-if="sponsoredCategorySelected">
            <h5>Your {{selectedCategory.catdispname}} race entry is sponsored by {{selectedCategory.sponsorName}}</h5>
            <FormKit type="submit" label="Sign Up!" @click="submitForm" />
          </div>
          <FormKit v-if="!sponsoredCategorySelected" type="submit" :label="submitLabel" @click="submitForm" />
        </FormKit>
        <div v-if="submitted">
          <h2>Submission successful, redirecting</h2>
        </div>
      </div>
      <EventCategoryScheduleComponent :categories="raceData.regCategories" :raceDate="raceData.eventDate" />
    </div>
    <div v-else>
      <div class="text-center">
        <h2 class="mt-5">Race not available for registration...</h2>
      </div>
    </div>
  </div>
</template>

<style>
.prev-lookup.formkit-label{
  color: #c10111
}
table.table {
  --bs-table-hover-bg: #76c8ff;
}
body {
  min-height: 75rem;
  padding-top: 4.5rem;
}
</style>