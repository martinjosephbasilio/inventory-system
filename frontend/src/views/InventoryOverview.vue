<template>
  <div>
    <div class="card">
      <div class="header-section">
        <div class="header-left">
          <h3><i class="fas fa-boxes"></i> Stock Inventory</h3>
          <p>Manage your packaging materials stock</p>
        </div>
        <button class="refresh-btn" @click="refreshData">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      <div class="table-responsive">
        <table class="inventory-table">
          <thead>
            <tr>
              <th><i class="fas fa-box"></i> ITEM</th>
              <th><i class="fas fa-cubes"></i> UNIT</th>
              <th><i class="fas fa-tag"></i> TYPE</th>
              <th><i class="fas fa-dollar-sign"></i> COST PRICE</th>
              <th><i class="fas fa-chart-line"></i> SELLING PRICE</th>
              <th><i class="fas fa-archive"></i> ON HAND</th>
              <th><i class="fas fa-bolt"></i> ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in store.stock" :key="item.id">
              <td class="item-cell">
                <strong>{{ item.name }}</strong><br>
                <span class="item-code">{{ item.id }}</span>
              </td>
              <td class="center">{{ item.pack_size }} <i class="fas fa-cube"></i> pcs/pack</td>
              <td>
                <span :class="['type-badge', getTypeClass(item.type)]">
                  <i :class="getTypeIcon(item.type)"></i> {{ item.type }}
                </span>
                </td>
              <td class="price-cell">
                <span class="price">₱{{ formatNumber(item.cost_pack) }}</span>
                <span class="price-unit">(Pack)</span><br>
                <small>₱{{ formatNumber(item.cost_base) }} (Base)</small>
                </td>
              <td class="price-cell">
                <span class="price">₱{{ formatNumber(item.sell_pack) }}</span>
                <span class="price-unit">(Pack)</span><br>
                <small>₱{{ formatNumber(item.sell_base) }} (Base)</small>
                </td>
              <td class="stock-cell">
                <div class="stock-display">
                  <i class="fas fa-box"></i> {{ item.boxes }} Packs +
                  <i class="fas fa-cube"></i> {{ item.pcs }} Pcs
                </div>
                <small class="base-info">
                  <i class="fas fa-database"></i> Base: {{ item.current_stock_base }} pcs
                </small>
                <div v-if="item.current_stock_base <= item.reorder_level && item.current_stock_base > 0"
                  class="low-stock-badge">
                  <i class="fas fa-exclamation-triangle"></i> Low Stock
                </div>
                <div v-if="item.current_stock_base === 0" class="out-stock-badge">
                  <i class="fas fa-times-circle"></i> Out of Stock
                </div>
                </td>
              <td class="actions-cell">
                <button class="btn-in" @click="openInOut(item, 'IN')">
                  <i class="fas fa-arrow-down"></i> IN
                </button>
                <button class="btn-out" @click="openInOut(item, 'OUT')">
                  OUT <i class="fas fa-arrow-up"></i>
                </button>
                <button class="btn-edit" @click="openEditStock(item)" title="Edit Stock">
                  <i class="fas fa-edit"></i> Edit
                </button>
                </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- IN/OUT Modal -->
    <div v-if="showModal" class="modal" @click.self="showModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>
            <i :class="modalType === 'IN' ? 'fas fa-arrow-down' : 'fas fa-arrow-up'"></i>
            {{ modalType === 'IN' ? 'ADD STOCK IN' : 'REMOVE STOCK OUT' }}
          </h3>
          <button class="close-btn" @click="showModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="selected-item-info">
            <i class="fas fa-box"></i>
            <div>
              <strong>{{ selectedItem?.name }}</strong>
              <span class="item-code">{{ selectedItem?.id }}</span>
            </div>
          </div>

          <div class="form-group">
            <label><i class="fas fa-sort-amount-up"></i> Quantity (in Packs):</label>
            <input type="number" v-model.number="quantity" min="1" class="form-input" />
            <small>1 Pack = {{ selectedItem?.pack_size || 0 }} pieces</small>
          </div>

          <div class="form-group">
            <label><i class="fas fa-cubes"></i> Unit:</label>
            <input type="text" :value="`Pack (${selectedItem?.pack_size || 0} pcs/pack)`" disabled class="form-input" />
          </div>

          <div v-if="modalType === 'OUT'" class="form-group">
            <label><i class="fas fa-tag"></i> Selling Price (per Pack):</label>
            <input type="number" step="0.01" v-model.number="sellPrice" class="form-input" />
            <small>Default: ₱{{ formatNumber(selectedItem?.sell_pack) }} per pack</small>
          </div>

          <div class="form-group">
            <label><i class="fas fa-pen"></i> Note (optional):</label>
            <input v-model="note" placeholder="e.g., Received from supplier, Sold to customer" class="form-input" />
          </div>

          <div class="preview">
            <strong><i class="fas fa-eye"></i> Preview:</strong>
            <p v-if="modalType === 'IN'">
              <i class="fas fa-plus-circle"></i> 
              Adding <strong>{{ quantity }}</strong> Pack(s) = 
              <strong>{{ baseDelta }}</strong> base units 
              <span class="preview-detail">({{ quantity }} packs × {{ selectedItem?.pack_size || 0 }} pcs/pack)</span>
            </p>
            <p v-else>
              <i class="fas fa-minus-circle"></i>
              Removing <strong>{{ quantity }}</strong> Pack(s) = 
              <strong>{{ baseDelta }}</strong> base units
              <span class="preview-detail">({{ quantity }} packs × {{ selectedItem?.pack_size || 0 }} pcs/pack)</span>
              <br>
              <i class="fas fa-money-bill-wave"></i> Total Sales: ₱{{ formatNumber(totalSalesAmount) }}
            </p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="showModal = false">
            <i class="fas fa-times"></i> Cancel
          </button>
          <button class="btn-save" @click="saveMovement">
            <i class="fas fa-check"></i> Confirm
          </button>
        </div>
      </div>
    </div>

    <!-- EDIT STOCK MODAL -->
    <div v-if="showEditModal" class="modal" @click.self="showEditModal = false">
      <div class="modal-content edit-modal">
        <div class="modal-header">
          <h3><i class="fas fa-edit"></i> Edit Stock: {{ editItem?.name }}</h3>
          <button class="close-btn" @click="showEditModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="stock-info">
            <p><strong>Current Stock:</strong> {{ editItem?.boxes || 0 }} packs</p>
            <p><strong>Pack Size:</strong> {{ editItem?.pack_size }} pcs/pack</p>
          </div>
          <div class="form-group">
            <label>New Stock (in packs):</label>
            <input type="number" v-model.number="newStockPacks" class="form-input" />
          </div>
          <div class="form-group">
            <label>Remarks:</label>
            <input v-model="editRemark" placeholder="e.g., Stock adjustment" class="form-input" />
          </div>
          <div class="preview" v-if="newStockPacks !== editItem?.boxes">
            <strong>Preview:</strong>
            <p :class="newStockPacks > editItem?.boxes ? 'text-success' : 'text-danger'">
              {{ newStockPacks > editItem?.boxes ? '➕ Add' : '➖ Remove' }} 
              {{ Math.abs(newStockPacks - (editItem?.boxes || 0)) }} packs
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showEditModal = false">Cancel</button>
          <button class="btn-save" @click="saveEditStock">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useInventoryStore } from '../stores/inventory'
