<template>
  <div>
    <div class="card">
      <div class="header-actions">
        <div class="header-left">
          <h3><i class="fas fa-coins"></i> Expenses Tracker</h3>
          <p><i class="fas fa-chart-line"></i> Track all business expenses and operating costs</p>
        </div>
        <button class="btn-add" @click="showAddModal = true">
          <i class="fas fa-plus-circle"></i> Add New Expense
        </button>
      </div>
      
      <!-- Filters -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-group">
            <label><i class="fas fa-calendar-alt"></i> From:</label>
            <input type="date" v-model="filters.startDate" @change="loadExpenses" class="filter-input" />
          </div>
          <div class="filter-group">
            <label><i class="fas fa-calendar-alt"></i> To:</label>
            <input type="date" v-model="filters.endDate" @change="loadExpenses" class="filter-input" />
          </div>
          <div class="filter-group">
            <label><i class="fas fa-folder"></i> Category:</label>
            <select v-model="filters.category" @change="loadExpenses" class="filter-input">
              <option value="">All Categories</option>
              
              <option value="Utilities">Utilities</option>
              <option value="Salary">Salary</option>
              <option value="Supplies">Supplies</option>
              <option value="Transport">Transport</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <button @click="clearFilters" class="btn-clear">
            <i class="fas fa-eraser"></i> Clear
          </button>
        </div>
      </div>
      
      <!-- Total Card -->
      <div class="total-card">
        <div class="total-icon">
          <i class="fas fa-peso-sign"></i>
        </div>
        <div class="total-info">
          <span>Total Expenses</span>
          <strong>₱{{ formatNumber(totalExpenses) }}</strong>
        </div>
      </div>
      
      <!-- Expenses Table -->
      <div class="table-responsive">
        <table class="expenses-table">
          <thead>
            <tr>
              <th>DATE</th>
              <th>DESCRIPTION</th>
              <th>CATEGORY</th>
              <th>AMOUNT</th>
              <th>NOTES</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="expense in store.expenses" :key="expense.id">
              <td>
                <i class="far fa-calendar-alt"></i> {{ expense.date }}
              </td>
              <td><strong>{{ expense.description }}</strong></td>
              <td>
                <span :class="['category-badge', getCategoryClass(expense.category)]">
                  <i :class="getCategoryIcon(expense.category)"></i> {{ expense.category }}
                </span>
              </td>
              <td class="amount-cell">
                <i class="fas fa-peso-sign"></i> {{ formatNumber(Number(expense.amount)) }}
              </td>
              <td>
                <span v-if="expense.note" class="note-text">
                  <i class="fas fa-comment"></i> {{ expense.note }}
                </span>
                <span v-else class="no-note">—</span>
              </td>
              <td class="action-cell">
                <button @click="openEditModal(expense)" class="btn-edit" title="Edit Expense">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="deleteExpense(expense.id)" class="btn-delete" title="Delete Expense">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
            <tr v-if="store.expenses.length === 0">
              <td colspan="6" class="empty-row">
                <i class="fas fa-receipt"></i> No expenses recorded
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Add Expense Modal -->
    <div v-if="showAddModal" class="modal" @click.self="showAddModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-plus-circle"></i> Add New Expense</h3>
          <button class="close-btn" @click="showAddModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label><i class="fas fa-calendar-alt"></i> Date:</label>
            <input type="date" v-model="expenseForm.date" class="form-input" />
          </div>
          <div class="form-group">
            <label><i class="fas fa-align-left"></i> Description:</label>
            <input type="text" v-model="expenseForm.description" placeholder="e.g., Office supplies, Electricity bill" class="form-input" />
          </div>
          <div class="form-group">
            <label><i class="fas fa-folder"></i> Category:</label>
            <select v-model="expenseForm.category" class="form-input">
              
              <option value="Utilities">Utilities (Electricity, Water, Internet)</option>
              <option value="Salary">Employee Salary</option>
              <option value="Supplies">Packaging Supplies</option>
              <option value="Transport">Transport / Delivery</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <div class="form-group">
            <label><i class="fas fa-peso-sign"></i> Amount (₱):</label>
            <input type="number" step="0.01" v-model="expenseForm.amount" class="form-input" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label><i class="fas fa-pen"></i> Additional Notes:</label>
            <input type="text" v-model="expenseForm.note" placeholder="Optional details" class="form-input" />
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
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-edit"></i> Edit Expense</h3>
          <button class="close-btn" @click="showEditModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label><i class="fas fa-calendar-alt"></i> Date:</label>
            <input type="date" v-model="editForm.date" class="form-input" />
          </div>
          <div class="form-group">
            <label><i class="fas fa-align-left"></i> Description:</label>
            <input type="text" v-model="editForm.description" placeholder="e.g., Office supplies, Electricity bill" class="form-input" />
          </div>
          <div class="form-group">
            <label><i class="fas fa-folder"></i> Category:</label>
            <select v-model="editForm.category" class="form-input">
              
              <option value="Utilities">Utilities (Electricity, Water, Internet)</option>
              <option value="Salary">Employee Salary</option>
              <option value="Supplies">Packaging Supplies</option>
              <option value="Transport">Transport / Delivery</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <div class="form-group">
            <label><i class="fas fa-peso-sign"></i> Amount (₱):</label>
            <input type="number" step="0.01" v-model="editForm.amount" class="form-input" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label><i class="fas fa-pen"></i> Additional Notes:</label>
            <input type="text" v-model="editForm.note" placeholder="Optional details" class="form-input" />
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
const API_URL = 'http://localhost:3000/api'

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

