<template>
  <div id="app" class="app-layout">
    <!-- SIDEBAR - only show when logged in -->
    <aside class="sidebar" v-if="isLoggedIn">
      <div class="logo-container">
        <h2 class="logo"><i class="fas fa-box"></i>INRandDGM</h2>
        <p class="logo-sub"><i class="fas fa-industry"></i> Packaging Corp</p>
      </div>
      
      <nav class="nav-menu">
        <router-link to="/" class="nav-item">
          <span class="nav-icon"><i class="fas fa-chart-line"></i></span>
          <span>Dashboard</span>
        </router-link>
        
        <router-link to="/inventory" class="nav-item">
          <span class="nav-icon"><i class="fas fa-boxes"></i></span>
          <span>Inventory Overview</span>
        </router-link>
        
        <router-link to="/movements" class="nav-item">
          <span class="nav-icon"><i class="fas fa-exchange-alt"></i></span>
          <span>IN/OUT Log</span>
        </router-link>
        
        <router-link to="/order-slip" class="nav-item">
          <span class="nav-icon"><i class="fas fa-file-invoice"></i></span>
          <span>Order Slip</span>
        </router-link>
        
        <router-link to="/expenses" class="nav-item">
          <span class="nav-icon"><i class="fas fa-coins"></i></span>
          <span>Expenses</span>
        </router-link>
        
        <router-link to="/income" class="nav-item">
          <span class="nav-icon"><i class="fas fa-chart-simple"></i></span>
          <span>Income Statement</span>
        </router-link>
        
        <router-link to="/setup" class="nav-item">
          <span class="nav-icon"><i class="fas fa-sliders-h"></i></span>
          <span>Setup</span>
        </router-link>
        <router-link to="/users" class="nav-item" v-if="user?.role === 'admin'">
  <span class="nav-icon"><i class="fas fa-users"></i></span>
  <span>User Management</span>
</router-link>
      </nav>
      
      <!-- SPACER - pushes user dropdown to bottom -->
      <div class="nav-spacer"></div>
      
      <!-- User Dropdown at the bottom -->
      <div class="user-dropdown">
        <div class="user-info" @click="toggleUserDropdown">
          <i class="fas fa-user-circle"></i>
          <div>
            <strong>{{ user?.full_name }}</strong>
            <small>{{ user?.role }}</small>
          </div>
          <i class="fas fa-chevron-down dropdown-arrow" :class="{ 'rotate': userDropdownOpen }"></i>
        </div>
        <div class="user-dropdown-menu" v-if="userDropdownOpen">
          <router-link to="/profile" class="user-dropdown-item" @click="closeUserDropdown">
            <i class="fas fa-user-circle"></i> My Profile
          </router-link>
          <div class="user-dropdown-divider"></div>
          <a href="#" class="user-dropdown-item" @click.prevent="logout">
            <i class="fas fa-sign-out-alt"></i> Logout
          </a>
        </div>
      </div>
    </aside>

    <!-- MAIN CONTENT - only show when logged in -->
    <main class="main-content" v-if="isLoggedIn">
      <div class="content-header">
        <h1><i class="fas fa-chart-pie"></i> {{ currentPageTitle }}</h1>
      </div>
      <router-view />
    </main>
    
    <!-- Show only login page when not logged in -->
    <div v-if="!isLoggedIn" class="login-wrapper">
      <router-view />
    </div>
    <!-- Global Auto-Refresh Indicator -->
<div style="display: flex; justify-content: flex-end; align-items: center; gap: 15px; margin-bottom: 15px; padding: 8px 12px; background: #e9ecef; border-radius: 8px;">
  <div style="display: flex; align-items: center; gap: 8px;">
    <i class="fas fa-sync-alt" style="color: #2c3e50;"></i>
    <span style="font-size: 12px; color: #2c3e50;">
      Last refresh: {{ lastGlobalRefresh.toLocaleTimeString() }}
    </span>
  </div>
  <label style="display: flex; align-items: center; gap: 5px; font-size: 12px; cursor: pointer;">
    <input type="checkbox" v-model="isAutoRefreshEnabled" style="margin: 0;">
    Auto-refresh (5 sec)
  </label>
  <button @click="refreshAllData" style="background: #2c3e50; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
    <i class="fas fa-refresh"></i> Refresh Now
  </button>
</div>

<router-view />

    <!-- GLOBAL MODALS -->
    <ProfessionalModal ref="professionalModal" />
    <Toast ref="toast" />
  </div>
</template>

<script setup>
import { computed, ref, provide, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInventoryStore } from './stores/inventory'
import ProfessionalModal from './components/ProfessionalModal.vue'
import Toast from './components/Toast.vue'
import axios from 'axios'

