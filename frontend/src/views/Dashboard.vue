<template>
  <div>
    <div class="card">
      <div class="header-actions">
        <h3><i class="fas fa-chart-line"></i> INR Packaging Dashboard</h3>
        <p>Real-time inventory and financial overview</p>
      </div>
      
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-arrow-down"></i></div>
          <div class="stat-info">
            <h4>Total Inventory IN</h4>
            <div class="value">{{ store.dashboard.total_in_base }} <span class="unit">units</span></div>
            <small>Year to date</small>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-arrow-up"></i></div>
          <div class="stat-info">
            <h4>Total Inventory OUT</h4>
            <div class="value">{{ store.dashboard.total_out_base }} <span class="unit">units</span></div>
            <small>Year to date</small>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-coins"></i></div>
          <div class="stat-info">
            <h4>Total Expenses</h4>
            <div class="value">₱{{ formatNumber(store.dashboard.total_expenses) }}</div>
            <small>All categories</small>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-chart-simple"></i></div>
          <div class="stat-info">
            <h4>Gross Sales</h4>
            <div class="value">₱ {{ formatNumber(grossSales) }}</div>
            <small>From OUT transactions</small>
          </div>
        </div>
        
        <div class="stat-card profit-card">
          <div class="stat-icon"><i class="fas fa-trophy"></i></div>
          <div class="stat-info">
            <h4>Net Profit</h4>
            <div class="value" :class="netProfit >= 0 ? 'profit-positive' : 'profit-negative'">
              ₱{{ formatNumber(netProfit) }}
            </div>
            <small>Sales - COGS - Expenses</small>
          </div>
        </div>
      </div>
      
      <!-- Two Column Layout -->
      <div class="two-columns">
        <!-- Left Column -->
        <div class="column">
          <!-- Stock Alerts -->
          <div class="info-card">
            <h4><i class="fas fa-exclamation-triangle"></i> Stock Alerts</h4>
            
            <div class="alert-section">
              <div class="alert-header out-stock">
                <span><i class="fas fa-times-circle"></i> Out of Stock</span>
                <span class="alert-count">{{ outOfStockItems.length }}</span>
              </div>
              <div v-if="outOfStockItems.length === 0" class="no-alert">
                <i class="fas fa-check-circle"></i> All items have stock
              </div>
              <div v-else class="alert-list">
                <div v-for="item in outOfStockItems.slice(0, 5)" :key="item.id" class="alert-item out">
                  <span><i class="fas fa-box"></i> {{ item.name }}</span>
                  <span class="stock-badge">0 stock</span>
                </div>
                <div v-if="outOfStockItems.length > 5" class="more-items">
                  <i class="fas fa-ellipsis-h"></i> +{{ outOfStockItems.length - 5 }} more items
                </div>
              </div>
            </div>
            
            <div class="alert-section">
              <div class="alert-header low-stock">
                <span><i class="fas fa-exclamation-circle"></i> Low Stock</span>
                <span class="alert-count">{{ lowStockItems.length }}</span>
              </div>
              <div v-if="lowStockItems.length === 0" class="no-alert">
                <i class="fas fa-check-circle"></i> No low stock items
              </div>
              <div v-else class="alert-list">
                <div v-for="item in lowStockItems.slice(0, 5)" :key="item.id" class="alert-item low">
                  <span><i class="fas fa-box"></i> {{ item.name }}</span>
                  <span class="stock-badge">{{ item.boxes }} packs left</span>
                </div>
                <div v-if="lowStockItems.length > 5" class="more-items">
                  <i class="fas fa-ellipsis-h"></i> +{{ lowStockItems.length - 5 }} more items
                </div>
              </div>
            </div>
          </div>
          
          <!-- Recent Movements -->
          <div class="info-card">
            <h4><i class="fas fa-history"></i> Recent Transactions</h4>
            <div class="recent-list">
              <div v-for="movement in recentMovements" :key="movement.id" class="recent-item">
                <div class="recent-date"><i class="far fa-calendar-alt"></i> {{ formatDate(movement.datetime) }}</div>
                <div :class="movement.type === 'IN' ? 'badge-in' : 'badge-out'">
                  <i :class="movement.type === 'IN' ? 'fas fa-download' : 'fas fa-upload'"></i> {{ movement.type }}
                </div>
                <div class="recent-name">{{ movement.item_name }}</div>
                <div class="recent-qty">{{ movement.quantity }} {{ movement.unit === 'PACK' ? 'pack(s)' : 'pcs' }}</div>
              </div>
              <div v-if="recentMovements.length === 0" class="no-data">
                <i class="fas fa-inbox"></i> No transactions yet
              </div>
            </div>
          </div>
        </div>
        
        <!-- Right Column -->
        <div class="column">
          <!-- Quick Actions -->
          <div class="info-card">
            <h4><i class="fas fa-bolt"></i> Quick Actions</h4>
            <div class="quick-actions">
              <button @click="quickAction('IN')" class="quick-btn in-btn">
                <i class="fas fa-arrow-down"></i> Quick Stock IN
              </button>
              <button @click="quickAction('OUT')" class="quick-btn out-btn">
                <i class="fas fa-arrow-up"></i> Quick Stock OUT
              </button>
              <button @click="goToSetup" class="quick-btn setup-btn">
                <i class="fas fa-plus-circle"></i> Add New Item
              </button>
              <button @click="goToExpenses" class="quick-btn expense-btn">
                <i class="fas fa-receipt"></i> Add Expense
              </button>
              <button @click="goToOrderSlip" class="quick-btn order-btn">
                <i class="fas fa-file-invoice"></i> Create Order Slip
              </button>
            </div>
          </div>
          
          <!-- Inventory Summary -->
          <div class="info-card">
            <h4><i class="fas fa-boxes"></i> Inventory Summary</h4>
            <div class="summary-row">
              <span><i class="fas fa-tag"></i> Total Items:</span>
              <strong>{{ store.items.length }}</strong>
            </div>
            <div class="summary-row">
              <span><i class="fas fa-dollar-sign"></i> Total Stock Value (Cost):</span>
              <strong>₱{{ formatNumber(totalCostValue) }}</strong>
            </div>
            <div class="summary-row">
              <span><i class="fas fa-chart-line"></i> Total Stock Value (Selling):</span>
              <strong>₱{{ formatNumber(totalSellValue) }}</strong>
            </div>
            <div class="summary-row profit-row">
              <span><i class="fas fa-chart-line"></i> Potential Profit:</span>
              <strong class="profit-positive">₱{{ formatNumber(potentialProfit) }}</strong>
            </div>
          </div>
          
          <!-- Category Distribution -->
          <div class="info-card">
            <h4><i class="fas fa-chart-pie"></i> Items by Category</h4>
            <div class="category-stats">
              <div v-for="(count, category) in categoryCounts" :key="category" class="category-stat">
                <span class="cat-name"><i :class="getCategoryIconClass(category)"></i> {{ category }}</span>
                <div class="cat-bar-container">
                  <div class="cat-bar" :style="{ width: getCategoryPercent(category) + '%' }"></div>
                </div>
                <span class="cat-count">{{ count }} items</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Quick IN/OUT Modal -->
    <div v-if="showQuickModal" class="modal" @click.self="showQuickModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i :class="quickType === 'IN' ? 'fas fa-arrow-down' : 'fas fa-arrow-up'"></i> {{ quickType === 'IN' ? 'Quick Stock IN' : 'Quick Stock OUT' }}</h3>
          <button class="close-btn" @click="showQuickModal = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label><i class="fas fa-box"></i> Select Item:</label>
            <select v-model="quickItemId" class="form-input">
              <option value="">-- Select Packaging Item --</option>
              <option v-for="item in store.stock" :key="item.id" :value="item.id">
                {{ item.name }} ({{ item.boxes }} packs left)
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label><i class="fas fa-user"></i> Customer Name:</label>
            <input type="text" v-model="quickCustomerName" class="form-input" placeholder="Enter customer name" />
            <small>Required for Stock OUT only</small>
          </div>
          
          <div class="form-group">
            <label><i class="fas fa-sort-amount-up"></i> Quantity (in Packs):</label>
            <input type="number" v-model.number="quickQuantity" min="1" class="form-input" />
            <small>1 Pack = {{ selectedQuickItem?.pack_size || 0 }} pieces</small>
          </div>
          
          <div class="form-group">
            <label><i class="fas fa-cubes"></i> Unit:</label>
            <input type="text" :value="`Pack (${selectedQuickItem?.pack_size || 0} pcs/pack)`" disabled class="form-input" />
          </div>
          
          <div v-if="quickType === 'OUT'" class="form-group">
            <label><i class="fas fa-tag"></i> Selling Price (per Pack):</label>
            <input type="number" step="0.01" v-model.number="quickSellPrice" class="form-input" placeholder="Enter price" />
            <small>Default: ₱{{ formatNumber(selectedQuickItem?.sell_pack) }} per pack</small>
          </div>
          
          <div class="form-group">
            <label><i class="fas fa-pen"></i> Remarks (optional):</label>
            <input type="text" v-model="quickNote" placeholder="e.g., Received from supplier, Sold to customer" class="form-input" />
          </div>
          
          <div class="preview">
            <strong><i class="fas fa-eye"></i> Preview:</strong>
            <p v-if="quickType === 'IN'">
              <i class="fas fa-plus-circle"></i> 
              Adding <strong>{{ quickQuantity }}</strong> Pack(s) = 
              <strong>{{ quickBaseDelta }}</strong> base units
              <span class="preview-detail">({{ quickQuantity }} packs × {{ selectedQuickItem?.pack_size || 0 }} pcs/pack)</span>
            </p>
            <p v-else>
              <i class="fas fa-minus-circle"></i>
              Removing <strong>{{ quickQuantity }}</strong> Pack(s) = 
              <strong>{{ quickBaseDelta }}</strong> base units
              <span class="preview-detail">({{ quickQuantity }} packs × {{ selectedQuickItem?.pack_size || 0 }} pcs/pack)</span>
              <br>
              <i class="fas fa-money-bill-wave"></i> Total Sales: ₱{{ formatNumber(quickTotalSales) }}
              <br>
              <i class="fas fa-user"></i> Customer: <strong>{{ quickCustomerName || 'Not specified' }}</strong>
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showQuickModal = false"><i class="fas fa-times"></i> Cancel</button>
          <button class="btn-save" @click="saveQuickMovement"><i class="fas fa-check"></i> Confirm Transaction</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useInventoryStore } from '../stores/inventory'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { ref, computed, onMounted, inject } from 'vue'
