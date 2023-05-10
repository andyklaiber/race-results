import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { plugin, defaultConfig } from '@formkit/vue'
import 'bootstrap/dist/css/bootstrap.min.css';
import * as bootstrap from 'bootstrap'
import '@formkit/themes/genesis';
import { datadogLogs } from '@datadog/browser-logs'
const devMode = import.meta.env.DEV

if (!devMode) {
  datadogLogs.init({
    clientToken: 'pub5b9b0cfce30b3b609b588d9f3ac85ebb',
    site: 'datadoghq.com',
    env: devMode ? 'dev' : 'production',
    service: 'public-site',
    version: APP_VERSION,
    forwardErrorsToLogs: true,
    sampleRate: 100,
  })
}

const app = createApp(App)
app.use(plugin, defaultConfig);
app.use(router);
app.mount('#app');