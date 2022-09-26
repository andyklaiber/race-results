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

    
    submitForm(clickEvent) {
      clickEvent.preventDefault();
      this.$formkit.submit("race-registration");
    },
    async submit(data) {
      console.log(data);
      // await request
      //   .post(
      //     `/api/payments/start-registration?race=${this.raceData.raceid}`,
      //     data
      //   )
      //   .then((response) => {
      //     if (response.data) {
      //       this.submitted = true;
      //       console.log(response.data);
      //       return new Promise((resolve) =>
      //         setTimeout(() => {
      //           window.location.href = response.data;
      //           resolve();
      //         }, 2000)
      //       );
      //     }
      //   })
      //   .catch((error) => {
      //     this.formError = ["Error submitting request"];
      //     console.log(error);
      //   });
    },
  },
  computed: {
    sortedCats() {
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
  },
};
</script>

<template>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="loaded">
      Edit component!!!!
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
