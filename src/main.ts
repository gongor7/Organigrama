import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Drawer from 'primevue/drawer'
import Tree from 'primevue/tree'
import Toast from 'primevue/toast'

import 'primeicons/primeicons.css'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import './style.css'

import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      cssLayer: false,
      darkModeSelector: '.app-dark',
    },
  },
})
app.use(ToastService)

app.component('Button', Button)
app.component('InputText', InputText)
app.component('Textarea', Textarea)
app.component('Drawer', Drawer)
app.component('Tree', Tree)
app.component('Toast', Toast)

app.mount('#app')
