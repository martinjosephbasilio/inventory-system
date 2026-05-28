<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <i class="fas fa-box"></i>
        <h2>Create New Account</h2>
        <p>Sign up to get started</p>
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
  <input type="email" v-model="email" placeholder="Enter your email" required />
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
          <input 
            type="password" 
            v-model="password" 
            placeholder="Enter password"
            required
          />
        </div>
        
        <div class="form-group">
          <label><i class="fas fa-lock"></i> Confirm Password</label>
          <input 
            type="password" 
            v-model="confirm_password" 
            placeholder="Confirm password"
            required
          />
        </div>
        
        <button type="submit" :disabled="loading" class="register-btn">
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-user-plus"></i>
          {{ loading ? 'Creating...' : 'Create Account' }}
        </button>
      </form>
      
      <div v-if="successMessage" class="success-message">
        <i class="fas fa-check-circle"></i> {{ successMessage }}
      </div>
      
      <div v-if="errorMessage" class="error-message">
        <i class="fas fa-exclamation-circle"></i> {{ errorMessage }}
      </div>
      
      <div class="register-footer">
        <router-link to="/login">← Back to Login</router-link>
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
const full_name = ref('')
const password = ref('')
const confirm_password = ref('')
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const API_URL = 'http://localhost:3000/api'

const handleRegister = async () => {
  // Clear previous messages
  errorMessage.value = ''
  successMessage.value = ''
  
  // Validation
  if (!username.value || !full_name.value || !password.value) {
    errorMessage.value = 'Please fill in all fields'
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
.register-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1a2a3a 0%, #0d1b2a 100%);
}

.register-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  width: 450px;
  max-width: 90%;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}

.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.register-header i {
  font-size: 3rem;
  color: #28a745;
  margin-bottom: 1rem;
}

.register-header h2 {
  color: #1a2a3a;
  margin-bottom: 0.25rem;
}

.register-header p {
  color: #666;
  font-size: 0.85rem;
}

.register-form .form-group {
  margin-bottom: 1.5rem;
}

.register-form label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #333;
}

.register-form label i {
  margin-right: 8px;
  color: #28a745;
}

.register-form input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.register-form input:focus {
  outline: none;
  border-color: #28a745;
  box-shadow: 0 0 0 2px rgba(40,167,69,0.1);
}

.register-btn {
  width: 100%;
  padding: 12px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.register-btn:hover {
  background: #1e7e34;
}

.register-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.success-message {
  margin-top: 1rem;
  padding: 10px;
  background: #d4edda;
  color: #155724;
  border-radius: 8px;
  text-align: center;
  font-size: 0.85rem;
}

.error-message {
  margin-top: 1rem;
  padding: 10px;
  background: #f8d7da;
  color: #dc3545;
  border-radius: 8px;
  text-align: center;
  font-size: 0.85rem;
}

.register-footer {
  margin-top: 1.5rem;
  text-align: center;
}

.register-footer a {
  color: #28a745;
  text-decoration: none;
}

.register-footer a:hover {
  text-decoration: underline;
}
</style>