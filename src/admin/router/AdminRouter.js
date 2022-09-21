import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // UserProfile will be rendered inside User's <router-view>
      // when /user/:id/profile is matched
      path: 'dashboard',
      component: UserProfile,
      
    },
    {
      // UserPosts will be rendered inside User's <router-view>
      // when /user/:id/posts is matched
      path: 'race/:raceid',
      component: races,
      children:[
        { path: '', component: race },
        // when /race/:raceid/roster is matched
        { path: 'roster', component: RaceRoster },
        // when /race/:raceid/pending is matched
        { path: 'pending', component: PendingPayments },
      ]
    },
  ]
})

export default router
