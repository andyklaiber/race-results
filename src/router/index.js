import { createRouter, createWebHashHistory } from 'vue-router'
import RaceResult from '../components/RaceResult.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { 
        path: '/race/:raceid', 
        component: RaceResult
    },
  ]
})

export default router
