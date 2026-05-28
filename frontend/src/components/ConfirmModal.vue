<template>
  <div v-if="visible" class="confirm-overlay" @click.self="cancel">
    <div class="confirm-modal">
      <div class="confirm-header" :class="type">
        <div class="confirm-icon">
          <i :class="iconClass"></i>
        </div>
        <h3>{{ title }}</h3>
      </div>
      <div class="confirm-body">
        <p>{{ message }}</p>
      </div>
      <div class="confirm-footer">
        <button class="btn-cancel" @click="cancel">
          <i class="fas fa-times"></i> {{ cancelText }}
        </button>
        <button class="btn-confirm" @click="confirm">
          <i class="fas fa-check"></i> {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
let resolvePromise = null

const type = ref('info')
const title = ref('Confirm')
const message = ref('Are you sure?')
const confirmText = ref('Confirm')
const cancelText = ref('Cancel')
const iconClass = ref('fas fa-question-circle')

const show = (options) => {
  type.value = options.type || 'info'
  title.value = options.title || 'Confirm'
  message.value = options.message || 'Are you sure?'
  confirmText.value = options.confirmText || 'Confirm'
  cancelText.value = options.cancelText || 'Cancel'
  
  switch(type.value) {
    case 'success':
      iconClass.value = 'fas fa-check-circle'
      break
    case 'error':
      iconClass.value = 'fas fa-times-circle'
      break
    case 'warning':
      iconClass.value = 'fas fa-exclamation-triangle'
      break
    default:
      iconClass.value = 'fas fa-question-circle'
  }
  
  visible.value = true
  
  return new Promise((resolve) => {
    resolvePromise = resolve
  })
}

const confirm = () => {
  visible.value = false
  if (resolvePromise) resolvePromise(true)
}

const cancel = () => {
  visible.value = false
  if (resolvePromise) resolvePromise(false)
}

defineExpose({ show })
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.confirm-modal {
  background: white;
  border-radius: 16px;
  width: 400px;
  max-width: 90%;
  overflow: hidden;
  animation: modalSlideIn 0.2s ease;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

@keyframes modalSlideIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.confirm-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: #f8f9fa;
}

.confirm-header.info {
  border-left: 4px solid #00adb5;
}

.confirm-header.success {
  border-left: 4px solid #28a745;
}

.confirm-header.error {
  border-left: 4px solid #dc3545;
}

.confirm-header.warning {
  border-left: 4px solid #ffc107;
}

.confirm-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 1.3rem;
}

.confirm-header.info .confirm-icon {
  background: #e3f2fd;
  color: #00adb5;
}

.confirm-header.success .confirm-icon {
  background: #d4edda;
  color: #28a745;
}

.confirm-header.error .confirm-icon {
  background: #f8d7da;
  color: #dc3545;
}

.confirm-header.warning .confirm-icon {
  background: #fff3cd;
  color: #ffc107;
}

.confirm-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #1a2a3a;
}

.confirm-body {
  padding: 20px;
}

.confirm-body p {
  margin: 0;
  font-size: 0.9rem;
  color: #555;
  line-height: 1.5;
}

.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.btn-cancel {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #5a6268;
}

.btn-confirm {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-confirm:hover {
  background: #c82333;
}
</style>