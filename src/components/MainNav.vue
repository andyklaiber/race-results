<script>
import dropdown from "bootstrap/js/dist/dropdown";
import { RouterLink } from "vue-router";

export default {
  props: ["races"],
  data() {
    return {
      count: 0,
      loggedIn:false,
    };
  },
  computed: {},
};
</script>

<template>
  <nav class="navbar navbar-expand-md navbar-dark bg-dark fixed-top">
    <div class="container-fluid">
      <a class="navbar-brand" href="/">Signup.bike</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarsExample04"
        aria-controls="navbarsExample04" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarsExample04">
        <ul class="navbar-nav me-auto mb-4 mb-md-0 px-5">
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: $route.name == 'home' }" :to="{ name: 'home'}">
              Upcoming Races
            </RouterLink>
          </li>
          <!-- <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: $route.name == 'races' }" :to="{ name: 'results'}">
              Results
            </RouterLink>
          </li> -->
          <!-- <li class="nav-item">
            <a class="nav-link disabled">Disabled</a>
          </li> -->
          <!-- <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown" aria-expanded="false">Dropdown</a>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#">Action</a></li>
              <li><a class="dropdown-item" href="#">Another action</a></li>
              <li><a class="dropdown-item" href="#">Something else here</a></li>
            </ul>
          </li> -->
        </ul>
        <button v-if="loggedIn" type="button" class="btn btn-secondary" @click="$emit('logout')">Logout</button>
      </div>
    </div>
  </nav>
</template>
<style scoped>
.nav-scroller {
  position: relative;
  z-index: 2;
  height: 2.75rem;
  overflow-y: hidden;
}

.nav-scroller .nav {
  display: flex;
  flex-wrap: nowrap;
  padding-bottom: 1rem;
  margin-top: -1px;
  overflow-x: auto;
  text-align: center;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
}
</style>