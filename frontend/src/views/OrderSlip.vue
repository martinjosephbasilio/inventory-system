<template>
  <div>
    <div class="card">
      <div class="header-actions">
        <h3><i class="fas fa-file-invoice"></i> Order Slip / Delivery Receipt</h3>
        <p><i class="fas fa-box-open"></i> Generate order slip for packaging materials</p>
      </div>
      
      <!-- Auto-refresh indicator -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 6px 12px; background: #f0f4f8; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 15px;">
          <span style="font-size: 12px; color: #2c3e50;">
            <i class="fas fa-sync-alt"></i>
            Last refresh: {{ lastRefresh.toLocaleTimeString() }}
          </span>
          <label style="font-size: 12px; display: flex; align-items: center; gap: 5px; cursor: pointer;">
            <input type="checkbox" v-model="isAutoRefreshEnabled">
            Auto-refresh (10 sec)
          </label>
        </div>
        <button @click="loadOrdersForDate" class="btn-refresh">
          <i class="fas fa-refresh"></i> Refresh Now
        </button>
      </div>
      
      <!-- Order Form -->
      <div class="order-form">
        <div class="form-row">
          <div class="form-group">
            <label><i class="fas fa-calendar-alt"></i> Date:</label>
            <input type="date" v-model="selectedDate" class="form-input" />
          </div>
          <div class="form-group">
            <label><i class="fas fa-clock"></i> Time:</label>
            <input type="time" v-model="orderTime" class="form-input" />
          </div>
          <div class="form-group">
            <label><i class="fas fa-building"></i> Customer / Company:</label>
            <input type="text" v-model="filterCustomerName" placeholder="Filter by customer name" class="form-input" />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label><i class="fas fa-search"></i> Search Item:</label>
            <input type="text" v-model="searchQuery" placeholder="Type item name or ID..." class="form-input" />
          </div>
          <div class="form-group">
            <label>&nbsp;</label>
            <div class="button-group">
              <button @click="selectAllFiltered" class="btn-secondary">
                <i class="fas fa-check-double"></i> Select All
              </button>
              <button @click="clearSelection" class="btn-secondary">
                <i class="fas fa-times"></i> Clear
              </button>
              <button @click="deleteSelectedOrders" class="btn-delete-selected" v-if="selectedOrderKeys.length > 0">
                <i class="fas fa-trash-alt"></i> Delete Selected ({{ selectedOrderKeys.length }})
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Date Info Badge -->
      <div class="date-info" v-if="hasExistingOrders">
        <div class="info-badge">
          <i class="fas fa-history"></i> 
          {{ existingOrdersCount }} existing order(s) for {{ selectedDate }}
          <button @click="deleteAllOrdersForDate" class="btn-delete-all" v-if="existingOrdersCount > 0">
            <i class="fas fa-trash-alt"></i> Delete All
          </button>
        </div>
      </div>
      
      <!-- Items Table -->
      <div class="table-responsive">
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 30px"><input type="checkbox" @change="toggleSelectAll" v-model="selectAllFlag" /></th>
              <th>CUSTOMER</th>
              <th>TIME</th>
              <th>ITEM CODE</th>
              <th>ITEM NAME</th>
              <th>CATEGORY</th>
              <th>AVAILABLE</th>
              <th>QTY</th>
              <th>UNIT PRICE</th>
              <th>AMOUNT</th>
              <th>REMARKS</th>
              <th style="width: 70px">ACTION</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredItems" :key="order.key" :class="{ 'selected-row': selectedOrderKeys.includes(order.key) }">
              <td class="center">
                <input type="checkbox" v-model="selectedOrderKeys" :value="order.key" />
              </td>
              <td><strong>{{ order.customerName }}</strong></td>
              <td>{{ order.timeDisplay }}</td>
              <td><code class="item-code">{{ order.itemId }}</code></td>
              <td><strong>{{ order.itemName }}</strong></td>
              <td>
                <span :class="['cat-badge', getCategoryClass(order.category)]">
                  <i :class="getCategoryIcon(order.category)"></i> {{ order.category || 'Packaging' }}
                </span>
              </td>
              <td>
                <span :class="['stock-badge', getStockClass(order.currentStock, order.reorderLevel)]">
                  <i :class="getStockIcon(order.currentStock, order.reorderLevel)"></i>
                  {{ order.boxes || 0 }} packs left
                </span>
              </td>
              <td>
                <input type="number" v-model="order.quantity" min="1" 
                       class="qty-input" @change="updateAndSaveOrder(order)" />
              </td>
              <td>
                <div class="price-wrapper">
                  <i class="fas fa-peso-sign"></i>
                  <input type="number" step="0.01" v-model="order.unitPrice" 
                         class="price-input" @change="updateAndSaveOrder(order)" />
                </div>
              </td>
              <td class="amount-cell"><i class="fas fa-peso-sign"></i> {{ formatNumber(order.amount) }}</td>
              <td>
                <input type="text" v-model="order.remark" placeholder="Optional" class="remark-input" @blur="updateAndSaveOrder(order)" />
              </td>
              <td class="action-cell">
                <button @click="openEditModal(order)" class="btn-edit" title="Edit Order">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="deleteSingleOrder(order)" class="btn-delete-row" title="Delete Order">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
            <tr v-if="filteredItems.length === 0">
              <td colspan="12" class="empty-row">
                <i class="fas fa-box-open"></i> No orders found
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="9" class="total-label"><strong>TOTAL AMOUNT:</strong></td>
              <td colspan="3"><strong class="total-amount">₱{{ formatNumber(totalAmount) }}</strong></td>
            </tr>
            <tr class="footer-row">
              <td colspan="12" class="footer-cell">
                <div class="footer-info">
                  <span><i class="fas fa-calendar-alt"></i> Generated Date: {{ currentDate }}</span>
                  <span><i class="fas fa-clock"></i> Generated Time: {{ currentTime }}</span>
                  <span><i class="fas fa-box"></i> Total Orders: {{ filteredItems.length }}</span>
                  <span><i class="fas fa-check-circle"></i> Selected: {{ selectedOrderKeys.length }}</span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    
    <!-- EDIT MODAL -->
    <div v-if="showEditModal" class="modal" @click.self="showEditModal = false">
      <div class="modal-content edit-modal">
        <div class="modal-header">
          <h3><i class="fas fa-edit"></i> Edit Order</h3>
          <button class="close-btn" @click="showEditModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="selected-item-info">
            <i class="fas fa-box"></i>
            <div>
              <strong>{{ editOrderData?.itemName }}</strong>
              <span class="item-code">{{ editOrderData?.itemId }}</span>
            </div>
          </div>
          
          <div class="form-group">
            <label><i class="fas fa-building"></i> Customer Name:</label>
            <input type="text" v-model="editOrderData.customerName" class="form-input" />
          </div>
          
          <div class="form-group">
            <label><i class="fas fa-clock"></i> Time:</label>
            <input type="time" v-model="editOrderData.timeDisplay" class="form-input" />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label><i class="fas fa-sort-amount-up"></i> Quantity:</label>
              <input type="number" v-model="editOrderData.quantity" min="1" class="form-input" @change="updateEditTotal" />
            </div>
          </div>
          
          <div class="form-group">
            <label><i class="fas fa-tag"></i> Unit Price:</label>
            <input type="number" step="0.01" v-model="editOrderData.unitPrice" class="form-input" @change="updateEditTotal" />
          </div>
          
          <div class="form-group">
            <label><i class="fas fa-pen"></i> Remarks:</label>
            <input type="text" v-model="editOrderData.remark" class="form-input" placeholder="Optional" />
          </div>
          
          <div class="preview">
            <strong><i class="fas fa-eye"></i> Preview:</strong>
            <p>
              <i class="fas fa-calculator"></i> 
              {{ editOrderData.quantity }} × ₱{{ formatNumber(editOrderData.unitPrice) }} = 
              <strong>₱{{ formatNumber(editOrderData.amount) }}</strong>
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showEditModal = false">
            <i class="fas fa-times"></i> Cancel
          </button>
          <button class="btn-save" @click="saveEditOrder">
            <i class="fas fa-save"></i> Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useInventoryStore } from '../stores/inventory'
