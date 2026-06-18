<template>
  <div>
    <div class="card">
      <div class="header-actions">
        <div class="header-left">
          <h3><i class="fas fa-coins"></i> Expenses Tracker</h3>
          <p><i class="fas fa-chart-line"></i> Track all business expenses and operating costs</p>
        </div>
        <button class="btn-add" @click="openAddModal">
          <i class="fas fa-plus-circle"></i> Add New Expense
        </button>
      </div>
      
      <!-- Summary Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-calendar-alt"></i></div>
          <div class="stat-info">
            <h4>This Month</h4>
            <div class="value">₱{{ formatNumber(monthlyTotal) }}</div>
            <small>{{ currentMonth }} {{ currentYear }}</small>
          </div>
        </div>
         <div class="stat-card">
    <div class="stat-icon"><i class="fas fa-calendar-alt"></i></div>

    <div class="stat-info">
      <h4>Year to Date</h4>
      <div class="value">₱{{ formatNumber(yearTotal) }}</div>
      <small>{{ currentYear }}</small>
    </div>
  </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-tags"></i></div>
          <div class="stat-info">
            <h4>Categories Used</h4>
            <div class="value">{{ categoriesCount }}</div>
            <small>Active expense categories</small>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-list"></i></div>
          <div class="stat-info">
            <h4>Total Records</h4>
            <div class="value">{{ store.expenses.length }}</div>
            <small>All time expenses</small>
          </div>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-group">
            <label><i class="fas fa-calendar-alt"></i> Start Date:</label>
            <div class="input-icon-wrapper">
              <i class="fas fa-calendar-day input-icon"></i>
              <input type="date" v-model="filters.startDate" @change="loadExpenses" class="filter-input with-icon" />
            </div>
            <small>Filter from this date</small>
          </div>
          <div class="filter-group">
            <label><i class="fas fa-calendar-alt"></i> End Date:</label>
            <div class="input-icon-wrapper">
              <i class="fas fa-calendar-day input-icon"></i>
              <input type="date" v-model="filters.endDate" @change="loadExpenses" class="filter-input with-icon" />
            </div>
            <small>Filter up to this date</small>
          </div>
          <div class="filter-group">
            <label><i class="fas fa-tag"></i> Category:</label>
            <div class="input-icon-wrapper">
              <i class="fas fa-list input-icon"></i>
              <select v-model="filters.category" @change="loadExpenses" class="filter-input with-icon">
                <option value="">All Categories</option>
                <option value="Raw Materials">Raw Materials</option>
                <option value="Utilities">Utilities</option>
                <option value="Rent">Rent</option>
                <option value="Salary">Salary / Wages</option>
                <option value="Transport">Transport</option>
                <option value="Supplies">Supplies</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <small>Filter by expense category</small>
          </div>
          <button @click="clearFilters" class="btn-clear">
            <i class="fas fa-eraser"></i> Clear All Filters
          </button>
        </div>
        <div class="filter-results" v-if="filteredExpenses.length !== store.expenses.length">
          <i class="fas fa-filter"></i> Showing <strong>{{ filteredExpenses.length }}</strong> of <strong>{{ store.expenses.length }}</strong> expenses
        </div>
      </div>
      
      <!-- Expenses Table -->
      <div class="table-responsive">
        <table class="expenses-table">
          <thead>
            <tr>
              <th><i class="fas fa-calendar-day"></i> DATE</th>
              <th><i class="fas fa-align-left"></i> DESCRIPTION</th>
              <th><i class="fas fa-tag"></i> CATEGORY</th>
              <th><i class="fas fa-peso-sign"></i> AMOUNT</th>
              <th><i class="fas fa-sticky-note"></i> NOTES</th>
              <th><i class="fas fa-cog"></i> ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="expense in filteredExpenses" :key="expense.id">
              <td class="date-cell">
                <i class="far fa-calendar-alt"></i> {{ formatDate(expense.date) }}
              </td>
              <td class="desc-cell"><strong>{{ expense.description }}</strong></td>
              <td>
                <span :class="['category-badge', getCategoryClass(expense.category)]">
                  <i :class="getCategoryIcon(expense.category)"></i> {{ expense.category }}
                </span>
              </td>
              <td class="amount-cell">
                <i class="fas fa-peso-sign"></i> {{ formatNumber(Number(expense.amount)) }}
              </td>
              <td class="note-cell">
                <span v-if="expense.note" class="note-text">
                  <i class="fas fa-comment"></i> {{ expense.note }}
                </span>
                <span v-else class="no-note">—</span>
              </td>
              <td class="action-cell">
                <button @click="openEditModal(expense)" class="btn-edit" title="Edit Expense">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button @click="deleteExpense(expense.id)" class="btn-delete" title="Delete Expense">
                  <i class="fas fa-trash-alt"></i> Delete
                </button>
              </td>
            </tr>
            <tr v-if="filteredExpenses.length === 0">
              <td colspan="6" class="empty-row">
                <i class="fas fa-receipt"></i> No expenses recorded
                <p>Click "Add New Expense" to get started</p>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="filteredExpenses.length > 0">
            <tr class="total-row">
              <td colspan="3" class="total-label"><strong>GRAND TOTAL</strong></td>
              <td colspan="3" class="total-amount"><i class="fas fa-peso-sign"></i> {{ formatNumber(filteredTotal) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    
    <!-- Add Expense Modal -->
    <div v-if="showAddModal" class="modal" @click.self="showAddModal = false">
      <div class="modal-content expense-modal">
        <div class="modal-header">
          <div class="header-icon">
            <i class="fas fa-plus-circle"></i>
          </div>
          <h3>Add New Expense</h3>
          <button class="close-btn" @click="showAddModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label><i class="fas fa-calendar-alt"></i> Date <span class="required">*</span></label>
            <input type="date" v-model="expenseForm.date" class="form-input" />
            <small>Select the date when this expense was incurred</small>
          </div>

          <div class="form-group">
            <label><i class="fas fa-pencil-alt"></i> Description <span class="required">*</span></label>
            <input type="text" v-model="expenseForm.description" placeholder="e.g., Office supplies, Electricity bill" class="form-input" />
            <small>Brief description of the expense</small>
          </div>

          <div class="form-group">
            <label><i class="fas fa-tag"></i> Category <span class="required">*</span></label>
            <select v-model="expenseForm.category" class="form-input">
  <option value="Raw Materials">Raw Materials</option>
  <option value="Utilities">Utilities</option>
  <option value="Rent">Rent</option>
  <option value="Salary">Salary / Wages</option>
  <option value="Transport">Transport</option>
  <option value="Supplies">Supplies</option>
  <option value="Others">Others</option>
</select>
            <small>Select the appropriate category for this expense</small>
          </div>

          <div class="form-group">
            <label><i class="fas fa-money-bill-wave"></i> Amount (₱) <span class="required">*</span></label>
            <div class="currency-input">
              <span class="currency"><i class="fas fa-peso-sign"></i></span>
              <input type="number" step="0.01" v-model="expenseForm.amount" class="form-input" placeholder="0.00" />
            </div>
            <small>Enter the amount in Philippine Peso (₱)</small>
          </div>

          <div class="form-group">
            <label><i class="fas fa-sticky-note"></i> Additional Notes</label>
            <input type="text" v-model="expenseForm.note" placeholder="Optional - e.g., Receipt #12345, Payment reference" class="form-input" />
            <small>Optional: Add additional details or reference numbers</small>
          </div>

          <div class="preview" v-if="expenseForm.amount > 0">
            <strong><i class="fas fa-eye"></i> Summary Preview</strong>
            <div class="preview-details">
              <div class="preview-row">
                <span><i class="fas fa-calendar-alt"></i> Date:</span>
                <span class="preview-value">{{ expenseForm.date || 'Not set' }}</span>
              </div>
              <div class="preview-row">
                <span><i class="fas fa-tag"></i> Category:</span>
                <span class="preview-value">{{ expenseForm.category || 'Not set' }}</span>
              </div>
              <div class="preview-row">
                <span><i class="fas fa-pencil-alt"></i> Description:</span>
                <span class="preview-value">{{ expenseForm.description || 'Not set' }}</span>
              </div>
              <div class="preview-row total">
                <span><i class="fas fa-money-bill-wave"></i> Total Amount:</span>
                <span class="preview-amount"><i class="fas fa-peso-sign"></i> {{ formatNumber(expenseForm.amount) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showAddModal = false">
            <i class="fas fa-times"></i> Cancel
          </button>
          <button class="btn-save" @click="saveExpense">
            <i class="fas fa-save"></i> Save Expense
          </button>
        </div>
      </div>
    </div>
    
    <!-- Edit Expense Modal -->
    <div v-if="showEditModal" class="modal" @click.self="showEditModal = false">
      <div class="modal-content expense-modal">
        <div class="modal-header">
          <div class="header-icon">
            <i class="fas fa-edit"></i>
          </div>
          <h3>Edit Expense</h3>
          <button class="close-btn" @click="showEditModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label><i class="fas fa-calendar-alt"></i> Date <span class="required">*</span></label>
            <input type="date" v-model="editForm.date" class="form-input" />
            <small>Select the date when this expense was incurred</small>
          </div>

          <div class="form-group">
            <label><i class="fas fa-pencil-alt"></i> Description <span class="required">*</span></label>
            <input type="text" v-model="editForm.description" placeholder="e.g., Office supplies, Electricity bill" class="form-input" />
            <small>Brief description of the expense</small>
          </div>

          <div class="form-group">
            <label><i class="fas fa-tag"></i> Category <span class="required">*</span></label>
            <select v-model="editForm.category" class="form-input">
  <option value="Raw Materials">Raw Materials</option>
  <option value="Utilities">Utilities</option>
  <option value="Rent">Rent</option>
  <option value="Salary">Salary / Wages</option>
  <option value="Transport">Transport</option>
  <option value="Supplies">Supplies</option>
  <option value="Others">Others</option>
</select>
            <small>Select the appropriate category for this expense</small>
          </div>

          <div class="form-group">
            <label><i class="fas fa-money-bill-wave"></i> Amount (₱) <span class="required">*</span></label>
            <div class="currency-input">
              <span class="currency"><i class="fas fa-peso-sign"></i></span>
              <input type="number" step="0.01" v-model="editForm.amount" class="form-input" placeholder="0.00" />
            </div>
            <small>Enter the amount in Philippine Peso (₱)</small>
          </div>

          <div class="form-group">
            <label><i class="fas fa-sticky-note"></i> Additional Notes</label>
            <input type="text" v-model="editForm.note" placeholder="Optional - e.g., Receipt #12345" class="form-input" />
            <small>Optional: Add additional details or reference numbers</small>
          </div>

          <div class="preview" v-if="editForm.amount > 0">
            <strong><i class="fas fa-eye"></i> Summary Preview</strong>
            <div class="preview-details">
              <div class="preview-row">
                <span><i class="fas fa-calendar-alt"></i> Date:</span>
                <span class="preview-value">{{ editForm.date || 'Not set' }}</span>
              </div>
              <div class="preview-row">
                <span><i class="fas fa-tag"></i> Category:</span>
                <span class="preview-value">{{ editForm.category || 'Not set' }}</span>
              </div>
              <div class="preview-row">
                <span><i class="fas fa-pencil-alt"></i> Description:</span>
                <span class="preview-value">{{ editForm.description || 'Not set' }}</span>
              </div>
              <div class="preview-row total">
                <span><i class="fas fa-money-bill-wave"></i> Total Amount:</span>
                <span class="preview-amount"><i class="fas fa-peso-sign"></i> {{ formatNumber(editForm.amount) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showEditModal = false">
            <i class="fas fa-times"></i> Cancel
          </button>
          <button class="btn-save" @click="updateExpense">
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
const showToast = inject('showToast')
const showConfirm = inject('showConfirm')
const API_URL = 'https://inventory-system-backend-production-0549.up.railway.app/api'

const showAddModal = ref(false)
const showEditModal = ref(false)

const filters = ref({
  startDate: '',
  endDate: '',
  category: ''
})

const expenseForm = ref({
  date: new Date().toISOString().split('T')[0],
  description: '',
  category: 'Others',
  amount: 0,
  note: ''
})

const editForm = ref({
  id: null,
  date: '',
  description: '',
  category: 'Others',
  amount: 0,
  note: ''
})

const currentMonth = new Date().toLocaleString('en-US', { month: 'long' })
const currentYear = new Date().getFullYear()

const monthlyTotal = computed(() => {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  return store.expenses
    .filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === month && d.getFullYear() === year
    })
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
})

const yearTotal = computed(() => {
  const year = new Date().getFullYear()
  return store.expenses
    .filter(e => new Date(e.date).getFullYear() === year)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
})

const categoriesCount = computed(() => {
  const cats = new Set()
  store.expenses.forEach(e => cats.add(e.category))
  return cats.size
})

const filteredExpenses = computed(() => {
  let result = store.expenses
  
  if (filters.value.startDate) {
    result = result.filter(e => e.date >= filters.value.startDate)
  }
  if (filters.value.endDate) {
    result = result.filter(e => e.date <= filters.value.endDate)
  }
  if (filters.value.category) {
    result = result.filter(e => e.category === filters.value.category)
  }
  
  return result
})

const filteredTotal = computed(() => {
  return filteredExpenses.value.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
})

const formatNumber = (num) => {
  return num?.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'
}

const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getCategoryIcon = (category) => {
  const icons = {
    'Raw Materials': 'fas fa-cubes',
    'Rent': 'fas fa-building',
    'Utilities': 'fas fa-bolt',
    'Salary': 'fas fa-users',
    'Supplies': 'fas fa-box',
    'Transport': 'fas fa-truck',
    'Others': 'fas fa-ellipsis-h'
  }
  return icons[category] || 'fas fa-tag'
}

const getCategoryClass = (category) => {
  const classes = {
    'Raw Materials': 'cat-materials',
    'Rent': 'cat-rent',
    'Utilities': 'cat-utilities',
    'Salary': 'cat-salary',
    'Supplies': 'cat-supplies',
    'Transport': 'cat-transport',
    'Others': 'cat-others'
  }
  return classes[category] || 'cat-others'
}

const loadExpenses = async () => {
  const params = {}
  if (filters.value.startDate) params.startDate = filters.value.startDate
  if (filters.value.endDate) params.endDate = filters.value.endDate
  if (filters.value.category) params.category = filters.value.category
  await store.fetchExpenses(params)
}

const clearFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    category: ''
  }
  loadExpenses()
}

const openAddModal = () => {
  expenseForm.value = {
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'Others',
    amount: 0,
    note: ''
  }
  showAddModal.value = true
}

const saveExpense = async () => {
  if (!expenseForm.value.description || expenseForm.value.amount <= 0) {
    showToast('Please fill in description and amount', 'warning')
    return
  }
  
  const expenseData = {
    ...expenseForm.value,
    amount: Number(expenseForm.value.amount)
  }
  
  await store.addExpense(expenseData)
  showAddModal.value = false
  showToast('Expense added successfully!', 'success')
  await loadExpenses()
  await store.fetchDashboard()
}

const openEditModal = (expense) => {
  editForm.value = {
    id: expense.id,
    date: expense.date,
    description: expense.description,
    category: expense.category,
    amount: expense.amount,
    note: expense.note || ''
  }
  showEditModal.value = true
}

const updateExpense = async () => {
  if (!editForm.value.description || editForm.value.amount <= 0) {
    showToast('Please fill in description and amount', 'warning')
    return
  }
  
  const confirmed = await showConfirm({
    type: 'info',
    title: 'Update Expense',
    message: 'Are you sure you want to update this expense?',
    confirmText: 'Yes, Update',
    cancelText: 'Cancel'
  })
  
  if (!confirmed) return
  
  try {
    await axios.put(`${API_URL}/expenses/${editForm.value.id}`, {
      date: editForm.value.date,
      description: editForm.value.description,
      category: editForm.value.category,
      amount: Number(editForm.value.amount),
      note: editForm.value.note
    })
    
    showToast('Expense updated successfully!', 'success')
    showEditModal.value = false
    await loadExpenses()
    await store.fetchDashboard()
  } catch (error) {
    console.error('Error updating expense:', error)
    showToast('Error updating expense', 'error')
  }
}

const deleteExpense = async (id) => {
  const confirmed = await showConfirm({
    type: 'warning',
    title: 'Delete Expense',
    message: 'Are you sure you want to delete this expense?',
    confirmText: 'Yes, Delete',
    cancelText: 'Cancel'
  })
  
  if (confirmed) {
    await store.deleteExpense(id)
    await loadExpenses()
    await store.fetchDashboard()
    showToast('Expense deleted!', 'success')
  }
}

onMounted(() => {
  loadExpenses()
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
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left h3 {
  margin-bottom: 0.25rem;
  color: #1a2a3a;
  font-weight: 700;
}

.header-left h3 i {
  color: #2c3e50;
  margin-right: 8px;
}

.header-left p {
  color: #333;
  font-size: 0.85rem;
  font-weight: 500;
  margin: 0;
}

.btn-add {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.btn-add:hover {
  background: #1e7e34;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
  color: #333;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.stat-info .value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1a2a3a;
}

.stat-info small {
  font-size: 0.65rem;
  color: #555;
  font-weight: 500;
}

.filter-section {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #dee2e6;
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
  font-weight: 700;
  color: #1a2a3a;
}

.filter-group label i {
  margin-right: 4px;
  color: #2c3e50;
}

.filter-group small {
  font-size: 0.6rem;
  color: #555;
  font-weight: 500;
}

.filter-input {
  padding: 8px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  min-width: 150px;
  background: white;
  font-weight: 500;
  color: #1a2a3a;
}

.filter-input:focus {
  outline: none;
  border-color: #2c3e50;
}

/* Input icons */
.input-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.input-icon {
  position: absolute;
  left: 10px;
  color: #6c757d;
  font-size: 0.8rem;
  z-index: 1;
  pointer-events: none;
}

.filter-input.with-icon {
  padding-left: 32px;
  width: 100%;
  min-width: 150px;
}

.filter-results {
  margin-top: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #155724;
}

.btn-clear {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-clear:hover {
  background: #5a6268;
}

.table-responsive {
  overflow-x: auto;
}

.expenses-table {
  min-width: 700px;
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.expenses-table th {
  background: #2c3e50;
  padding: 12px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

.expenses-table td {
  padding: 10px;
  border-bottom: 1px solid #e2e8f0;
  color: #1a2a3a;
  font-weight: 500;
}

.expenses-table tr:hover td {
  background: #f7fafc;
}

.date-cell {
  font-weight: 600;
  color: #1a2a3a;
}

.desc-cell {
  font-weight: 600;
  color: #1a2a3a;
}

.amount-cell {
  font-weight: 700;
  color: #dc3545;
}

.note-cell {
  font-weight: 500;
  color: #1a2a3a;
}

.category-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.cat-materials { background: #e3f2fd; color: #0d47a1; }
.cat-rent { background: #f3e5f5; color: #4a148c; }
.cat-utilities { background: #fff3e0; color: #bf360c; }
.cat-salary { background: #e8f5e9; color: #1b5e20; }
.cat-supplies { background: #e0f2f1; color: #004d40; }
.cat-transport { background: #fff8e1; color: #f57f17; }
.cat-others { background: #f5f5f5; color: #424242; }

.note-text {
  font-size: 0.8rem;
  font-weight: 500;
  color: #1a2a3a;
}

.no-note {
  color: #adb5bd;
  font-weight: 400;
}

.action-cell {
  display: flex;
  gap: 5px;
}

.btn-edit, .btn-delete {
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 600;
}

.btn-edit {
  background: #17a2b8;
  color: white;
}

.btn-edit:hover {
  background: #138496;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

.btn-delete:hover {
  background: #bb2d3b;
}

.empty-row {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.empty-row i {
  font-size: 2rem;
  display: block;
  margin-bottom: 10px;
  color: #adb5bd;
}

.empty-row p {
  font-size: 0.8rem;
  margin-top: 5px;
  color: #6c757d;
}

.total-row {
  background: #f8f9fa;
  font-weight: 700;
}

.total-label {
  text-align: right;
  font-size: 0.9rem;
  color: #1a2a3a;
}

.total-amount {
  font-size: 1.1rem;
  color: #28a745;
  font-weight: 700;
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

.expense-modal .modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 1rem 1.5rem;
  background: #2c3e50;
  color: white;
  border-radius: 12px 12px 0 0;
}

.header-icon {
  font-size: 1.3rem;
}

.modal-header h3 {
  flex: 1;
  margin: 0;
  font-weight: 700;
  color: white;
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
  margin-bottom: 0.4rem;
  font-weight: 700;
  font-size: 0.85rem;
  color: #1a2a3a;
}

.form-group label i {
  margin-right: 6px;
  color: #2c3e50;
}

.required {
  color: #dc3545;
  font-weight: 700;
}

.form-group small {
  font-size: 0.7rem;
  color: #555;
  font-weight: 500;
  display: block;
  margin-top: 4px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-weight: 500;
  color: #1a2a3a;
}

.form-input:focus {
  outline: none;
  border-color: #2c3e50;
}

.currency-input {
  position: relative;
}

.currency {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-weight: 700;
  color: #1a2a3a;
}

.currency-input .form-input {
  padding-left: 28px;
}

.preview {
  background: #f0f2f5;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.preview strong {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 700;
  color: #1a2a3a;
}

.preview-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  padding: 2px 0;
  font-weight: 500;
  color: #1a2a3a;
}

.preview-value {
  font-weight: 600;
  color: #1a2a3a;
}

.preview-row.total {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid #ddd;
  font-weight: 700;
}

.preview-amount {
  font-weight: 700;
  color: #28a745;
}

.btn-cancel {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-cancel:hover {
  background: #5a6268;
}

.btn-save {
  background: #2c3e50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-save:hover {
  background: #1a252f;
}

/* Compact styles */
.card {
  padding: 0.8rem !important;
}

.header-actions {
  margin-bottom: 0.8rem !important;
  gap: 0.5rem !important;
}

.header-left h3 {
  font-size: 0.95rem !important;
}

.header-left p {
  font-size: 0.65rem !important;
}

.btn-add {
  padding: 5px 12px !important;
  font-size: 0.7rem !important;
}

.filter-section {
  padding: 0.6rem !important;
}

.filter-row {
  gap: 0.5rem !important;
}

.filter-group label {
  font-size: 0.6rem !important;
}

.filter-input {
  padding: 4px 8px !important;
  font-size: 0.65rem !important;
  min-width: 120px !important;
}

.filter-input.with-icon {
  padding-left: 28px !important;
  min-width: 120px !important;
}

.input-icon {
  font-size: 0.65rem !important;
  left: 8px !important;
}

.expenses-table th {
  padding: 0.4rem 0.5rem !important;
  font-size: 0.65rem !important;
}

.expenses-table td {
  padding: 0.35rem 0.4rem !important;
  font-size: 0.7rem !important;
}

.btn-edit, .btn-delete {
  padding: 3px 8px !important;
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
  font-size: 0.65rem !important;
}

.form-input {
  padding: 4px 8px !important;
  font-size: 0.65rem !important;
}

.stats-grid {
  gap: 0.6rem !important;
}

.stat-card {
  padding: 0.4rem 0.6rem !important;
}

.stat-icon {
  width: 35px !important;
  height: 35px !important;
  font-size: 1rem !important;
}

.stat-info h4 {
  font-size: 0.55rem !important;
}

.stat-info .value {
  font-size: 0.9rem !important;
}
</style>