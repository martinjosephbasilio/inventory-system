<template>
  <div>
    <div class="card">
      <div class="header-actions">
        <h3><i class="fas fa-industry"></i> Raw Materials Usage</h3>
        <p>Monitor all raw materials consumption - Rolls, Ink, Chemicals, and Supplies</p>
      </div>

      <!-- Summary Stats -->
      <div class="stats-grid">
        <div class="stat-card" v-for="stat in summaryStats" :key="stat.label">
          <div class="stat-icon"><i :class="stat.icon"></i></div>
          <div class="stat-info">
            <h4>{{ stat.label }}</h4>
            <div class="value">{{ stat.value }} <span class="unit">{{ stat.unit }}</span></div>
            <small>{{ stat.subLabel }}</small>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button @click="openModal('RECEIVED')" class="quick-btn received-btn">
          <i class="fas fa-arrow-down"></i> Receive Materials
        </button>
        <button @click="openModal('USED')" class="quick-btn used-btn">
          <i class="fas fa-arrow-up"></i> Use Materials
        </button>
        <button @click="openModal('WASTE')" class="quick-btn waste-btn">
          <i class="fas fa-trash-alt"></i> Report Waste
        </button>
        <button @click="refreshData" class="quick-btn refresh-btn">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      <!-- Filters + Search -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-group">
            <label>Category:</label>
            <select v-model="filters.category" class="filter-input">
              <option value="">All Categories</option>
              <option value="Rolls">Rolls</option>
              <option value="Ink">Ink</option>
              <option value="Chemicals">Chemicals</option>
              <option value="Supplies">Supplies</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Action:</label>
            <select v-model="filters.action" class="filter-input">
              <option value="">All</option>
              <option value="RECEIVED">Received</option>
              <option value="USED">Used</option>
              <option value="WASTE">Waste</option>
            </select>
          </div>
          <div class="filter-group search-group">
            <label><i class="fas fa-search"></i> Search:</label>
            <div class="search-wrapper">
              <input type="text" v-model="searchQuery" placeholder="Search material name..." class="filter-input search-input" />
              <button @click="clearSearch" class="btn-clear-search" v-if="searchQuery">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <button @click="clearFilters" class="btn-clear">
            <i class="fas fa-eraser"></i> Clear
          </button>
        </div>
        <div class="search-results" v-if="searchQuery && filteredItems.length > 0">
          <i class="fas fa-search"></i> Found <strong>{{ filteredItems.length }}</strong> result(s) for "<strong>{{ searchQuery }}</strong>"
        </div>
        <div class="search-results no-results" v-if="searchQuery && filteredItems.length === 0">
          <i class="fas fa-exclamation-circle"></i> No results found for "<strong>{{ searchQuery }}</strong>"
        </div>
      </div>

      <!-- Materials Table -->
      <div class="table-responsive">
        <table class="materials-table">
          <thead>
            <tr>
              <th>DATE</th>
              <th>MATERIAL</th>
              <th>CATEGORY</th>
              <th>ACTION</th>
              <th>QTY</th>
              <th>UNIT</th>
              <th>REMARKS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredItems" :key="item.id">
              <td>{{ formatDate(item.datetime) }}</td>
              <td><strong>{{ item.material_type || item.item_name }}</strong></td>
              <td>
                <span :class="['category-badge', getCategoryClass(item.material_category || getCategoryFromNote(item.note))]">
                  {{ item.material_category || getCategoryFromNote(item.note) || 'Uncategorized' }}
                </span>
              </td>
              <td>
                <span :class="getActionClass(item.action_type || item.type)">
                  {{ getActionLabel(item.action_type || item.type) }}
                </span>
              </td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.material_unit || item.unit || 'pcs' }}</td>
              <td>{{ item.note || '-' }}</td>
              <td>
                <button @click="deleteRecord(item.id)" class="btn-delete" title="Delete">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
            <tr v-if="filteredItems.length === 0">
              <td colspan="8" class="empty-row">
                <i class="fas fa-inbox"></i> No records found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL -->
    <div v-if="showModal" class="modal" @click.self="showModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>
            <i :class="getModalIcon()"></i>
            {{ getModalTitle() }}
          </h3>
          <button class="close-btn" @click="showModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Category:</label>
            <select v-model="form.category" class="form-input">
              <option value="Rolls">Rolls</option>
              <option value="Ink">Ink</option>
              <option value="Chemicals">Chemicals</option>
              <option value="Supplies">Supplies</option>
            </select>
          </div>

          <div class="form-group">
            <label>Material Name:</label>
            <input type="text" v-model="form.materialName" placeholder="e.g., Black Ink, Plastic Roll" class="form-input" />
          </div>

          <div class="form-group">
            <label>Quantity:</label>
            <input type="number" v-model.number="form.quantity" min="1" class="form-input" />
          </div>

          <div class="form-group">
            <label>Unit:</label>
            <select v-model="form.unit" class="form-input">
              <option value="rolls">Rolls</option>
              <option value="liters">Liters</option>
              <option value="kg">Kilograms</option>
              <option value="pcs">Pieces</option>
              <option value="bottles">Bottles</option>
            </select>
          </div>

          <div class="form-group" v-if="form.action === 'USED'">
            <label>Used For:</label>
            <input type="text" v-model="form.usedFor" placeholder="e.g., Packaging Line 1" class="form-input" />
          </div>

          <div class="form-group" v-if="form.action === 'WASTE'">
            <label>Waste Reason:</label>
            <select v-model="form.wasteReason" class="form-input">
              <option value="Damaged">Damaged</option>
              <option value="Expired">Expired</option>
              <option value="Defective">Defective</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div class="form-group">
            <label>Remarks:</label>
            <input type="text" v-model="form.remarks" placeholder="Additional notes" class="form-input" />
          </div>

          <div class="preview">
            <strong>Preview:</strong>
            <p>
              <i :class="form.action === 'RECEIVED' ? 'fas fa-plus-circle text-success' : form.action === 'USED' ? 'fas fa-minus-circle text-warning' : 'fas fa-trash-alt text-danger'"></i>
              {{ getModalAction() }} <strong>{{ form.quantity || 0 }}</strong> {{ form.unit || 'pcs' }} of {{ form.materialName || 'material' }}
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showModal = false">Cancel</button>
          <button class="btn-save" @click="saveRecord">Confirm</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useInventoryStore } from '../stores/inventory'