// ========== GLOBAL AUTO-REFRESH ==========
const lastGlobalRefresh = ref(new Date())
let globalRefreshInterval = null
const isAutoRefreshEnabled = ref(true)

// Function to refresh all important data
const refreshAllData = async () => {
  if (!isLoggedIn.value) return
  
  try {
    // Refresh inventory stock
    await store.fetchStock()
    await store.fetchItems()
    
    // Refresh dashboard data
    await store.fetchDashboard()
    
    // Refresh current user data (para mag-update ang profile name)
    const token = localStorage.getItem('token')
    if (token && user.value) {
      try {
        const response = await axios.get('https://inventory-system-backend-production-0549.up.railway.app/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.data) {
          user.value = response.data
          localStorage.setItem('user', JSON.stringify(response.data))
        }
      } catch (err) {
        console.log('User refresh skipped:', err.message)
      }
    }
    
    lastGlobalRefresh.value = new Date()
    console.log('Auto-refresh at:', lastGlobalRefresh.value.toLocaleTimeString())
  } catch (error) {
    console.error('Auto-refresh error:', error)
  }
}

const route = useRoute()
const router = useRouter()
const store = useInventoryStore()

const professionalModal = ref(null)
const toast = ref(null)

// User and login state
const user = ref(null)
const isLoggedIn = ref(false)
const userDropdownOpen = ref(false)

// Check login status function
const checkLoginStatus = () => {
  const token = localStorage.getItem('token')
  const userData = localStorage.getItem('user')
  
  isLoggedIn.value = !!token
  
  if (userData) {
    user.value = JSON.parse(userData)
  } else {
    user.value = null
  }
}

const toggleUserDropdown = () => {
  userDropdownOpen.value = !userDropdownOpen.value
}

const closeUserDropdown = () => {
  userDropdownOpen.value = false
}

// Close dropdown when clicking outside
const closeDropdownOnClickOutside = (event) => {
  const dropdown = document.querySelector('.user-dropdown')
  if (dropdown && !dropdown.contains(event.target)) {
    userDropdownOpen.value = false
    document.removeEventListener('click', closeDropdownOnClickOutside)
  }
}

watch(userDropdownOpen, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      document.addEventListener('click', closeDropdownOnClickOutside)
    }, 0)
  } else {
    document.removeEventListener('click', closeDropdownOnClickOutside)
  }
})

const currentPageTitle = computed(() => {
  const titles = {
    '/': 'Dashboard',
    '/inventory': 'Inventory Overview',
    '/movements': 'IN/OUT Log',
    '/order-slip': 'Order Slip',
    '/expenses': 'Expenses',
    '/income': 'Income Statement',
    '/profile': 'My Profile',
    '/setup': 'Setup'
  }
  return titles[route.path] || 'Inventory System'
})

// Global showConfirm function - Professional Modal
const showConfirm = (options) => {
  if (professionalModal.value) {
    return professionalModal.value.show(options)
  }
  return Promise.resolve(confirm(options.message))
}

// Global showToast function
const showToast = (message, type = 'success') => {
  if (toast.value) {
    toast.value.show(message, type)
  } else {
    alert(message)
  }
}

const showAlert = (message, type = 'info') => {
  if (toast.value) {
    toast.value.show(message, type)
  } else {
    alert(message)
  }
}

// Logout function
const logout = async () => {
  const confirmed = await showConfirm({
    type: 'warning',
    title: 'Logout',
    message: 'Are you sure you want to logout?',
    confirmText: 'Yes, Logout',
    cancelText: 'Cancel'
  })
  
  if (confirmed) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    isLoggedIn.value = false
    user.value = null
    router.push('/login')
    showToast('Logged out successfully!', 'success')
  }
}

// Provide to all child components
provide('showConfirm', showConfirm)
provide('showToast', showToast)
provide('showAlert', showAlert)
provide('axios', axios)

// Watch for route changes
watch(() => route.path, () => {
  checkLoginStatus()
  closeUserDropdown()
})

onMounted(() => {
  checkLoginStatus()
  
  if (isLoggedIn.value && route.path !== '/login') {
    store.fetchItems()
    store.fetchStock()
    store.fetchDashboard()
  }
  
  // Start global auto-refresh every 5 seconds
  if (globalRefreshInterval) clearInterval(globalRefreshInterval)
  globalRefreshInterval = setInterval(() => {
    if (isAutoRefreshEnabled.value && isLoggedIn.value) {
      refreshAllData()
    }
  }, 5000) // 5 seconds
})

// Clean up auto-refresh when app unmounts
import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (globalRefreshInterval) {
    clearInterval(globalRefreshInterval)
    globalRefreshInterval = null
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f0f2f5;
}

