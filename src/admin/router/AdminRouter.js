import { createRouter, createWebHashHistory } from 'vue-router';

import Manage from '../Manage.vue';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { 
      path: '/manage/', 
      component: Manage
  },
  ]
})

export default router
