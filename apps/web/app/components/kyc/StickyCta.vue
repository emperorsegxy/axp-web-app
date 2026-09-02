<script setup lang="ts">
defineProps<{
  canGoBack: boolean;
  disabled: boolean;
  label: string;
  help: string;
}>();
defineEmits<{ back: []; next: [] }>();
</script>

<template>
  <div class="sticky-bar">
    <div class="row">
      <button v-if="canGoBack" type="button" class="btn-secondary" @click="$emit('back')">Back</button>
      <button type="button" class="btn-primary next-btn" :disabled="disabled" @click="$emit('next')">{{ label }}</button>
    </div>
    <div class="help">{{ help }}</div>
  </div>
</template>

<style scoped>
.sticky-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 15;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(26, 35, 61, 0.1);
}
.row {
  max-width: 680px;
  margin: 0 auto;
  padding: 12px clamp(16px, 4vw, 24px) 16px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.next-btn {
  flex: 1 1 200px;
  padding: 0 24px;
}
.btn-secondary {
  padding: 0 20px;
}
.help {
  max-width: 680px;
  margin: 0 auto;
  padding: 0 clamp(16px, 4vw, 24px) 14px;
  font-size: 12px;
  color: var(--muted);
}
</style>
