<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal-container" :class="size">
      <div class="modal-header" :class="type">
        <div class="header-icon">
          <i :class="iconClass"></i>
        </div>
        <div class="header-title">
          <h3>{{ title }}</h3>
          <p v-if="subtitle">{{ subtitle }}</p>
        </div>
        <button class="header-close" @click="close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <slot name="body">
          <p>{{ message }}</p>
        </slot>
      </div>
      
      <div class="modal-footer">
        <slot name="footer">
          <button class="btn-secondary" @click="close">
            <i class="fas fa-times"></i> {{ cancelText }}
          </button>
          <button class="btn-primary" @click="confirm">
            <i class="fas fa-check"></i> {{ confirmText }}
          </button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
let resolvePromise = null

const type = ref('info')
const size = ref('medium')
const title = ref('Confirm')
const subtitle = ref('')
const message = ref('Are you sure?')
const confirmText = ref('Confirm')
const cancelText = ref('Cancel')
const iconClass = ref('fas fa-question-circle')

const show = (options) => {
  type.value = options.type || 'info'
  size.value = options.size || 'medium'
  title.value = options.title || 'Confirm'
  subtitle.value = options.subtitle || ''
  message.value = options.message || 'Are you sure?'
  confirmText.value = options.confirmText || 'Confirm'
  cancelText.value = options.cancelText || 'Cancel'
  
  // Set icon based on type
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
    case 'info':
      iconClass.value = 'fas fa-info-circle'
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

const close = () => {
  visible.value = false
  if (resolvePromise) resolvePromise(false)
}

defineExpose({ show })
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalFadeIn 0.2s ease;
}

.modal-container.small { width: 400px; }
.modal-container.medium { width: 500px; }
.modal-container.large { width: 700px; }

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
  border-radius: 16px 16px 0 0;
}

.modal-header.info {
  background: linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%);
}

.modal-header.success {
  background: linear-gradient(135deg, #d4edda 0%, #f8f9fa 100%);
}

.modal-header.error {
  background: linear-gradient(135deg, #f8d7da 0%, #f8f9fa 100%);
}

.modal-header.warning {
  background: linear-gradient(135deg, #fff3cd 0%, #f8f9fa 100%);
}

.header-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 24px;
}

.modal-header.info .header-icon {
  background: #00adb5;
  color: white;
}

.modal-header.success .header-icon {
  background: #28a745;
  color: white;
}

.modal-header.error .header-icon {
  background: #dc3545;
  color: white;
}

.modal-header.warning .header-icon {
  background: #ffc107;
  color: #333;
}

.header-title {
  flex: 1;
}

.header-title h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1a2a3a;
}

.header-title p {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: #6c757d;
}

.header-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #6c757d;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s;
}

.header-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
}

.modal-body {
  padding: 24px;
  font-size: 0.9rem;
  color: #495057;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  border-radius: 0 0 16px 16px;
}

.btn-primary {
  background: #00adb5;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #008a91;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #5a6268;
}
</style>