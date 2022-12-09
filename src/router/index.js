import { createRouter, createWebHashHistory } from 'vue-router';
import Landing from '../components/LandingComponent.vue'
import RaceResult from '../components/RaceResult.vue';
import RaceReg from '../components/RaceReg.vue';
import RaceRegConfirm from '../components/RaceRegConfirm.vue';
import SeriesRaceResult from '../components/SeriesResult.vue';
import TeamComp from '../components/TeamComp.vue'
import Roster from '../components/Roster.vue';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { 
      path: '/', 
      component: Landing
    },
    { 
        path: '/race/:raceid', 
        component: RaceResult
    },
    { 
      path: '/register/:raceid', 
      name: 'register',
      component: RaceReg
    },
    { 
      path: '/regconfirmation/:raceid/:payment_id', 
      component: RaceRegConfirm
    },
    { 
        path: '/roster/:raceid', 
        component: Roster
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