import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import axios from 'axios'

const store = useInventoryStore()
const API_URL = 'https://inventory-system-backend-production-0549.up.railway.app/api'
const showToast = inject('showToast')
const showConfirm = inject('showConfirm')

// Date and time
const now = new Date()
const currentDateValue = now.toISOString().split('T')[0]
const currentTimeValue = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

const selectedDate = ref(currentDateValue)
const orderTime = ref(currentTimeValue.slice(0, 5))
const currentDate = ref(currentDateValue)
const currentTime = ref(currentTimeValue)
const filterCustomerName = ref('')
const searchQuery = ref('')
const showEditModal = ref(false)
const editOrderData = ref(null)

// Order items
const orderItems = ref([])
const selectedOrderKeys = ref([])
const selectAllFlag = ref(false)

// Auto-refresh
const lastRefresh = ref(new Date())
let refreshInterval = null
const isAutoRefreshEnabled = ref(true)

// Existing orders tracking
const hasExistingOrders = ref(false)
const existingOrdersCount = ref(0)

const filteredItems = computed(() => {
  let result = orderItems.value
  
  if (filterCustomerName.value) {
    const query = filterCustomerName.value.toLowerCase()
    result = result.filter(order => order.customerName.toLowerCase().includes(query))
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(order => 
      order.itemName.toLowerCase().includes(query) || 
      order.itemId.toLowerCase().includes(query)
    )
  }
  
  return result
})

