<script>
import dropdown from 'bootstrap/js/dist/dropdown';
import { RouterLink } from 'vue-router';



export default {
  props: ["races"],
  data() {
    return {
      count: 0
    }
  },
  computed:{
  }
}
</script>

<template>
<nav class="navbar navbar-expand-sm navbar-light bg-light">
  <div class="container-fluid">
    <div class="navbar-brand" href="#">2022 PCRS</div>
    <div class="collapse navbar-collapse" id="navbarSupportedContent">
      <ul class="navbar-nav me-auto mb-2 mb-lg-0">
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            Race Results
          </a>
          <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
            <li v-for="race in races" :key="race.raceid" >
                <RouterLink v-if="race.active" class="dropdown-item" :class="{active:$route.params.raceid === race.raceid}" :to="`/race/${race.raceid}`">{{race.displayName + ` - ${race.formattedStartDate}`}}</RouterLink>
                <div v-else class="dropdown-item disabled">{{race.displayName + ` - ${race.formattedStartDate}`}}</div>
            </li>

          </ul>
        </li>
      </ul>
    </div>
    <div class="nav-item">
         <RouterLink  class="nav-link" :to="`/series/pcrs_2022`">Series Standings</RouterLink>
    </div>
     <div class="nav-item">
          <a class="nav-link active" aria-current="page" href="https://racemtb.com/">RaceMtb Home</a>
        </div>
  </div>
</nav>

</template>