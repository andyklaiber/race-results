<script>
import _ from "lodash";
import dropdown from "bootstrap/js/dist/dropdown";
import { RouterLink, RouterView } from "vue-router";
import request from "@/lib/ApiClient";

export default {
  emits: ['logout'],
  components: {
    RouterView
  },
  data() {
    return {
      count: 0,
      races: [],
    };
  },
  created() {
    this.$watch(
      () => this.$route.query,
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
      console.log('fetch plz')
      if (this.$route) {
       return request(`/api/races/`)
          .then((response) => {
            this.races = response.data;
            this.loading = false;
            console.log("fetched")
            console.log(this.races);
            
          })
          .catch((err) => {
            this.loading = false;
            this.error = err.toString();
            console.error(err);
          });
      }
    }
  },
  computed: {
    displayRaces(){
      let filtered = _.filter(this.races, (raceInfo)=>{
        if(!raceInfo.isTestData){
          return true;
        }
      })
      return filtered;
      // order by upcoming race date?
      //return _.sortBy(filtered, [function(o) { return o.displayName.toLowerCase(); }]);
    },
    loggedIn(){
      return false;
    }
  },
  
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
        <ul class="navbar-nav me-auto mb-2 mb-md-0">
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: $route.name == 'races' }" :to="{ name: 'races'}">
              Races
            </RouterLink>
            <RouterLink class="nav-link" :class="{ active: $route.name == 'races' }" :to="{ name: 'results'}">
              Results
            </RouterLink>
          </li>
          <li class="nav-item">
            <!-- <RouterLink class="nav-link" :class="{ active: $route.name == 'payments' }" :to="{ name: 'payments'}">
              Payments
            </RouterLink> -->
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
        <button v-if="loggedIn" type="button" class="btn btn-secondary" @click="$emit('logout')">Logout</button>
      </div>
    </div>
  </nav>
<body>
  <div class="container-fluid">
    <div v-for="(race, idx) in displayRaces" :key="idx">
      {{race.displayName}}
      <pre>{{Object.keys(race)}}</pre>
      <pre>{{Object.keys(race.eventDetails)}}</pre>

    </div>
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
  min-height: 75rem;
  padding-top: 4.5rem;
}
</style>