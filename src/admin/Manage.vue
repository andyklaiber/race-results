<script>
import dropdown from "bootstrap/js/dist/dropdown";
import { RouterLink, RouterView } from "vue-router";

export default {
  emits: ['logout'],
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
  <nav class="navbar navbar-expand-md navbar-dark bg-dark fixed-top">
    <div class="container-fluid">
      <a class="navbar-brand" href="/">Signup.bike Admin</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarsExample04"
        aria-controls="navbarsExample04" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarsExample04">
        <ul class="navbar-nav me-auto mb-2 mb-md-0">
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: $route.name == 'races' }" :to="{ name: 'races'}">
              Races
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: $route.name == 'series' || $route.name == 'edit-series' }" :to="{ name: 'series'}">
              Series
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: $route.name == 'payments' }" :to="{ name: 'payments'}">
              Payments
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: $route.name == 'results' }" :to="{ name: 'results'}">
              Results
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: $route.name == 'series-results' }" :to="{ name: 'series-results'}">
              Series Points
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
        <button type="button" class="btn btn-secondary" @click="$emit('logout')">Logout</button>
      </div>
    </div>
  </nav>
<body>
  <div class="container-fluid">
    <RouterView/>
  </div>
</body>
</template>
<style scoped>
body {
  font-size: .875rem;
}

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

/*
 * Sidebar
 */

.sidebar {
  position: fixed;
  top: 0;
  /* rtl:raw:
  right: 0;
  */
  bottom: 0;
  /* rtl:remove */
  left: 0;
  z-index: 100;
  /* Behind the navbar */
  padding: 48px 0 0;
  /* Height of navbar */
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, .1);
}

@media (max-width: 767.98px) {
  .sidebar {
    top: 5rem;
  }
}

.sidebar-sticky {
  height: calc(100vh - 48px);
  overflow-x: hidden;
  overflow-y: auto;
  /* Scrollable contents if viewport is shorter than content. */
}

.sidebar .nav-link {
  font-weight: 500;
  color: #333;
}

.sidebar .nav-link .feather {
  margin-right: 4px;
  color: #727272;
}

.sidebar .nav-link.active {
  color: #2470dc;
}

.sidebar .nav-link:hover .feather,
.sidebar .nav-link.active .feather {
  color: inherit;
}

.sidebar-heading {
  font-size: .75rem;
}

/*
 * Navbar
 */

body {
  /* min-height: 75rem; */
  padding-top: 4.5rem;
}
</style>