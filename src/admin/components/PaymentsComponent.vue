<script>
import _ from "lodash";
import request from "@/lib/ApiClient";
import dayjs from 'dayjs/esm/index.js';

export default {
  components: {

  },
  data() {
    return {
      loading: false,
      error: null,
      filter:'all',
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
    dollas(amtPennies) {
      if(!_.isNumber(amtPennies)){
        return '';
      }
      let amtDollas = parseFloat(amtPennies/100)
      return amtDollas.toLocaleString("en-US", { style: "currency", currency: "USD" });
    },
    fetchData() {
      this.error = null;
      this.loading = true;
      if (this.$route) {
        request(`/api/payments/`)
          .then((response) => {
            this.payments = response.data;
            this.loading = false;
            
          })
          .catch((err) => {
            this.loading = false;
            this.error = err.toString();
            console.error(err);
          });
      }
    },
  },
  computed: {

    loaded() {
      if (!this.payments) {
        return false;
      }
      return true;
    },
    filterOptions(){
      return {
        "all":"All",
        "unpaid":"unpaid"
      }
    },
    filteredPayments(){
      if(this.payments && this.filter !== 'all'){
        return _.filter(this.payments, {status:'unpaid'});
      }
      return this.payments;
    }
  },
};
</script>

<template>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="loaded">
      <div
          class="
            d-flex
            justify-content-between
            flex-wrap flex-md-nowrap
            align-items-center
            pt-3
            pb-2
            mb-3
            border-bottom
          "
        >
          <div class="btn-toolbar mb-2 mb-md-0">
            <FormKit
                type="select"
                label="Filter by Status:"
                name="filter"
                v-model="filter"
                default="all"
                :options="filterOptions"
              />
          </div>
        </div>

        <h2>Payments</h2>
        <div class="table-responsive">
          <table class="table table-striped table-hover table-sm">
            <thead>
              <tr>
                <th scope="col">Status</th>
                <th scope="col">Reg Email</th>
                <th scope="col">Race</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(payment, idx) in filteredPayments" :key="idx">
                <td>{{payment.status}}</td>
                <td>{{payment.regData.email}}</td>
                <td>{{payment.regData.raceid}}</td>
                <td>{{dollas(payment.stripePayment?.amount_total)}}</td>
                <td>{{idx}}</td>
              </tr>

            </tbody>
          </table>
          <pre>
            {{payments[0]}}
          </pre>
        </div>
    </div>
    <div v-else>
      <div class="text-center">
        <h2 class="mt-5">Error loading payments...</h2>
      </div>
    </div>
  </div>
</template>

<style>
table.table {
  --bs-table-hover-bg: #76c8ff;
}
</style>
