import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import axios from 'axios'

// Set base URL for axios
axios.defaults.baseURL = 'https://inventory-system-backend-production-0549.up.railway.app/api'

// Add token to requests if exists
const token = localStorage.getItem('token')
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Add response interceptor for 401 errors (unauthorized)
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete axios.defaults.headers.common['Authorization']
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

const app = createApp(App)
app.use(createPinia())
app.use(router)

// Global helpers - these will be replaced by App.vue's provide
app.config.globalProperties.$showToast = (message, type) => {
  console.log(message, type)
}
app.config.globalProperties.$showConfirm = (options) => {
  console.log(options)
  return Promise.resolve(false)
}

app.mount('#app')
