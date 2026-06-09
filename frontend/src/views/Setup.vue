<template>
  <div>
    <div class="card">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h2><i class="fas fa-cogs"></i> Products & Materials Master</h2>
          <p class="subtitle"><i class="fas fa-boxes"></i> Manage your packaging inventory items</p>
        </div>
        <button class="btn-primary" @click="openAddModal">
          <i class="fas fa-plus-circle"></i> Add New Item
        </button>
      </div>

      <!-- Search and Filter Bar -->
      <div class="search-section">
        <div class="search-box">
          <i class="fas fa-search search-icon"></i>
          <input type="text" v-model="searchQuery" placeholder="Search by item name, code, or category..."
            class="search-input" />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="filter-badge" v-if="searchQuery">
          <i class="fas fa-filter"></i> Results: {{ filteredItems.length }} items
        </div>
      </div>

      <!-- Items Table -->
      <div class="table-container">
        <table class="pro-table">
          <thead>
            <tr>
              <th><i class="fas fa-barcode"></i> Item Code</th>
              <th><i class="fas fa-box"></i> Item Name</th>
              <th><i class="fas fa-tags"></i> Category</th>
              <th><i class="fas fa-cubes"></i> Pack Size</th>
              <th><i class="fas fa-dollar-sign"></i> Cost Price</th>
              <th><i class="fas fa-chart-line"></i> Selling Price</th>
              <th><i class="fas fa-warehouse"></i> Stock</th>
              <th><i class="fas fa-flag"></i> Reorder</th>
              <th><i class="fas fa-info-circle"></i> Status</th>
              <th><i class="fas fa-cog"></i> Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredItems" :key="item.id" class="item-row">
              <td class="code-cell">
                <code class="item-code">{{ item.id }}</code>
               </td>
              <td class="name-cell">
                <div class="item-name">{{ item.name }}</div>
               </td>
              <td>
                <span :class="['category-badge', getCategoryClass(item.category)]">
                  <i :class="getCategoryIcon(item.category)"></i> {{ item.category || 'Packaging' }}
                </span>
               </td>
              <td class="center">
                <span class="pack-size">{{ item.pack_size }} <i class="fas fa-cube"></i> pcs/pack</span>
               </td>
              <td class="price-cell">
                <div class="price"><i class="fas fa-peso-sign"></i> {{ formatNumber(item.cost_pack) }}</div>
                <div class="price-unit">(<i class="fas fa-peso-sign"></i> {{ formatNumber(item.cost_base) }}/pc)</div>
               </td>
              <td class="price-cell">
                <div class="price"><i class="fas fa-peso-sign"></i> {{ formatNumber(item.sell_pack) }}</div>
                <div class="price-unit">(<i class="fas fa-peso-sign"></i> {{ formatNumber(item.sell_base) }}/pc)</div>
               </td>
              <!-- FIXED: Stock column - no pcs -->
              <td class="stock-cell">
                <div class="stock-info">
                  <span class="stock-packs"><i class="fas fa-cubes"></i> {{ item.boxes || 0 }} packs</span>
                  <span class="stock-base"><i class="fas fa-database"></i> Base: {{ item.current_stock_base || 0 }} pcs</span>
                </div>
               </td>
              <td class="center">
                <span class="reorder-value">{{ item.reorder_in_packs }} packs</span>
                <small class="reorder-base">({{ item.reorder_level }} pcs)</small>
               </td>
              <td>
                <span :class="getStockStatusClass(item)">
                  <i :class="getStockStatusIcon(item)"></i>
                  {{ getStockStatusText(item) }}
                </span>
               </td>
              <td class="actions-cell">
                <button class="action-btn edit" @click="openEditModal(item)" title="Edit Item">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" @click="deleteItem(item.id)" title="Delete Item">
                  <i class="fas fa-trash-alt"></i>
                </button>
               </td>
            </tr>
            <tr v-if="filteredItems.length === 0">
              <td colspan="10" class="empty-row">
                <div class="empty-state">
                  <i class="fas fa-box-open empty-icon"></i>
                  <p>No items found</p>
                  <button class="btn-outline" @click="openAddModal">
                    <i class="fas fa-plus"></i> Add your first item
                  </button>
                </div>
               </td>
             </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer Stats -->
      <div class="table-footer">
        <div class="footer-info">
          <span><i class="fas fa-database"></i> Total Items: <strong>{{ store.items.length }}</strong></span>
          <span><i class="fas fa-folder"></i> Categories: <strong>{{ uniqueCategories }}</strong></span>
          <span><i class="fas fa-exclamation-triangle"></i> Low Stock: <strong>{{ lowStockCount }}</strong></span>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="header-icon">
            <i :class="isEditing ? 'fas fa-edit' : 'fas fa-plus-circle'"></i>
          </div>
          <h3>{{ isEditing ? 'Edit Product' : 'Add New Product' }}</h3>
          <button class="modal-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-tabs">
            <div class="tab active"><i class="fas fa-info-circle"></i> Basic Info</div>
            <div class="tab"><i class="fas fa-dollar-sign"></i> Pricing</div>
            <div class="tab"><i class="fas fa-chart-line"></i> Inventory</div>
          </div>

          <div class="form-section">
            <div class="form-row">
              <div class="form-group">
                <label>Item Code / SKU <span class="required">*</span></label>
                <input type="text" v-model="form.id" :disabled="isEditing" placeholder="e.g., ITM-00001"
                  class="form-control" />
                <small><i class="fas fa-magic"></i> Auto-generated for new items</small>
              </div>
              <div class="form-group">
                <label>Item Name <span class="required">*</span></label>
                <input type="text" v-model="form.name" placeholder="e.g., Corrugated Box 10x10x10"
                  class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label><i class="fas fa-tags"></i> Category</label>
                <select v-model="form.category" class="form-control">
                  <option value="Boxes">Boxes & Cartons</option>
                  <option value="Plastics">Plastics & Containers</option>
                  <option value="Films">Films & Wraps</option>
                  <option value="Tapes">Tapes & Adhesives</option>
                  <option value="Bags">Bags & Pouches</option>
                  <option value="Labels">Labels & Stickers</option>
                  <option value="Tools">Tools & Equipment</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div class="form-group">
                <label><i class="fas fa-ruler-combined"></i> Unit of Measure:</label>
                <select v-model="form.unit" class="form-control">
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="rolls">Rolls</option>
                  <option value="meters">Meters (m)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="liters">Liters (L)</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label><i class="fas fa-cubes"></i> Pack Size </label>
                <input type="number" v-model.number="form.pack_size" min="1" class="form-control" />
                <small>How many pieces per pack?</small>
              </div>
              <div class="form-group">
                <label><i class="fas fa-chart-line"></i> Sales Type</label>
                <select v-model="form.type" class="form-control">
                  <option value="Both">Both (Wholesale + Retail)</option>
                  <option value="Retail">Retail Only</option>
                  <option value="Wholesale">Wholesale Only</option>
                </select>
              </div>
            </div>

            <div class="price-section">
              <div class="section-title"><i class="fas fa-coins"></i> Pricing (Philippine Peso)</div>
              <div class="form-row">
                <div class="form-group">
                  <label>Cost Price (per Pack)</label>
                  <div class="currency-input">
                    <span class="currency"><i class="fas fa-peso-sign"></i></span>
                    <input type="number" step="0.01" v-model.number="form.cost_pack" class="form-control" />
                  </div>
                </div>
                <div class="form-group">
                  <label>Cost Price (per Piece)</label>
                  <div class="currency-input">
                    <span class="currency"><i class="fas fa-peso-sign"></i></span>
                    <input type="number" step="0.01" v-model.number="form.cost_base" class="form-control" />
                  </div>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Selling Price (per Pack)</label>
                  <div class="currency-input">
                    <span class="currency"><i class="fas fa-peso-sign"></i></span>
                    <input type="number" step="0.01" v-model.number="form.sell_pack" class="form-control" />
                  </div>
                </div>
                <div class="form-group">
                  <label>Selling Price (per Piece)</label>
                  <div class="currency-input">
                    <span class="currency"><i class="fas fa-peso-sign"></i></span>
                    <input type="number" step="0.01" v-model.number="form.sell_base" class="form-control" />
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label><i class="fas fa-flag-checkered"></i> Reorder Level (in packs)</label>
                <input type="number" v-model.number="form.reorder_packs" min="0" class="form-control" />
                <small>Alert when stock falls below this level (in packs)</small>
              </div>
              <div class="form-group" v-if="!isEditing">
                <label><i class="fas fa-database"></i> Initial Stock (in packs)</label>
                <input type="number" v-model.number="form.initial_stock_packs" min="0" class="form-control" />
                <small>Starting inventory in packs</small>
              </div>
            </div>
          </div>

          <div class="preview-card">
            <div class="preview-header"><i class="fas fa-eye"></i> Summary Preview</div>
            <div class="preview-content">
              <div class="preview-row">
                <span>{{ form.name || 'Item Name' }}</span>
                <code class="preview-code">{{ form.id || 'ITEM-CODE' }}</code>
              </div>
              <div class="preview-row">
                <span><i class="fas fa-cubes"></i> Pack: {{ form.pack_size }} pcs/pack</span>
                <span><i class="fas fa-coins"></i> Cost: ₱{{ formatNumber(form.cost_pack) }} | Sell: ₱{{
                  formatNumber(form.sell_pack) }}</span>
              </div>
              <div class="preview-row">
                <span><i class="fas fa-flag"></i> Reorder at: {{ form.reorder_packs || 20 }} packs ({{ (form.reorder_packs || 20) * form.pack_size }} pcs)</span>
              </div>
              <div class="preview-row profit-highlight" v-if="form.sell_pack > form.cost_pack">
                <i class="fas fa-chart-line"></i> Profit per pack: ₱{{ formatNumber(form.sell_pack - form.cost_pack) }}
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">
            <i class="fas fa-times"></i> Cancel
          </button>
          <button class="btn-primary" @click="saveItem">
            <i :class="isEditing ? 'fas fa-save' : 'fas fa-plus'"></i>
            {{ isEditing ? 'Update Item' : 'Create Item' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useInventoryStore } from '../stores/inventory'
import { ref, computed, onMounted, inject } from 'vue'

const store = useInventoryStore()
const showToast = inject('showToast')
const showConfirm = inject('showConfirm')

const showModal = ref(false)
const isEditing = ref(false)
const searchQuery = ref('')

const form = ref({
  id: '',
  name: '',
  category: 'Boxes',
  unit: 'pack',
  pack_size: 1,
  type: 'Both',
  cost_pack: 0,
  cost_base: 0,
  sell_pack: 0,
  sell_base: 0,
  reorder_packs: 20,
  initial_stock_packs: 0
})

// Low stock threshold in packs (20 packs = low stock)
const LOW_STOCK_THRESHOLD = 20

// Get stock data from store.stock
const getItemStock = (itemId) => {
  const stockItem = store.stock.find(s => s.id === itemId)
  return stockItem || { current_stock_base: 0, boxes: 0, pcs: 0 }
}

const filteredItems = computed(() => {
  let items = store.items.map(item => {
    const stock = getItemStock(item.id)
    // Reorder in packs is always 20 (or from item.reorder_packs if exists)
    const reorderInPacks = item.reorder_packs || 20
    return {
      ...item,
      current_stock_base: stock.current_stock_base,
      boxes: stock.boxes || 0,
      pcs: stock.pcs || 0,
      reorder_in_packs: reorderInPacks,
      reorder_level: reorderInPacks * (item.pack_size || 1)
    }
  })
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item =>
      item.id.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query) ||
      (item.category && item.category.toLowerCase().includes(query))
    )
  }
  return items
})

