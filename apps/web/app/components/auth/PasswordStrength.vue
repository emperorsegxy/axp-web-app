<script setup lang="ts">
import { computed } from 'vue';
import { getPasswordStrengthScore, PASSWORD_STRENGTH_LABELS } from '~/utils/passwordStrength';

const props = defineProps<{ password: string }>();

const score = computed(() => getPasswordStrengthScore(props.password));
const colors = ['rgba(26,35,61,.12)', 'oklch(0.58 0.18 28)', 'oklch(0.68 0.15 70)', 'oklch(0.55 0.13 155)'];
const bar = (i: number) => (score.value >= i ? colors[score.value] : 'rgba(26,35,61,.12)');
</script>

<template>
  <div>
    <div class="bars">
      <div class="bar" :style="{ background: bar(1) }" />
      <div class="bar" :style="{ background: bar(2) }" />
      <div class="bar" :style="{ background: bar(3) }" />
    </div>
    <div class="label">{{ PASSWORD_STRENGTH_LABELS[score] }}</div>
  </div>
</template>

<style scoped>
.bars {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 5px;
  margin-top: 10px;
}
.bar {
  height: 3px;
  border-radius: 999px;
}
.label {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 8px;
  line-height: 1.5;
}
</style>
