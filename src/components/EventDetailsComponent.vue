<script>
import { RouterLink } from "vue-router";
import FbShareComponent from './FbShareComponent.vue';
import dayjs from '@/lib/dayjs';

export default {
  components: { FbShareComponent },
  props: ["details", "raceid"],
  data() {
    return {
    };
  },
  computed: {
    isRosterPage() {
      return this.$route.path.includes('/roster/')
    },
    isRegPage() {
      return this.$route.name === 'register'
    },
    regDisabled() {
      return dayjs().isBefore(this.details.regOpenDate)
    },
    regTimeToOpen() {
      return dayjs().to(this.details.regOpenDate)
    },
  },
};
</script>

<template>
  <div class="container mb-4">
    <div class="row p-1 pb-0 pe-lg-0 pt-lg-3 align-items-center rounded-3 border shadow">
      <div class="col-sm-3 offset-sm-1 p-0">
        <a :href="details.homepageUrl">
        <img class="pb-3" :src="details.logoUrl" alt="" width="250">
      </a>
      </div>
      <div class="col-lg-7 p-3 p-lg-3 pt-lg-3">
        <div class="row">
          <div class="col col-md-auto">
            <h3 class="display-5 fw-bold lh-3">{{ details.name }}</h3>
          </div>
        </div>
        <p class="lead fw-bold">{{details.formattedDates}}</p>
        <div v-if="details.homepageUrl" class="d-grid gap-2 d-md-flex justify-content-md mb-4 mb-lg-3">
          <div class="col-md-auto">
            <a class="btn btn-sm btn-success" :href="details.homepageUrl">Event Homepage</a>
          </div>
          <div class="col col-lg-2">
            <div v-if="details.facebookShare">
              <FbShareComponent :url="details.homepageUrl" />
            </div>
          </div>
        </div>
        <p class="lead">{{ details.tagline }}</p>
        <div v-if="regDisabled" class="fw-bold">
          Registration will open {{regTimeToOpen}}
        </div>
        <div v-else class="row">
          <div class="col col-md-auto" v-if="!isRegPage">
            <RouterLink class="btn btn-success" :to="{ name: 'register', params: { raceid } }">Register</RouterLink>
          </div>
          <div class="col" v-if="!isRosterPage">
            <RouterLink class="btn btn-secondary" :to="{ name: 'roster', params: { raceid } }">See who is signed up</RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>