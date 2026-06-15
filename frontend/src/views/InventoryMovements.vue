<template>
  <div>
    <div class="card">
      <div class="header-actions">
        <h3><i class="fas fa-clipboard-list"></i> IN/OUT Transaction Log</h3>
        <p><i class="fas fa-chart-line"></i> Monitor all inventory movements for packaging materials</p>
      </div>
      
      <!-- Filters -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-group">
            <label><i class="fas fa-calendar-alt"></i> Start Date:</label>
            <input type="date" v-model="filters.startDate" @change="loadMovements" class="filter-input" />
          </div>
          <div class="filter-group">
            <label><i class="fas fa-calendar-alt"></i> End Date:</label>
            <input type="date" v-model="filters.endDate" @change="loadMovements" class="filter-input" />
          </div>
          <div class="filter-group">
            <label><i class="fas fa-box"></i> Item:</label>
            <select v-model="filters.itemId" @change="loadMovements" class="filter-input">
              <option value="">All Items</option>
              <option v-for="item in store.items" :key="item.id" :value="item.id">
                {{ item.name }}
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label><i class="fas fa-exchange-alt"></i> Type:</label>
            <select v-model="filters.type" @change="loadMovements" class="filter-input">
              <option value="">All</option>
              <option value="IN">IN (Received)</option>
              <option value="OUT">OUT (Issued)</option>
            </select>
          </div>
          <button @click="clearFilters" class="btn-clear">
            <i class="fas fa-eraser"></i> Clear Filters
          </button>
          <button @click="loadMovements" class="btn-refresh">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>
      
      <!-- Summary Stats -->
      <div class="summary-stats">
        <div class="summary-card">
          <div class="summary-icon"><i class="fas fa-arrow-down"></i></div>
          <div class="summary-info">
            <span>Total IN</span>
            <strong>{{ totalInBase }} <small>base units</small></strong>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon"><i class="fas fa-arrow-up"></i></div>
          <div class="summary-info">
            <span>Total OUT</span>
            <strong>{{ totalOutBase }} <small>base units</small></strong>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon"><i class="fas fa-chart-line"></i></div>
          <div class="summary-info">
            <span>Net Change</span>
            <strong :class="netChange >= 0 ? 'positive' : 'negative'">
              {{ netChange >= 0 ? '+' : '' }}{{ netChange }}
            </strong>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon"><i class="fas fa-money-bill-wave"></i></div>
          <div class="summary-info">
            <span>Total Sales</span>
            <strong>₱{{ formatNumber(totalSales) }}</strong>
          </div>
        </div>
      </div>
      
      <!-- Movements Table -->
      <div class="table-responsive">
        <table class="movements-table">
          <thead>
            <tr>
              <th>DATE & TIME</th>
              <th>TYPE</th>
              <th>ITEM CODE</th>
              <th>ITEM NAME</th>
              <th>CUSTOMER / SUPPLIER</th>
              <th>QTY</th>
              <th>UNIT</th>
              <th>BASE DELTA</th>
              <th>UNIT PRICE</th>
              <th>TOTAL SALES</th>
              <th>REMARKS</th>
              <th style="width: 80px">ACTION</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="movement in filteredMovements" :key="movement.id">
              <td>
                {{ formatDateTime(movement.datetime) }}
              </td>
              <td>
                <span :class="movement.type === 'IN' ? 'badge-in' : 'badge-out'">
                  <i :class="movement.type === 'IN' ? 'fas fa-arrow-down' : 'fas fa-arrow-up'"></i>
                  {{ movement.type }}
                </span>
              </td>
              <td><code>{{ movement.item_id }}</code></td>
              <td><strong>{{ movement.item_name }}</strong></td>
              <td>
                <strong>{{ movement.type === 'IN' ? 'Supplier' : (movement.customer_name || 'Walk-in Customer') }}</strong>
              </td>
              <td>{{ movement.quantity }}</td>
              <td>{{ movement.unit }}</td>
              <td>{{ movement.base_delta }}</td>
              <td>₱{{ formatNumber(movement.sell_price) }}</td>
              <td>₱{{ formatNumber(movement.total_sales) }}</td>
              <td>
                <span v-if="movement.note">
                  <i class="fas fa-comment"></i> {{ movement.note }}
                </span>
                <span v-else class="no-note">—</span>
              </td>
              <td class="action-cell">
                <button @click="openEditModal(movement)" class="btn-edit" title="Edit Transaction">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="deleteMovement(movement.id, movement.item_name)" class="btn-delete" title="Delete Transaction">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
            <tr v-if="!filteredMovements.length">
              <td colspan="12" class="empty-row">
                <i class="fas fa-inbox"></i> No transactions found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- EDIT MODAL -->
    <div v-if="showEditModal" class="modal" @click.self="showEditModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-edit"></i> Edit Transaction</h3>
          <button class="close-btn" @click="showEditModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="selected-item-info">
            <i class="fas fa-box"></i>
            <div>
              <strong>{{ editForm.item_name }}</strong>
              <span class="item-code">{{ editForm.item_id }}</span>
            </div>
          </div>
          
          <div class="form-group">
            <label><i class="fas fa-calendar-alt"></i> Date & Time:</label>
            <input type="datetime-local" v-model="editForm.datetime" class="form-input" />
          </div>
          
          <div class="form-group">
            <label><i class="fas fa-exchange-alt"></i> Type:</label>
            <select v-model="editForm.type" class="form-input" @change="onTypeChange">
              <option value="IN">IN (Received)</option>
              <option value="OUT">OUT (Issued)</option>
            </select>
          </div>
          
          <div class="form-group" v-if="editForm.type === 'OUT'">
            <label><i class="fas fa-user"></i> Customer Name:</label>
            <input type="text" v-model="editForm.customer_name" placeholder="Customer name" class="form-input" />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label><i class="fas fa-sort-amount-up"></i> Quantity:</label>
              <input type="number" v-model="editForm.quantity" min="1" class="form-input" @change="recalculateTotal" />
            </div>
            <div class="form-group">
              <label><i class="fas fa-cubes"></i> Unit:</label>
              <select v-model="editForm.unit" class="form-input" @change="recalculateTotal">
                <option value="BASE">Piece (pcs)</option>
                <option value="PACK">Pack</option>
              </select>
            </div>
          </div>
          
          <div class="form-group" v-if="editForm.type === 'OUT'">
            <label><i class="fas fa-tag"></i> Unit Price (per piece):</label>
            <input type="number" step="0.01" v-model="editForm.sell_price" class="form-input" @change="recalculateTotal" />
          </div>
          
          <div class="form-group">
            <label><i class="fas fa-pen"></i> Remarks:</label>
            <input type="text" v-model="editForm.note" placeholder="Optional" class="form-input" />
          </div>
          
          <div class="preview" v-if="editForm.type === 'OUT'">
            <strong><i class="fas fa-eye"></i> Preview:</strong>
            <p>
              <i class="fas fa-money-bill-wave"></i> 
              Total Sales: <strong>₱{{ formatNumber(editForm.total_sales) }}</strong>
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showEditModal = false">
            <i class="fas fa-times"></i> Cancel
          </button>
          <button class="btn-save" @click="updateMovement">
            <i class="fas fa-save"></i> Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useInventoryStore } from '../stores/inventory'
