import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { plugin, defaultConfig } from '@formkit/vue'
import 'bootstrap/dist/css/bootstrap.min.css';
import '@formkit/themes/genesis';
import * as Sentry from "@sentry/vue";
import { BrowserTracing } from "@sentry/tracing";


const app = createApp(App)
Sentry.init({
    app,
    dsn: "https://4e78356c499d457d9ad435abf93628d4@o1431023.ingest.sentry.io/6781986",
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
        tracingOrigins: ["localhost", "signup.bike", /^\//],
      }),
    ],
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    environment: import.meta.env.DEV ? 'dev' : 'production',
    tracesSampleRate: 1.0,
  });
app.use(plugin,defaultConfig);
app.use(router);
app.mount('#app');