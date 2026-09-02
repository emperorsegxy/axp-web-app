<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ modelValue: string; hasError?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [string] }>();

const digits = ref<string[]>(props.modelValue.split('').concat(Array(6).fill('')).slice(0, 6));
const inputs = ref<(HTMLInputElement | null)[]>([]);

watch(
  () => props.modelValue,
  (val) => {
    if (val === digits.value.join('')) return;
    digits.value = val.split('').concat(Array(6).fill('')).slice(0, 6);
  },
);

function onInput(i: number, e: Event) {
  const target = e.target as HTMLInputElement;
  const v = target.value.replace(/\D/g, '').slice(-1);
  digits.value[i] = v;
  emit('update:modelValue', digits.value.join(''));
  if (v && i < 5) inputs.value[i + 1]?.focus();
}

function onKeydown(i: number, e: KeyboardEvent) {
  if (e.key === 'Backspace' && !digits.value[i] && i > 0) {
    inputs.value[i - 1]?.focus();
  }
}

defineExpose({
  focusFirst: () => inputs.value[0]?.focus(),
  reset: () => {
    digits.value = Array(6).fill('');
    emit('update:modelValue', '');
  },
});
</script>

<template>
  <div class="otp-row">
    <input
      v-for="(d, i) in digits"
      :key="i"
      :ref="(el) => (inputs[i] = el as HTMLInputElement)"
      type="text"
      inputmode="numeric"
      maxlength="1"
      :value="d"
      class="otp-box"
      :class="{ 'has-error': hasError }"
      @input="onInput(i, $event)"
      @keydown="onKeydown(i, $event)"
    />
  </div>
</template>

<style scoped>
.otp-row {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}
.otp-box {
  width: 100%;
  min-width: 0;
  height: 60px;
  text-align: center;
  font-size: 22px;
  font-weight: 600;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--ink);
}
.otp-box.has-error {
  border-color: oklch(0.58 0.18 28 / 0.55);
}
</style>
