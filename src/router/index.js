import { createRouter, createWebHashHistory } from 'vue-router';
import Landing from '@/components/LandingComponent.vue'
import RaceResult from '@/components/results/RaceResult.vue';
import ResultComponent from '@/components/results/ResultComponent.vue';
import SeriesResultComponent from '@/components/results/SeriesResultComponent.vue';
import RaceReg from '@/components/registration/RaceReg.vue';
import RaceRegConfirm from '@/components/registration/RaceRegConfirm.vue';
import SeriesRaceResult from '@/components/results/SeriesResult.vue';
import TeamComp from '@/components/results/TeamComp.vue'
import TeamCompComponent from '@/components/results/TeamCompComponent.vue'
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
        path: '/result/:id',
        name: 'raceResult',
        component: ResultComponent
    },
    { 
        path: '/result/series/:seriesid', 
        name: 'seriesResults',
        component: SeriesResultComponent
    },
    { 
        path: '/result/series/:seriesid/team',
        name: "teamCompResults",
        component: TeamCompComponent
    },
    { 
      path: '/register/:raceid', 
      name: 'register',
      component: RaceReg
    },
    { 
      path: '/register/test/:raceid', 
      name: 'register-test',
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
