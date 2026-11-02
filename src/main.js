import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { definePreset } from '@primeuix/themes'
import Material from '@primeuix/themes/material'
import App from './App.vue'
import './style.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'primeicons/primeicons.css'

const CompactMaterial = definePreset(Material, {
  semantic: {
    formField: {
      paddingY: '0.25rem',
      sm: {
        paddingY: '0.375rem'
      }
    }
  },
  components: {
    button: {
      root: {
        paddingY: '0.5rem',
        sm: {
          paddingY: '0.375rem'
        }
      }
    }
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(PrimeVue, {
  theme: {
    preset: CompactMaterial,
    options: {
      darkModeSelector: '.app-dark'
    }
  }
})
app.mount('#app')
