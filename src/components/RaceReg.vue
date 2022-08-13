<script>
import _ from "lodash";

export default {
  components: {},
  data() {
    return {
      categories: {},
      loading: false,
      error: null,
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
        if (import.meta.env.DEV) {
          dataUrl = "http://localhost:3000" + dataUrl;
        }
        fetch(dataUrl)
          .then((response) => response.json())
          .then((data) => {
            this.seriesData = data;
            this.loading = false;
          })
          .catch((err) => {
            console.error(err);

            this.error = err.toString();
          });
      }
    },
  },
  computed: {
    sortedCats() {
      return _.orderBy(this.seriesData.regCategories, "disporder");
    },
    loaded() {
      if (!this.seriesData) {
        return false;
      }
      return true;
    },
  },
};
</script>

<template>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="loaded">
        <div class="row">
          <div class="col">
            <label for="firstName">First Name</label>
            <input
              type="text"
              class="form-control"
              id="firstName"
              placeholder="First name"
            />
          </div>
          <div class="col">
            <label for="lastName">Last Name</label>
            <input
              type="text"
              class="form-control"
              id="lastName"
              placeholder="Last name"
            />
          </div>
        </div>
        <div class="form-group pt-3">
          <label for="inputEmail">Email</label>
          <div>
            <input
              type="email"
              class="form-control"
              id="inputEmail"
              placeholder="Email"
            />
          </div>
        </div>
        <fieldset class="form-group pt-3">
          <div class="row">
            <legend>What would you like to purchase?</legend>
            <div>
              <template
                v-for="(paymentOpt, key) in seriesData.paymentOptions"
                :key="key"
              >
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="radio"
                    name="payment"
                    id="payment"
                    :value="paymentOpt.type"
                  />
                  <label class="form-check-label" for="gridRadios1">
                    {{ paymentOpt.name }}
                  </label>
                </div>
              </template>
            </div>
          </div>
        </fieldset>
        <div class="form-group  pt-3">
          <label for="select">Select your Race Category:</label>
          <div>
            <select id="category" name="select" class="form-control">
                <option v-for="(cat, key) in sortedCats" :value="cat.id" :key='key'>{{ cat.catdispname }}</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <div class="col-sm-10  pt-3">
            <button name="submit" type="submit" class="btn btn-primary" @click='checkout()'>
              Submit
            </button>
          </div>
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