const selectedOrders = computed(() => {
  return orderItems.value.filter(order => selectedOrderKeys.value.includes(order.key))
})

const totalAmount = computed(() => {
  let total = 0
  for (const order of selectedOrders.value) {
    total += order.amount
  }
  return total
})

const formatNumber = (num) => {
  return num?.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'
}

const getCategoryClass = (category) => {
  const classes = {
    'Boxes': 'cat-boxes', 'Plastics': 'cat-plastics', 'Films': 'cat-films',
    'Tapes': 'cat-tapes', 'Bags': 'cat-bags', 'Labels': 'cat-labels',
    'Tools': 'cat-tools', 'Others': 'cat-others'
  }
  return classes[category] || 'cat-others'
}

const getCategoryIcon = (category) => {
  const icons = {
    'Boxes': 'fas fa-box', 'Plastics': 'fas fa-flask', 'Films': 'fas fa-film',
    'Tapes': 'fas fa-tape', 'Bags': 'fas fa-shopping-bag', 'Labels': 'fas fa-tag',
    'Tools': 'fas fa-tools', 'Others': 'fas fa-archive'
  }
  return icons[category] || 'fas fa-box'
}

const getStockClass = (stock, reorder) => {
  if (stock === 0) return 'stock-out'
  if (stock <= reorder) return 'stock-low'
  return 'stock-ok'
}

const getStockIcon = (stock, reorder) => {
  if (stock === 0) return 'fas fa-times-circle'
  if (stock <= reorder) return 'fas fa-exclamation-triangle'
  return 'fas fa-check-circle'
}

watch(selectedDate, () => {
  loadOrdersForDate()
})

