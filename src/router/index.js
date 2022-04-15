import { createRouter, createWebHashHistory } from 'vue-router';
import RaceResult from '../components/RaceResult.vue';
import SeriesRaceResult from '../components/SeriesResult.vue';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { 
        path: '/race/:raceid', 
        component: RaceResult
    },
    { 
        path: '/series/:seriesid', 
        component: SeriesRaceResult
    },
    { 
        path: '/series/grom/:seriesid', 
        component: SeriesRaceResult
    },
  ]
})

export default router
