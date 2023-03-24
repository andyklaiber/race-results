import { createApp } from 'vue'
import App from '@/admin/Admin.vue'
import router from '@/admin/router/AdminRouter'
import { plugin, defaultConfig } from '@formkit/vue'
import { datadogLogs } from '@datadog/browser-logs'
// Import our custom CSS
import '@/scss/styles.scss'

// Import all of Bootstrap's JS
import * as bootstrap from 'bootstrap'
import '@formkit/themes/genesis'
const devMode = import.meta.env.DEV
if (!devMode) {
datadogLogs.init({
    clientToken: 'pub5b9b0cfce30b3b609b588d9f3ac85ebb',
    site: 'datadoghq.com',
    env: devMode ? 'dev' : 'production',
    service: 'admin-site',
    version: APP_VERSION,
    forwardErrorsToLogs: true,
    sampleRate: 100,
  })
}
const app = createApp(App);
app.use(plugin,defaultConfig);
app.use(router);
app.mount('#app');