import { ref, computed, onMounted, inject } from 'vue'
import axios from 'axios'

const store = useInventoryStore()
const API_URL = 'https://inventory-system-backend-production-0549.up.railway.app/api'
const showToast = inject('showToast')
const showConfirm = inject('showConfirm')

const filters = ref({
  startDate: '',
  endDate: '',
  itemId: '',
  type: ''
})

const showEditModal = ref(false)
const editForm = ref({
  id: null,
  datetime: '',
  type: '',
  item_id: '',
  item_name: '',
  quantity: 1,
  unit: 'PACK',
  base_delta: 0,
  sell_price: 0,
  total_sales: 0,
  customer_name: '',
  note: ''
})

const filteredMovements = computed(() => {
  let result = store.movements || []
  
  // ✅ I-exclude ang Stock Adjustment sa table display
  result = result.filter(m => m.customer_name !== 'Stock Adjustment')
  
  if (filters.value.type && result.length) {
    result = result.filter(m => m.type === filters.value.type)
  }
  return result
})


// Total IN - I-exclude ang mga correction/sobrang IN
const totalInBase = computed(() => {
  // ✅ Gamitin ang cutoff date kung kailan naging tama ang stock
  // I-set ito sa petsa bago ka nag-correct
  const cutoffDate = new Date('2026-06-15') // Palitan sa tamang petsa
  
  let total = 0
  for (const m of filteredMovements.value) {
    if (m.type === 'IN') {
      const movementDate = new Date(m.datetime)
      // ✅ I-exclude ang mga IN bago ang cutoff date
      if (movementDate >= cutoffDate) {
        total += Number(m.base_delta) || 0
      }
    }
  }
  return total
})

