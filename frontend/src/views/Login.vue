<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <i class="fas fa-box"></i>
        <h2>INR Packaging Corp</h2>
        <p>Inventory Management System</p>
      </div>
      
      <div class="login-form">
        <div class="form-group">
          <label>Username</label>
          <input type="text" id="username" placeholder="Enter your username" />
        </div>
        
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="password" placeholder="Enter your password" />
        </div>
        
        <button id="loginBtn" class="login-btn">Login</button>
      </div>
      
      <div id="errorMessage" class="error-message" style="display: none;"></div>
      
      <!-- Forgot Password Link - IDINAGDAG ITO -->
      <div class="forgot-password">
        <router-link to="/forgot-password">Forgot Password?</router-link>
      </div>
      
      <div class="login-footer">
        <small>Default: admin / admin123</small>
      </div>
      
      <div class="register-link">
        <p>Don't have an account? <a href="#" @click.prevent="goToRegister">Create Account</a></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const API_URL = 'http://localhost:3000/api'

// Function to show error message (stays for 30 minutes = 1,800,000 milliseconds)
let errorTimeout = null

const showError = (message) => {
  const errorDiv = document.getElementById('errorMessage')
  
  // Clear previous timeout
  if (errorTimeout) {
    clearTimeout(errorTimeout)
  }
  
  // Show error
  errorDiv.textContent = message
  errorDiv.style.display = 'block'
  
  // Auto hide after 30 minutes (sobrang tagal, halos hindi na mawawala)
  errorTimeout = setTimeout(() => {
    errorDiv.style.display = 'none'
    errorTimeout = null
  }, 1800000) // 30 minutes = 1,800,000 milliseconds
}

// Login function
const doLogin = async () => {
  const usernameInput = document.getElementById('username')
  const passwordInput = document.getElementById('password')
  const loginBtn = document.getElementById('loginBtn')
  const errorDiv = document.getElementById('errorMessage')
  
  const username = usernameInput.value
  const password = passwordInput.value
  
  errorDiv.style.display = 'none'
  
  if (!username || !password) {
    showError('⚠️ Please enter username and password')
    return
  }
  
  loginBtn.disabled = true
  loginBtn.textContent = 'Logging in...'
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    
    const data = await response.json()
    
    if (data.success) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      window.location.href = '/'
    } else {
      showError(`❌ ${data.error || 'Invalid username or password'}`)
      loginBtn.disabled = false
      loginBtn.textContent = 'Login'
    }
  } catch (error) {
    showError('❌ Login failed. Please check your connection.')
    loginBtn.disabled = false
    loginBtn.textContent = 'Login'
  }
}

// Setup after DOM is ready
setTimeout(() => {
  const loginBtn = document.getElementById('loginBtn')
  const usernameInput = document.getElementById('username')
  const passwordInput = document.getElementById('password')
  
  if (loginBtn) {
    loginBtn.onclick = function(e) {
      e.preventDefault()
      doLogin()
    }
  }
  
  // Enter key functionality - WITHOUT page refresh
  const handleEnter = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      doLogin()
    }
  }
  
  if (usernameInput) {
    usernameInput.addEventListener('keypress', handleEnter)
  }
  
  if (passwordInput) {
    passwordInput.addEventListener('keypress', handleEnter)
  }
}, 100)

const goToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1a2a3a 0%, #0d1b2a 100%);
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header i {
  font-size: 3rem;
  color: #dc3545;
  margin-bottom: 1rem;
}

.login-header h2 {
  color: #1a2a3a;
  margin-bottom: 0.25rem;
}

.login-header p {
  color: #666;
  font-size: 0.85rem;
}

.login-form .form-group {
  margin-bottom: 1.5rem;
}

.login-form label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #333;
}

.login-form input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.login-form input:focus {
  outline: none;
  border-color: #dc3545;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
}

.login-btn:hover {
  background: #bb2d3b;
}

.login-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.error-message {
  margin-top: 1rem;
  padding: 15px;
  background: #f8d7da;
  color: #dc3545;
  border-radius: 8px;
  text-align: center;
  font-size: 0.9rem;
  border-left: 4px solid #dc3545;
  animation: fadeIn 0.3s ease;
}

/* Forgot Password - BAGONG STYLE */
.forgot-password {
  margin-top: 0.75rem;
  text-align: right;
}

.forgot-password a {
  color: #6c757d;
  font-size: 0.75rem;
  text-decoration: none;
  transition: color 0.2s;
}

.forgot-password a:hover {
  color: #dc3545;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-footer {
  margin-top: 1rem;
  text-align: center;
  color: #999;
}

.register-link {
  margin-top: 1rem;
  text-align: center;
}

.register-link a {
  color: #28a745;
  text-decoration: none;
  font-weight: bold;
  cursor: pointer;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>