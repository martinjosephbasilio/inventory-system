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
        <!-- Profile Avatar -->
        <div class="profile-avatar">
          <div class="avatar-circle">
            <i class="fas fa-user"></i>
          </div>
          <div class="avatar-info">
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
            </div>
          </div>
          
          <div class="info-row">
            <div class="info-label">
              <i class="fas fa-user-circle"></i> Full Name
            </div>
            <div class="info-value">
              <strong>{{ user?.full_name }}</strong>
              <button @click="openEditName" class="btn-edit-small">
                <i class="fas fa-edit"></i> Edit
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
              <input 
                type="password" 
                v-model="passwordForm.current_password" 
                placeholder="Enter current password"
                required
              />
            </div>
            
            <div class="form-group">
              <label>New Password</label>
              <input 
                type="password" 
                v-model="passwordForm.new_password" 
                placeholder="Enter new password"
                required
              />
            </div>
            
            <div class="form-group">
              <label>Confirm New Password</label>
              <input 
                type="password" 
                v-model="passwordForm.confirm_password" 
                placeholder="Confirm new password"
                required
              />
            </div>
            
            <button type="submit" :disabled="passwordLoading" class="btn-change-password">
              <i v-if="passwordLoading" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-save"></i>
              {{ passwordLoading ? 'Updating...' : 'Update Password' }}
            </button>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Edit Name Modal -->
    <div v-if="showNameModal" class="modal" @click.self="showNameModal = false">
      <div class="modal-content edit-modal">
        <div class="modal-header">
          <h3><i class="fas fa-edit"></i> Edit Full Name</h3>
          <button class="close-btn" @click="showNameModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" v-model="editName" class="form-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showNameModal = false">Cancel</button>
          <button class="btn-save" @click="updateFullName">Save Changes</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import axios from 'axios'

const showToast = inject('showToast')
const showConfirm = inject('showConfirm')

const user = ref(null)
const editName = ref('')
const showNameModal = ref(false)
const passwordLoading = ref(false)

const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

const API_URL = 'http://localhost:3000/api'

const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
}

const loadUserData = () => {
  const userData = localStorage.getItem('user')
  if (userData) {
    user.value = JSON.parse(userData)
  }
}

const openEditName = () => {
  editName.value = user.value?.full_name || ''
  showNameModal.value = true
}

const updateFullName = async () => {
  if (!editName.value.trim()) {
    showToast('Please enter a valid name', 'warning')
    return
  }
  
  try {
    const token = localStorage.getItem('token')
    const response = await axios.put(`${API_URL}/auth/profile`, 
      { full_name: editName.value },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
    if (response.data.success) {
      // Update local storage
      const updatedUser = { ...user.value, full_name: editName.value }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      user.value = updatedUser
      
      showToast('Name updated successfully!', 'success')
      showNameModal.value = false
    }
  } catch (error) {
    console.error('Error updating name:', error)
    showToast(error.response?.data?.error || 'Error updating name', 'error')
  }
}

const changePassword = async () => {
  if (!passwordForm.value.current_password) {
    showToast('Please enter current password', 'warning')
    return
  }
  
  if (passwordForm.value.new_password.length < 4) {
    showToast('New password must be at least 4 characters', 'warning')
    return
  }
  
  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    showToast('New passwords do not match', 'warning')
    return
  }
  
  const confirmed = await showConfirm({
    type: 'warning',
    title: 'Change Password',
    message: 'Are you sure you want to change your password?',
    confirmText: 'Yes, Change',
    cancelText: 'Cancel'
  })
  
  if (!confirmed) return
  
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
      showToast('Password changed successfully!', 'success')
      passwordForm.value = {
        current_password: '',
        new_password: '',
        confirm_password: ''
      }
    }
  } catch (error) {
    console.error('Error changing password:', error)
    showToast(error.response?.data?.error || 'Error changing password', 'error')
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
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.header-actions {
  margin-bottom: 1.5rem;
}

.header-left h3 {
  margin-bottom: 0.25rem;
  color: #1a2a3a;
}

.header-left h3 i {
  color: #2c3e50;
  margin-right: 8px;
}

.header-left p {
  color: #666;
  font-size: 0.85rem;
}

.profile-container {
  max-width: 600px;
  margin: 0 auto;
}

.profile-avatar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.avatar-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #dc3545, #c82333);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-circle i {
  font-size: 2.5rem;
  color: white;
}

.avatar-info h2 {
  margin-bottom: 0.25rem;
  color: #1a2a3a;
}

.badge-admin {
  background: #dc3545;
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.badge-user {
  background: #28a745;
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.profile-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #4a5568;
}

.info-label i {
  margin-right: 8px;
  color: #2c3e50;
}

.info-value {
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-edit-small {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
}

.btn-edit-small:hover {
  background: #138496;
}

.change-password-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

.change-password-section h4 {
  margin-bottom: 1rem;
  color: #1a2a3a;
}

.change-password-section h4 i {
  margin-right: 8px;
  color: #2c3e50;
}

.password-form .form-group {
  margin-bottom: 1rem;
}

.password-form label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 600;
  color: #4a5568;
}

.password-form input {
  width: 100%;
  padding: 8px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
}

.password-form input:focus {
  outline: none;
  border-color: #2c3e50;
}

.btn-change-password {
  background: #2c3e50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;
}

.btn-change-password:hover {
  background: #1a252f;
}

/* Modal */
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
  width: 450px;
  max-width: 95%;
}

.edit-modal {
  width: 450px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #2c3e50;
  color: white;
  border-radius: 12px 12px 0 0;
}

.modal-header h3 i {
  margin-right: 8px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  background: #718096;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-save {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}
</style>