const updateAndSaveOrder = async (order) => {
  const quantity = Number(order.quantity)
  const unitPrice = Number(order.unitPrice)
  const amount = quantity * unitPrice
  order.amount = amount
  
  const requestData = {
    datetime: `${selectedDate.value} ${order.timeDisplay || orderTime.value || '12:00:00'}`,
    type: 'OUT',
    item_id: order.itemId,
    item_name: order.itemName,
    quantity: quantity,
    unit: 'PACK',
    base_delta: quantity,
    note: order.remark ? String(order.remark) : '',
    sell_price: unitPrice,
    total_sales: amount,
    customer_name: order.customerName || 'Walk-in Customer'
  }
  
  try {
    await axios.put(`${API_URL}/movements/${order.id}`, requestData)
    showToast('Order updated!', 'success')
    await store.fetchStock()
    await store.fetchDashboard()
  } catch (error) {
    console.error('Error updating order:', error.response?.data || error)
    showToast('Error updating order', 'error')
  }
}

const updateEditTotal = () => {
  if (editOrderData.value) {
    editOrderData.value.amount = Number(editOrderData.value.quantity) * Number(editOrderData.value.unitPrice)
  }
}

const openEditModal = (order) => {
  editOrderData.value = { ...order }
  showEditModal.value = true
}

const saveEditOrder = async () => {
  if (!editOrderData.value) return
  
  const confirmed = await showConfirm({
    type: 'info',
    title: 'Save Changes',
    message: `Save changes to this order?`,
    confirmText: 'Yes, Save',
    cancelText: 'Cancel'
  })
  
  if (!confirmed) return
  
  const quantity = Number(editOrderData.value.quantity)
  const unitPrice = Number(editOrderData.value.unitPrice)
  const amount = quantity * unitPrice
  editOrderData.value.amount = amount
  
  const requestData = {
    datetime: `${selectedDate.value} ${editOrderData.value.timeDisplay || orderTime.value || '12:00:00'}`,
    type: 'OUT',
    item_id: editOrderData.value.itemId,
    item_name: editOrderData.value.itemName,
    quantity: quantity,
    unit: 'PACK',
    base_delta: quantity,
    note: editOrderData.value.remark ? String(editOrderData.value.remark) : '',
    sell_price: unitPrice,
    total_sales: amount,
    customer_name: editOrderData.value.customerName || 'Walk-in Customer'
  }
  
  try {
    await axios.put(`${API_URL}/movements/${editOrderData.value.id}`, requestData)
    
    const index = orderItems.value.findIndex(o => o.key === editOrderData.value.key)
    if (index !== -1) {
      orderItems.value[index] = { ...orderItems.value[index], ...editOrderData.value }
    }
    
    showToast('Order updated successfully!', 'success')
    showEditModal.value = false
    await loadOrdersForDate()
    await store.fetchStock()
    await store.fetchDashboard()
  } catch (error) {
    console.error('Error updating order:', error.response?.data || error)
    showToast('Error updating order', 'error')
  }
}

const deleteSingleOrder = async (order) => {
  const confirmed = await showConfirm({
    type: 'warning',
    title: 'Delete Order',
    message: `Delete order for "${order.itemName}"?`,
    confirmText: 'Yes, Delete',
    cancelText: 'Cancel'
  })
  
  if (!confirmed) return
  
  try {
    await axios.delete(`${API_URL}/movements/${order.id}`)
    showToast('Order deleted!', 'success')
    await loadOrdersForDate()
    await store.fetchStock()
    await store.fetchDashboard()
  } catch (error) {
    console.error('Error deleting order:', error)
    showToast('Error deleting order', 'error')
  }
}

const deleteSelectedOrders = async () => {
  if (selectedOrderKeys.value.length === 0) return
  
  const confirmed = await showConfirm({
    type: 'warning',
    title: 'Delete Selected Orders',
    message: `Delete ${selectedOrderKeys.value.length} selected order(s)?`,
    confirmText: 'Yes, Delete',
    cancelText: 'Cancel'
  })
  
  if (!confirmed) return
  
  try {
    for (const key of selectedOrderKeys.value) {
      const order = orderItems.value.find(o => o.key === key)
      if (order?.id) {
        await axios.delete(`${API_URL}/movements/${order.id}`)
      }
    }
    showToast(`${selectedOrderKeys.value.length} order(s) deleted!`, 'success')
    selectedOrderKeys.value = []
    await loadOrdersForDate()
    await store.fetchStock()
    await store.fetchDashboard()
  } catch (error) {
    console.error('Error deleting orders:', error)
    showToast('Error deleting orders', 'error')
  }
}

