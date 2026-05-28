<template>
  <div class="toast-container">
    <div v-for="toast in toasts" :key="toast.id" :class="['toast', toast.type]">
      <div class="toast-icon">
        <i :class="toast.icon"></i>
      </div>
      <div class="toast-content">
        <p>{{ toast.message }}</p>
      </div>
      <button class="toast-close" @click="removeToast(toast.id)">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const toasts = ref([])
let nextId = 1

const show = (message, type = 'success') => {
  const id = nextId++
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-times-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  }
  
  toasts.value.push({
    id,
    message,
    type,
    icon: icons[type] || icons.success
  })
  
  setTimeout(() => {
    removeToast(id)
  }, 3000)
}

const removeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

defineExpose({ show })
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  min-width: 280px;
  max-width: 350px;
  background: white;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast.success {
  border-left: 4px solid #28a745;
}

.toast.error {
  border-left: 4px solid #dc3545;
}

.toast.warning {
  border-left: 4px solid #ffc107;
}

.toast.info {
  border-left: 4px solid #00adb5;
}

.toast.success .toast-icon {
  color: #28a745;
}

.toast.error .toast-icon {
  color: #dc3545;
}

.toast.warning .toast-icon {
  color: #ffc107;
}

.toast.info .toast-icon {
  color: #00adb5;
}

.toast-icon {
  font-size: 1.2rem;
}

.toast-content {
  flex: 1;
}

.toast-content p {
  margin: 0;
  font-size: 0.85rem;
  color: #333;
}

.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  font-size: 0.8rem;
  padding: 0;
}

.toast-close:hover {
  color: #666;
}
</style>