// Stock status based on packs (Low Stock when 20 packs or below)
const getStockStatusClass = (item) => {
  const stockInPacks = item.boxes || 0
  
  if (stockInPacks === 0) return 'status-badge status-out'
  if (stockInPacks <= LOW_STOCK_THRESHOLD) return 'status-badge status-low'
  return 'status-badge status-good'
}

const getStockStatusIcon = (item) => {
  const stockInPacks = item.boxes || 0
  
  if (stockInPacks === 0) return 'fas fa-times-circle'
  if (stockInPacks <= LOW_STOCK_THRESHOLD) return 'fas fa-exclamation-triangle'
  return 'fas fa-check-circle'
}

const getStockStatusText = (item) => {
  const stockInPacks = item.boxes || 0
  
  if (stockInPacks === 0) return 'Out of Stock'
  if (stockInPacks <= LOW_STOCK_THRESHOLD) return 'Low Stock'
  return 'In Stock'
}

const deleteItem = async (id) => {
  const hasMovements = store.movements.some(m => m.item_id === id)
  const confirmMsg = hasMovements 
    ? '⚠️ This item has transaction history. Deleting may affect reports. Continue?'
    : `Delete item "${id}"?`
  
  const confirmed = await showConfirm({
    type: 'warning',
    title: 'Delete Item',
    message: confirmMsg,
    confirmText: 'Yes, Delete',
    cancelText: 'Cancel'
  })
  
  if (confirmed) {
    await store.deleteItem(id)
    await store.fetchItems()
    await store.fetchStock()
    showToast('Item deleted successfully!', 'success')
  }
}