import axios from 'axios'

const store = useInventoryStore()
const authStore = useAuthStore()
const router = useRouter()
const showToast = inject('showToast')
const showConfirm = inject('showConfirm')

const API_URL = 'https://inventory-system-backend-production-0549.up.railway.app/api'

const showQuickModal = ref(false)
const quickType = ref('IN')
const quickItemId = ref('')
const quickQuantity = ref(1)
const quickNote = ref('')
const quickSellPrice = ref(0)
const quickCustomerName = ref('')

// Low stock threshold in packs
const LOW_STOCK_THRESHOLD = 20

// ========== BAGONG LOGIC: WALA NANG COGS ==========
// Gross Sales = OUT transactions lang (benta)
const grossSales = computed(() => {
  return store.movements
    ?.filter(m => m.type === 'OUT')
    .reduce((sum, m) => sum + (Number(m.total_sales) || 0), 0) || 0
})

// ✅ COGS = 0 (WALA NA! Lahat ng gastos nasa Expenses na)
const cogs = computed(() => {
  return 0
})

// Net Profit = Sales - Expenses (wala nang COGS)
const netProfit = computed(() => {
  const sales = grossSales.value
  const expenses = Number(store.dashboard?.total_expenses) || 0
  return sales - expenses
})

// Selected item for preview
const selectedQuickItem = computed(() => {
  return store.stock?.find(i => i.id === quickItemId.value) || null
})

