import { defineStore } from 'pinia'
import axios from 'axios'

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    items: [],
    movements: [],
    stock: [],
    dashboard: {
      total_in_base: 0,
      total_out_base: 0,
      total_expenses: 0,
      gross_sales: 0,
      profit: 0
    },
    expenses: []
  }),

  actions: {
    async fetchItems() {
      try {
        const res = await axios.get('/items')
        this.items = res.data
      } catch (error) {
        console.error('Error fetching items:', error)
      }
    },

    async fetchStock() {
      try {
        const res = await axios.get('/stock')
        this.stock = res.data
      } catch (error) {
        console.error('Error fetching stock:', error)
      }
    },

    async fetchDashboard() {
      try {
        const res = await axios.get('/dashboard')
        this.dashboard = res.data
      } catch (error) {
        console.error('Error fetching dashboard:', error)
      }
    },

    async fetchMovements(filters = {}) {
      try {
        const params = new URLSearchParams(filters)
        const res = await axios.get(`/movements?${params}`)
        this.movements = res.data
      } catch (error) {
        console.error('Error fetching movements:', error)
      }
    },

    async addMovement(movement) {
      try {
        const res = await axios.post('/movements', movement)
        await this.fetchStock()
        await this.fetchDashboard()
        return res.data
      } catch (error) {
        console.error('Error adding movement:', error)
        throw error
      }
    },

    async fetchExpenses(filters = {}) {
      try {
        const params = new URLSearchParams(filters)
        const res = await axios.get(`/expenses?${params}`)
        this.expenses = res.data.map(exp => ({
          ...exp,
          amount: Number(exp.amount)
        }))
      } catch (error) {
        console.error('Error fetching expenses:', error)
      }
    },

    async addExpense(expense) {
      try {
        const res = await axios.post('/expenses', expense)
        await this.fetchExpenses()
        await this.fetchDashboard()
        return res.data
      } catch (error) {
        console.error('Error adding expense:', error)
        throw error
      }
    },

    async deleteExpense(id) {
      try {
        await axios.delete(`/expenses/${id}`)
        await this.fetchExpenses()
        await this.fetchDashboard()
      } catch (error) {
        console.error('Error deleting expense:', error)
        throw error
      }
    },

    async addItem(item) {
      try {
        const res = await axios.post('/items', item)
        await this.fetchItems()
        return res.data
      } catch (error) {
        console.error('Error adding item:', error)
        throw error
      }
    },

    async updateItem(id, item) {
      try {
        const res = await axios.put(`/items/${id}`, item)
        await this.fetchItems()
        await this.fetchStock()
        return res.data
      } catch (error) {
        console.error('Error updating item:', error)
        throw error
      }
    },

    async deleteItem(id) {
      try {
        await axios.delete(`/items/${id}`)
        await this.fetchItems()
        await this.fetchStock()
      } catch (error) {
        console.error('Error deleting item:', error)
        throw error
      }
    }
  }
})