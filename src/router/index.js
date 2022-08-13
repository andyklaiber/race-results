import { createRouter, createWebHashHistory } from 'vue-router';
import RaceResult from '../components/RaceResult.vue';
import RaceReg from '../components/RaceReg.vue';
import SeriesRaceResult from '../components/SeriesResult.vue';
import TeamComp from '../components/TeamComp.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { 
        path: '/race/:raceid', 
        component: RaceResult
    },
    { 
      path: '/racereg/:seriesid', 
      component: RaceReg
    },
    { 
        path: '/series/:seriesid', 
        component: SeriesRaceResult
    },
    { 
        path: '/series/grom/:seriesid', 
        component: SeriesRaceResult
    },
    { 
        path: '/teamcomp/:seriesid', 
        component: TeamComp
    },
  ]
})

export default router
