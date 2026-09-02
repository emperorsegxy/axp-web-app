<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  modelValue: string;
  id: string;
  label?: string;
  placeholder?: string;
  autocomplete?: string;
  hasError?: boolean;
}>();
const emit = defineEmits<{ 'update:modelValue': [string] }>();

const showPw = ref(false);
const type = computed(() => (showPw.value ? 'text' : 'password'));
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="field-label">{{ label }}</label>
    <div class="wrap">
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        class="text-input"
        :class="{ 'has-error': hasError }"
        style="padding-right: 76px"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <button type="button" class="toggle" @click="showPw = !showPw">{{ showPw ? 'Hide' : 'Show' }}</button>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.wrap {
  position: relative;
}
.toggle {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  min-height: 36px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
}
.toggle:hover {
  background: var(--cream);
}
</style>