.app-layout {
  display: flex;
  min-height: 100vh;
}

/* Login wrapper - full screen */
.login-wrapper {
  flex: 1;
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1a2a3a 0%, #0d1b2a 100%);
}

/* ========== SIDEBAR STYLES ========== */
.sidebar {
  width: 280px;
  background: linear-gradient(180deg, #1a2a3a 0%, #0d1b2a 100%);
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
}

.logo-container {
  padding: 1.5rem;
  text-align: center;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 1rem;
}

.logo {
  font-size: 1.8rem;
  margin-bottom: 0.25rem;
}

.logo i {
  margin-right: 8px;
}

.logo-sub {
  font-size: 0.75rem;
  opacity: 0.7;
}

.logo-sub i {
  margin-right: 4px;
}

/* Navigation */
.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0 1rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #e0e0e0;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.router-link-active {
  background: #dc3545;
  color: white;
}

.nav-icon {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
}

/* Spacer to push dropdown to bottom */
.nav-spacer {
  flex: 1;
}

/* User Dropdown at bottom */
.user-dropdown {
  position: relative;
  margin: 1rem;
  margin-top: auto;
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.8rem 1rem;
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.user-info:hover {
  background: rgba(255,255,255,0.15);
}

.user-info i:first-child {
  font-size: 2rem;
  opacity: 0.8;
}

.user-info strong {
  display: block;
  font-size: 0.9rem;
}

.user-info small {
  font-size: 0.7rem;
  opacity: 0.7;
  text-transform: capitalize;
}

.dropdown-arrow {
  margin-left: auto;
  font-size: 0.8rem;
  transition: transform 0.2s;
}

.dropdown-arrow.rotate {
  transform: rotate(180deg);
}

.user-dropdown-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: #0d1b2a;
  border-radius: 8px;
  margin-bottom: 4px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
  z-index: 100;
}

.user-dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  color: #e0e0e0;
  text-decoration: none;
  transition: background 0.2s;
  font-size: 0.85rem;
}

.user-dropdown-item i {
  width: 20px;
  font-size: 0.9rem;
}

.user-dropdown-item:hover {
  background: rgba(255,255,255,0.1);
  color: white;
}

.user-dropdown-divider {
  height: 1px;
  background: rgba(255,255,255,0.1);
  margin: 4px 0;
}

/* ========== MAIN CONTENT STYLES ========== */
.main-content {
  flex: 1;
  margin-left: 280px;
  padding: 1.5rem;
}

.content-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
}

.content-header h1 {
  color: #1a2a3a;
  font-size: 1.8rem;
}

.content-header h1 i {
  color: #dc3545;
  margin-right: 10px;
}

/* ========== BUTTON STYLES ========== */
button {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

button:hover {
  background: #bb2d3b;
}

button.danger {
  background: #dc3545;
}

button.danger:hover {
  background: #bb2d3b;
}

button.success {
  background: #28a745;
}

button.success:hover {
  background: #1e7e34;
}

.btn-primary {
  background: #dc3545;
}

.btn-primary:hover {
  background: #bb2d3b;
}

.btn-add {
  background: #28a745;
}

.btn-add:hover {
  background: #1e7e34;
}

.btn-in {
  background: #28a745;
}

.btn-out {
  background: #dc3545;
}

/* ========== TABLE STYLES ========== */
table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background: #1a2a3a;
  color: white;
}

/* ========== CARD STYLES ========== */
.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.card h3 {
  margin-bottom: 1rem;
  color: #1a2a3a;
}

/* ========== STATS GRID ========== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-left: 4px solid #dc3545;
}

.stat-card h4 {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-card .value {
  font-size: 2rem;
  font-weight: bold;
  color: #1a2a3a;
}

/* ========== ALERT STYLES ========== */
.alert {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
}

.alert-danger {
  background: #f8d7da;
  border-left-color: #dc3545;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .sidebar {
    width: 70px;
  }
  
  .logo-container h2 span,
  .logo-sub span,
  .user-info div,
  .user-dropdown-menu,
  .nav-item span:last-child {
    display: none;
  }
  
  .user-info {
    justify-content: center;
    padding: 0.8rem;
  }
  
  .user-info i:first-child {
    font-size: 1.8rem;
    margin: 0;
  }
  
  .dropdown-arrow {
    display: none;
  }
  
  .logo i {
    font-size: 1.5rem;
  }
  
  .main-content {
    margin-left: 70px;
  }
  
  .nav-item {
    justify-content: center;
    padding: 12px;
  }
  
  .nav-icon {
    font-size: 1.5rem;
    width: auto;
  }
}
</style>