const totalExpenses = computed(() => {
  let total = 0
  for (const exp of store.expenses) {
    total += Number(exp.amount)
  }
  return total
})

const formatNumber = (num) => {
  return num?.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'
}

const getCategoryIcon = (category) => {
  const icons = {
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
  
  console.log('Expenses loaded:', store.expenses)
  
  let total = 0
  for (const exp of store.expenses) {
    total += exp.amount
  }
  console.log('Total computed manually:', total)
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
  
  expenseForm.value = {
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'Others',
    amount: 0,
    note: ''
  }
  
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

const clearFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    category: ''
  }
  loadExpenses()
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
}

.header-left h3 i {
  color: #2c3e50;
  margin-right: 8px;
}

.header-left p {
  color: #666;
  font-size: 0.85rem;
  margin: 0;
}

.header-left p i {
  margin-right: 4px;
  color: #2c3e50;
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
  font-weight: 500;
}

.btn-add:hover {
  background: #1e7e34;
}

.filter-section {
  background: #f4f6f8;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e6ea;
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

.filter-group label i {
  margin-right: 4px;
  color: #2c3e50;
}

.filter-input {
  padding: 8px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  min-width: 150px;
  background: white;
}

.filter-input:focus {
  outline: none;
  border-color: #2c3e50;
  box-shadow: 0 0 0 2px rgba(44,62,80,0.1);
}

.btn-clear {
  background: #718096;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-clear:hover {
  background: #4a5568;
}

.total-card {
  background: #2c3e50;
  color: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.total-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffc107;
}

.total-info {
  display: flex;
  flex-direction: column;
}

.total-info span {
  font-size: 0.8rem;
  opacity: 0.8;
}

.total-info strong {
  font-size: 2rem;
  color: #ffc107;
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
  font-weight: 600;
  color: white;
  border-bottom: 2px solid #1a252f;
}

.expenses-table td {
  padding: 10px;
  border-bottom: 1px solid #e2e8f0;
  color: #2d3748;
}

.expenses-table tr:hover td {
  background: #f7fafc;
}

.amount-cell {
  font-weight: bold;
  color: #dc3545;
}

.amount-cell i {
  margin-right: 2px;
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

.note-text {
  font-size: 0.8rem;
  color: #718096;
}

.note-text i {
  margin-right: 4px;
}

.no-note {
  color: #cbd5e0;
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
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}

.btn-edit:hover {
  background: #138496;
}

.btn-delete {
  background: #dc3545;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}

.btn-delete:hover {
  background: #bb2d3b;
}

.empty-row {
  text-align: center;
  padding: 40px;
  color: #a0aec0;
}

.empty-row i {
  font-size: 2rem;
  display: block;
  margin-bottom: 10px;
  color: #cbd5e0;
}

/* Category colors - professional but distinct */
.cat-rent { background: #e3f2fd; color: #1565c0; }
.cat-utilities { background: #e8f5e9; color: #2e7d32; }
.cat-salary { background: #f3e5f5; color: #6a1b9a; }
.cat-supplies { background: #fff3e0; color: #e65100; }
.cat-transport { background: #e0f2f1; color: #00695c; }
.cat-others { background: #f5f5f5; color: #616161; }

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
  width: 500px;
  max-width: 95%;
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

.form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-save:hover {
  background: #1a252f;
}
</style>