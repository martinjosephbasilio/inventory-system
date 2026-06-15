import { createRouter, createWebHistory } from 'vue-router'
// router/index.js
import ForgotPassword from '../views/ForgotPassword.vue'
import ResetPassword from '../views/ResetPassword.vue'

const routes = [
  // ... existing routes
  { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPassword },
  { path: '/reset-password', name: 'ResetPassword', component: ResetPassword },
]
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/Register.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../views/Profile.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/inventory',
      name: 'InventoryOverview',
      component: () => import('../views/InventoryOverview.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/movements',
      name: 'InventoryMovements',
      component: () => import('../views/InventoryMovements.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/order-slip',
      name: 'OrderSlip',
      component: () => import('../views/OrderSlip.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/expenses',
      name: 'Expenses',
      component: () => import('../views/Expenses.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/income',
      name: 'IncomeStatement',
      component: () => import('../views/IncomeStatement.vue'),
      meta: { requiresAuth: true }
    },
    {
  path: '/forgot-password',
  name: 'ForgotPassword',
  component: () => import('../views/ForgotPassword.vue'),
  meta: { requiresAuth: false }
},
{
  path: '/reset-password/:token',
  name: 'ResetPassword',
  component: () => import('../views/ResetPassword.vue'),
  meta: { requiresAuth: false }
},
    {
      path: '/setup',
      name: 'Setup',
      component: () => import('../views/Setup.vue'),
      meta: { requiresAuth: true }
    },
    {
  path: '/users',
  name: 'UserManagement',
  component: () => import('../views/UserManagement.vue'),
  meta: { requiresAuth: true }
}
  ]
})

// Navigation guard
// Navigation guard - FIXED (no more 'next' callback)
router.beforeEach((to, from) => {
  const token = localStorage.getItem('token')
  const requiresAuth = to.meta.requiresAuth !== false
  
  // Redirect to login if route requires auth and no token
  if (requiresAuth && !token) {
    return '/login'
  }
  
  // Redirect to dashboard if already logged in and trying to access login/register
  if ((to.path === '/login' || to.path === '/register') && token) {
    return '/'
  }
  
  // Allow navigation
  return true
})


export default router