import { useAuthStore } from '../stores/auth'
import { ref, computed, onMounted, inject } from 'vue'
import axios from 'axios'

const store = useInventoryStore()
const authStore = useAuthStore()
const showToast = inject('showToast')
const showConfirm = inject('showConfirm')

const API_URL = 'https://inventory-system-backend-production-0549.up.railway.app/api'

const materials = ref([])
const searchQuery = ref('')
const filters = ref({
  category: '',
  action: ''
})
const showModal = ref(false)
const form = ref({
  action: 'RECEIVED',
  category: 'Rolls',
  materialName: '',
  quantity: 1,
  unit: 'rolls',
  usedFor: '',
  wasteReason: '',
  remarks: ''
})

// Summary Stats
const summaryStats = computed(() => {
  const received = materials.value.filter(m => m.action_type === 'RECEIVED' || m.type === 'RECEIVED')
  const used = materials.value.filter(m => m.action_type === 'USED' || m.type === 'USED')
  const waste = materials.value.filter(m => m.action_type === 'WASTE' || m.type === 'WASTE')
  
  const totalReceived = received.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0)
  const totalUsed = used.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0)
  const totalWaste = waste.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0)
  
  return [
    { label: 'Total Received', value: totalReceived, unit: 'units', icon: 'fas fa-arrow-down', subLabel: 'All purchases' },
    { label: 'Total Used', value: totalUsed, unit: 'units', icon: 'fas fa-arrow-up', subLabel: 'Production consumption' },
    { label: 'Total Waste', value: totalWaste, unit: 'units', icon: 'fas fa-trash-alt', subLabel: 'Damaged/Expired' },
    { label: 'Remaining', value: totalReceived - totalUsed - totalWaste, unit: 'units', icon: 'fas fa-boxes', subLabel: 'Available inventory' }
  ]
})

const filteredItems = computed(() => {
  let result = materials.value
  
  // ✅ I-filter: Raw Materials lang dapat (RECEIVED, USED, WASTE)
  // At dapat may MAT- prefix ang item_id
  result = result.filter(m => {
    // I-check kung ang type ay raw materials
    const isRawMaterialType = m.type === 'RECEIVED' || m.type === 'USED' || m.type === 'WASTE'
    // I-check kung ang item_id ay nagsisimula sa MAT-
    const hasMatPrefix = m.item_id && m.item_id.startsWith('MAT-')
    
    // O kaya i-check kung ang item_name ay nasa listahan ng raw materials
    const rawMaterialNames = ['Roll', 'Rolls', 'Ink', 'Chemicals', 'Supplies']
    const isRawMaterialName = rawMaterialNames.some(name => 
      m.item_name && m.item_name.toLowerCase().includes(name.toLowerCase())
    )
    
    return isRawMaterialType || hasMatPrefix || isRawMaterialName
  })
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(m => {
      const name = (m.material_type || m.item_name || '').toLowerCase()
      const note = (m.note || '').toLowerCase()
      return name.includes(query) || note.includes(query)
    })
  }
  
  // Apply category filter
  if (filters.value.category) {
    result = result.filter(m => {
      const cat = m.material_category || getCategoryFromNote(m.note)
      return cat === filters.value.category
    })
  }
  
  // Apply action filter
  if (filters.value.action) {
    result = result.filter(m => (m.action_type || m.type) === filters.value.action)
  }
  
  return result
})

