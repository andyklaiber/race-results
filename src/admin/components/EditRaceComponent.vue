<script>
import _ from "lodash";
import request from "@/lib/ApiClient";
import dayjs from '@/lib/dayjs';
import ModalComponent from './ModalComponent.vue';
import EditRaceCategoriesComponent from './EditRaceCategoriesComponent.vue';
import EditRaceCouponsComponent from './EditRaceCouponsComponent.vue';

export default {
  components: {
    ModalComponent,
    EditRaceCategoriesComponent,
    EditRaceCouponsComponent
  },
  data() {
    return {
      categories: {},
      loading: false,
      error: null,
      formError: [],
      formInputData: {},
      editedCategories: [],
      editedCoupons: {},
      editedPaymentOptions: [],
      raceData: {},
      showModal: false,
      modalMode: null,
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
      if (typeof amt === 'string') {
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
    editProperty(mode, raceProp, data) {
      this.showModal = true;
      this.modalMode = mode
      this[raceProp] = data;
    },
    editOptionalPurchases() {
      this.showModal = true;
      this.modalMode = 'optionalpurchases'
    },
    closeModal() {
      this.showModal = false;
    },
    async saveProperty(formData) {
      console.log("Saved property data")
      this.showModal = false;
      this.modalMode = null;
      console.log(formData);
      return this.fetchData()
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
    regOpenDate() {
      return dayjs(this.raceData.regOpenDate).format('YYYY-MM-DDTHH:mm');
    },
    timeToOpen() {
      return dayjs().to(this.raceData.eventDetails?.regOpenDate)
    },
    timeToClose() {
      return dayjs().to(this.raceData.eventDetails?.regCloseDate)
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
        <div class="d-flex flex-row">
          <div class="my-3 mx-5">
            <a :href="`/#/register/${raceData.raceid}`">View Reg Form</a>
          </div>
          <div class="my-3">
            <a :href="`/#/roster/${raceData.raceid}`">View Roster</a>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6">
            <FormKit type="form" :errors="formError" id="race-settings" @submit="saveRaceData" submit-label="Save"
              v-model="formInputData">
              <FormKit :value="raceData?.displayName" type="text" name="displayName" label="Event Name" />
              <FormKit :value="raceData?.contactEmail" type="text" name="contactEmail" label="Contact Email" />
              <FormKit :value="eventDate" type="datetime-local" name="eventDate" label="Date" />
              <FormKit :value="raceData?.series" type="text" name="series" label="Event Series Name" />
              <FormKit :value="raceData?.seriesRaceNumber" type="number" name="seriesRaceNumber"
                label="Series Race Number" />
              <FormKit type="group" name="eventDetails">
                <FormKit :value="raceData?.eventDetails?.name" type="text" name="name" label="Header Event Name" />
                <FormKit :value="raceData?.eventDetails?.formattedDates" type="text" name="formattedDates"
                  label="Header Formatted dates" />
                <FormKit :value="raceData?.eventDetails?.tagline" type="text" name="tagline"
                  label="Header tagline text" />
                <FormKit :value="raceData?.eventDetails?.regOpenDate" type="datetime-local" name="regOpenDate"
                  label="Registration Open Date" />
                <p>Registration Opens {{ timeToOpen }}</p>
                <FormKit :value="raceData?.eventDetails?.regCloseDate" type="datetime-local" name="regCloseDate"
                  label="Registration Close Date" />
                <p>Registration Closes {{ timeToClose }}</p>
                <FormKit :value="raceData?.eventDetails?.logoUrl" type="text" name="logoUrl" label="Logo URL" />
                <FormKit :value="raceData?.eventDetails?.headerPhoto" type="text" name="headerPhoto"
                  label="Header Photo URL" />
                <FormKit :value="raceData?.eventDetails?.homepageUrl" type="text" name="homepageUrl"
                  label="Home Page URL" />
                <FormKit type="group" name="facebookShare">
                  <FormKit :value="raceData?.eventDetails?.facebookShare?.url" type="text" name="url"
                    label="FB Share URL" />
                </FormKit>
              </FormKit>
              <FormKit type="textarea" :value="raceData?.headerContent" :v-model="raceData?.headerContent"
                label="Extra content below header" name="headerContent"></FormKit>
              <FormKit :value="raceData?.entryCountMax" type="number" label="Maximum Number of registrations"
                name="entryCountMax" />
              <p>
              <h6>Current Reg Count: {{ raceData.entryCount }}</h6>
              </p>
              <FormKit :value="raceData?.showPaytypeOnRoster" type="checkbox"
                label="Show Payment Type as stages on roster" name="showPaytypeOnRoster" />
              <FormKit :value="raceData.isTestData" type="checkbox" label="Use Test payment integrations"
                name="isTestData" />
              <FormKit :value="raceData.couponsEnabled" type="checkbox" label="Enable Coupons" name="couponsEnabled" />
              <FormKit :value="raceData?.cashPaymentsEnabled" type="checkbox" label="Enable Cash payments on race day"
                name="cashPaymentsEnabled" />
              <FormKit type="group" name="stripeMeta">
                <FormKit :value="raceData?.stripeMeta?.accountId" type="text" name="accountId"
                  label="Stripe Integration Account ID" />
              </FormKit>
              <FormKit :value="raceData.archived" type="checkbox"
                label="Archive Race (will not be visible in admin race list)" name="archived" />
            </FormKit>
          </div>
          <div class="col-md-6">
            <div class="accordion">
              <div class="accordion-item">
                <div class="accordion-header">
                  <button class="accordion-button" type="button" data-bs-toggle="collapse"
                    data-bs-target="#collapseCategories" aria-expanded="true" aria-controls="collapseCategories">
                    <h5>Categories</h5>
                  </button>

                </div>

                <div class="accordian-collapse collapse" id="collapseCategories">
                  <div class="accordion-body">
                    <div class='btn btn-sm btn-primary'
                      @click="editProperty('categories', 'editedCategories', [...sortedCats])">
                      Edit Categories
                    </div>
                    <div v-for="cat in sortedCats" class="mt-1">
                      {{ cat.catdispname }} <strong v-if="cat.sponsored">Sponsored</strong>
                    </div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <div class="accordion-header">
                  <button class="accordion-button" type="button" data-bs-toggle="collapse"
                    data-bs-target="#collapsePaytypes" aria-expanded="true" aria-controls="collapsePaytypes">

                    <h5>Race Payment</h5>
                  </button>

                </div>

                <div class="accordian-collapse collapse" id="collapsePaytypes">
                  <div class="accordion-body">
                    <!-- <div class='btn btn-sm btn-primary'
                      @click="editProperty('paymentOptions', 'editedPaymentOptions', [...raceData.paymentOptions])">
                      Edit Payments
                    </div> -->
                    <table class="table">
                      <thead>
                        <tr>
                          <th scope="col">Option</th>
                          <th scope="col">Price</th>

                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="payOpt in raceData.paymentOptions">
                          <th scope="row"> {{ payOpt.name }}</th>

                          <td>{{ `${dollas(payOpt.amount)}` }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <div class="accordion-header">
                  <button class="accordion-button" type="button" data-bs-toggle="collapse"
                    data-bs-target="#collapseCoupons" aria-expanded="true" aria-controls="collapseCoupons">
                    <h5>Coupons</h5>
                  </button>
                </div>



                <div class="accordian-collapse collapse" id="collapseCoupons">
                  <div class="accordion-body">
                    <div class='btn btn-sm btn-primary'
                      @click="editProperty('coupons', 'editedCoupons', { ...raceData.couponCodes })">
                      Edit Coupons
                    </div>
                    <div v-for="(couponData, couponCode) of raceData.couponCodes"
                      class="d-flex flex-row justify-content-between my-1">

                      <div>
                        {{ couponCode }}
                      </div>
                      <div>
                        {{ !couponData.singleUse }}
                      </div>
                      <div>{{ couponData.fractionDiscount / 1 * 100 }}%</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <div class="accordion-header">
                  <button class="accordion-button" type="button" data-bs-toggle="collapse"
                    data-bs-target="#collapsePurchaseOpts" aria-expanded="true" aria-controls="collapsePurchaseOpts">
                    <h5>Optional Purchases</h5>
                  </button>
                </div>



                <div class="accordian-collapse collapse" id="collapsePurchaseOpts">
                  <div class="accordion-body">
                    <!-- <div class='btn btn-sm btn-primary' @click="editOptionalPurchases">
                      Edit Optional Purchases
                    </div> -->
                    <div v-for="(optionData, idx) in raceData.optionalPurchases"
                      class="d-flex flex-row justify-content-between my-1">

                      <div>
                        {{ optionData.label }}
                      </div>
                      <div v-if="optionData.optionsLabel">
                        {{ optionData.optionsLabel }}
                      </div>
                      <div>{{ dollas(parseFloat(optionData.amount)) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
        <!-- <pre>{{raceData}}
      </pre> -->
        <Teleport to="body">
          <EditRaceCategoriesComponent v-if="modalMode == 'categories'" :show="showModal" :categories="editedCategories"
            :payTypes="paymentOptions" @close="closeModal" @save="saveProperty">
          </EditRaceCategoriesComponent>


          <EditRaceCouponsComponent :coupons="editedCoupons" v-if="modalMode == 'coupons'" :show="showModal"
            @close="closeModal" @save="saveProperty">
          </EditRaceCouponsComponent>

        </Teleport>
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

.modal-body {
  overflow: visible;
}
</style>
