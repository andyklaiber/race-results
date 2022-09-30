<script>
import { RouterLink } from "vue-router";
import FbShareComponent from './FbShareComponent.vue';

export default {
  components: { FbShareComponent },
  props: ["details"],
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
    }
  },
};
</script>

<template>
  <div class="container mb-4">
    <div class="row p-4 pb-0 pe-lg-0 pt-lg-3 align-items-center rounded-3 border shadow">
      <div class="col-lg-3 offset-lg-1 p-0">
        <img class="pb-3" :src="details.logoUrl" alt="" width="200">
      </div>
      <div class="col-lg-7 p-3 p-lg-3 pt-lg-3">
        <h3 class="display-5 fw-bold lh-3">{{details.name}}</h3>
        <p class="lead">{{details.tagline}}</p>
        <div v-if="details.homepageUrl" class="d-grid gap-2 d-md-flex justify-content-md-between mb-4 mb-lg-3">
          <div>
            <a :href="details.homepageUrl">Event Homepage</a>
          </div>
          <div v-if="details.facebookShare">
            <FbShareComponent :url="details.homepageUrl" />
          </div>

        </div>
        <div class="row">
          <div class="col">
          <RouterLink v-if="!isRosterPage" :to="`/roster/${$route.params.raceid}`">See who is signed up</RouterLink>
        </div>
        <div class="col">
          <RouterLink v-if="!isRegPage" :to="{name:'register',params:$route.params.raceid}">Register</RouterLink>
        </div>
      </div>
      </div>
    </div>
  </div>

</template>