// Compute base delta (quantity × pack_size)
const quickBaseDelta = computed(() => {
  const item = selectedQuickItem.value
  if (!item) return 0
  return quickQuantity.value * (item.pack_size || 1)
})

// Total sales for OUT
const quickTotalSales = computed(() => {
  if (quickType.value === 'OUT') {
    const item = selectedQuickItem.value
    if (!item) return 0
    const price = quickSellPrice.value || item.sell_pack || 0
    return quickQuantity.value * price
  }
  return 0
})

const recentMovements = computed(() => {
  return store.movements?.slice(0, 5) || []
})

const outOfStockItems = computed(() => {
  return store.stock?.filter(item => item.current_stock_base === 0) || []
})

const lowStockItems = computed(() => {
  return store.stock?.filter(item => {
    const stockInPacks = item.boxes || 0
    return stockInPacks > 0 && stockInPacks <= LOW_STOCK_THRESHOLD
  }) || []
})

const totalCostValue = computed(() => {
  return store.stock?.reduce((sum, item) => {
    return sum + (item.current_stock_base * (item.cost_base || 0))
  }, 0) || 0
})

const totalSellValue = computed(() => {
  return store.stock?.reduce((sum, item) => {
    return sum + (item.current_stock_base * (item.sell_base || 0))
  }, 0) || 0
})

