<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Enhanced header with icon animation -->
      <div class="login-header">
        <div class="icon-wrapper">
          <i class="fas fa-boxes"></i>
        </div>
        <h1>INR Packaging Corp</h1>

        <p>Inventory Management System</p>
      </div>
      
      <div class="login-form">
        <div class="form-group">
          <label><i class="fas fa-user"></i> Username</label>
          <input type="text" v-model="username" placeholder="Enter your username" @keypress="handleEnter" />
        </div>
        
        <div class="form-group">
          <label><i class="fas fa-lock"></i> Password</label>
          <div class="password-wrapper">
            <input :type="passwordVisible ? 'text' : 'password'" v-model="password" placeholder="Enter your password" @keypress="handleEnter" />
            <button type="button" class="toggle-password" @click="togglePasswordVisibility">
              <i :class="passwordVisible ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
        </div>
        
        <button @click="doLogin" :disabled="isLoading" class="login-btn">
          <span>{{ isLoading ? 'Logging in...' : 'Login' }}</span>
          <i :class="isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-arrow-right'"></i>
        </button>
      </div>
      
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      
      <div class="forgot-password">
        <router-link to="/forgot-password">Forgot Password?</router-link>
      </div>
      
      <div class="login-footer">
        <span class="demo-badge">
          
        </span>
      </div>
      
      <div class="register-link">
        <p>Don't have an account? <a href="#" @click.prevent="goToRegister">Create Account</a></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const API_URL = 'https://inventory-system-backend-production-0549.up.railway.app/api'

// Reactive variables
const username = ref('')
const password = ref('')
const passwordVisible = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// Toggle password visibility
const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value
}

// Handle Enter key
const handleEnter = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    doLogin()
  }
}

// Login function
const doLogin = async () => {
  // Clear previous error
  errorMessage.value = ''
  
  // Validate inputs
  if (!username.value || !password.value) {
    errorMessage.value = '⚠️ Please enter username and password'
    return
  }
  
  isLoading.value = true
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: username.value, 
        password: password.value 
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      // Save to auth store (reactive)
      authStore.setToken(data.token)
      authStore.setUser(data.user)
      
      // Navigate to dashboard without full page reload
      router.push('/')
    } else {
      errorMessage.value = `❌ ${data.error || 'Invalid username or password'}`
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = '❌ Login failed. Please check your connection.'
  } finally {
    isLoading.value = false
  }
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #3d0c0c 0%, #7a1f1f 100%);
  position: relative;
  overflow: hidden;
}

/* Decorative background elements */
.login-container::before {
  content: "";
  position: absolute;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 50%;
  top: -150px;
  right: -100px;
}

.login-container::after {
  content: "";
  position: absolute;
  width: 400px;
  height: 400px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 50%;
  bottom: -200px;
  left: -150px;
}

.login-card {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 32px;
  padding: 2.5rem;
  width: 440px;
  max-width: 90%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 8px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(2px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  z-index: 1;
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.4);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.icon-wrapper {
  background: linear-gradient(135deg, #dc2626, #991b1b);
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;
  box-shadow: 0 10px 20px -5px rgba(220, 38, 38, 0.4);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.icon-wrapper i {
  font-size: 2rem;
  color: white;
}

.login-header h2 {
  color: #2d1a1a;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 0.25rem;
}

.login-header p {
  color: #7a5c5c;
  font-size: 0.85rem;
  font-weight: 500;
}

.login-form .form-group {
  margin-bottom: 1.5rem;
}

.login-form label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #5c3a3a;
  font-size: 0.85rem;
  letter-spacing: 0.3px;
}

.login-form label i {
  margin-right: 8px;
  font-size: 0.8rem;
  color: #dc2626;
}

.login-form input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  font-family: inherit;
  background: #ffffff;
}

.login-form input:focus {
  outline: none;
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  flex: 1;
  padding-right: 45px;
}

.toggle-password {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: #bca0a0;
  cursor: pointer;
  font-size: 1rem;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.toggle-password:hover {
  color: #dc2626;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: white;
  border: none;
  border-radius: 40px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.login-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #b91c1c, #991b1b);
  transform: scale(1.02);
  box-shadow: 0 6px 18px rgba(220, 38, 38, 0.4);
}

.login-btn:disabled {
  background: linear-gradient(135deg, #c17a7a, #a86b6b);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.login-btn i {
  font-size: 0.9rem;
  transition: transform 0.2s;
}

.login-btn:hover:not(:disabled) i {
  transform: translateX(3px);
}

.fa-spin {
  animation: fa-spin 1s infinite linear;
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  margin-top: 1rem;
  padding: 12px 16px;
  background: linear-gradient(135deg, #fee2e2, #fff0f0);
  color: #dc2626;
  border-radius: 16px;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 500;
  border-left: 4px solid #dc2626;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.forgot-password {
  margin-top: 1rem;
  text-align: right;
}

.forgot-password a {
  color: #b85c5c;
  font-size: 0.8rem;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.forgot-password a:hover {
  color: #dc2626;
  text-decoration: underline;
}

.login-footer {
  margin-top: 1.25rem;
  text-align: center;
}

.demo-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fff0f0;
  padding: 6px 14px;
  border-radius: 40px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #b91c1c;
  letter-spacing: 0.3px;
}

.demo-badge i {
  font-size: 0.7rem;
}

.register-link {
  margin-top: 1.25rem;
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #f0e2e2;
}

.register-link p {
  color: #7a5c5c;
  font-size: 0.85rem;
}

.register-link a {
  color: #dc2626;
  text-decoration: none;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.2s;
}

.register-link a:hover {
  color: #991b1b;
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 480px) {
  .login-card {
    padding: 1.75rem;
    border-radius: 24px;
  }
  
  .icon-wrapper {
    width: 55px;
    height: 55px;
  }
  
  .icon-wrapper i {
    font-size: 1.5rem;
  }
  
  .login-header h2 {
    font-size: 1.4rem;
  }
}
</style>