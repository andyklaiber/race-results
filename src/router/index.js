import { createRouter, createWebHashHistory } from 'vue-router';
import Landing from '@/components/LandingComponent.vue'
import RaceResult from '@/components/results/RaceResult.vue';
import RaceReg from '@/components/registration/RaceReg.vue';
import RaceRegConfirm from '@/components/registration/RaceRegConfirm.vue';
import SeriesRaceResult from '@/components/results/SeriesResult.vue';
import TeamComp from '@/components/results/TeamComp.vue'
import Roster from '@/components/registration/Roster.vue';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { 
      path: '/', 
      name: 'home',
      component: Landing
    },
    { 
      path: '/results/', 
      name: 'results',
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
        name: 'roster',
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
