import { createRouter, createWebHashHistory } from 'vue-router';
import PaymentsComponent from '@/admin/components/PaymentsComponent.vue';
import EditRacersComponent from '@/admin/components/EditRacersComponent.vue';
import EditRaceComponent from '@/admin/components/EditRaceComponent.vue';
import EditSeriesRacersComponent from '@/admin/components/EditSeriesRacersComponent.vue';
import RaceLayoutComponent from '@/admin/components/RaceLayoutComponent.vue';
import RacesComponent from '@/admin/components/RacesComponent.vue';
import ResultLayoutComponent from '@/admin/components/ResultLayoutComponent.vue';
import ResultsListComponent from '@/admin/components/ResultsComponent.vue';
import ResultEditorComponent from '@/admin/components/ResultEditorComponent.vue';
import SeriesResultsListComponent from '@/admin/components/SeriesResultsListComponent.vue';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/payments/',
      component: PaymentsComponent,
      name: "payments"
    },
    {
      path: '/races/',
      component: RacesComponent,
      name: "races"
    },
    {
      path: '/results/',
      component: ResultsListComponent,
      name: "results"
    },
    {
      path: '/series-results/',
      component: SeriesResultsListComponent,
      name: "series-results"
    },
    {
      path: '/results/:resultid/',
      component: ResultLayoutComponent,
      name: "view-result",
      children:[
        { path: '', component: ResultEditorComponent, name: 'edit-result' },
      ]
    },
    {
      // UserPosts will be rendered inside User's <router-view>
      // when /user/:id/posts is matched
      path: '/race/:raceid/',
      component: RaceLayoutComponent,
      name: "view-race",
      children:[
        { path: '', component: EditRaceComponent, name: 'edit-race' },
        { path: 'racers/', component: EditRacersComponent, name: 'edit-racers' },
        { path: 'series/:series', component: EditSeriesRacersComponent, name: 'edit-series-racers' },
        // when /race/:raceid/roster is matched
        // { path: 'roster', component: RaceRoster },
        // // when /race/:raceid/pending is matched
        // { path: 'pending', component: PendingPayments },
      ]
    },
  ]
})

export default router