const deleteAllOrdersForDate = async () => {
  const confirmed = await showConfirm({
    type: 'warning',
    title: 'Delete All Orders',
    message: `Delete ALL ${existingOrdersCount.value} order(s) for ${selectedDate.value}?`,
    confirmText: 'Yes, Delete All',
    cancelText: 'Cancel'
  })
  
  if (!confirmed) return
  
  try {
    const response = await axios.get(`${API_URL}/movements`, {
      params: { startDate: selectedDate.value, endDate: selectedDate.value, type: 'OUT' }
    })
    
    for (const order of response.data) {
      await axios.delete(`${API_URL}/movements/${order.id}`)
    }
    
    showToast(`All orders for ${selectedDate.value} deleted!`, 'success')
    await loadOrdersForDate()
    await store.fetchStock()
    await store.fetchDashboard()
  } catch (error) {
    console.error('Error deleting all orders:', error)
    showToast('Error deleting orders', 'error')
  }
}

// ✅ UPDATED: Exclude Stock Adjustment transactions
const loadOrdersForDate = async () => {
  try {
    const response = await axios.get(`${API_URL}/movements`, {
      params: { startDate: selectedDate.value, endDate: selectedDate.value, type: 'OUT' }
    })
    
    // ✅ FILTER: I-exclude ang mga may customer_name na "Stock Adjustment"
    const filteredOrders = response.data.filter(order => 
      order.customer_name !== 'Stock Adjustment'
    )
    
    existingOrdersCount.value = filteredOrders.length
    hasExistingOrders.value = filteredOrders.length > 0
    
    orderItems.value = []
    selectedOrderKeys.value = []
    
    for (const order of filteredOrders) {
      const item = store.stock.find(i => i.id === order.item_id)
      
      let timeDisplay = ''
      if (order.datetime) {
        const timePart = order.datetime.split(' ')[1]
        if (timePart) timeDisplay = timePart.slice(0, 5)
      }
      
      const quantity = Number(order.quantity) || 1
      const unitPrice = Number(order.sell_price) || (item?.sell_pack || 0)
      const amount = quantity * unitPrice
      
      orderItems.value.push({
        key: `${order.item_id}_${order.id}`,
        id: order.id,
        itemId: order.item_id,
        itemName: order.item_name,
        category: item?.category || 'Packaging',
        packSize: item?.pack_size || 1,
        currentStock: item?.current_stock_base || 0,
        boxes: item?.boxes || 0,
        pcs: item?.pcs || 0,
        reorderLevel: item?.reorder_level || 20,
        quantity: quantity,
        unitPrice: unitPrice,
        amount: amount,
        remark: order.note || '',
        customerName: order.customer_name || 'Walk-in Customer',
        timeDisplay: timeDisplay
      })
    }
    
    lastRefresh.value = new Date()
  } catch (error) {
    console.error('Error loading orders:', error)
  }
}

const selectAllFiltered = () => {
  selectedOrderKeys.value = filteredItems.value.map(order => order.key)
  selectAllFlag.value = true
}

const clearSelection = () => {
  selectedOrderKeys.value = []
  selectAllFlag.value = false
}

const toggleSelectAll = () => {
  if (selectAllFlag.value) {
    selectAllFiltered()
  } else {
    clearSelection()
  }
}

