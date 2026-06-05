<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <div class="icon-wrapper">
          <i class="fas fa-user-plus"></i>
        </div>
        <h2>Create New Account</h2>
        <p>Sign up to get started with INR Packaging</p>
      </div>
      
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label><i class="fas fa-user"></i> Username</label>
          <input 
            type="text" 
            v-model="username" 
            placeholder="Enter username"
            required
          />
        </div>
        
        <div class="form-group">
          <label><i class="fas fa-envelope"></i> Email Address</label>
          <input 
            type="email" 
            v-model="email" 
            placeholder="Enter your email" 
            required 
          />
        </div>
        
        <div class="form-group">
          <label><i class="fas fa-user-circle"></i> Full Name</label>
          <input 
            type="text" 
            v-model="full_name" 
            placeholder="Enter full name"
            required
          />
        </div>
        
        <div class="form-group">
          <label><i class="fas fa-lock"></i> Password</label>
          <div class="password-wrapper">
            <input 
              :type="passwordVisible ? 'text' : 'password'" 
              v-model="password" 
              placeholder="Enter password"
              required
            />
            <button type="button" class="toggle-password" @click="togglePasswordVisibility('password')">
              <i :class="passwordVisible ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label><i class="fas fa-lock"></i> Confirm Password</label>
          <div class="password-wrapper">
            <input 
              :type="confirmVisible ? 'text' : 'password'" 
              v-model="confirm_password" 
              placeholder="Confirm password"
              required
            />
            <button type="button" class="toggle-password" @click="togglePasswordVisibility('confirm')">
              <i :class="confirmVisible ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
        </div>
        
        <button type="submit" :disabled="loading" class="register-btn">
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-user-plus"></i>
          {{ loading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>
      
      <div v-if="successMessage" class="success-message">
        <i class="fas fa-check-circle"></i> {{ successMessage }}
      </div>
      
      <div v-if="errorMessage" class="error-message">
        <i class="fas fa-exclamation-circle"></i> {{ errorMessage }}
      </div>
      
      <div class="register-footer">
        <router-link to="/login">
          <i class="fas fa-arrow-left"></i> Back to Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const username = ref('')
const email = ref('')
const full_name = ref('')
const password = ref('')
const confirm_password = ref('')
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const passwordVisible = ref(false)
const confirmVisible = ref(false)

const API_URL = 'https://inventory-system-backend-production-0549.up.railway.app/api'

const togglePasswordVisibility = (field) => {
  if (field === 'password') {
    passwordVisible.value = !passwordVisible.value
  } else if (field === 'confirm') {
    confirmVisible.value = !confirmVisible.value
  }
}

const handleRegister = async () => {
  // Clear previous messages
  errorMessage.value = ''
  successMessage.value = ''
  
  // Validation
  if (!username.value || !email.value || !full_name.value || !password.value) {
    errorMessage.value = 'Please fill in all fields'
    return
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    errorMessage.value = 'Please enter a valid email address'
    return
  }
  
  if (password.value !== confirm_password.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }
  
  if (password.value.length < 4) {
    errorMessage.value = 'Password must be at least 4 characters'
    return
  }
  
  if (username.value.length < 3) {
    errorMessage.value = 'Username must be at least 3 characters'
    return
  }
  
  loading.value = true
  
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      username: username.value,
      email: email.value,
      password: password.value,
      full_name: full_name.value,
      role: 'user'
    })
    
    if (response.data.success) {
      successMessage.value = 'Account created successfully! Redirecting to login...'
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  } catch (error) {
    console.error('Registration error:', error)
    errorMessage.value = error.response?.data?.error || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.register-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #3d0c0c 0%, #7a1f1f 100%);
  position: relative;
  overflow: hidden;
}

/* Decorative background elements */
.register-container::before {
  content: "";
  position: absolute;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 50%;
  top: -150px;
  right: -100px;
}

.register-container::after {
  content: "";
  position: absolute;
  width: 400px;
  height: 400px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 50%;
  bottom: -200px;
  left: -150px;
}

.register-card {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 32px;
  padding: 2.5rem;
  width: 480px;
  max-width: 90%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 8px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(2px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  z-index: 1;
}

.register-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.4);
}

.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.icon-wrapper {
  background: linear-gradient(135deg, #b91c1c, #7f1d1d);
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;
  box-shadow: 0 10px 20px -5px rgba(185, 28, 28, 0.4);
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

.register-header h2 {
  color: #1e1b1b;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 0.25rem;
}

.register-header p {
  color: #6b4c4c;
  font-size: 0.85rem;
  font-weight: 500;
}

.register-form .form-group {
  margin-bottom: 1.25rem;
}

.register-form label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #5c3a3a;
  font-size: 0.85rem;
  letter-spacing: 0.3px;
}

.register-form label i {
  margin-right: 8px;
  font-size: 0.8rem;
  color: #b91c1c;
}

.register-form input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  font-family: inherit;
  background: #ffffff;
}

.register-form input:focus {
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

.register-btn {
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
  margin-top: 0.5rem;
}

.register-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #b91c1c, #991b1b);
  transform: scale(1.02);
  box-shadow: 0 6px 18px rgba(220, 38, 38, 0.4);
}

.register-btn:disabled {
  background: linear-gradient(135deg, #c17a7a, #a86b6b);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.success-message {
  margin-top: 1rem;
  padding: 12px 16px;
  background: linear-gradient(135deg, #fee2e2, #fff0f0);
  color: #b91c1c;
  border-radius: 16px;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 500;
  border-left: 4px solid #dc2626;
  animation: fadeIn 0.3s ease;
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

.fa-spin {
  animation: fa-spin 1s infinite linear;
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.register-footer {
  margin-top: 1.5rem;
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #f0e2e2;
}

.register-footer a {
  color: #b91c1c;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  transition: color 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.register-footer a:hover {
  color: #7f1d1d;
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 500px) {
  .register-card {
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
  
  .register-header h2 {
    font-size: 1.4rem;
  }
  
  .register-form .form-group {
    margin-bottom: 1rem;
  }
  
  .register-form input {
    padding: 10px 14px;
  }
}
</style>