import { useAuthStore } from '../stores/auth'  
import { ref, computed, inject, onMounted } from 'vue'
import axios from 'axios'

const store = useInventoryStore()
const authStore = useAuthStore()
const showToast = inject('showToast')
const showConfirm = inject('showConfirm')

const showModal = ref(false)
const modalType = ref('IN')
const selectedItem = ref(null)
const quantity = ref(1)
const note = ref('')
const sellPrice = ref(0)

// Edit Stock variables
const showEditModal = ref(false)
const editItem = ref(null)
const newStockPacks = ref(0)
const editRemark = ref('')

const baseDelta = computed(() => {
  return quantity.value * (selectedItem.value?.pack_size || 1)
})

const totalSalesAmount = computed(() => {
  if (modalType.value === 'OUT') {
    const price = sellPrice.value || selectedItem.value?.sell_pack || 0
    return quantity.value * price
  }
  return 0
})

const formatNumber = (num) => {
  return num?.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'
}

const getTypeClass = (type) => {
  return {
    'Both': 'type-both',
    'Retail': 'type-retail',
    'Wholesale': 'type-wholesale'
  }[type] || ''
}

const getTypeIcon = (type) => {
  return {
    'Both': 'fas fa-balance-scale',
    'Retail': 'fas fa-store',
    'Wholesale': 'fas fa-warehouse'
  }[type] || 'fas fa-tag'
}

const refreshData = async () => {
  await store.fetchStock()
  await store.fetchDashboard()
  if (showToast) showToast('Data refreshed!', 'success')
}

