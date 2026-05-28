<template>
  <div>
    <div class="card">
      <div class="header-actions">
        <h3><i class="fas fa-chart-line"></i> Income Statement</h3>
        <p>Financial performance report - Sales, COGS, Expenses, and Profit</p>
      </div>
      
      <!-- Year Selector -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-group">
            <label><i class="fas fa-calendar-alt"></i> Select Year:</label>
            <select v-model="selectedYear" @change="loadIncomeData" class="filter-input">
              <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
            </select>
          </div>
          <button @click="loadIncomeData" class="btn-refresh">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>
      
      <!-- Summary Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
          <div class="stat-info">
            <h4>Gross Sales</h4>
            <div class="value">₱{{ formatNumber(grossSales) }}</div>
            <small>Total OUT transactions</small>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-boxes"></i></div>
          <div class="stat-info">
            <h4>COGS (Cost of Goods Sold)</h4>
            <div class="value">₱{{ formatNumber(cogs) }}</div>
            <small>Cost of IN transactions</small>
          </div>
        </div>
        <div class="stat-card profit-card">
          <div class="stat-icon"><i class="fas fa-chart-simple"></i></div>
          <div class="stat-info">
            <h4>Gross Profit</h4>
            <div class="value" :class="grossProfit >= 0 ? 'profit-positive' : 'profit-negative'">
              ₱{{ formatNumber(grossProfit) }}
            </div>
            <small>Sales - COGS</small>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-coins"></i></div>
          <div class="stat-info">
            <h4>Operating Expenses</h4>
            <div class="value">₱{{ formatNumber(totalExpenses) }}</div>
            <small>From Expenses tracker</small>
          </div>
        </div>
        <div class="stat-card net-card">
          <div class="stat-icon"><i class="fas fa-trophy"></i></div>
          <div class="stat-info">
            <h4>Net Profit / Loss</h4>
            <div class="value" :class="netProfit >= 0 ? 'profit-positive' : 'profit-negative'">
              ₱{{ formatNumber(netProfit) }}
            </div>
            <small>Gross Profit - Expenses</small>
          </div>
        </div>
      </div>
      
      <!-- Monthly Breakdown Table -->
      <div class="table-responsive">
        <h4>Monthly Financial Breakdown</h4>
        <table class="income-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Sales (OUT)</th>
              <th>COGS (IN)</th>
              <th>Gross Profit</th>
              <th>Expenses</th>
              <th>Net Profit</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="month in months" :key="month.num">
              <td>{{ month.name }}</td>
              <td class="amount">₱{{ formatNumber(monthlySales[month.num]) }}</td>
              <td class="amount">₱{{ formatNumber(monthlyCogs[month.num]) }}</td>
              <td class="amount" :class="getProfitClass(monthlyGrossProfit[month.num])">
                ₱{{ formatNumber(monthlyGrossProfit[month.num]) }}
              </td>
              <td class="amount">₱{{ formatNumber(monthlyExpenses[month.num]) }}</td>
              <td class="amount" :class="getProfitClass(monthlyNetProfit[month.num])">
                ₱{{ formatNumber(monthlyNetProfit[month.num]) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th>TOTAL</th>
              <th class="amount">₱{{ formatNumber(grossSales) }}</th>
              <th class="amount">₱{{ formatNumber(cogs) }}</th>
              <th class="amount" :class="grossProfit >= 0 ? 'profit-positive' : 'profit-negative'">
                ₱{{ formatNumber(grossProfit) }}
              </th>
              <th class="amount">₱{{ formatNumber(totalExpenses) }}</th>
              <th class="amount" :class="netProfit >= 0 ? 'profit-positive' : 'profit-negative'">
                ₱{{ formatNumber(netProfit) }}
              </th>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <!-- Expenses by Category -->
      <div class="expenses-card">
        <h4><i class="fas fa-chart-pie"></i> Expenses by Category</h4>
        <div class="category-grid">
          <div v-for="(amount, category) in expensesByCategory" :key="category" class="category-item">
            <span class="category-name">
              <i :class="getCategoryIcon(category)"></i> {{ category }}
            </span>
            <span class="category-amount">₱{{ formatNumber(amount) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useInventoryStore } from '../stores/inventory'
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const store = useInventoryStore()
const API_URL = 'http://localhost:3000/api'

const selectedYear = ref(new Date().getFullYear())
const availableYears = ref([2023, 2024, 2025, 2026, 2027])

const monthlySales = ref({})
const monthlyCogs = ref({})
const monthlyExpenses = ref({})
const expensesByCategory = ref({})

const months = [
  { num: 1, name: 'January' }, { num: 2, name: 'February' }, { num: 3, name: 'March' },
  { num: 4, name: 'April' }, { num: 5, name: 'May' }, { num: 6, name: 'June' },
  { num: 7, name: 'July' }, { num: 8, name: 'August' }, { num: 9, name: 'September' },
  { num: 10, name: 'October' }, { num: 11, name: 'November' }, { num: 12, name: 'December' }
]

// COMPUTED WITH NUMBER CONVERSION
const grossSales = computed(() => {
  let total = 0
  for (let i = 1; i <= 12; i++) {
    total += Number(monthlySales.value[i] || 0)
  }
  return total
})

const cogs = computed(() => {
  let total = 0
  for (let i = 1; i <= 12; i++) {
    total += Number(monthlyCogs.value[i] || 0)
  }
  return total
})

const grossProfit = computed(() => {
  return grossSales.value - cogs.value
})

const totalExpenses = computed(() => {
  let total = 0
  for (let i = 1; i <= 12; i++) {
    total += Number(monthlyExpenses.value[i] || 0)
  }
  return total
})

const netProfit = computed(() => {
  return grossProfit.value - totalExpenses.value
})

const monthlyGrossProfit = computed(() => {
  const result = {}
  for (let i = 1; i <= 12; i++) {
    const sales = Number(monthlySales.value[i] || 0)
    const cost = Number(monthlyCogs.value[i] || 0)
    result[i] = sales - cost
  }
  return result
})

const monthlyNetProfit = computed(() => {
  const result = {}
  for (let i = 1; i <= 12; i++) {
    const gross = Number(monthlyGrossProfit.value[i] || 0)
    const expense = Number(monthlyExpenses.value[i] || 0)
    result[i] = gross - expense
  }
  return result
})

const formatNumber = (num) => {
  const value = Number(num)
  return isNaN(value) ? '0.00' : value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const getProfitClass = (value) => {
  const num = Number(value)
  if (num > 0) return 'profit-positive'
  if (num < 0) return 'profit-negative'
  return ''
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

const loadIncomeData = async () => {
  // Reset data
  for (let i = 1; i <= 12; i++) {
    monthlySales.value[i] = 0
    monthlyCogs.value[i] = 0
    monthlyExpenses.value[i] = 0
  }
  expensesByCategory.value = {}
  
  const startDate = `${selectedYear.value}-01-01`
  const endDate = `${selectedYear.value}-12-31`
  
  try {
    // Get movements (IN/OUT)
    const movementsRes = await axios.get(`${API_URL}/movements`, {
      params: { startDate, endDate }
    })
    
    for (const movement of movementsRes.data) {
      const month = new Date(movement.datetime).getMonth() + 1
      
      if (movement.type === 'OUT') {
        const salesAmount = Number(movement.total_sales) || 0
        monthlySales.value[month] = (monthlySales.value[month] || 0) + salesAmount
      } else if (movement.type === 'IN') {
        const item = store.items.find(i => i.id === movement.item_id)
        if (item) {
          const cost = (movement.base_delta || 0) * (item.cost_base || 0)
          monthlyCogs.value[month] = (monthlyCogs.value[month] || 0) + cost
        }
      }
    }
    
    // Get expenses
    const expensesRes = await axios.get(`${API_URL}/expenses`, {
      params: { startDate, endDate }
    })
    
    for (const expense of expensesRes.data) {
      const month = new Date(expense.date).getMonth() + 1
      const amount = Number(expense.amount) || 0
      monthlyExpenses.value[month] = (monthlyExpenses.value[month] || 0) + amount
      expensesByCategory.value[expense.category] = (expensesByCategory.value[expense.category] || 0) + amount
    }
    
    console.log('Income Data Loaded - Sales:', monthlySales.value)
    console.log('Income Data Loaded - COGS:', monthlyCogs.value)
    console.log('Income Data Loaded - Expenses:', monthlyExpenses.value)
    
  } catch (error) {
    console.error('Error loading income data:', error)
  }
}

onMounted(async () => {
  await store.fetchItems()
  await loadIncomeData()
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
  margin-bottom: 1.5rem;
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
}

.filter-section {
  background: #f4f6f8;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e6ea;
}

.filter-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
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
  min-width: 120px;
  background: white;
}

.filter-input:focus {
  outline: none;
  border-color: #2c3e50;
  box-shadow: 0 0 0 2px rgba(44,62,80,0.1);
}

.btn-refresh {
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

.btn-refresh:hover {
  background: #1a252f;
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
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  border-left: 4px solid #2c3e50;
}

.stat-icon {
  font-size: 1.3rem;
  width: 45px;
  height: 45px;
  background: #edf2f7;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2c3e50;
}

.stat-info {
  flex: 1;
}

.stat-info h4 {
  font-size: 0.7rem;
  color: #718096;
  margin-bottom: 0.25rem;
  letter-spacing: 0.5px;
}

.stat-info .value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #1a2a3a;
}

.stat-info small {
  font-size: 0.65rem;
  color: #a0aec0;
}

.profit-card {
  border-left-color: #17a2b8;
}

.net-card {
  border-left-color: #ffc107;
}

.profit-positive {
  color: #28a745;
}

.profit-negative {
  color: #dc3545;
}

.table-responsive {
  overflow-x: auto;
  margin-bottom: 2rem;
}

.table-responsive h4 {
  margin-bottom: 1rem;
  color: #1a2a3a;
  font-size: 1rem;
}

.income-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.income-table th {
  background: #2c3e50;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: white;
  border-bottom: 2px solid #1a252f;
}

/* Right align ang mga amount columns sa header */
.income-table th:nth-child(2),
.income-table th:nth-child(3),
.income-table th:nth-child(4),
.income-table th:nth-child(5),
.income-table th:nth-child(6) {
  text-align: right;
}

.income-table td {
  padding: 10px;
  border-bottom: 1px solid #e2e8f0;
  color: #2d3748;
}

.income-table tr:hover td {
  background: #f7fafc;
}

/* Right align ang mga amount cells */
.amount {
  text-align: right;
}

/* Left align ang Month column */
.income-table td:first-child,
.income-table th:first-child {
  text-align: left;
}

.income-table tfoot {
  background: #f8f9fa;
  font-weight: bold;
}

.income-table tfoot th,
.income-table tfoot td {
  padding: 12px;
  border-top: 2px solid #cbd5e0;
}

/* Right align ang tfoot amount columns */
.income-table tfoot th:nth-child(2),
.income-table tfoot th:nth-child(3),
.income-table tfoot th:nth-child(4),
.income-table tfoot th:nth-child(5),
.income-table tfoot th:nth-child(6),
.income-table tfoot td:nth-child(2),
.income-table tfoot td:nth-child(3),
.income-table tfoot td:nth-child(4),
.income-table tfoot td:nth-child(5),
.income-table tfoot td:nth-child(6) {
  text-align: right;
}

.expenses-card {
  background: #f4f6f8;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e2e6ea;
}

.expenses-card h4 {
  margin-bottom: 1rem;
  color: #1a2a3a;
}

.expenses-card h4 i {
  margin-right: 8px;
  color: #2c3e50;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}

.category-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: white;
  border-radius: 6px;
  border-left: 3px solid #2c3e50;
}

.category-name {
  font-weight: 500;
  color: #1a2a3a;
}

.category-name i {
  margin-right: 6px;
  color: #2c3e50;
}

.category-amount {
  font-weight: bold;
  color: #dc3545;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>