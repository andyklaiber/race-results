<script>
import dropdown from "bootstrap/js/dist/dropdown";
import { RouterLink } from "vue-router";

export default {
  props: ["races"],
  data() {
    return {
      count: 0,
    };
  },
  computed: {},
};
</script>

<template>
  <nav id="top" class="navbar navbar-light bg-light">
    <div class="container-fluid">
      <div class="navbar-brand" href="#">2022 Prairie City Race Series</div>

      <div class="nav-item">
        <a
          class="nav-link active"
          aria-current="page"
          href="https://racemtb.com/"
          >RaceMtb Home</a
        >
      </div>
    </div>
  </nav>
  <p class="mt-3">View Weekly lap times:</p>
  <ul class="nav nav-tabs mt-1 justify-content-center">
    <li v-for="race in races" :key="race.raceid" class="nav-item">
      <RouterLink
        class="nav-link"
        :class="{ active: $route.params.raceid === race.raceid }"
        :to="`/race/${race.raceid}`"
        >{{ race.displayName + ` - ${race.formattedStartDate}` }}</RouterLink
      >
    </li>
    <li class="nav-item">
      <RouterLink
        class="nav-link"
        :class="{ active: $route.path == '/series/pcrs_2022' }"
        :to="`/series/pcrs_2022`"
        >Series Standings</RouterLink
      >
    </li>
    <li class="nav-item">
      <RouterLink
        class="nav-link"
        :class="{ active: $route.path == '/series/grom/pcrs_2022' }"
        :to="`/series/grom/pcrs_2022`"
        >Grom Series Standings</RouterLink
      >
    </li>
  </ul>
</template>