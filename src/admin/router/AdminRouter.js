import { createRouter, createWebHashHistory } from 'vue-router';
import PaymentsComponent from '@/admin/components/PaymentsComponent.vue';
import EditRaceComponent from '@/admin/components/EditRaceComponent.vue';
import RaceComponent from '@/admin/components/RaceComponent.vue';
import RacesComponent from '@/admin/components/RacesComponent.vue';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // UserPosts will be rendered inside User's <router-view>
      // when /user/:id/posts is matched
      path: '/payments/',
      component: PaymentsComponent,
      name: "payments"
    },
    {
      // UserPosts will be rendered inside User's <router-view>
      // when /user/:id/posts is matched
      path: '/races/',
      component: RacesComponent,
      name: "races"
    },
    {
      // UserPosts will be rendered inside User's <router-view>
      // when /user/:id/posts is matched
      path: '/race/:raceid',
      component: RaceComponent,
      name: "view-race",
      children:[
        { path: 'edit', component: EditRaceComponent, name: 'edit-race' },
        // when /race/:raceid/roster is matched
        // { path: 'roster', component: RaceRoster },
        // // when /race/:raceid/pending is matched
        // { path: 'pending', component: PendingPayments },
      ]
    },
  ]
})

export default router
