import { createApp } from 'vue'
import App from '@/admin/Admin.vue'
import router from '@/admin/router/AdminRouter'
import { plugin, defaultConfig } from '@formkit/vue'
// Import our custom CSS
import '@/scss/styles.scss'

// Import all of Bootstrap's JS
import * as bootstrap from 'bootstrap'
import '@formkit/themes/genesis'

const app = createApp(App);
app.use(plugin,defaultConfig);
app.use(router);
app.mount('#app');