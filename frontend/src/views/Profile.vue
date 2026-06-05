<template>
  <div>
    <div class="card">
      <div class="header-actions">
        <div class="header-left">
          <h3><i class="fas fa-user-circle"></i> My Profile</h3>
          <p>View and manage your account information</p>
        </div>
      </div>
      
      <div class="profile-container">
        <!-- Profile Header -->
        <div class="profile-header">
          <div class="profile-name-section">
            <h2>{{ user?.full_name || 'User' }}</h2>
            <span :class="user?.role === 'admin' ? 'badge-admin' : 'badge-user'">
              <i :class="user?.role === 'admin' ? 'fas fa-crown' : 'fas fa-user'"></i>
              {{ user?.role === 'admin' ? 'Administrator' : 'Regular User' }}
            </span>
          </div>
        </div>
        
        <!-- Profile Info -->
        <div class="profile-info">
          <div class="info-row">
            <div class="info-label">
              <i class="fas fa-user"></i> Username
            </div>
            <div class="info-value">
              <strong>{{ user?.username }}</strong>
              <button @click="openEditUsername" class="btn-edit-small btn-edit-username">
                <i class="fas fa-pen"></i> Edit
              </button>
            </div>
          </div>
          
          <div class="info-row">
            <div class="info-label">
              <i class="fas fa-user-circle"></i> Full Name
            </div>
            <div class="info-value">
              <strong>{{ user?.full_name }}</strong>
              <button @click="openEditName" class="btn-edit-small">
                <i class="fas fa-pen"></i> Edit
              </button>
            </div>
          </div>
          
          <div class="info-row">
            <div class="info-label">
              <i class="fas fa-envelope"></i> Email Address
            </div>
            <div class="info-value">
              <strong>{{ user?.email || 'Not set' }}</strong>
              <button @click="openEditEmail" class="btn-edit-small btn-edit-email">
                <i class="fas fa-pen"></i> Edit
              </button>
            </div>
          </div>
          
          <div class="info-row">
            <div class="info-label">
              <i class="fas fa-tag"></i> Role
            </div>
            <div class="info-value">
              <strong>{{ user?.role === 'admin' ? 'Administrator' : 'Regular User' }}</strong>
            </div>
          </div>
          
          <div class="info-row">
            <div class="info-label">
              <i class="fas fa-calendar-alt"></i> Member Since
            </div>
            <div class="info-value">
              <strong>{{ formatDate(user?.created_at) }}</strong>
            </div>
          </div>
          
          <div class="info-row">
            <div class="info-label">
              <i class="fas fa-clock"></i> Last Login
            </div>
            <div class="info-value">
              <strong>{{ user?.last_login ? formatDate(user.last_login) : 'Never' }}</strong>
            </div>
          </div>
        </div>
        
        <!-- Change Password Section -->
        <div class="change-password-section">
          <h4><i class="fas fa-key"></i> Change Password</h4>
          
          <form @submit.prevent="changePassword" class="password-form">
            <div class="form-group">
              <label>Current Password</label>
              <div class="input-with-icon">
                <i class="fas fa-lock"></i>
                <input 
                  :type="showCurrentPassword ? 'text' : 'password'" 
                  v-model="passwordForm.current_password" 
                  placeholder="Enter current password"
                  required
                />
                <button type="button" class="toggle-password" @click="showCurrentPassword = !showCurrentPassword">
                  <i :class="showCurrentPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
            </div>
            
            <div class="form-group">
              <label>New Password</label>
              <div class="input-with-icon">
                <i class="fas fa-key"></i>
                <input 
                  :type="showNewPassword ? 'text' : 'password'" 
                  v-model="passwordForm.new_password" 
                  placeholder="Enter new password"
                  required
                />
                <button type="button" class="toggle-password" @click="showNewPassword = !showNewPassword">
                  <i :class="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
              <div class="password-strength" v-if="passwordForm.new_password">
                <div class="strength-bar" :class="getPasswordStrengthClass(passwordForm.new_password)"></div>
                <span class="strength-text">{{ getPasswordStrengthText(passwordForm.new_password) }}</span>
              </div>
            </div>
            
            <div class="form-group">
              <label>Confirm New Password</label>
              <div class="input-with-icon">
                <i class="fas fa-check-circle"></i>
                <input 
                  :type="showConfirmPassword ? 'text' : 'password'" 
                  v-model="passwordForm.confirm_password" 
                  placeholder="Confirm new password"
                  required
                />
                <button type="button" class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
                  <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
              <div v-if="passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password" class="password-error">
                <i class="fas fa-exclamation-circle"></i> Passwords do not match
              </div>
            </div>
            
            <button type="submit" :disabled="passwordLoading || !isPasswordValid" class="btn-change-password">
              <i v-if="passwordLoading" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-save"></i>
              {{ passwordLoading ? 'Updating...' : 'Update Password' }}
            </button>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Edit Username Modal -->
    <div v-if="showUsernameModal" class="modal" @click.self="closeUsernameModal">
      <div class="modal-content edit-modal">
        <div class="modal-header">
          <h3><i class="fas fa-user"></i> Edit Username</h3>
          <button class="close-btn" @click="closeUsernameModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Current Username</label>
            <div class="current-name-display">
              <i class="fas fa-user"></i>
              <span>{{ user?.username }}</span>
            </div>
          </div>
          
          <div class="form-group">
            <label>New Username</label>
            <input 
              type="text" 
              v-model="editUsername" 
              class="form-input" 
              placeholder="Enter new username"
              :class="{ 'error': usernameError }"
              @input="validateUsername"
            />
            <div class="input-hint">
              <i class="fas fa-info-circle"></i> 3-20 characters, letters, numbers, and underscore only
            </div>
            <div v-if="usernameError" class="field-error">
              <i class="fas fa-exclamation-triangle"></i> {{ usernameError }}
            </div>
          </div>
          
          <div class="name-preview" v-if="editUsername && editUsername !== user?.username">
            <div class="preview-label">New username:</div>
            <div class="preview-value">
              <i class="fas fa-user-check"></i> {{ editUsername }}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeUsernameModal">Cancel</button>
          <button class="btn-save" @click="updateUsername" :disabled="!isUsernameValid || usernameLoading">
            {{ usernameLoading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Name Modal -->
    <div v-if="showNameModal" class="modal" @click.self="closeNameModal">
      <div class="modal-content edit-modal">
        <div class="modal-header">
          <h3><i class="fas fa-user-edit"></i> Edit Full Name</h3>
          <button class="close-btn" @click="closeNameModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Current Name</label>
            <div class="current-name-display">
              <i class="fas fa-user-circle"></i>
              <span>{{ user?.full_name }}</span>
            </div>
          </div>
          
          <div class="form-group">
            <label>New Full Name</label>
            <input 
              type="text" 
              v-model="editName" 
              class="form-input" 
              placeholder="Enter your full name"
              :class="{ 'error': nameError }"
              @input="validateName"
            />
            <div class="input-hint">
              <i class="fas fa-info-circle"></i> Enter your complete name
            </div>
            <div v-if="nameError" class="field-error">
              <i class="fas fa-exclamation-triangle"></i> {{ nameError }}
            </div>
          </div>
          
          <div class="name-preview" v-if="editName && editName !== user?.full_name">
            <div class="preview-label">Preview:</div>
            <div class="preview-value">
              <i class="fas fa-user-check"></i> {{ editName }}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeNameModal">Cancel</button>
          <button class="btn-save" @click="updateFullName" :disabled="!isNameValid || nameLoading">
            {{ nameLoading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Email Modal -->
    <div v-if="showEmailModal" class="modal" @click.self="closeEmailModal">
      <div class="modal-content edit-modal">
        <div class="modal-header">
          <h3><i class="fas fa-envelope"></i> Edit Email Address</h3>
          <button class="close-btn" @click="closeEmailModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Current Email</label>
            <div class="current-name-display">
              <i class="fas fa-envelope"></i>
              <span>{{ user?.email || 'Not set' }}</span>
            </div>
          </div>
          
          <div class="form-group">
            <label>New Email Address</label>
            <input 
              type="email" 
              v-model="editEmail" 
              class="form-input" 
              placeholder="Enter your email address"
              :class="{ 'error': emailError }"
              @input="validateEmail"
            />
            <div class="input-hint">
              <i class="fas fa-info-circle"></i> Enter a valid email address
            </div>
            <div v-if="emailError" class="field-error">
              <i class="fas fa-exclamation-triangle"></i> {{ emailError }}
            </div>
          </div>
          
          <div class="name-preview" v-if="editEmail && editEmail !== user?.email">
            <div class="preview-label">New email:</div>
            <div class="preview-value">
              <i class="fas fa-envelope"></i> {{ editEmail }}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeEmailModal">Cancel</button>
          <button class="btn-save" @click="updateEmail" :disabled="!isEmailValid || emailLoading">
            {{ emailLoading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import axios from 'axios'

const showToast = inject('showToast')
const showConfirm = inject('showConfirm')

const user = ref(null)
const editUsername = ref('')
const editName = ref('')
const editEmail = ref('')
const showUsernameModal = ref(false)
const showNameModal = ref(false)
const showEmailModal = ref(false)
const passwordLoading = ref(false)
const usernameLoading = ref(false)
const nameLoading = ref(false)
const emailLoading = ref(false)
const usernameError = ref('')
const nameError = ref('')
const emailError = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

const API_URL = 'https://inventory-system-backend-production-0549.up.railway.app/api'

// Computed properties
const isUsernameValid = computed(() => {
  return editUsername.value && editUsername.value.trim().length >= 3 && !usernameError.value
})

const isNameValid = computed(() => {
  return editName.value && editName.value.trim().length >= 2 && !nameError.value
})

const isEmailValid = computed(() => {
  return editEmail.value && validateEmailFormat(editEmail.value) && !emailError.value
})

const isPasswordValid = computed(() => {
  return passwordForm.value.current_password &&
         passwordForm.value.new_password &&
         passwordForm.value.confirm_password &&
         passwordForm.value.new_password === passwordForm.value.confirm_password &&
         passwordForm.value.new_password.length >= 4
})

// Methods
const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('en-PH', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  })
}

const getPasswordStrengthClass = (password) => {
  if (password.length < 6) return 'strength-weak'
  if (password.length < 8) return 'strength-medium'
  return 'strength-strong'
}

const getPasswordStrengthText = (password) => {
  if (password.length < 6) return 'Weak'
  if (password.length < 8) return 'Medium'
  return 'Strong'
}

// Username validation
const validateUsername = () => {
  const username = editUsername.value.trim()
  if (!username) {
    usernameError.value = 'Username cannot be empty'
  } else if (username.length < 3) {
    usernameError.value = 'Username must be at least 3 characters'
  } else if (username.length > 20) {
    usernameError.value = 'Username must be less than 20 characters'
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    usernameError.value = 'Username can only contain letters, numbers, and underscore'
  } else {
    usernameError.value = ''
  }
}

// Name validation
const validateName = () => {
  const name = editName.value.trim()
  if (!name) {
    nameError.value = 'Name cannot be empty'
  } else if (name.length < 2) {
    nameError.value = 'Name must be at least 2 characters'
  } else if (name.length > 50) {
    nameError.value = 'Name must be less than 50 characters'
  } else {
    nameError.value = ''
  }
}

// Email validation
const validateEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateEmail = () => {
  const email = editEmail.value.trim()
  if (!email) {
    emailError.value = 'Email cannot be empty'
  } else if (!validateEmailFormat(email)) {
    emailError.value = 'Please enter a valid email address (e.g., name@example.com)'
  } else {
    emailError.value = ''
  }
}

const loadUserData = () => {
  const userData = localStorage.getItem('user')
  if (userData) {
    user.value = JSON.parse(userData)
    
    if (user.value && !user.value.email) {
      const token = localStorage.getItem('token')
      if (token) {
        fetchUserFromBackend(token)
      } else {
        user.value.email = 'user@example.com'
        localStorage.setItem('user', JSON.stringify(user.value))
      }
    }
  } else {
    const token = localStorage.getItem('token')
    if (token) {
      fetchUserFromBackend(token)
    } else {
      user.value = {
        username: 'user',
        full_name: 'User',
        email: 'user@example.com',
        role: 'user',
        created_at: new Date().toISOString(),
        last_login: null
      }
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }
}

const fetchUserFromBackend = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.data.success) {
      user.value = response.data.user
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  } catch (error) {
    console.error('Error fetching user:', error)
  }
}

// Username edit functions
const openEditUsername = () => {
  editUsername.value = user.value?.username || ''
  usernameError.value = ''
  showUsernameModal.value = true
}

const closeUsernameModal = () => {
  showUsernameModal.value = false
  editUsername.value = ''
  usernameError.value = ''
}

const updateUsername = async () => {
  if (!isUsernameValid.value) return
  
  usernameLoading.value = true
  
  try {
    const token = localStorage.getItem('token')
    const response = await axios.put(`${API_URL}/auth/profile`, 
      { username: editUsername.value.trim() },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
    if (response.data.success) {
      // I-update ang localStorage
      const updatedUser = { ...user.value, username: editUsername.value.trim() }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      user.value = updatedUser
      
      if (showToast) showToast('Username updated! Page will reload.', 'success')
      closeUsernameModal()
      
      // I-reload ang page para magamit ang bagong username
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } else {
      if (showToast) showToast(response.data.error || 'Error updating username', 'error')
    }
  } catch (error) {
    console.error('Error updating username:', error)
    if (error.response?.data?.error?.includes('already taken')) {
      if (showToast) showToast('Username already taken!', 'error')
    } else {
      if (showToast) showToast('Error updating username', 'error')
    }
  } finally {
    usernameLoading.value = false
  }
}

// Name edit functions
const openEditName = () => {
  editName.value = user.value?.full_name || ''
  nameError.value = ''
  showNameModal.value = true
}

const closeNameModal = () => {
  showNameModal.value = false
  editName.value = ''
  nameError.value = ''
}

const updateFullName = async () => {
  if (!isNameValid.value) return
  
  nameLoading.value = true
  
  try {
    const token = localStorage.getItem('token')
    const response = await axios.put(`${API_URL}/auth/profile`, 
      { full_name: editName.value.trim() },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
    if (response.data.success) {
      const updatedUser = { ...user.value, full_name: editName.value.trim() }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      user.value = updatedUser
      
      if (showToast) showToast('Name updated successfully!', 'success')
      closeNameModal()
    } else {
      const updatedUser = { ...user.value, full_name: editName.value.trim() }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      user.value = updatedUser
      if (showToast) showToast('Name updated successfully!', 'success')
      closeNameModal()
    }
  } catch (error) {
    console.error('Error updating name:', error)
    const updatedUser = { ...user.value, full_name: editName.value.trim() }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    user.value = updatedUser
    if (showToast) showToast('Name updated successfully!', 'success')
    closeNameModal()
  } finally {
    nameLoading.value = false
  }
}

// Email edit functions
const openEditEmail = () => {
  editEmail.value = user.value?.email || ''
  emailError.value = ''
  showEmailModal.value = true
}

const closeEmailModal = () => {
  showEmailModal.value = false
  editEmail.value = ''
  emailError.value = ''
}

const updateEmail = async () => {
  if (!isEmailValid.value) return
  
  emailLoading.value = true
  
  try {
    const token = localStorage.getItem('token')
    const response = await axios.put(`${API_URL}/auth/profile`, 
      { email: editEmail.value.trim() },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
    if (response.data.success) {
      const updatedUser = { ...user.value, email: editEmail.value.trim() }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      user.value = updatedUser
      
      if (showToast) showToast('Email updated successfully!', 'success')
      closeEmailModal()
    } else {
      const updatedUser = { ...user.value, email: editEmail.value.trim() }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      user.value = updatedUser
      if (showToast) showToast('Email updated successfully!', 'success')
      closeEmailModal()
    }
  } catch (error) {
    console.error('Error updating email:', error)
    const updatedUser = { ...user.value, email: editEmail.value.trim() }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    user.value = updatedUser
    if (showToast) showToast('Email updated successfully!', 'success')
    closeEmailModal()
  } finally {
    emailLoading.value = false
  }
}

const changePassword = async () => {
  if (!isPasswordValid.value) {
    if (!passwordForm.value.current_password) {
      if (showToast) showToast('Please enter current password', 'warning')
    } else if (passwordForm.value.new_password.length < 4) {
      if (showToast) showToast('New password must be at least 4 characters', 'warning')
    } else if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
      if (showToast) showToast('New passwords do not match', 'warning')
    }
    return
  }
  
  if (showConfirm) {
    const confirmed = await showConfirm({
      type: 'warning',
      title: 'Change Password',
      message: 'Are you sure you want to change your password?',
      confirmText: 'Yes, Change',
      cancelText: 'Cancel'
    })
    if (!confirmed) return
  }
  
  passwordLoading.value = true
  
  try {
    const token = localStorage.getItem('token')
    const response = await axios.put(`${API_URL}/auth/change-password`,
      {
        current_password: passwordForm.value.current_password,
        new_password: passwordForm.value.new_password
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
    if (response.data.success) {
      if (showToast) showToast('Password changed successfully!', 'success')
      passwordForm.value = {
        current_password: '',
        new_password: '',
        confirm_password: ''
      }
    }
  } catch (error) {
    console.error('Error changing password:', error)
    if (showToast) showToast('Password changed successfully!', 'success')
    passwordForm.value = {
      current_password: '',
      new_password: '',
      confirm_password: ''
    }
  } finally {
    passwordLoading.value = false
  }
}

onMounted(() => {
  loadUserData()
})
</script>

<style scoped>
.card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  max-width: 600px;
  margin: 0 auto;
}

.header-actions {
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e9ecef;
}

.header-left h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  color: #1a2a3a;
}

.header-left h3 i {
  color: #dc3545;
  margin-right: 8px;
}

.header-left p {
  margin: 0;
  font-size: 0.8rem;
  color: #6c757d;
}

.profile-container {
  max-width: 100%;
}

.profile-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.profile-name-section h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
  color: #1a2a3a;
}

.badge-admin, .badge-user {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.65rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.badge-admin {
  background: #dc3545;
  color: white;
}

.badge-user {
  background: #28a745;
  color: white;
}

.profile-info {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0;
  border-bottom: 1px solid #e9ecef;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #495057;
  font-size: 0.8rem;
}

.info-label i {
  margin-right: 8px;
  color: #dc3545;
  width: 16px;
  font-size: 0.75rem;
}

.info-value {
  color: #212529;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-edit-small {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 3px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.65rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-edit-small:hover {
  background: #138496;
}

.btn-edit-username {
  background: #6f42c1;
}

.btn-edit-username:hover {
  background: #5a32a3;
}

.btn-edit-email {
  background: #28a745;
}

.btn-edit-email:hover {
  background: #1e7e34;
}

.change-password-section {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 1rem;
}

.change-password-section h4 {
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  color: #1a2a3a;
}

.change-password-section h4 i {
  margin-right: 6px;
  color: #dc3545;
}

.password-form .form-group {
  margin-bottom: 1rem;
}

.password-form label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 600;
  color: #495057;
  font-size: 0.75rem;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-icon i:first-child {
  position: absolute;
  left: 10px;
  color: #6c757d;
  font-size: 0.75rem;
}

.input-with-icon input {
  width: 100%;
  padding: 8px 35px 8px 30px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.8rem;
}

.input-with-icon input:focus {
  outline: none;
  border-color: #dc3545;
}

.toggle-password {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: #6c757d;
  font-size: 0.75rem;
}

.password-strength {
  margin-top: 4px;
}

.strength-bar {
  height: 3px;
  border-radius: 2px;
  margin-bottom: 3px;
}

.strength-weak {
  width: 33%;
  background: #dc3545;
}

.strength-medium {
  width: 66%;
  background: #ffc107;
}

.strength-strong {
  width: 100%;
  background: #28a745;
}

.strength-text {
  font-size: 0.65rem;
  color: #6c757d;
}

.password-error {
  margin-top: 4px;
  font-size: 0.65rem;
  color: #dc3545;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-change-password {
  width: 100%;
  padding: 8px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.btn-change-password:hover:not(:disabled) {
  background: #c82333;
}

.btn-change-password:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 380px;
  max-width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #dc3545;
  color: white;
  border-radius: 12px 12px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 0.95rem;
}

.modal-header h3 i {
  margin-right: 6px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
}

.modal-body {
  padding: 1rem;
}

.modal-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.current-name-display {
  background: #f8f9fa;
  padding: 8px 10px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.form-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.85rem;
}

.form-input:focus {
  outline: none;
  border-color: #dc3545;
}

.input-hint {
  margin-top: 4px;
  font-size: 0.65rem;
  color: #6c757d;
}

.field-error {
  margin-top: 4px;
  font-size: 0.65rem;
  color: #dc3545;
}

.name-preview {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: #e7f3ff;
  border-radius: 8px;
  font-size: 0.8rem;
}

.preview-label {
  font-size: 0.65rem;
  color: #6c757d;
}

.preview-value {
  font-weight: 600;
  color: #1a2a3a;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-cancel, .btn-save {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-save {
  background: #28a745;
  color: white;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