// Helper functions
const formatDate = (datetime) => {
  if (!datetime) return '-'
  try {
    const d = new Date(datetime)
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return datetime
  }
}

const getCategoryClass = (category) => {
  const classes = {
    'Rolls': 'cat-rolls',
    'Ink': 'cat-ink',
    'Chemicals': 'cat-chemicals',
    'Supplies': 'cat-supplies'
  }
  return classes[category] || 'cat-other'
}

const getActionClass = (action) => {
  const classes = {
    'RECEIVED': 'badge-received',
    'USED': 'badge-used',
    'WASTE': 'badge-waste'
  }
  return classes[action] || 'badge-other'
}

const getActionLabel = (action) => {
  const labels = {
    'RECEIVED': 'Received',
    'USED': 'Used',
    'WASTE': 'Waste'
  }
  return labels[action] || action
}

const getCategoryFromNote = (note) => {
  if (!note) return 'Uncategorized'
  const match = note.match(/\[(.*?)\]/)
  return match ? match[1] : 'Uncategorized'
}

const getModalIcon = () => {
  const icons = {
    'RECEIVED': 'fas fa-arrow-down',
    'USED': 'fas fa-arrow-up',
    'WASTE': 'fas fa-trash-alt'
  }
  return icons[form.value.action] || 'fas fa-box'
}

const getModalTitle = () => {
  const titles = {
    'RECEIVED': 'Receive Materials',
    'USED': 'Use Materials',
    'WASTE': 'Report Waste'
  }
  return titles[form.value.action] || 'Material Movement'
}

const getModalAction = () => {
  const actions = {
    'RECEIVED': 'Receive',
    'USED': 'Use',
    'WASTE': 'Report waste for'
  }
  return actions[form.value.action] || 'Process'
}

const clearSearch = () => {
  searchQuery.value = ''
}

const loadData = async () => {
  try {
    const token = authStore.getToken()
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    const response = await axios.get(`${API_URL}/movements`)
    materials.value = response.data || []
  } catch (error) {
    console.error('Error loading materials:', error)
    if (showToast) showToast('Error loading data', 'error')
  }
}

const refreshData = () => {
  loadData()
  if (showToast) showToast('Data refreshed!', 'success')
}

const clearFilters = () => {
  filters.value = {
    category: '',
    action: ''
  }
  searchQuery.value = ''
}

const openModal = (action) => {
  form.value = {
    action: action,
    category: 'Rolls',
    materialName: '',
    quantity: 1,
    unit: 'rolls',
    usedFor: '',
    wasteReason: '',
    remarks: ''
  }
  showModal.value = true
}

const saveRecord = async () => {
  if (!form.value.materialName || form.value.materialName.trim() === '') {
    if (showToast) showToast('Please enter material name', 'warning')
    return
  }
  if (!form.value.quantity || form.value.quantity <= 0) {
    if (showToast) showToast('Please enter valid quantity', 'warning')
    return
  }

  const confirmed = await showConfirm({
    type: form.value.action === 'RECEIVED' ? 'info' : 'warning',
    title: 'Confirm',
    message: `${getModalAction()} ${form.value.quantity} ${form.value.unit} of ${form.value.materialName}?`,
    confirmText: 'Yes',
    cancelText: 'Cancel'
  })

  if (!confirmed) return

  const now = new Date()
  const datetime = now.toISOString().slice(0, 19).replace('T', ' ')

  const noteValue = `[${form.value.category}] ${form.value.remarks || ''}`

  const movement = {
    datetime: datetime,
    type: form.value.action,
    item_id: 'MAT-' + Date.now(),
    item_name: form.value.materialName,
    quantity: Number(form.value.quantity),
    unit: form.value.unit,
    base_delta: Number(form.value.quantity),
    note: noteValue,
    material_category: form.value.category,
    material_unit: form.value.unit,
    material_type: form.value.materialName,
    action_type: form.value.action,
    sell_price: null,
    total_sales: null,
    customer_name: form.value.action === 'RECEIVED' ? 'Supplier' : 'Production'
  }

  try {
    const token = authStore.getToken()
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    await axios.post(`${API_URL}/movements`, movement)
    await loadData()
    if (showToast) showToast(`✅ ${getModalAction()} recorded!`, 'success')
    showModal.value = false
  } catch (error) {
    console.error('Error saving:', error)
    if (showToast) showToast('Error saving record', 'error')
  }
}