const uniqueCategories = computed(() => {
  const cats = new Set()
  for (const item of store.items) {
    if (item.category) cats.add(item.category)
  }
  return cats.size
})

const lowStockCount = computed(() => {
  return store.stock.filter(item => {
    const stockInPacks = item.boxes || 0
    return stockInPacks > 0 && stockInPacks <= LOW_STOCK_THRESHOLD
  }).length
})

const formatNumber = (num) => {
  return num?.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'
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

const generateNextId = () => {
  const items = store.items
  if (items.length === 0) return 'ITM-00001'
  const numbers = items.map(item => {
    const match = item.id.match(/ITM-(\d+)/)
    return match ? parseInt(match[1]) : 0
  })
  const maxNum = Math.max(...numbers)
  const nextNum = (maxNum + 1).toString().padStart(5, '0')
  return `ITM-${nextNum}`
}

const openAddModal = () => {
  isEditing.value = false
  form.value = {
    id: generateNextId(),
    name: '',
    category: 'Boxes',
    unit: 'pcs',
    pack_size: 1,
    type: 'Both',
    cost_pack: 0,
    cost_base: 0,
    sell_pack: 0,
    sell_base: 0,
    reorder_packs: 20,
    initial_stock_packs: 0
  }
  showModal.value = true
}

const openEditModal = (item) => {
  isEditing.value = true
  form.value = {
    id: item.id,
    name: item.name,
    category: item.category || 'Boxes',
    unit: item.unit || 'pcs',
    pack_size: item.pack_size,
    type: item.type,
    cost_pack: item.cost_pack,
    cost_base: item.cost_base,
    sell_pack: item.sell_pack,
    sell_base: item.sell_base,
    reorder_packs: item.reorder_packs || 20,
    initial_stock_packs: 0
  }
  showModal.value = true
}

const saveItem = async () => {
  if (!form.value.id || !form.value.name) {
    showToast('Please fill in Item Code and Name', 'warning')
    return
  }
  
  if (form.value.pack_size <= 0) {
    showToast('Pack size must be greater than 0', 'warning')
    return
  }
  
  // Convert packs to pieces
  const reorder_level = (form.value.reorder_packs || 20) * form.value.pack_size
  
  const itemData = {
    id: form.value.id,
    name: form.value.name,
    pack_size: form.value.pack_size,
    type: form.value.type,
    cost_pack: form.value.cost_pack,
    cost_base: form.value.cost_base,
    sell_pack: form.value.sell_pack,
    sell_base: form.value.sell_base,
    reorder_level: reorder_level,
    reorder_packs: form.value.reorder_packs || 20
  }
  
  if (isEditing.value) {
    await store.updateItem(form.value.id, itemData)
    showToast('Item updated successfully!', 'success')
  } else {
    const exists = store.items.some(i => i.id === form.value.id)
    if (exists) {
      showToast('Item ID already exists!', 'error')
      return
    }
    await store.addItem(itemData)
    
    if (form.value.initial_stock_packs > 0) {
      const initialStockPcs = form.value.initial_stock_packs * form.value.pack_size
      const now = new Date()
      const datetime = now.toISOString().slice(0, 19).replace('T', ' ')
      const movement = {
        datetime: datetime,
        type: 'IN',
        item_id: form.value.id,
        item_name: form.value.name,
        quantity: form.value.initial_stock_packs,
        unit: 'PACK',
        base_delta: initialStockPcs,
        note: 'Initial stock on item creation',
        sell_price: null,
        total_sales: null
      }
      await store.addMovement(movement)
      showToast(`Initial stock of ${form.value.initial_stock_packs} packs added!`, 'success')
    }
    showToast('Item added successfully!', 'success')
  }
  
  closeModal()
  await store.fetchItems()
  await store.fetchStock()
}

const closeModal = () => {
  showModal.value = false
}

onMounted(async () => {
  await store.fetchItems()
  await store.fetchMovements()
  await store.fetchStock()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left h2 {
  font-size: 1.5rem;
  color: #1a2a3a;
  margin-bottom: 0.25rem;
}

.header-left h2 i {
  color: #00adb5;
  margin-right: 8px;
}

.subtitle {
  color: #6c757d;
  font-size: 0.85rem;
}

.subtitle i {
  margin-right: 4px;
}

.btn-primary {
  background: #00adb5;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #008a91;
  transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  border: 1px solid #00adb5;
  color: #00adb5;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-outline:hover {
  background: #e3f2fd;
}

.search-section {
  margin-bottom: 1.5rem;
}

.search-box {
  position: relative;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.search-input {
  width: 100%;
  padding: 10px 35px 10px 38px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
}

.search-input:focus {
  outline: none;
  border-color: #00adb5;
}

.clear-search {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
}

.clear-search:hover {
  color: #666;
}

.filter-badge {
  margin-top: 8px;
  font-size: 0.8rem;
  color: #666;
}

.filter-badge i {
  margin-right: 4px;
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #eee;
}

.pro-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.pro-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}

.pro-table th i {
  margin-right: 6px;
  color: #00adb5;
}

.pro-table td {
  padding: 12px;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

.item-row:hover {
  background: #f8f9fa;
}

.code-cell .item-code {
  font-family: monospace;
  font-weight: 600;
  color: #00adb5;
  background: #e3f2fd;
  padding: 4px 8px;
  border-radius: 4px;
}

.name-cell .item-name {
  font-weight: 500;
}

.category-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
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

.center {
  text-align: center;
}

.pack-size {
  background: #f0f2f5;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.price-cell .price {
  font-weight: 600;
  color: #1a2a3a;
}

.price-cell .price-unit {
  font-size: 0.7rem;
  color: #6c757d;
}

.stock-cell .stock-info {
  display: flex;
  flex-direction: column;
}

.stock-packs {
  font-weight: 600;
  color: #1a2a3a;
  font-size: 0.85rem;
}

.stock-base {
  font-size: 0.7rem;
  color: #6c757d;
  margin-top: 2px;
}

.reorder-value {
  font-weight: 600;
  color: #ffc107;
  background: #fff3cd;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  display: inline-block;
}

.reorder-base {
  font-size: 0.6rem;
  color: #6c757d;
  display: block;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.status-good {
  background: #d4edda;
  color: #155724;
}

.status-low {
  background: #fff3cd;
  color: #856404;
}

.status-out {
  background: #f8d7da;
  color: #721c24;
}

.actions-cell {
  display: flex;
  gap: 5px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-btn.edit {
  background: #ffc107;
  color: #333;
}

.action-btn.edit:hover {
  background: #e0a800;
}

.action-btn.delete {
  background: #dc3545;
  color: white;
}

.action-btn.delete:hover {
  background: #bb2d3b;
}

.empty-row td {
  text-align: center;
  padding: 40px;
}

.empty-state {
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 10px;
  color: #ccc;
}

.table-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.footer-info {
  display: flex;
  gap: 1.5rem;
  font-size: 0.8rem;
  color: #6c757d;
}

.footer-info i {
  margin-right: 4px;
}

/* Modal styles */
.modal-overlay {
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

.modal-container {
  background: white;
  border-radius: 16px;
  width: 700px;
  max-width: 95%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #eee;
  background: #1a2a3a;
  color: white;
  border-radius: 16px 16px 0 0;
}

.header-icon {
  font-size: 1.3rem;
}

.modal-header h3 {
  flex: 1;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
}

.form-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.tab {
  padding: 8px 16px;
  font-size: 0.85rem;
  cursor: pointer;
  color: #6c757d;
  border-bottom: 2px solid transparent;
}

.tab i {
  margin-right: 6px;
}

.tab.active {
  color: #00adb5;
  border-bottom-color: #00adb5;
}

.form-section {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-weight: 500;
  font-size: 0.85rem;
  color: #333;
}

.form-group label i {
  margin-right: 4px;
  color: #00adb5;
}

.required {
  color: #dc3545;
}

.form-control {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
}

.form-control:focus {
  outline: none;
  border-color: #00adb5;
}

.form-control:disabled {
  background: #e9ecef;
  cursor: not-allowed;
}

.currency-input {
  position: relative;
}

.currency {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.currency-input .form-control {
  padding-left: 28px;
}

.price-section {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.section-title {
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1a2a3a;
}

.section-title i {
  margin-right: 6px;
  color: #00adb5;
}

.preview-card {
  background: #e8f4f8;
  border-radius: 8px;
  margin-top: 1rem;
  overflow: hidden;
}

.preview-header {
  background: #00adb5;
  color: white;
  padding: 8px 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.preview-header i {
  margin-right: 6px;
}

.preview-content {
  padding: 12px;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  padding: 4px 0;
}

.preview-code {
  font-family: monospace;
  color: #00adb5;
  background: none;
}

.profit-highlight {
  color: #28a745;
  font-weight: 500;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid #ddd;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-secondary:hover {
  background: #5a6268;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .footer-info {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}
/* PAMPALIIT LANG NG PRODUCTS MASTER - IDAGDAG SA DULO */

.card {
  padding: 0.8rem !important;
}

.page-header {
  margin-bottom: 0.8rem !important;
  gap: 0.5rem !important;
}

.header-left h2 {
  font-size: 1rem !important;
  margin-bottom: 0.1rem !important;
}

.subtitle {
  font-size: 0.65rem !important;
}

.btn-primary {
  padding: 5px 12px !important;
  font-size: 0.7rem !important;
}

.search-section {
  margin-bottom: 0.8rem !important;
}

.search-input {
  padding: 6px 35px 6px 38px !important;
  font-size: 0.7rem !important;
}

.filter-badge {
  font-size: 0.65rem !important;
  margin-top: 4px !important;
}

.pro-table th {
  padding: 0.4rem 0.5rem !important;
  font-size: 0.65rem !important;
}

.pro-table td {
  padding: 0.35rem 0.4rem !important;
  font-size: 0.7rem !important;
}

.item-code {
  padding: 2px 6px !important;
  font-size: 0.6rem !important;
}

.item-name {
  font-size: 0.7rem !important;
}

.category-badge {
  padding: 2px 8px !important;
  font-size: 0.6rem !important;
}

.pack-size {
  padding: 2px 6px !important;
  font-size: 0.65rem !important;
}

.price-cell .price {
  font-size: 0.7rem !important;
}

.price-cell .price-unit {
  font-size: 0.55rem !important;
}

.stock-packs {
  font-size: 0.7rem !important;
}

.stock-base {
  font-size: 0.55rem !important;
}

.reorder-value {
  padding: 2px 8px !important;
  font-size: 0.6rem !important;
}

.reorder-base {
  font-size: 0.5rem !important;
}

.status-badge {
  padding: 2px 8px !important;
  font-size: 0.6rem !important;
}

.action-btn {
  width: 26px !important;
  height: 26px !important;
  font-size: 0.7rem !important;
}

.table-footer {
  margin-top: 0.6rem !important;
  padding-top: 0.6rem !important;
}

.footer-info {
  font-size: 0.65rem !important;
  gap: 0.8rem !important;
}

/* Modal - mas maliit */
.modal-container {
  width: 550px !important;
}

.modal-header {
  padding: 0.6rem 1rem !important;
}

.modal-header h3 {
  font-size: 0.85rem !important;
}

.header-icon {
  font-size: 1rem !important;
}

.modal-body {
  padding: 0.8rem !important;
}

.form-tabs {
  margin-bottom: 0.8rem !important;
}

.tab {
  padding: 4px 12px !important;
  font-size: 0.7rem !important;
}

.form-row {
  gap: 0.6rem !important;
  margin-bottom: 0.6rem !important;
}

.form-group label {
  font-size: 0.65rem !important;
}

.form-control {
  padding: 4px 8px !important;
  font-size: 0.65rem !important;
}

.currency {
  font-size: 0.65rem !important;
}

.price-section {
  padding: 0.6rem !important;
  margin: 0.6rem 0 !important;
}

.section-title {
  font-size: 0.7rem !important;
  margin-bottom: 0.5rem !important;
}

.preview-card {
  margin-top: 0.6rem !important;
}

.preview-header {
  padding: 4px 10px !important;
  font-size: 0.65rem !important;
}

.preview-content {
  padding: 6px 10px !important;
}

.preview-row {
  font-size: 0.65rem !important;
  padding: 2px 0 !important;
}

.preview-code {
  font-size: 0.6rem !important;
}

.profit-highlight {
  font-size: 0.65rem !important;
}

.modal-footer {
  padding: 0.6rem 1rem !important;
  gap: 8px !important;
}

.btn-secondary, .btn-primary {
  padding: 4px 12px !important;
  font-size: 0.65rem !important;
}

.empty-icon {
  font-size: 1.5rem !important;
}

.empty-state p {
  font-size: 0.7rem !important;
}

.empty-state .btn-outline {
  padding: 4px 12px !important;
  font-size: 0.65rem !important;
}
</style>