const openInOut = (item, type) => {
  selectedItem.value = item
  modalType.value = type
  quantity.value = 1
  note.value = ''
  sellPrice.value = item.sell_pack
  showModal.value = true
}

const saveMovement = async () => {
  if (!quantity.value || quantity.value <= 0) {
    if (showToast) showToast('Please enter a valid quantity', 'error')
    return
  }

  const now = new Date()
  const datetime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

  let finalBaseDelta = baseDelta.value

  if (modalType.value === 'OUT' && finalBaseDelta > selectedItem.value.current_stock_base) {
    if (showToast) showToast(`Not enough stock! Available: ${selectedItem.value.boxes} packs (${selectedItem.value.current_stock_base} pcs)`, 'error')
    return
  }

  let customerName = null
  if (modalType.value === 'OUT') {
    customerName = prompt('Enter customer name:', 'Walk-in Customer')
    if (customerName === null) return
    if (customerName.trim() === '') customerName = 'Walk-in Customer'
  }

  const confirmed = await showConfirm({
    type: modalType.value === 'OUT' ? 'warning' : 'info',
    title: modalType.value === 'OUT' ? 'Confirm Stock OUT' : 'Confirm Stock IN',
    message: `${modalType.value === 'IN' ? 'Add' : 'Remove'} ${quantity.value} Pack(s) of ${selectedItem.value.name}?`,
    confirmText: 'Yes, Proceed',
    cancelText: 'Cancel'
  })

  if (!confirmed) return

  const movement = {
    datetime: datetime,
    type: modalType.value,
    item_id: selectedItem.value.id,
    item_name: selectedItem.value.name,
    quantity: quantity.value,
    unit: 'PACK',
    base_delta: finalBaseDelta,
    note: note.value,
    sell_price: modalType.value === 'OUT' ? (sellPrice.value || selectedItem.value.sell_pack) : null,
    total_sales: totalSalesAmount.value,
    customer_name: customerName
  }

  await store.addMovement(movement)
  await store.fetchStock()
  await store.fetchDashboard()

  showModal.value = false
  if (showToast) showToast(`✅ ${modalType.value === 'IN' ? 'Stock IN' : 'Stock OUT'} recorded!`, 'success')
}

// EDIT STOCK FUNCTIONS
const openEditStock = (item) => {
  editItem.value = item
  newStockPacks.value = item.boxes
  editRemark.value = ''
  showEditModal.value = true
}

const saveEditStock = async () => {
  if (!editItem.value) return
  
  const oldPacks = editItem.value.boxes
  const newPacks = newStockPacks.value
  const difference = newPacks - oldPacks
  
  if (difference === 0) {
    showEditModal.value = false
    return
  }
  
  const action = difference > 0 ? 'add' : 'remove'
  const qty = Math.abs(difference)
  
  const confirmed = await showConfirm({
    type: action === 'add' ? 'info' : 'warning',
    title: action === 'add' ? 'Add Stock' : 'Remove Stock',
    message: `${action === 'add' ? 'Add' : 'Remove'} ${qty} pack(s) to ${editItem.value.name}?`,
    confirmText: 'Yes, Proceed',
    cancelText: 'Cancel'
  })
  
  if (!confirmed) return
  
  const now = new Date()
  const datetime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  
  const baseDelta = qty * (editItem.value.pack_size || 1)
  
  // ✅ Gumawa ng movement para ma-record ang pagbawas
  const movement = {
    datetime: datetime,
    type: action === 'add' ? 'IN' : 'OUT',
    item_id: editItem.value.id,
    item_name: editItem.value.name,
    quantity: qty,
    unit: 'PACK',
    base_delta: baseDelta,
    note: editRemark.value || `Manual stock ${action === 'add' ? 'addition' : 'removal'}`,
    sell_price: action === 'remove' ? editItem.value.sell_pack : null,
    total_sales: action === 'remove' ? qty * editItem.value.sell_pack : null,
    customer_name: action === 'remove' ? 'Stock Adjustment' : null
  }
  
  try {
    await store.addMovement(movement)
    await store.fetchStock()
    await store.fetchDashboard()
    
    showToast(`✅ Stock ${action === 'add' ? 'added' : 'removed'} successfully!`, 'success')
    showEditModal.value = false
    
    // ✅ I-reload para makita ang update
    setTimeout(() => {
      window.location.reload()
    }, 500)
    
  } catch (error) {
    console.error('Error updating stock:', error)
    showToast('Error updating stock', 'error')
  }
}
</script>