// Total OUT (same logic)
// Total OUT - walang date filter
const totalOutBase = computed(() => {
  let total = 0
  for (const m of filteredMovements.value) {
    if (m.type === 'OUT' && m.customer_name !== 'Stock Adjustment') {
      total += Number(m.base_delta) || 0
    }
  }
  return total
})

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0.00'
  return Number(num).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  try {
    const datetimeStr = String(datetime)
    if (!datetimeStr.includes(' ')) return datetimeStr
    const parts = datetimeStr.split(' ')
    if (parts.length < 2) return datetimeStr
    const [date, time] = parts
    if (!time || !time.includes(':')) return date
    const timeParts = time.split(':')
    if (timeParts.length < 2) return date
    let hours = parseInt(timeParts[0])
    const minutes = timeParts[1]
    const period = hours >= 12 ? 'PM' : 'AM'
    let hours12 = hours % 12 || 12
    return `${date} ${hours12}:${minutes} ${period}`
  } catch (error) {
    console.error('Date format error:', datetime)
    return String(datetime) || '-'
  }
}

const loadMovements = async () => {
  const params = {}
  if (filters.value.startDate) params.startDate = filters.value.startDate
  if (filters.value.endDate) params.endDate = filters.value.endDate
  if (filters.value.itemId) params.itemId = filters.value.itemId
  if (filters.value.type) params.type = filters.value.type
  await store.fetchMovements(params)
}

const clearFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    itemId: '',
    type: ''
  }
  loadMovements()
}

const openEditModal = (movement) => {
  let formattedDatetime = movement.datetime
  if (formattedDatetime && !formattedDatetime.includes('T')) {
    formattedDatetime = formattedDatetime.replace(' ', 'T')
  }
  
  editForm.value = {
    id: movement.id,
    datetime: formattedDatetime,
    type: movement.type,
    item_id: movement.item_id,
    item_name: movement.item_name,
    quantity: movement.quantity,
    unit: movement.unit,
    base_delta: movement.base_delta,
    sell_price: movement.sell_price || 0,
    total_sales: movement.total_sales || 0,
    customer_name: movement.customer_name || '',
    note: movement.note || ''
  }
  showEditModal.value = true
}

const recalculateTotal = () => {
  if (editForm.value.type === 'OUT') {
    let baseDelta = editForm.value.quantity
    if (editForm.value.unit === 'PACK') {
      const item = store.stock?.find(i => i.id === editForm.value.item_id)
      const packSize = item?.pack_size || 1
      baseDelta = editForm.value.quantity * packSize
    }
    editForm.value.base_delta = baseDelta
    editForm.value.total_sales = baseDelta * (editForm.value.sell_price || 0)
  } else {
    let baseDelta = editForm.value.quantity
    if (editForm.value.unit === 'PACK') {
      const item = store.stock?.find(i => i.id === editForm.value.item_id)
      const packSize = item?.pack_size || 1
      baseDelta = editForm.value.quantity * packSize
    }
    editForm.value.base_delta = baseDelta
  }
}

const onTypeChange = () => {
  if (editForm.value.type === 'IN') {
    editForm.value.customer_name = ''
    editForm.value.sell_price = 0
  }
  recalculateTotal()
}

const updateMovement = async () => {
  const confirmed = await showConfirm({
    type: 'info',
    title: 'Update Transaction',
    message: 'Are you sure you want to update this transaction?',
    confirmText: 'Yes, Update',
    cancelText: 'Cancel'
  })
  
  if (!confirmed) return
  
  try {
    const movementData = {
      datetime: editForm.value.datetime,
      type: editForm.value.type,
      item_id: editForm.value.item_id,
      item_name: editForm.value.item_name,
      quantity: editForm.value.quantity,
      unit: editForm.value.unit,
      base_delta: editForm.value.base_delta,
      note: editForm.value.note,
      sell_price: editForm.value.type === 'OUT' ? editForm.value.sell_price : null,
      total_sales: editForm.value.type === 'OUT' ? editForm.value.total_sales : null,
      customer_name: editForm.value.type === 'OUT' ? (editForm.value.customer_name || 'Walk-in Customer') : null
    }
    
    await axios.put(`${API_URL}/movements/${editForm.value.id}`, movementData)
    showToast('Transaction updated successfully!', 'success')
    showEditModal.value = false
    await loadMovements()
    await store.fetchStock()
    await store.fetchDashboard()
  } catch (error) {
    console.error('Error updating transaction:', error)
    showToast('Error updating transaction', 'error')
  }
}

const deleteMovement = async (id, itemName) => {
  const confirmed = await showConfirm({
    type: 'warning',
    title: 'Delete Transaction',
    message: `Are you sure you want to delete transaction for "${itemName}"? This cannot be undone.`,
    confirmText: 'Yes, Delete',
    cancelText: 'Cancel'
  })
  
  if (!confirmed) return
  
  try {
    await axios.delete(`${API_URL}/movements/${id}`)
    showToast('Transaction deleted successfully!', 'success')
    await loadMovements()
    await store.fetchStock()
    await store.fetchDashboard()
  } catch (error) {
    console.error('Error deleting transaction:', error)
    showToast('Error deleting transaction', 'error')
  }
}

