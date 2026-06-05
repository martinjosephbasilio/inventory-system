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
      <i class="fas fa-sync-alt" :class="{ 'fa-spin': false }"></i>
      Last refresh: {{ lastRefresh.toLocaleTimeString() }}
    </span>
    <label style="font-size: 12px; display: flex; align-items: center; gap: 5px; cursor: pointer;">
      <input type="checkbox" v-model="isAutoRefreshEnabled" style="margin: 0;">
      Auto-refresh (10 sec)
    </label>
  </div>
  <button @click="loadOrdersForDate" style="background: #2c3e50; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
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
                <i class="fas fa-trash-alt"></i> Delete Selected
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
              <th style="width: 40px">
                <input type="checkbox" @change="toggleSelectAll" v-model="selectAllFlag" />
              </th>
              <th>CUSTOMER</th>
              <th>TIME</th>
              <th>ITEM NAME</th>
              <th>CATEGORY</th>
              <th>AVAILABLE</th>
              <th>QTY</th>
              <th>UNIT</th>
              <th>UNIT PRICE</th>
              <th>AMOUNT</th>
              <th>REMARKS</th>
              <th style="width: 80px">ACTION</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredItems" :key="order.key" :class="{ 'selected-row': selectedOrderKeys.includes(order.key) }">
              <td class="center">
                <input type="checkbox" v-model="selectedOrderKeys" :value="order.key" />
              </td>
              <td>
                <strong>{{ order.customerName }}</strong>
              </td>
              <td>
                {{ order.timeDisplay }}
              </td>
              <td>
                <strong>{{ order.itemName }}</strong><br>
                <small class="item-code">{{ order.itemId }}</small>
              </td>
              <td>
                <span :class="['cat-badge', getCategoryClass(order.category)]">
                  <i :class="getCategoryIcon(order.category)"></i> {{ order.category || 'Packaging' }}
                </span>
              </td>
              <td>
                <span :class="['stock-badge', getStockClass(order.currentStock, order.reorderLevel)]">
                  <i :class="getStockIcon(order.currentStock, order.reorderLevel)"></i>
                  {{ order.boxes || 0 }} packs<br>
                  <small>{{ order.pcs || 0 }} pcs left</small>
                </span>
              </td>
              <td>
                <input type="number" v-model="order.quantity" min="1" 
                       class="qty-input" @change="updateAndSaveOrder(order)" />
              </td>
              <td>
                <select v-model="order.unit" @change="updateAndSaveOrder(order)" class="unit-select">
                  <option value="BASE">Piece (pcs)</option>
                  <option value="PACK">Pack ({{ order.packSize }} pcs)</option>
                </select>
              </td>
              <td class="price-cell">
                <i class="fas fa-peso-sign"></i>
                <input type="number" step="0.01" v-model="order.unitPrice" 
                        class="price-input" @change="updateAndSaveOrder(order)" />
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
              <td colspan="10" class="total-label"><strong>TOTAL AMOUNT:</strong></td>
              <td colspan="2"><strong class="total-amount">₱{{ formatNumber(totalAmount) }}</strong></td>
            </tr>
            <tr class="footer-row">
              <td colspan="12" class="footer-cell">
                <div class="footer-info">
                  <span><i class="fas fa-calendar-alt"></i> Generated Date: {{ currentDate }}</span>
                  <span><i class="fas fa-clock"></i> Generated Time: {{ currentTime }}</span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div class="actions">
        <div class="selection-info">
          <span><i class="fas fa-box"></i> Orders: {{ filteredItems.length }}</span>
          <span><i class="fas fa-check-circle"></i> Selected: {{ selectedOrderKeys.length }}</span>
          <span v-if="hasExistingOrders" class="existing-badge">
            <i class="fas fa-calendar-check"></i> {{ selectedDate }} has orders
          </span>
        </div>
        <div class="action-buttons">
          <button @click="previewOrderSlip" class="btn-preview">
            <i class="fas fa-eye"></i> Preview
          </button>
          <button @click="downloadPDF" class="btn-pdf">
            <i class="fas fa-file-pdf"></i> Download PDF
          </button>
        </div>
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
            <div class="form-group">
              <label><i class="fas fa-cubes"></i> Unit:</label>
              <select v-model="editOrderData.unit" class="form-input" @change="updateEditTotal">
                <option value="BASE">Piece (pcs)</option>
                <option value="PACK">Pack ({{ editOrderData?.packSize }} pcs)</option>
              </select>
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
              {{ editOrderData.quantity }} {{ editOrderData.unit === 'PACK' ? 'Pack(s)' : 'Piece(s)' }} × ₱{{ formatNumber(editOrderData.unitPrice) }} = 
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
    
    <!-- PREVIEW MODAL -->
    <div v-if="showPreview" class="modal" @click.self="showPreview = false">
      <div class="modal-content preview-modal">
        <div class="modal-header">
          <h3>Order Slip Preview</h3>
          <button class="close-btn" @click="showPreview = false">✕</button>
        </div>
        <div class="modal-body preview-body">
          <div class="receipt">
            <div class="receipt-header">
              <h2>INR PACKAGING CORPORATION</h2>
              <p>Packaging Solutions Provider</p>
              <p>Tel: (02) 8123-4567 | Email: sales@inrpackaging.com</p>
              <hr>
              <h3>ORDER SLIP / DELIVERY RECEIPT</h3>
            </div>
            
            <div class="receipt-info">
              <p><strong>Date:</strong> {{ selectedDate }}</p>
              <p><strong>Time:</strong> {{ orderTime || '--:--' }}</p>
            </div>
            
            <table class="receipt-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Time</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Item</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in selectedOrders" :key="order.key">
                  <td>{{ order.customerName }}</td>
                  <td>{{ order.timeDisplay }}</td>
                  <td>{{ order.quantity }}</td>
                  <td>{{ order.unit === 'PACK' ? 'Pack' : 'Piece' }}</td>
                  <td>{{ order.itemName }}</td>
                  <td>₱{{ formatNumber(order.unitPrice) }}</td>
                  <td>₱{{ formatNumber(order.amount) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="6" class="total-right"><strong>TOTAL:</strong></td>
                  <td><strong>₱{{ formatNumber(totalAmount) }}</strong></td>
                </tr>
                <tr class="receipt-footer-row">
                  <td colspan="7" class="receipt-footer-cell">
                    <div class="receipt-footer-info">
                      <span>Generated: {{ currentDate }} {{ currentTime }}</span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
            
            <div class="receipt-footer">
              <p>Thank you for your order!</p>
              <p>For inquiries, contact us at sales@inrpackaging.com</p>
              <hr>
              <p>This is a system-generated order slip.</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showPreview = false">Close</button>
          <button class="btn-save" @click="downloadPDF">Download PDF</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useInventoryStore } from '../stores/inventory'
import { ref, computed, onMounted, watch, inject } from 'vue'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import axios from 'axios'

const store = useInventoryStore()
const API_URL = 'https://inventory-system-backend-production-0549.up.railway.app/api'
const showToast = inject('showToast')
const showConfirm = inject('showConfirm')

// Get current date and time for generation
const now = new Date()
const currentDateValue = now.toISOString().split('T')[0]
const currentTimeValue = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

// Selected date for orders (default to current date)
const selectedDate = ref(currentDateValue)
const orderTime = ref(currentTimeValue.slice(0, 5))
const currentDate = ref(currentDateValue)
const currentTime = ref(currentTimeValue)
const filterCustomerName = ref('')
const searchQuery = ref('')
const showPreview = ref(false)
const showEditModal = ref(false)
const editOrderData = ref(null)

// Order items as array (each order is separate)
const orderItems = ref([])
const selectedOrderKeys = ref([])
const selectAllFlag = ref(false)

// Auto-refresh
const lastRefresh = ref(new Date())
let refreshInterval = null
const isAutoRefreshEnabled = ref(true) // pwedeng i-off ng user

// Existing orders tracking
const hasExistingOrders = ref(false)
const existingOrdersCount = ref(0)

const filteredItems = computed(() => {
  let result = orderItems.value
  
  if (filterCustomerName.value) {
    const query = filterCustomerName.value.toLowerCase()
    result = result.filter(order => 
      order.customerName.toLowerCase().includes(query)
    )
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
    'Boxes': 'cat-boxes',
    'Plastics': 'cat-plastics',
    'Films': 'cat-films',
    'Tapes': 'cat-tapes',
    'Bags': 'cat-bags',
    'Labels': 'cat-labels',
    'Tools': 'cat-tools',
    'Others': 'cat-others'
  }
  return classes[category] || 'cat-others'
}

const getCategoryIcon = (category) => {
  const icons = {
    'Boxes': 'fas fa-box',
    'Plastics': 'fas fa-flask',
    'Films': 'fas fa-film',
    'Tapes': 'fas fa-tape',
    'Bags': 'fas fa-shopping-bag',
    'Labels': 'fas fa-tag',
    'Tools': 'fas fa-tools',
    'Others': 'fas fa-archive'
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

// AUTO SAVE when editing directly in table
const updateAndSaveOrder = async (order) => {
  let baseQty = order.quantity
  if (order.unit === 'PACK') {
    baseQty = order.quantity * order.packSize
  }
  order.amount = baseQty * order.unitPrice
  
  try {
    const baseDelta = order.unit === 'PACK' 
      ? order.quantity * order.packSize 
      : order.quantity
    const totalSales = baseDelta * order.unitPrice
    
    const movement = {
      datetime: `${selectedDate.value} ${order.timeDisplay || orderTime.value || '12:00:00'}`,
      type: 'OUT',
      item_id: order.itemId,
      item_name: order.itemName,
      quantity: order.quantity,
      unit: order.unit,
      base_delta: baseDelta,
      note: order.remark || '',
      sell_price: order.unitPrice,
      total_sales: totalSales,
      customer_name: order.customerName
    }
    
    await axios.put(`${API_URL}/movements/${order.id}`, movement)
    showToast('Order updated!', 'success')
    
    await store.fetchStock()
    await store.fetchDashboard()
  } catch (error) {
    console.error('Error updating order:', error)
    showToast('Error updating order', 'error')
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
    message: `Are you sure you want to save changes to this order?`,
    confirmText: 'Yes, Save',
    cancelText: 'Cancel'
  })
  
  if (!confirmed) return
  
  try {
    const baseDelta = editOrderData.value.unit === 'PACK' 
      ? editOrderData.value.quantity * editOrderData.value.packSize 
      : editOrderData.value.quantity
    const totalSales = baseDelta * editOrderData.value.unitPrice
    
    const movement = {
      datetime: `${selectedDate.value} ${editOrderData.value.timeDisplay || orderTime.value || '12:00:00'}`,
      type: 'OUT',
      item_id: editOrderData.value.itemId,
      item_name: editOrderData.value.itemName,
      quantity: editOrderData.value.quantity,
      unit: editOrderData.value.unit,
      base_delta: baseDelta,
      note: editOrderData.value.remark || '',
      sell_price: editOrderData.value.unitPrice,
      total_sales: totalSales,
      customer_name: editOrderData.value.customerName
    }
    
    await axios.put(`${API_URL}/movements/${editOrderData.value.id}`, movement)
    
    const index = orderItems.value.findIndex(o => o.key === editOrderData.value.key)
    if (index !== -1) {
      orderItems.value[index] = {
        ...orderItems.value[index],
        customerName: editOrderData.value.customerName,
        timeDisplay: editOrderData.value.timeDisplay,
        quantity: editOrderData.value.quantity,
        unit: editOrderData.value.unit,
        unitPrice: editOrderData.value.unitPrice,
        amount: editOrderData.value.amount,
        remark: editOrderData.value.remark
      }
    }
    
    showToast('Order updated successfully!', 'success')
    showEditModal.value = false
    await loadOrdersForDate()
    await store.fetchStock()
    await store.fetchDashboard()
    
  } catch (error) {
    console.error('Error updating order:', error)
    showToast('Error updating order', 'error')
  }
}

const deleteSingleOrder = async (order) => {
  const confirmed = await showConfirm({
    type: 'warning',
    title: 'Delete Order',
    message: `Are you sure you want to delete order for "${order.itemName}"?`,
    confirmText: 'Yes, Delete',
    cancelText: 'Cancel'
  })
  
  if (!confirmed) return
  
  try {
    await axios.delete(`${API_URL}/movements/${order.id}`)
    showToast('Order deleted successfully!', 'success')
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
    message: `Are you sure you want to delete ${selectedOrderKeys.value.length} selected order(s)?`,
    confirmText: 'Yes, Delete',
    cancelText: 'Cancel'
  })
  
  if (!confirmed) return
  
  try {
    for (const key of selectedOrderKeys.value) {
      const order = orderItems.value.find(o => o.key === key)
      if (order && order.id) {
        await axios.delete(`${API_URL}/movements/${order.id}`)
      }
    }
    showToast(`${selectedOrderKeys.value.length} order(s) deleted successfully!`, 'success')
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
    message: `Are you sure you want to delete ALL ${existingOrdersCount.value} order(s) for ${selectedDate.value}?`,
    confirmText: 'Yes, Delete All',
    cancelText: 'Cancel'
  })
  
  if (!confirmed) return
  
  try {
    const response = await axios.get(`${API_URL}/movements`, {
      params: {
        startDate: selectedDate.value,
        endDate: selectedDate.value,
        type: 'OUT'
      }
    })
    
    for (const order of response.data) {
      await axios.delete(`${API_URL}/movements/${order.id}`)
    }
    
    showToast(`All orders for ${selectedDate.value} deleted successfully!`, 'success')
    await loadOrdersForDate()
    await store.fetchStock()
    await store.fetchDashboard()
  } catch (error) {
    console.error('Error deleting all orders:', error)
    showToast('Error deleting orders', 'error')
  }
}

const loadOrdersForDate = async () => {
  try {
    const response = await axios.get(`${API_URL}/movements`, {
      params: {
        startDate: selectedDate.value,
        endDate: selectedDate.value,
        type: 'OUT'
      }
    })
    
    existingOrdersCount.value = response.data.length
    hasExistingOrders.value = response.data.length > 0
    
    orderItems.value = []
    selectedOrderKeys.value = []
    
    for (const order of response.data) {
      const item = store.stock.find(i => i.id === order.item_id)
      
      let timeDisplay = ''
      if (order.datetime) {
        const timePart = order.datetime.split(' ')[1]
        if (timePart) {
          timeDisplay = timePart.slice(0, 5)
        }
      }
      
      if (item) {
        let baseQty = order.quantity
        if (order.unit === 'PACK') {
          baseQty = order.quantity * item.pack_size
        }
        const amount = baseQty * (order.sell_price || item.sell_base)
        
        orderItems.value.push({
          key: `${order.item_id}_${order.id}`,
          id: order.id,
          datetime: order.datetime,
          itemId: order.item_id,
          itemName: order.item_name,
          category: item.category,
          packSize: item.pack_size,
          currentStock: item.current_stock_base,
          boxes: item.boxes,
          pcs: item.pcs,
          reorderLevel: item.reorder_level,
          quantity: order.quantity,
          unit: order.unit,
          unitPrice: order.sell_price || item.sell_base,
          amount: amount,
          remark: order.note || '',
          customerName: order.customer_name || 'Walk-in Customer',
          timeDisplay: timeDisplay
        })
      } else {
        orderItems.value.push({
          key: `${order.item_id}_${order.id}`,
          id: order.id,
          datetime: order.datetime,
          itemId: order.item_id,
          itemName: order.item_name,
          category: 'Unknown',
          packSize: 1,
          currentStock: 0,
          boxes: 0,
          pcs: 0,
          reorderLevel: 0,
          quantity: order.quantity,
          unit: order.unit,
          unitPrice: order.sell_price || 0,
          amount: order.total_sales || 0,
          remark: order.note || '',
          customerName: order.customer_name || 'Walk-in Customer',
          timeDisplay: timeDisplay
        })
      }
    }
    
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

const previewOrderSlip = () => {
  if (selectedOrderKeys.value.length === 0) {
    showToast('Please select at least one order', 'warning')
    return
  }
  showPreview.value = true
}

const downloadPDF = () => {
  if (selectedOrderKeys.value.length === 0) {
    showToast('Please select at least one order', 'warning')
    return
  }
  
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait'
  })
  
  doc.setFontSize(18)
  doc.setTextColor(44, 62, 80)
  doc.text('INR PACKAGING CORPORATION', 105, 20, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('Packaging Solutions Provider', 105, 28, { align: 'center' })
  doc.text('Tel: (02) 8123-4567 | Email: sales@inrpackaging.com', 105, 34, { align: 'center' })
  
  doc.setDrawColor(44, 62, 80)
  doc.line(20, 40, 190, 40)
  
  doc.setFontSize(14)
  doc.setTextColor(44, 62, 80)
  doc.text('ORDER SLIP / DELIVERY RECEIPT', 105, 50, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`Date: ${selectedDate.value}`, 20, 62)
  doc.text(`Time: ${orderTime.value || '--:--'}`, 20, 70)
  
  const tableData = []
  let grandTotal = 0
  
  for (const order of selectedOrders.value) {
    let baseQty = order.quantity
    let unitDisplay = order.unit === 'BASE' ? 'Piece' : `Pack (${order.packSize} pcs)`
    if (order.unit === 'PACK') {
      baseQty = order.quantity * order.packSize
    }
    const amount = baseQty * order.unitPrice
    grandTotal += amount
    
    tableData.push([
      order.customerName,
      order.timeDisplay,
      `${order.quantity}`,
      unitDisplay,
      order.itemName,
      `₱${order.unitPrice.toFixed(2)}`,
      `₱${amount.toFixed(2)}`,
      order.remark
    ])
  }
  
  autoTable(doc, {
    startY: 78,
    head: [['Customer', 'Time', 'Qty', 'Unit', 'Item', 'Unit Price', 'Amount', 'Remarks']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255] },
    margin: { left: 20, right: 20 }
  })
  
  const finalY = doc.lastAutoTable.finalY + 10
  doc.setFontSize(12)
  doc.setTextColor(44, 62, 80)
  doc.text(`TOTAL AMOUNT: ₱${grandTotal.toFixed(2)}`, 170, finalY, { align: 'right' })
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated on: ${currentDate.value} ${currentTime.value}`, 20, finalY + 15)
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('Thank you for your order!', 105, finalY + 25, { align: 'center' })
  doc.text('For inquiries, contact us at sales@inrpackaging.com', 105, finalY + 31, { align: 'center' })
  doc.text('This is a system-generated order slip.', 105, finalY + 37, { align: 'center' })
  
  const safeTime = orderTime.value?.replace(/:/g, '-') || '00-00'
  doc.save(`OrderSlip_INR_${selectedDate.value}_${safeTime}.pdf`)
}

onMounted(async () => {
  await store.fetchStock()
  await loadOrdersForDate()
  // Start auto-refresh every 10 seconds
  if (refreshInterval) clearInterval(refreshInterval)
  refreshInterval = setInterval(() => {
    if (isAutoRefreshEnabled.value) {
      loadOrdersForDate()
      lastRefresh.value = new Date()
      console.log('Auto-refreshed orders at:', lastRefresh.value.toLocaleTimeString())
    }
  }, 10000) // 10 seconds
})

// Clean up pag umalis sa page
import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
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

.form-input:focus {
  outline: none;
  border-color: #2c3e50;
  box-shadow: 0 0 0 2px rgba(44,62,80,0.1);
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-delete-selected:hover { background: #bb2d3b; }

.btn-delete-all {
  background: #dc3545;
  color: white;
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  margin-left: 10px;
}
.btn-delete-all:hover { background: #bb2d3b; }

.date-info { margin-bottom: 1rem; }
.info-badge { 
  background: #edf2f7; 
  padding: 8px 12px; 
  border-radius: 6px; 
  display: inline-flex; 
  align-items: center; 
  gap: 10px; 
  font-size: 0.85rem; 
  color: #2d3748; 
  border-left: 3px solid #2c3e50;
}
.existing-badge { 
  background: #ffc107; 
  color: #333; 
  padding: 4px 10px; 
  border-radius: 20px; 
  font-size: 0.7rem; 
  font-weight: bold; 
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
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #1a252f;
}

.items-table td {
  padding: 10px;
  border-bottom: 1px solid #e2e8f0;
  color: #2d3748;
  background: white;
}

.items-table tr:hover {
  background: #f7fafc;
}

.selected-row {
  background: #edf2f7 !important;
}

.item-code {
  font-size: 0.65rem;
  color: #718096;
}

.qty-input {
  width: 60px;
  padding: 4px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  background: white;
  color: #2d3748;
}

.unit-select {
  width: 90px;
  padding: 4px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  background: white;
  color: #2d3748;
}

.price-input {
  width: 80px;
  padding: 4px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  background: white;
  color: #2d3748;
}

.remark-input {
  width: 100px;
  padding: 4px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  background: white;
  color: #2d3748;
}

.amount-cell {
  font-weight: bold;
  color: #28a745;
}

.action-cell {
  display: flex;
  gap: 5px;
  justify-content: center;
}

.btn-edit {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 5px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
}
.btn-edit:hover { background: #138496; }

.btn-delete-row {
  background: #dc3545;
  color: white;
  border: none;
  padding: 5px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
}
.btn-delete-row:hover { background: #bb2d3b; }

.total-row {
  background: #f8f9fa;
  font-weight: bold;
}

.total-label {
  text-align: right;
}

.total-amount {
  color: #28a745;
  font-size: 1.1rem;
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.selection-info {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #4a5568;
  align-items: center;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-preview {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}
.btn-preview:hover { background: #138496; }

.btn-pdf {
  background: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}
.btn-pdf:hover { background: #bb2d3b; }

.empty-row {
  text-align: center;
  padding: 20px;
  color: #a0aec0;
}

.center {
  text-align: center;
}

/* Category Badges */
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

/* Stock Badges */
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
  border-radius: 8px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.preview-modal { width: 800px; }
.edit-modal { width: 500px; }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem;
  border-bottom: 1px solid #e2e8f0;
  background: #2c3e50;
  color: white;
  border-radius: 8px 8px 0 0;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
}

.modal-body { padding: 1rem; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.8rem;
  border-top: 1px solid #e2e8f0;
}

.selected-item-info {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #edf2f7;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.preview {
  background: #f0f2f5;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.btn-cancel {
  background: #718096;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}
.btn-cancel:hover { background: #4a5568; }

.btn-save {
  background: #2c3e50;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}
.btn-save:hover { background: #1a252f; }

/* Receipt */
.receipt { font-family: monospace; }
.receipt-header { text-align: center; margin-bottom: 15px; }
.receipt-header h2 { font-size: 1rem; margin-bottom: 5px; }
.receipt-header p { font-size: 0.7rem; margin: 2px 0; }
.receipt-info { margin-bottom: 10px; font-size: 0.75rem; }
.receipt-table { width: 100%; border-collapse: collapse; font-size: 0.7rem; }
.receipt-table th, .receipt-table td { border: 1px solid #ddd; padding: 4px; text-align: left; }
.receipt-table th { background: #f0f0f0; }
.total-right { text-align: right; }
.receipt-footer { text-align: center; margin-top: 10px; font-size: 0.65rem; }

.footer-row { background: #f8f9fa; }
.footer-cell { padding: 10px !important; }
.footer-info { display: flex; justify-content: flex-end; gap: 20px; font-size: 0.7rem; color: #666; }
.footer-info i { margin-right: 4px; color: #2c3e50; }

.receipt-footer-row { background: #f8f9fa; }
.receipt-footer-cell { padding: 8px !important; }
.receipt-footer-info { text-align: right; font-size: 0.65rem; color: #666; }

@media (max-width: 768px) {
  .form-row { flex-direction: column; }
  .action-buttons { width: 100%; }
  .action-buttons button { flex: 1; }
  .action-cell { flex-direction: column; align-items: center; }
}
/* PAMPALIIT LANG NG ORDER SLIP TABLE - IDAGDAG SA DULO */

.items-table th {
  padding: 0.4rem 0.3rem !important;
  font-size: 0.65rem !important;
}

.items-table td {
  padding: 0.35rem 0.25rem !important;
  font-size: 0.7rem !important;
}

.qty-input {
  width: 55px !important;
  padding: 3px !important;
  font-size: 0.65rem !important;
}

.unit-select {
  width: 85px !important;
  padding: 3px !important;
  font-size: 0.65rem !important;
}

.price-input {
  width: 75px !important;
  padding: 3px !important;
  font-size: 0.65rem !important;
}

.remark-input {
  width: 90px !important;
  padding: 3px !important;
  font-size: 0.65rem !important;
}

.cat-badge {
  padding: 2px 6px !important;
  font-size: 0.6rem !important;
}

.stock-badge {
  padding: 2px 6px !important;
  font-size: 0.6rem !important;
  gap: 2px !important;
}

.btn-edit, .btn-delete-row {
  padding: 3px 6px !important;
  font-size: 0.55rem !important;
}

.amount-cell {
  font-size: 0.7rem !important;
}

.card {
  padding: 0.8rem !important;
}

.header-actions h3 {
  font-size: 0.95rem !important;
}

.header-actions p {
  font-size: 0.65rem !important;
  margin-bottom: 0.8rem !important;
}

.order-form {
  padding: 0.6rem !important;
  margin-bottom: 0.6rem !important;
}

.form-row {
  gap: 0.5rem !important;
  margin-bottom: 0.5rem !important;
}

.form-group label {
  font-size: 0.65rem !important;
}

.form-input {
  padding: 4px 8px !important;
  font-size: 0.65rem !important;
}

.btn-secondary, .btn-delete-selected {
  padding: 4px 10px !important;
  font-size: 0.6rem !important;
}

.info-badge {
  padding: 4px 8px !important;
  font-size: 0.7rem !important;
}

.btn-delete-all {
  padding: 2px 8px !important;
  font-size: 0.6rem !important;
}

.summary-info span, .selection-info span {
  font-size: 0.65rem !important;
}

.btn-preview, .btn-pdf {
  padding: 4px 10px !important;
  font-size: 0.65rem !important;
}

.total-amount {
  font-size: 0.9rem !important;
}

.modal-content {
  width: 450px !important;
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

.selected-item-info {
  padding: 6px 8px !important;
  margin-bottom: 0.8rem !important;
  font-size: 0.7rem !important;
}

.preview {
  padding: 0.5rem !important;
  margin-top: 0.5rem !important;
}

.preview p {
  font-size: 0.7rem !important;
}

.footer-info {
  font-size: 0.6rem !important;
  gap: 10px !important;
}

.empty-row {
  padding: 0.8rem !important;
  font-size: 0.7rem !important;
}
</style>
