<script>
import { RouterLink, RouterView } from "vue-router";

export default {
  components: {
    RouterView
  },
  data() {
    return {
      count: 0,
    };
  },
  computed: {},
};
</script>

<template>
  <nav class="navbar navbar-expand-sm">
    <div class="container-fluid">
        <ul class="navbar-nav me-auto mb-2 mb-md-0">
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: $route.name == 'edit-race' }" :to="{ name: 'edit-race'}">
              Event Settings
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: $route.name == 'edit-racers' }" :to="{ name: 'edit-racers'}">
              Event Racers
            </RouterLink>
          </li>
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
      </div>
  </nav>

  <div class="container-fluid">
    <RouterView />
  </div>

</template>
<style scoped>

</style>