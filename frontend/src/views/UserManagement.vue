<template>
  <div>
    <div class="card">
      <div class="header-actions">
        <div class="header-left">
          <h3><i class="fas fa-users"></i> User Management</h3>
          <p>Approve, reject, or delete user accounts</p>
        </div>
        <div class="pending-badge" v-if="pendingCount > 0">
          <i class="fas fa-bell"></i> {{ pendingCount }} pending request(s)
        </div>
      </div>
      
      <div class="table-responsive">
        <table class="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" :class="{'pending-row': user.status === 'pending'}">
              <td>{{ user.id }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.full_name }}</td>
              <td>
                <span :class="user.role === 'admin' ? 'role-admin' : 'role-user'">
                  {{ user.role === 'admin' ? 'Admin' : 'User' }}
                </span>
              </td>
              <td>
                <span :class="getStatusClass(user.status)">
                  <i :class="getStatusIcon(user.status)"></i>
                  {{ getStatusText(user.status) }}
                </span>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td class="actions">
                <!-- PENDING: Approve and Reject buttons -->
                <div v-if="user.status === 'pending'" class="action-buttons">
                  <button @click="approveUser(user.id)" class="btn-approve">
                    <i class="fas fa-check"></i> Approve
                  </button>
                  <button @click="rejectUser(user.id)" class="btn-reject">
                    <i class="fas fa-times"></i> Reject
                  </button>
                </div>
                
                <!-- REJECTED: Delete button -->
                <div v-if="user.status === 'rejected'" class="action-buttons">
                  <button @click="deleteUser(user.id)" class="btn-delete">
                    <i class="fas fa-trash"></i> Delete
                  </button>
                </div>
                
                <!-- APPROVED: Delete button (except admin) -->
                <div v-if="user.status === 'approved'" class="action-buttons">
                  <button 
                    v-if="user.username !== 'admin'" 
                    @click="deleteUser(user.id)" 
                    class="btn-delete"
                  >
                    <i class="fas fa-trash"></i> Delete
                  </button>
                  <span v-if="user.username === 'admin'" class="admin-protected">Protected</span>
                </div>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="7" class="empty-row">No users found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'

const axios = inject('axios')
const showToast = inject('showToast')
const showConfirm = inject('showConfirm')

const users = ref([])
const pendingCount = ref(0)

const fetchUsers = async () => {
  try {
    const response = await axios.get('/auth/users')
    users.value = response.data
    pendingCount.value = users.value.filter(u => u.status === 'pending').length
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

const approveUser = async (id) => {
  const confirmed = await showConfirm({
    type: 'info',
    title: 'Approve User',
    message: 'Are you sure you want to approve this user?',
    confirmText: 'Yes, Approve',
    cancelText: 'Cancel'
  })
  
  if (confirmed) {
    try {
      await axios.put(`/auth/users/${id}/approve`)
      showToast('User approved successfully!', 'success')
      await fetchUsers()
    } catch (error) {
      showToast('Error approving user', 'error')
    }
  }
}

const rejectUser = async (id) => {
  const confirmed = await showConfirm({
    type: 'warning',
    title: 'Reject User',
    message: 'Are you sure you want to reject this user?',
    confirmText: 'Yes, Reject',
    cancelText: 'Cancel'
  })
  
  if (confirmed) {
    try {
      await axios.put(`/auth/users/${id}/reject`)
      showToast('User rejected', 'success')
      await fetchUsers()
    } catch (error) {
      showToast('Error rejecting user', 'error')
    }
  }
}

const deleteUser = async (id) => {
  const confirmed = await showConfirm({
    type: 'warning',
    title: 'Delete User',
    message: 'Are you sure you want to delete this user?',
    confirmText: 'Yes, Delete',
    cancelText: 'Cancel'
  })
  
  if (confirmed) {
    try {
      await axios.delete(`/auth/users/${id}`)
      showToast('User deleted successfully!', 'success')
      await fetchUsers()
    } catch (error) {
      showToast('Error deleting user', 'error')
    }
  }
}

const getStatusClass = (status) => {
  const classes = {
    pending: 'status-pending',
    approved: 'status-approved',
    rejected: 'status-rejected'
  }
  return classes[status] || ''
}

const getStatusIcon = (status) => {
  const icons = {
    pending: 'fas fa-clock',
    approved: 'fas fa-check-circle',
    rejected: 'fas fa-times-circle'
  }
  return icons[status] || 'fas fa-question'
}

const getStatusText = (status) => {
  const texts = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected'
  }
  return texts[status] || status
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

onMounted(() => {
  fetchUsers()
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.pending-badge {
  background: #ffc107;
  color: #333;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: bold;
}

.pending-badge i {
  margin-right: 8px;
}

.table-responsive {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  background: #2c3e50;
  color: white;
  padding: 12px;
  text-align: left;
  font-weight: 600;
}

.users-table td {
  padding: 10px;
  border-bottom: 1px solid #e2e8f0;
  color: #2d3748;
}

.pending-row {
  background: #fff3cd;
}

.role-admin {
  background: #dc3545;
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  display: inline-block;
}

.role-user {
  background: #28a745;
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  display: inline-block;
}

.status-pending {
  background: #ffc107;
  color: #333;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  display: inline-block;
}

.status-approved {
  background: #28a745;
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  display: inline-block;
}

.status-rejected {
  background: #dc3545;
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  display: inline-block;
}

.actions {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  gap: 5px;
}

.btn-approve {
  background: #28a745;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
}

.btn-approve:hover {
  background: #1e7e34;
}

.btn-reject {
  background: #dc3545;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
}

.btn-reject:hover {
  background: #bb2d3b;
}

.btn-delete {
  background: #6c757d;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
}

.btn-delete:hover {
  background: #5a6268;
}

.admin-protected {
  background: #17a2b8;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  display: inline-block;
}

.empty-row {
  text-align: center;
  padding: 40px;
  color: #a0aec0;
}
</style>