<style scoped>
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left h3 {
  margin-bottom: 0.25rem;
  color: #1a2a3a;
}

.header-left h3 i {
  color: #00adb5;
  margin-right: 8px;
}

.header-left p {
  color: #666;
  font-size: 0.85rem;
}

.refresh-btn {
  background: #f0f2f5;
  color: #1a2a3a;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #e0e0e0;
}

.refresh-btn i {
  margin-right: 6px;
}

.table-responsive {
  overflow-x: auto;
}

.inventory-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.inventory-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}

.inventory-table th i {
  margin-right: 6px;
  color: #00adb5;
}

.inventory-table td {
  padding: 12px;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

.item-cell {
  font-weight: 500;
}

.item-code {
  font-size: 0.7rem;
  color: #999;
  font-family: monospace;
}

.center {
  text-align: center;
}

.type-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.type-badge i {
  font-size: 0.7rem;
}

.type-both {
  background: #e3f2fd;
  color: #1565c0;
}

.type-retail {
  background: #e8f5e9;
  color: #2e7d32;
}

.type-wholesale {
  background: #f3e5f5;
  color: #6a1b9a;
}

.price-cell {
  min-width: 100px;
}

.price {
  font-weight: 600;
  color: #1a2a3a;
}

.price-unit {
  font-size: 0.7rem;
  color: #999;
}

.stock-cell {
  background: #f9f9f9;
  min-width: 200px;
}

.stock-display {
  font-weight: bold;
  color: #1a2a3a;
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.stock-display i {
  color: #00adb5;
}

.base-info {
  font-size: 0.7rem;
  color: #666;
}

.low-stock-badge {
  color: #ff9800;
  font-size: 0.7rem;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.out-stock-badge {
  color: #dc3545;
  font-size: 0.7rem;
  margin-top: 4px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
}

.actions-cell {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.btn-in {
  background: #28a745;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-in:hover {
  background: #1e7e34;
}

.btn-out {
  background: #ffc107;
  color: #333;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-out:hover {
  background: #e0a800;
}

.btn-edit {
  background: #00adb5;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-edit:hover {
  background: #008a91;
}

.text-success {
  color: #28a745;
}

.text-danger {
  color: #dc3545;
}

/* Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.edit-modal {
  width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #ddd;
  background: #1a2a3a;
  color: white;
  border-radius: 12px 12px 0 0;
}

.modal-header h3 {
  margin: 0;
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
  border-top: 1px solid #ddd;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.selected-item-info {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f0f2f5;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.selected-item-info i {
  font-size: 1.2rem;
  color: #00adb5;
}

.selected-item-info .item-code {
  font-size: 0.7rem;
  color: #999;
  display: block;
}

.stock-info {
  background: #f0f2f5;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.stock-info p {
  margin: 5px 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  font-size: 0.85rem;
}

.form-group label i {
  margin-right: 6px;
  color: #00adb5;
}

.form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group small {
  font-size: 0.7rem;
  color: #666;
  display: block;
  margin-top: 4px;
}

.preview {
  background: #f0f2f5;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.preview strong i {
  margin-right: 6px;
}

.preview p {
  margin: 8px 0 0 0;
  font-size: 0.85rem;
}

.preview-detail {
  font-size: 0.7rem;
  color: #666;
  display: block;
  margin-top: 2px;
}

.btn-cancel {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-cancel:hover {
  background: #5a6268;
}

.btn-save {
  background: #00adb5;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-save:hover {
  background: #008a91;
}

/* Compact styles */
.card {
  padding: 0.8rem !important;
}

.inventory-table th {
  padding: 0.4rem 0.3rem !important;
  font-size: 0.65rem !important;
}

.inventory-table td {
  padding: 0.4rem 0.3rem !important;
  font-size: 0.7rem !important;
}

.in-btn, .out-btn, .btn-edit {
  padding: 0.2rem 0.4rem !important;
  font-size: 0.55rem !important;
}

.modal-content {
  width: 380px !important;
}

.modal-header {
  padding: 0.5rem 1rem !important;
}

.modal-header h3 {
  font-size: 0.85rem !important;
}

.modal-body {
  padding: 0.8rem !important;
}

.modal-footer {
  padding: 0.6rem 0.8rem !important;
}

.form-group {
  margin-bottom: 0.5rem !important;
}

.form-group label {
  font-size: 0.7rem !important;
}

.form-input {
  padding: 5px 8px !important;
  font-size: 0.7rem !important;
}

@media (max-width: 768px) {
  .inventory-table th {
    font-size: 0.55rem !important;
  }
}
</style>