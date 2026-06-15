<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <i class="fas fa-lock"></i>
        <h2>Reset Password</h2>
        <p>Enter your new password</p>
      </div>
      
      <div class="login-form">
        <div class="form-group">
          <label>New Password</label>
          <input type="password" v-model="password" placeholder="Enter new password" />
        </div>
        
        <div class="form-group">
          <label>Confirm Password</label>
          <input type="password" v-model="confirmPassword" placeholder="Confirm new password" />
        </div>
        
        <button @click="resetPassword" :disabled="loading" class="login-btn">
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-save"></i>
          {{ loading ? 'Resetting...' : 'Reset Password' }}
        </button>
      </div>
      
      <div v-if="message" class="success-message">
        <i class="fas fa-check-circle"></i> {{ message }}
      </div>
      
      <div v-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i> {{ error }}
      </div>
      
      <div class="login-footer">
        <router-link to="/login">← Back to Login</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const message = ref('')
const error = ref('')
const token = ref('')

const API_URL = 'https://inventory-system-backend-production-0549.up.railway.app/api'

onMounted(() => {
  token.value = route.query.token
  if (!token.value) {
    error.value = 'Invalid reset link. Please request a new one.'
  }
})

const resetPassword = async () => {
  if (!password.value) {
    error.value = 'Please enter new password'
    return
  }
  
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }
  
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }
  
  loading.value = true
  message.value = ''
  error.value = ''
  
  try {
    const response = await axios.post(`${API_URL}/auth/reset-password`, {
      token: token.value,
      newPassword: password.value
    })
    
    message.value = response.data.message || 'Password reset successful!'
    
    setTimeout(() => {
      router.push('/login')
    }, 3000)
    
  } catch (err) {
    error.value = err.response?.data?.error || 'Invalid or expired token'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Same styles as ForgotPassword.vue */
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

.success-message {
  margin-top: 1rem;
  padding: 12px;
  background: #d4edda;
  color: #155724;
  border-radius: 8px;
  text-align: center;
}

.error-message {
  margin-top: 1rem;
  padding: 12px;
  background: #f8d7da;
  color: #dc3545;
  border-radius: 8px;
  text-align: center;
}

.login-footer {
  margin-top: 1rem;
  text-align: center;
}

.login-footer a {
  color: #28a745;
  text-decoration: none;
}
</style>