const potentialProfit = computed(() => {
  return totalSellValue.value - totalCostValue.value
})

const categoryCounts = computed(() => {
  const counts = {}
  for (const item of store.items || []) {
    const cat = item.category || 'Others'
    counts[cat] = (counts[cat] || 0) + 1
  }
  return counts
})

const getCategoryPercent = (category) => {
  const total = store.items?.length || 1
  return (categoryCounts.value[category] / total) * 100
}

const getCategoryIconClass = (category) => {
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

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0.00'
  const parsed = Number(num)
  return isNaN(parsed) ? '0.00' : parsed.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (datetime) => {
  if (!datetime) return '-'
  try {
    const datetimeStr = String(datetime)
    if (!datetimeStr.includes(' ')) return datetimeStr
    const parts = datetimeStr.split(' ')
    if (parts.length < 2) return parts[0]
    const time = parts[1]
    if (!time) return parts[0]
    return `${parts[0]} ${time.slice(0, 5)}`
  } catch (error) {
    console.error('Date format error:', datetime)
    return '-'
  }
}

const quickAction = (type) => {
  quickType.value = type
  quickItemId.value = ''
  quickQuantity.value = 1
  quickSellPrice.value = 0
  quickNote.value = ''
  quickCustomerName.value = ''
  showQuickModal.value = true
}

const saveQuickMovement = async () => {
  if (!quickItemId.value) {
    showToast('Please select an item', 'warning')
    return
  }
  
  const item = selectedQuickItem.value
  if (!item) return
  
  if (!quickQuantity.value || quickQuantity.value <= 0) {
    showToast('Please enter a valid quantity', 'warning')
    return
  }
  
  let finalCustomerName = null
  if (quickType.value === 'OUT') {
    if (!quickCustomerName.value || quickCustomerName.value.trim() === '') {
      showToast('Please enter customer name for Stock OUT', 'warning')
      return
    }
    finalCustomerName = quickCustomerName.value.trim()
  }
  
  const confirmed = await showConfirm({
    type: quickType.value === 'OUT' ? 'warning' : 'info',
    title: quickType.value === 'OUT' ? 'Confirm Stock OUT' : 'Confirm Stock IN',
    message: `${quickType.value === 'IN' ? 'Add' : 'Remove'} ${quickQuantity.value} Pack(s) of ${item.name}?`,
    confirmText: 'Yes, Proceed',
    cancelText: 'Cancel'
  })
  
  if (!confirmed) return
  
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const datetime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  
  const baseDelta = quickBaseDelta.value
  
  if (quickType.value === 'OUT' && baseDelta > item.current_stock_base) {
    showToast(`Not enough stock! Available: ${item.boxes} packs (${item.current_stock_base} pcs)`, 'error')
    return
  }
  
  const sellPricePerPack = quickSellPrice.value || item.sell_pack || 0
  
  const movement = {
    datetime: datetime,
    type: quickType.value,
    item_id: item.id,
    item_name: item.name,
    quantity: quickQuantity.value,
    unit: 'PACK',
    base_delta: baseDelta,
    note: quickNote.value,
    sell_price: quickType.value === 'OUT' ? sellPricePerPack : null,
    total_sales: quickType.value === 'OUT' ? quickQuantity.value * sellPricePerPack : null,
    customer_name: finalCustomerName
  }

  try {
    const token = authStore.getToken()
    if (!token) {
      showToast('Session expired. Please login again.', 'error')
      router.push('/login')
      return
    }
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    
    await store.addMovement(movement)
    await store.fetchStock()
    await store.fetchDashboard()
    await store.fetchMovements()
    
    showQuickModal.value = false
    showToast(`✅ ${quickType.value === 'IN' ? 'Stock IN' : 'Stock OUT'} recorded successfully!`, 'success')
  } catch (error) {
    console.error('Error saving movement:', error)
    if (error.response?.status === 401) {
      showToast('Session expired. Please login again.', 'error')
      authStore.logout()
      router.push('/login')
    } else {
      showToast('Error saving movement. Please try again.', 'error')
    }
  }
}

const goToSetup = () => {
  router.push('/setup')
}

const goToExpenses = () => {
  router.push('/expenses')
}

const goToOrderSlip = () => {
  router.push('/order-slip')
}

onMounted(async () => {
  console.log('Dashboard mounting...')
  
  const localToken = localStorage.getItem('token')
  const localUser = localStorage.getItem('user')
  
  if (!localToken || !localUser) {
    console.log('No token found, redirecting to login')
    router.push('/login')
    return
  }
  
  authStore.restoreSession()
  axios.defaults.headers.common['Authorization'] = `Bearer ${localToken}`
  
  try {
    await store.fetchDashboard()
    await store.fetchStock()
    await store.fetchItems()
    await store.fetchMovements()
    console.log('All data loaded! Gross Sales:', grossSales.value, 'Net Profit:', netProfit.value)
  } catch (error) {
    console.error('Error loading data:', error)
    if (error.response?.status === 401) {
      authStore.logout()
      router.push('/login')
    }
  }
})
</script>

<style scoped>
/* Your existing styles here - keep them as they are */
.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.header-actions {
  margin-bottom: 1.5rem;
}

.header-actions h3 i {
  color: #2c3e50;
  margin-right: 8px;
}

.header-actions p {
  color: #666;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 1.2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  transition: transform 0.2s;
  border-left: 4px solid #2c3e50;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 1.5rem;
  background: #edf2f7;
  width: 55px;
  height: 55px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: #2c3e50;
}

.stat-info h4 {
  font-size: 0.7rem;
  color: #718096;
  margin-bottom: 0.25rem;
  letter-spacing: 0.5px;
}

.stat-info .value {
  font-size: 1.3rem;
  font-weight: bold;
  color: #1a2a3a;
}

.stat-info .unit {
  font-size: 0.7rem;
  font-weight: normal;
  color: #718096;
}

.stat-info small {
  font-size: 0.65rem;
  color: #a0aec0;
}

.profit-card {
  border-left-color: #ffc107;
}

.profit-positive {
  color: #28a745;
}

.profit-negative {
  color: #dc3545;
}

.two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-card {
  background: white;
  border-radius: 10px;
  padding: 1.2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
}

.info-card h4 {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #edf2f7;
  color: #1a2a3a;
}

.info-card h4 i {
  color: #2c3e50;
  margin-right: 8px;
}

.alert-section {
  margin-bottom: 1rem;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.alert-header.out-stock {
  background: #f8d7da;
  color: #dc3545;
}

.alert-header.low-stock {
  background: #fff3cd;
  color: #856404;
}

.alert-count {
  background: white;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.75rem;
}

.no-alert {
  text-align: center;
  padding: 0.75rem;
  color: #28a745;
  font-size: 0.85rem;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.85rem;
  flex-wrap: wrap;
}

.alert-item.out {
  background: #f8d7da;
}

.alert-item.low {
  background: #fff3cd;
}

.stock-badge {
  font-size: 0.7rem;
  color: #4a5568;
}

.more-items {
  font-size: 0.7rem;
  color: #718096;
  text-align: center;
  margin-top: 0.25rem;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.recent-item:hover {
  background: #f7fafc;
}

.recent-date {
  font-size: 0.65rem;
  color: #718096;
  min-width: 85px;
}

.badge-in {
  background: #28a745;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: bold;
}

.badge-out {
  background: #e53e3e;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: bold;
}

.recent-name {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 500;
  color: #2d3748;
}

.recent-qty {
  font-size: 0.7rem;
  color: #718096;
}

.no-data {
  text-align: center;
  padding: 1rem;
  color: #a0aec0;
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.quick-btn {
  padding: 0.7rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.quick-btn:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}

.quick-btn i {
  margin-right: 6px;
}

.in-btn {
  background: #28a745;
  color: white;
}

.out-btn {
  background: #e53e3e;
  color: white;
}

.setup-btn {
  background: #17a2b8;
  color: white;
}

.expense-btn {
  background: #718096;
  color: white;
}

.order-btn {
  background: #6f42c1;
  color: white;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.summary-row span {
  color: #4a5568;
}

.summary-row i {
  margin-right: 6px;
  color: #2c3e50;
}

.summary-row strong {
  color: #2d3748;
}

.profit-row {
  border-bottom: none;
  padding-top: 0.75rem;
  font-size: 1rem;
}

.category-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.category-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cat-name {
  min-width: 85px;
  font-size: 0.8rem;
  color: #2d3748;
}

.cat-name i {
  margin-right: 6px;
  color: #2c3e50;
}

.cat-bar-container {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.cat-bar {
  height: 100%;
  background: #2c3e50;
  border-radius: 4px;
}

.cat-count {
  min-width: 60px;
  font-size: 0.7rem;
  color: #718096;
  text-align: right;
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
  width: 480px;
  max-width: 95%;
  max-height: 90vh;
  overflow-y: auto;
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

.modal-header i {
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

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  font-size: 0.85rem;
  color: #4a5568;
}

.form-group label i {
  margin-right: 6px;
  color: #2c3e50;
}

.form-group small {
  font-size: 0.7rem;
  color: #718096;
  display: block;
  margin-top: 4px;
}

.form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #2c3e50;
  box-shadow: 0 0 0 2px rgba(44,62,80,0.1);
}

.btn-cancel {
  background: #718096;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #4a5568;
}

.btn-save {
  background: #2c3e50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-save:hover {
  background: #1a252f;
}

@media (max-width: 900px) {
  .two-columns {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
  
  .quick-actions {
    grid-template-columns: 1fr;
  }
}

/* Compact styles */
.card {
  padding: 0.8rem !important;
}

.header-actions {
  margin-bottom: 0.8rem !important;
}

.header-actions h3 {
  font-size: 1rem !important;
  margin-bottom: 0.2rem !important;
}

.header-actions p {
  font-size: 0.7rem !important;
}

.stats-grid {
  gap: 0.6rem !important;
  margin-bottom: 1rem !important;
}

.stat-card {
  padding: 0.5rem 0.7rem !important;
  gap: 0.5rem !important;
}

.stat-icon {
  width: 35px !important;
  height: 35px !important;
  font-size: 1rem !important;
}

.stat-info h4 {
  font-size: 0.6rem !important;
  margin-bottom: 0.1rem !important;
}

.stat-info .value {
  font-size: 0.85rem !important;
}

.stat-info .unit {
  font-size: 0.5rem !important;
}

.stat-info small {
  font-size: 0.5rem !important;
}

.two-columns {
  gap: 0.8rem !important;
}

.column {
  gap: 0.8rem !important;
}

.info-card {
  padding: 0.7rem !important;
}

.info-card h4 {
  font-size: 0.75rem !important;
  margin-bottom: 0.5rem !important;
  padding-bottom: 0.3rem !important;
}

.alert-section {
  margin-bottom: 0.6rem !important;
}

.alert-header {
  padding: 0.3rem 0.5rem !important;
  font-size: 0.65rem !important;
}

.alert-count {
  padding: 1px 6px !important;
  font-size: 0.6rem !important;
}

.no-alert {
  padding: 0.3rem !important;
  font-size: 0.7rem !important;
}

.alert-item {
  padding: 0.25rem 0.4rem !important;
  font-size: 0.7rem !important;
}

.stock-badge {
  font-size: 0.6rem !important;
}

.more-items {
  font-size: 0.6rem !important;
}

.recent-item {
  padding: 0.25rem !important;
  gap: 0.4rem !important;
}

.recent-date {
  font-size: 0.55rem !important;
  min-width: 70px !important;
}

.badge-in, .badge-out {
  padding: 1px 6px !important;
  font-size: 0.55rem !important;
}

.recent-name {
  font-size: 0.7rem !important;
}

.recent-qty {
  font-size: 0.6rem !important;
}

.quick-actions {
  gap: 0.5rem !important;
}

.quick-btn {
  padding: 0.4rem !important;
  font-size: 0.6rem !important;
}

.quick-btn i {
  margin-right: 3px !important;
}

.summary-row {
  padding: 0.25rem 0 !important;
  font-size: 0.7rem !important;
}

.summary-row span i {
  margin-right: 4px !important;
}

.profit-row {
  padding-top: 0.4rem !important;
}

.category-stats {
  gap: 0.4rem !important;
}

.category-stat {
  gap: 0.3rem !important;
}

.cat-name {
  min-width: 65px !important;
  font-size: 0.7rem !important;
}

.cat-bar-container {
  height: 5px !important;
}

.cat-count {
  min-width: 45px !important;
  font-size: 0.6rem !important;
}

.preview {
  padding: 0.5rem !important;
  margin-top: 0.5rem !important;
}

.preview p {
  font-size: 0.7rem !important;
}

.preview-detail {
  font-size: 0.6rem !important;
}

.modal-content {
  width: 400px !important;
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
  margin-bottom: 0.25rem !important;
}

.form-group small {
  font-size: 0.55rem !important;
}

.form-input {
  padding: 5px 8px !important;
  font-size: 0.7rem !important;
}

.btn-cancel, .btn-save {
  padding: 5px 12px !important;
  font-size: 0.65rem !important;
}

.no-data {
  padding: 0.5rem !important;
  font-size: 0.65rem !important;
}

@media (max-width: 900px) {
  .stats-grid {
    gap: 0.5rem !important;
  }
  
  .two-columns {
    gap: 0.6rem !important;
  }
  
  .stat-card {
    padding: 0.4rem 0.6rem !important;
  }
  
  .stat-icon {
    width: 30px !important;
    height: 30px !important;
    font-size: 0.8rem !important;
  }
  
  .stat-info .value {
    font-size: 0.75rem !important;
  }
}
</style>