onMounted(() => {
  loadMovements()
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

.header-actions h3 i {
  color: #2c3e50;
  margin-right: 8px;
}

.header-actions p {
  color: #666;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}

.filter-section {
  background: #f4f6f8;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #e2e6ea;
}

.filter-row {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-group label {
  font-size: 0.7rem;
  font-weight: bold;
  color: #4a5568;
}

.filter-group label i {
  margin-right: 4px;
  color: #2c3e50;
}

.filter-input {
  padding: 6px 10px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  min-width: 130px;
  background: white;
  font-size: 0.7rem;
}

.filter-input:focus {
  outline: none;
  border-color: #2c3e50;
  box-shadow: 0 0 0 2px rgba(44,62,80,0.1);
}

.btn-clear, .btn-refresh {
  background: #2c3e50;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
}

.btn-clear {
  background: #718096;
}

.btn-clear:hover {
  background: #4a5568;
}

.btn-refresh:hover {
  background: #1a252f;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.summary-card {
  background: white;
  border-radius: 8px;
  padding: 0.6rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-left: 3px solid #2c3e50;
}

.summary-icon {
  font-size: 1.2rem;
  width: 35px;
  text-align: center;
  color: #2c3e50;
}

.summary-info {
  display: flex;
  flex-direction: column;
}

.summary-info span {
  font-size: 0.6rem;
  color: #718096;
}

.summary-info strong {
  font-size: 0.9rem;
  color: #1a2a3a;
}

.summary-info strong small {
  font-size: 0.6rem;
  font-weight: normal;
  color: #718096;
}

.positive {
  color: #28a745;
}

.negative {
  color: #dc3545;
}

.table-responsive {
  overflow-x: auto;
}

.movements-table {
  min-width: 1200px;
  width: 100%;
  border-collapse: collapse;
  font-size: 0.7rem;
}

.movements-table th {
  background: #2c3e50;
  padding: 8px;
  text-align: left;
  font-weight: 600;
  color: white;
  border-bottom: 2px solid #1a252f;
}

.movements-table td {
  padding: 6px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
  color: #2d3748;
  background: white;
}

.movements-table tr:hover td {
  background: #f7fafc;
}

.badge-in {
  background: #28a745;
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.6rem;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.badge-out {
  background: #e53e3e;
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.6rem;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

code {
  background: #edf2f7;
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-family: monospace;
  color: #2d3748;
}

.no-note {
  color: #a0aec0;
}

.empty-row {
  text-align: center;
  padding: 20px;
  color: #a0aec0;
}

.empty-row i {
  font-size: 1.5rem;
  display: block;
  margin-bottom: 8px;
  color: #cbd5e0;
}

.action-cell {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.btn-edit {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.6rem;
}

.btn-edit:hover {
  background: #138496;
}

.btn-delete {
  background: #dc3545;
  color: white;
  border: none;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.6rem;
}

.btn-delete:hover {
  background: #bb2d3b;
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
  width: 500px;
  max-width: 95%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1.2rem;
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
  padding: 1rem;
}

.modal-footer {
  padding: 0.8rem 1.2rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.form-group {
  margin-bottom: 0.8rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.3rem;
  font-weight: bold;
  font-size: 0.7rem;
  color: #4a5568;
}

.form-group label i {
  margin-right: 4px;
  color: #2c3e50;
}

.form-input {
  width: 100%;
  padding: 6px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  background: white;
  font-size: 0.7rem;
}

.form-input:focus {
  outline: none;
  border-color: #2c3e50;
  box-shadow: 0 0 0 2px rgba(44,62,80,0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.selected-item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #edf2f7;
  padding: 8px;
  border-radius: 8px;
  margin-bottom: 0.8rem;
}

.selected-item-info i {
  font-size: 1rem;
  color: #2c3e50;
}

.selected-item-info .item-code {
  font-size: 0.6rem;
  color: #718096;
  display: block;
}

.preview {
  background: #f0f2f5;
  padding: 0.8rem;
  border-radius: 8px;
  margin-top: 0.8rem;
}

.preview strong i {
  margin-right: 4px;
}

.preview p {
  margin: 6px 0 0 0;
  font-size: 0.7rem;
}

.btn-cancel {
  background: #718096;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
}

.btn-cancel:hover {
  background: #4a5568;
}

.btn-save {
  background: #2c3e50;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
}

.btn-save:hover {
  background: #1a252f;
}
</style>