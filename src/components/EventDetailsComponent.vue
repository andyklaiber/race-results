<script>


export default {
  props: ["details"],
  data() {
    return {
    };
  },
  computed: {},
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
        <div v-if="details.homepageUrl" class="d-grid gap-2 d-md-flex justify-content-md-start mb-4 mb-lg-3">
          <a :href="details.homepageUrl" >Homepage</a>
        </div>
      </div>
      
    </div>
  </div>
  
</template>