const deleteRecord = async (id) => {
  const confirmed = await showConfirm({
    type: 'warning',
    title: 'Delete Record',
    message: 'Are you sure you want to delete this record?',
    confirmText: 'Yes, Delete',
    cancelText: 'Cancel'
  })

  if (!confirmed) return

  try {
    const token = authStore.getToken()
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    await axios.delete(`${API_URL}/movements/${id}`)
    await loadData()
    if (showToast) showToast('Record deleted successfully!', 'success')
  } catch (error) {
    console.error('Error deleting:', error)
    if (showToast) showToast('Error deleting record', 'error')
  }
}

onMounted(async () => {
  await loadData()
})
</script>

<style scoped>
.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.header-actions h3 {
  margin-bottom: 0.25rem;
  color: #1a2a3a;
}

.header-actions p {
  color: #666;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  border-left: 4px solid #2c3e50;
}

.stat-icon {
  font-size: 1.5rem;
  width: 45px;
  height: 45px;
  background: #edf2f7;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2c3e50;
}

.stat-info h4 {
  font-size: 0.7rem;
  color: #718096;
  margin-bottom: 0.25rem;
}

.stat-info .value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #1a2a3a;
}

.stat-info .unit {
  font-size: 0.7rem;
  font-weight: normal;
  color: #718096;
}

.quick-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.quick-btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.received-btn { background: #28a745; color: white; }
.used-btn { background: #ffc107; color: #333; }
.waste-btn { background: #dc3545; color: white; }
.refresh-btn { background: #2c3e50; color: white; }

.quick-btn:hover { opacity: 0.85; }

.filter-section {
  background: #f4f6f8;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.filter-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-group label {
  font-size: 0.75rem;
  font-weight: bold;
  color: #4a5568;
}

.filter-input {
  padding: 6px 10px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  min-width: 140px;
  background: white;
}

.search-group {
  flex: 1;
  min-width: 200px;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  padding-right: 35px;
  width: 100%;
}

.btn-clear-search {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 4px;
}

.btn-clear-search:hover {
  color: #333;
}

.search-results {
  margin-top: 8px;
  font-size: 0.8rem;
  color: #28a745;
  padding: 4px 8px;
  background: #d4edda;
  border-radius: 4px;
}

.search-results.no-results {
  color: #dc3545;
  background: #f8d7da;
}

.btn-clear {
  background: #718096;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-clear:hover {
  background: #4a5568;
}

.table-responsive {
  overflow-x: auto;
}

.materials-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.materials-table th {
  background: #2c3e50;
  color: white;
  padding: 10px;
  text-align: left;
}

.materials-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

.category-badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 500;
  display: inline-block;
}

.cat-rolls { background: #e3f2fd; color: #1565c0; }
.cat-ink { background: #f3e5f5; color: #6a1b9a; }
.cat-chemicals { background: #fff3e0; color: #e65100; }
.cat-supplies { background: #e8f5e9; color: #2e7d32; }
.cat-other { background: #f5f5f5; color: #616161; }

.badge-received { background: #28a745; color: white; padding: 3px 10px; border-radius: 4px; font-size: 0.7rem; display: inline-block; }
.badge-used { background: #ffc107; color: #333; padding: 3px 10px; border-radius: 4px; font-size: 0.7rem; display: inline-block; }
.badge-waste { background: #dc3545; color: white; padding: 3px 10px; border-radius: 4px; font-size: 0.7rem; display: inline-block; }
.badge-other { background: #718096; color: white; padding: 3px 10px; border-radius: 4px; font-size: 0.7rem; display: inline-block; }

.btn-delete {
  background: #dc3545;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
}

.btn-delete:hover {
  background: #bb2d3b;
}

.empty-row {
  text-align: center;
  padding: 20px;
  color: #a0aec0;
}

.empty-row i {
  font-size: 2rem;
  display: block;
  margin-bottom: 10px;
  color: #cbd5e0;
}

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
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #2c3e50;
  color: white;
  border-radius: 12px 12px 0 0;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
}

.modal-body { padding: 1.5rem; }
.modal-footer {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #ddd;
}

.form-group { margin-bottom: 1rem; }
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  font-size: 0.85rem;
}
.form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
}

.preview {
  background: #f0f2f5;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.text-success { color: #28a745; }
.text-warning { color: #ffc107; }
.text-danger { color: #dc3545; }

.btn-cancel {
  background: #718096;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}
.btn-save {
  background: #2c3e50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  .filter-row {
    flex-direction: column;
  }
  .filter-input {
    min-width: 100%;
  }
}
</style>