onMounted(async () => {
  await store.fetchStock()
  await loadOrdersForDate()
  
  if (refreshInterval) clearInterval(refreshInterval)
  refreshInterval = setInterval(() => {
    if (isAutoRefreshEnabled.value) {
      loadOrdersForDate()
    }
  }, 10000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
})
</script>

<style scoped>
/* Styles - keep your existing styles */
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

.btn-refresh {
  background: #2c3e50;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}

.order-form {
  background: #f4f6f8;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #e2e6ea;
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  min-width: 180px;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: bold;
  font-size: 0.85rem;
  color: #4a5568;
}

.form-group label i {
  margin-right: 6px;
  color: #2c3e50;
}

.form-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  background: white;
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

.btn-secondary {
  background: #718096;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary:hover { background: #4a5568; }

.btn-delete-selected {
  background: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-delete-all {
  background: #dc3545;
  color: white;
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  margin-left: 10px;
}

.date-info { margin-bottom: 1rem; }
.info-badge { 
  background: #edf2f7; 
  padding: 8px 12px; 
  border-radius: 6px; 
  display: inline-flex; 
  align-items: center; 
  gap: 10px; 
  font-size: 0.85rem; 
  border-left: 3px solid #2c3e50;
}

.table-responsive {
  overflow-x: auto;
  margin-bottom: 1rem;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
  background: white;
}

.items-table th {
  background: #2c3e50;
  color: white;
  padding: 10px 8px;
  text-align: left;
  font-weight: 600;
}

.items-table td {
  padding: 8px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

.selected-row {
  background: #edf2f7 !important;
}

.item-code {
  font-size: 0.7rem;
  color: #00adb5;
  background: #e3f2fd;
  padding: 2px 6px;
  border-radius: 4px;
}

.qty-input {
  width: 60px;
  padding: 4px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
}

.price-input {
  width: 80px;
  padding: 4px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
}

.price-wrapper {
  display: flex;
  align-items: center;
  gap: 3px;
}

.price-wrapper i {
  font-size: 0.7rem;
  color: #6c757d;
}

.remark-input {
  width: 100px;
  padding: 4px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
}

.amount-cell {
  font-weight: bold;
  color: #28a745;
}

.action-cell {
  display: flex;
  gap: 5px;
}

.btn-edit, .btn-delete-row {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
}

.btn-edit { background: #17a2b8; color: white; }
.btn-delete-row { background: #dc3545; color: white; }

.total-row {
  background: #f8f9fa;
}

.total-label {
  text-align: right;
}

.total-amount {
  color: #28a745;
  font-size: 1.1rem;
}

.footer-row {
  background: #f8f9fa;
}

.footer-cell {
  padding: 10px !important;
}

.footer-info {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  font-size: 0.7rem;
  color: #666;
}

.center {
  text-align: center;
}

.cat-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.cat-boxes { background: #e3f2fd; color: #1565c0; }
.cat-plastics { background: #f3e5f5; color: #6a1b9a; }
.cat-films { background: #fff3e0; color: #e65100; }
.cat-tapes { background: #e8f5e9; color: #2e7d32; }
.cat-bags { background: #e0f2f1; color: #00695c; }
.cat-labels { background: #fce4ec; color: #c2185b; }
.cat-tools { background: #eceff1; color: #455a64; }
.cat-others { background: #f5f5f5; color: #616161; }

.stock-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
}

.stock-out { color: #dc3545; background: #f8d7da; }
.stock-low { color: #856404; background: #fff3cd; }
.stock-ok { color: #155724; background: #d4edda; }

.empty-row {
  text-align: center;
  padding: 20px;
  color: #a0aec0;
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
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.edit-modal { width: 450px; }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
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

.modal-body { padding: 16px; }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
}

.selected-item-info {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #edf2f7;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.preview {
  background: #f0f2f5;
  padding: 10px;
  border-radius: 8px;
  margin-top: 16px;
}

.btn-cancel {
  background: #718096;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-save {
  background: #2c3e50;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .form-row { flex-direction: column; }
  .action-cell { flex-direction: column; }
}
</style>